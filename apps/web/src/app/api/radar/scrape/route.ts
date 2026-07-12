import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runPermitScrape } from "@/lib/scrape/runPermitScrape";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function firecrawlConfigured(): boolean {
  return !!(
    process.env.FIRECRAWL_API_KEY &&
    !/your-|fc-\.\.\.|placeholder/i.test(process.env.FIRECRAWL_API_KEY)
  );
}

function serviceRoleConfigured(): boolean {
  return !!(
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !/your-|placeholder/i.test(process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

/** Vercel Cron (GET + x-vercel-cron) or Bearer CRON_SECRET / x-cron-secret */
function isAuthorizedCron(req: NextRequest): boolean {
  if (req.headers.get("x-vercel-cron") === "1") return true;

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || /your-|placeholder|change-me/i.test(cronSecret)) {
    // Dev convenience only — never treat empty production secret as OK
    if (process.env.NODE_ENV === "development") {
      const dev = process.env.CRON_SECRET;
      if (dev) {
        const authHeader = req.headers.get("authorization");
        return (
          authHeader === `Bearer ${dev}` ||
          req.headers.get("x-cron-secret") === dev
        );
      }
    }
    return false;
  }

  const authHeader = req.headers.get("authorization");
  return (
    authHeader === `Bearer ${cronSecret}` ||
    req.headers.get("x-cron-secret") === cronSecret
  );
}

async function assertPaidOrCron(req: NextRequest): Promise<
  { ok: true } | { ok: false; res: NextResponse }
> {
  if (isAuthorizedCron(req)) return { ok: true };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  const rawTier = profile?.subscription_tier ?? null;
  const testAccess = user.email === "brandonlacoste9@gmail.com";
  const isFree =
    (!rawTier || rawTier === "" || rawTier === "free") && !testAccess;

  if (isFree) {
    return {
      ok: false,
      res: NextResponse.json(
        {
          error: "UPGRADE_REQUIRED",
          message:
            "Municipal lead scraping is available on paid plans. Upgrade to unlock Lead Radar.",
        },
        { status: 403 }
      ),
    };
  }

  return { ok: true };
}

async function executeScrape(body: {
  cities?: string[];
  promoteToLeads?: boolean;
  maxPerCity?: number;
}) {
  const result = await runPermitScrape({
    cities: body.cities,
    promoteToLeads: body.promoteToLeads,
    maxPerCity: body.maxPerCity,
  });

  return {
    success: true as const,
    ...result,
    firecrawlConfigured: firecrawlConfigured(),
    serviceRoleConfigured: serviceRoleConfigured(),
  };
}

/**
 * POST /api/radar/scrape
 * Auth: paid contractor session OR CRON_SECRET / Vercel Cron.
 */
export async function POST(req: NextRequest) {
  try {
    const gate = await assertPaidOrCron(req);
    if (!gate.ok) return gate.res;

    let body: { cities?: string[]; promoteToLeads?: boolean; maxPerCity?: number } =
      {};
    try {
      body = await req.json();
    } catch {
      /* empty body ok */
    }

    const payload = await executeScrape(body);
    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scrape failed";
    console.error("[api/radar/scrape] POST", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/radar/scrape
 * - Vercel Cron / CRON_SECRET → run scrape (promote leads)
 * - Otherwise → inventory status only
 */
export async function GET(req: NextRequest) {
  try {
    // Scheduled run (Vercel Cron hits GET once daily at 12:00 UTC)
    if (isAuthorizedCron(req)) {
      const payload = await executeScrape({
        promoteToLeads: true,
        maxPerCity: 25,
      });
      return NextResponse.json(payload);
    }

    const { createClient: createAdmin } = await import("@supabase/supabase-js");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = serviceRoleConfigured()
      ? process.env.SUPABASE_SERVICE_ROLE_KEY!
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createAdmin(url, key, { auth: { persistSession: false } });
    const { count, error } = await supabase
      .from("scraped_inventory")
      .select("id", { count: "exact", head: true });

    if (error) throw error;

    const { count: scrapedLeadCount } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("source", "scraped");

    return NextResponse.json({
      success: true,
      mode: "status",
      scraped_inventory_count: count ?? 0,
      scraped_leads_count: scrapedLeadCount ?? 0,
      firecrawlConfigured: firecrawlConfigured(),
      serviceRoleConfigured: serviceRoleConfigured(),
      cronSecretConfigured: !!(
        process.env.CRON_SECRET &&
        !/your-|placeholder|change-me/i.test(process.env.CRON_SECRET)
      ),
      sources: [
        "calgary / edmonton / winnipeg (Socrata open data — free)",
        "vancouver (OpenDataSoft API — free)",
        "toronto (CKAN DataStore open data — free)",
        "montreal (CKAN DataStore open data — free)",
        "ottawa / quebec city (Firecrawl fallback when FIRECRAWL_API_KEY set)",
      ],
      setup: {
        FIRECRAWL_API_KEY: firecrawlConfigured()
          ? "ok"
          : "missing — needed for Toronto / MTL / Ottawa / Québec portals",
        SUPABASE_SERVICE_ROLE_KEY: serviceRoleConfigured()
          ? "ok"
          : "missing — needed to write scraped_inventory (leads promotion still works with anon)",
        CRON_SECRET:
          process.env.CRON_SECRET &&
          !/your-|placeholder|change-me/i.test(process.env.CRON_SECRET)
            ? "ok"
            : "missing — set for non-Vercel cron callers; Vercel Cron uses x-vercel-cron header",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Status failed";
    console.error("[api/radar/scrape] GET", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
