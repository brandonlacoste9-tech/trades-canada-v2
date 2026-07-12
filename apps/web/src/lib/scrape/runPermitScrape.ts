import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  PERMIT_SOURCES,
  normalizeOpenDataRow,
  parsePermitsFromMarkdown,
  type NormalizedPermit,
  type PermitSource,
} from "./permitSources";

export interface ScrapeRunResult {
  inserted: number;
  skipped: number;
  promotedToLeads: number;
  errors: string[];
  cities: Record<string, { fetched: number; inserted: number; method: string }>;
  duration_ms: number;
}

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  return /your-|placeholder|fc-\.\.\./i.test(value);
}

function getWriteClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || isPlaceholder(url)) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL not configured");
  }
  const key =
    serviceKey && !isPlaceholder(serviceKey)
      ? serviceKey
      : anonKey && !isPlaceholder(anonKey)
        ? anonKey
        : null;
  if (!key) throw new Error("Supabase keys not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "Trades-Canada-LeadRadar/1.0" },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function scrapeOpenData(source: PermitSource): Promise<NormalizedPermit[]> {
  if (!source.apiUrl) return [];

  if (source.kind === "socrata") {
    const rows = (await fetchJson(source.apiUrl)) as Record<string, unknown>[];
    if (!Array.isArray(rows)) return [];
    return rows
      .map((row) => normalizeOpenDataRow(row, source))
      .filter((p): p is NormalizedPermit => p !== null);
  }

  if (source.kind === "opendatasoft") {
    const data = (await fetchJson(source.apiUrl)) as {
      results?: Array<{ record?: Record<string, unknown> } | Record<string, unknown>>;
    };
    const results = data.results ?? [];
    return results
      .map((item) => {
        const row =
          item && typeof item === "object" && "record" in item && item.record
            ? (item.record as Record<string, unknown>)
            : (item as Record<string, unknown>);
        // Vancouver often nests fields under record
        const fields =
          row && typeof row === "object" && "fields" in row
            ? (row.fields as Record<string, unknown>)
            : row;
        return normalizeOpenDataRow(fields, source);
      })
      .filter((p): p is NormalizedPermit => p !== null);
  }

  // Toronto / Montréal CKAN DataStore (free open data)
  if (source.kind === "ckan_resource") {
    const data = (await fetchJson(source.apiUrl)) as {
      success?: boolean;
      result?: { records?: Record<string, unknown>[] };
    };
    if (!data.success || !Array.isArray(data.result?.records)) {
      throw new Error(`CKAN datastore failed for ${source.city}`);
    }
    return data.result.records
      .map((row) => normalizeOpenDataRow(row, source))
      .filter((p): p is NormalizedPermit => p !== null);
  }

  return [];
}

async function scrapeWithFirecrawl(
  source: PermitSource
): Promise<NormalizedPermit[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey || isPlaceholder(apiKey)) {
    throw new Error("FIRECRAWL_API_KEY not set (required for HTML portal sources)");
  }

  const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: source.portalUrl,
      formats: ["markdown"],
      onlyMainContent: true,
      timeout: 45000,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firecrawl ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as { data?: { markdown?: string } };
  const markdown = data.data?.markdown ?? "";
  if (!markdown) return [];
  return parsePermitsFromMarkdown(markdown, source.city, source.portalUrl, source.label);
}

/** Live production columns (differs from older schema.sql). */
const CITY_PROVINCE: Record<string, string> = {
  calgary: "AB",
  edmonton: "AB",
  vancouver: "BC",
  winnipeg: "MB",
  toronto: "ON",
  ottawa: "ON",
  montreal: "QC",
  quebec: "QC",
};

/** Live `trade_category` enum may not include all project_type values (e.g. "general"). */
const TRADE_CATEGORY_ALLOW = new Set([
  "hvac",
  "roofing",
  "landscaping",
  "renovations",
  "plumbing",
  "electrical",
]);

function toInventoryRow(permit: NormalizedPermit) {
  const city = permit.city.toLowerCase();
  const pt = permit.project_type;
  return {
    title: permit.title,
    description: permit.description,
    address: permit.location, // live column is `address`, not `location`
    permit_number: permit.permit_number,
    source: permit.source,
    source_url: permit.url, // live column is `source_url`, not `url`
    city,
    province: CITY_PROVINCE[city] ?? "CA",
    project_type: pt,
    // Only set when valid for the live enum — avoid "invalid input value for enum trade_category"
    trade_category: pt && TRADE_CATEGORY_ALLOW.has(pt) ? pt : null,
    estimated_value: permit.estimated_value,
    scraped_at: new Date().toISOString(),
    is_active: true,
  };
}

async function upsertPermit(
  supabase: SupabaseClient,
  permit: NormalizedPermit
): Promise<"inserted" | "skipped" | "rls_blocked"> {
  const row = toInventoryRow(permit);

  try {
    if (permit.permit_number) {
      const { data: existing } = await supabase
        .from("scraped_inventory")
        .select("id")
        .eq("city", row.city)
        .eq("permit_number", permit.permit_number)
        .maybeSingle();

      if (existing) return "skipped";
    } else {
      const { data: existing } = await supabase
        .from("scraped_inventory")
        .select("id")
        .eq("city", row.city)
        .eq("title", permit.title)
        .maybeSingle();
      if (existing) return "skipped";
    }

    const { error } = await supabase.from("scraped_inventory").insert(row);
    if (error) {
      if (/duplicate|unique/i.test(error.message)) return "skipped";
      // Anon key cannot write inventory (RLS) — fall back to leads-only path
      if (
        error.code === "42501" ||
        /row-level security|permission denied/i.test(error.message)
      ) {
        return "rls_blocked";
      }
      // Column mismatch on older DBs — treat as blocked, still promote to leads
      if (error.code === "PGRST204" || /schema cache|column/i.test(error.message)) {
        return "rls_blocked";
      }
      throw error;
    }
    return "inserted";
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/row-level security|42501|PGRST204|column/i.test(msg)) return "rls_blocked";
    throw e;
  }
}

/**
 * Optionally promote scraped permits into the contractor `leads` marketplace
 * so paid users see them as claimable job signals (no homeowner PII).
 */
async function promoteToLead(
  supabase: SupabaseClient,
  permit: NormalizedPermit
): Promise<boolean> {
  const email = `permit+${(permit.permit_number || permit.title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40)}@scraped.trades-canada.local`;

  // Avoid flooding: skip if a scraped lead with same message/title already exists recently
  const { data: existing } = await supabase
    .from("leads")
    .select("id")
    .eq("source", "scraped")
    .eq("city", permit.city)
    .ilike("message", `%${(permit.permit_number || permit.title).slice(0, 40)}%`)
    .limit(1)
    .maybeSingle();

  if (existing) return false;

  const { error } = await supabase.from("leads").insert({
    name: `Permit Lead — ${permit.city}`,
    email,
    phone: null,
    project_type: permit.project_type || "general",
    language: "en",
    city: permit.city,
    source: "scraped",
    status: "new",
    score: permit.estimated_value
      ? Math.min(95, Math.max(40, Math.round(Number(permit.estimated_value) / 5000)))
      : 55,
    message: [
      permit.title,
      permit.location ? `Location: ${permit.location}` : null,
      permit.permit_number ? `Permit #: ${permit.permit_number}` : null,
      permit.description,
      `Source: ${permit.source}`,
      permit.url,
    ]
      .filter(Boolean)
      .join("\n")
      .slice(0, 900),
  });

  return !error;
}

export async function runPermitScrape(options?: {
  cities?: string[];
  promoteToLeads?: boolean;
  maxPerCity?: number;
}): Promise<ScrapeRunResult> {
  const start = Date.now();
  const promote = options?.promoteToLeads !== false;
  const maxPerCity = options?.maxPerCity ?? 25;
  const cityFilter = options?.cities?.map((c) => c.toLowerCase());

  const sources = PERMIT_SOURCES.filter(
    (s) => !cityFilter || cityFilter.includes(s.city)
  );

  const supabase = getWriteClient();
  let inserted = 0;
  let skipped = 0;
  let promotedToLeads = 0;
  const errors: string[] = [];
  const cities: ScrapeRunResult["cities"] = {};

  for (const source of sources) {
    cities[source.city] = { fetched: 0, inserted: 0, method: "none" };
    try {
      let permits: NormalizedPermit[] = [];
      let method = "none";

      if (source.kind !== "firecrawl_only" && source.apiUrl) {
        try {
          permits = await scrapeOpenData(source);
          method = source.kind;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          errors.push(`${source.city} open-data: ${msg}`);
        }
      }

      if (permits.length === 0) {
        try {
          permits = await scrapeWithFirecrawl(source);
          method = "firecrawl";
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          // Only error if we had no open-data either
          if (method === "none") {
            errors.push(`${source.city}: ${msg}`);
          }
        }
      }

      cities[source.city].method = method;
      cities[source.city].fetched = permits.length;
      const batch = permits.slice(0, maxPerCity);

      for (const permit of batch) {
        try {
          const result = await upsertPermit(supabase, permit);
          if (result === "inserted") {
            inserted++;
            cities[source.city].inserted++;
          } else if (result === "skipped") {
            skipped++;
          }
          // Always try marketplace promotion when enabled (works with publishable key + leads RLS)
          // so contractors still get scrapes even if scraped_inventory write is RLS-blocked.
          if (promote && result !== "skipped") {
            const ok = await promoteToLead(supabase, permit);
            if (ok) {
              promotedToLeads++;
              if (result === "rls_blocked") {
                // Count as delivered via leads even without inventory row
                cities[source.city].inserted++;
              }
            } else if (result === "rls_blocked") {
              skipped++;
            }
          } else if (result === "rls_blocked" && !promote) {
            errors.push(
              `${source.city}: scraped_inventory insert blocked by RLS — set SUPABASE_SERVICE_ROLE_KEY or enable promoteToLeads`
            );
          }
        } catch (e) {
          const msg =
            e instanceof Error
              ? e.message
              : typeof e === "object" && e && "message" in e
                ? String((e as { message: unknown }).message)
                : JSON.stringify(e);
          errors.push(`${source.city} upsert: ${msg}`);
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${source.city}: ${msg}`);
    }
  }

  try {
    await supabase.from("automated_logs").insert({
      event_type: "firecrawl.scrape_complete",
      channel: "firecrawl",
      status: inserted > 0 ? "sent" : "failed",
      subject: `Scraped ${inserted} permits, promoted ${promotedToLeads} leads`,
      metadata: {
        inserted,
        skipped,
        promotedToLeads,
        errors,
        cities,
        duration_ms: Date.now() - start,
      },
    });
  } catch {
    /* logging best-effort */
  }

  return {
    inserted,
    skipped,
    promotedToLeads,
    errors,
    cities,
    duration_ms: Date.now() - start,
  };
}
