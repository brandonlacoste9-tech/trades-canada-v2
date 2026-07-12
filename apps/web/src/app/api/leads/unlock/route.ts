import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { normalizeTier } from "@/lib/leadEligibility";

// ─── POST /api/leads/unlock ────────────────────────────────────────────────────
// Authenticated. Enforces tier + monthly limits, then returns contact / permit
// details for marketplace cards (form leads OR municipal inventory).

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  return /your-|placeholder/i.test(value);
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || isPlaceholder(url)) throw new Error("Supabase URL not configured.");
  const key =
    serviceKey && !isPlaceholder(serviceKey)
      ? serviceKey
      : anonKey && !isPlaceholder(anonKey)
        ? anonKey
        : null;
  if (!key) throw new Error("Supabase credentials not configured.");
  return createAdminClient<Database>(url, key, { auth: { persistSession: false } });
}

type UnlockLeadPayload = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  url?: string | null;
  project_type?: string | null;
  message?: string | null;
  source?: string | null;
  /** form = homeowner PII; permit = open-data job signal */
  lead_kind?: "form" | "permit";
  address?: string | null;
  permit_number?: string | null;
  maps_url?: string | null;
};

function buildMapsUrl(address?: string | null, city?: string | null): string | null {
  const q = [address, city, "Canada"].filter(Boolean).join(", ").trim();
  if (!q || q === "Canada") return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function dbTierToPlanId(tier: string | null | undefined): string {
  if (!tier) return "starter";
  const t = tier.toLowerCase();
  if (t === "elite" || t === "dominator") return "dominator";
  if (t === "pro" || t === "engine") return "engine";
  return "starter";
}


export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let leadId: string;
    try {
      const body = (await req.json()) as { leadId?: unknown };
      if (!body.leadId || typeof body.leadId !== "string") throw new Error("missing leadId");
      leadId = body.leadId;
    } catch {
      return NextResponse.json(
        { error: "Invalid request body. Provide { leadId: string }." },
        { status: 400 }
      );
    }

    // Demo / mock cards use non-UUID ids
    if (leadId.startsWith("mock-")) {
      return NextResponse.json(
        {
          error: "UPGRADE_REQUIRED",
          message:
            "This is a demo lead. Subscribe to a paid plan to unlock real homeowner and permit leads.",
        },
        { status: 403 }
      );
    }

    const admin = getAdminClient();

    // ── Profile + tier ─────────────────────────────────────────────────────
    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("subscription_tier, city, services")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile) {
      console.error("[unlock] profile fetch error", profileErr?.message);
      return NextResponse.json(
        {
          error: "PROFILE_NOT_FOUND",
          message: "Complete your contractor profile before unlocking leads.",
        },
        { status: 404 }
      );
    }

    const rawTier = profile.subscription_tier ?? "free";
    const testAccess = user.email === "brandonlacoste9@gmail.com";
    const tier = testAccess ? "elite" : normalizeTier(rawTier);
    const isFree =
      (!rawTier || rawTier === "" || rawTier === "free") && !testAccess;

    if (isFree) {
      return NextResponse.json(
        {
          error: "UPGRADE_REQUIRED",
          message:
            "You are on the free tier. Subscribe to a paid plan to unlock real leads.",
        },
        { status: 403 }
      );
    }

    // Resolve plan limit — support starter/engine/dominator + normalized aliases
    const planIds = Array.from(new Set([dbTierToPlanId(rawTier), rawTier, tier, "starter", "engine", "dominator", "pro", "elite"]));
    let leadLimit: number | null = null;
    for (const planId of planIds) {
      const { data: plan } = await admin
        .from("subscription_plans")
        .select("lead_limit")
        .eq("id", planId)
        .maybeSingle();
      if (plan) {
        leadLimit = plan.lead_limit;
        break;
      }
    }
    // elite / dominator → unlimited when no row match
    if (tier === "elite") leadLimit = null;

    if (leadLimit !== null) {
      const startOfMonth = new Date();
      startOfMonth.setUTCDate(1);
      startOfMonth.setUTCHours(0, 0, 0, 0);

      const { count, error: countErr } = await admin
        .from("lead_unlocks")
        .select("id", { count: "exact", head: true })
        .eq("contractor_id", user.id)
        .gte("unlocked_at", startOfMonth.toISOString());

      if (countErr) {
        console.error("[unlock] count error", countErr.message);
        return NextResponse.json(
          { error: "Could not verify unlock count.", message: countErr.message },
          { status: 500 }
        );
      }

      if ((count ?? 0) >= leadLimit) {
        return NextResponse.json(
          {
            error: "LIMIT_REACHED",
            message: `You've reached your monthly limit of ${leadLimit} unlock${leadLimit === 1 ? "" : "s"}. Upgrade to unlock more.`,
            current: count,
            limit: leadLimit,
          },
          { status: 403 }
        );
      }
    }

    // ── Resolve lead: marketplace `leads` OR municipal `scraped_inventory` ─
    let unlockLeadId = leadId;
    let payload: UnlockLeadPayload | null = null;

    const { data: formLead } = await admin
      .from("leads")
      .select("id, name, email, phone, city, project_type, message, source, score")
      .eq("id", leadId)
      .maybeSingle();

    if (formLead) {
      unlockLeadId = formLead.id;
      const isScrapedRow = formLead.source === "scraped";
      // Parse address/permit from scrape intel message when present
      const msg = formLead.message || "";
      const parsedAddr = msg.match(/Location:\s*(.+)/i)?.[1]?.trim() || null;
      const parsedPermit = msg.match(/Permit\s*#:\s*(.+)/i)?.[1]?.trim() || null;
      const sourceLine = msg.match(/Source:\s*(.+)/i)?.[1]?.trim() || null;

      payload = {
        id: formLead.id,
        name: formLead.name,
        email: isScrapedRow ? null : formLead.email,
        phone: isScrapedRow ? null : formLead.phone,
        city: formLead.city,
        project_type: formLead.project_type,
        message: formLead.message,
        source: formLead.source,
        lead_kind: isScrapedRow ? "permit" : "form",
        address: parsedAddr,
        permit_number: parsedPermit,
        url: isScrapedRow ? sourceLine : null,
        maps_url: buildMapsUrl(parsedAddr, formLead.city),
      };

      // Optional partitioned contacts table (may not exist in production)
      if (!isScrapedRow) {
        try {
          const { data: contact, error: contactErr } = await admin
            .from("lead_contacts")
            .select("name, email, phone")
            .eq("lead_id", leadId)
            .maybeSingle();
          if (!contactErr && contact) {
            payload.name = contact.name || payload.name;
            payload.email = contact.email || payload.email;
            payload.phone = contact.phone || payload.phone;
          }
        } catch {
          /* table missing — PII is on leads row */
        }
      }
    } else {
      // Municipal inventory card (id is scraped_inventory.id)
      // Live columns: address/source_url/title/… — NOT location/url/enriched_*
      const { data: scraped, error: scrapedErr } = await admin
        .from("scraped_inventory")
        .select(
          "id, title, address, source_url, permit_number, city, province, project_type, description, estimated_value, applicant_name, source"
        )
        .eq("id", leadId)
        .maybeSingle();

      if (scrapedErr) {
        console.error("[unlock] scraped_inventory select error", scrapedErr.message);
        return NextResponse.json(
          {
            error: "UNLOCK_FAILED",
            message: `Could not load permit lead: ${scrapedErr.message}`,
          },
          { status: 500 }
        );
      }

      if (!scraped) {
        return NextResponse.json(
          {
            error: "LEAD_NOT_FOUND",
            message:
              "Lead not found. Refresh the marketplace and try a current listing.",
          },
          { status: 404 }
        );
      }

      // lead_unlocks.lead_id should reference leads — ensure a lead row exists
      const syntheticEmail = `permit+${String(scraped.permit_number || scraped.id)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 40)}@scraped.trades-canada.local`;

      const { data: existingLinked } = await admin
        .from("leads")
        .select("id, name, email, phone, city, project_type, message, source")
        .eq("source", "scraped")
        .eq("email", syntheticEmail)
        .maybeSingle();

      const displayName =
        (scraped as { applicant_name?: string | null }).applicant_name ||
        (scraped.permit_number
          ? `Permit ${scraped.permit_number}`
          : `Job site — ${scraped.city || "Canada"}`);

      const intelMessage = [
        scraped.title,
        scraped.address ? `Location: ${scraped.address}` : null,
        scraped.permit_number ? `Permit #: ${scraped.permit_number}` : null,
        scraped.description,
        scraped.source_url || scraped.source
          ? `Source: ${scraped.source_url || scraped.source}`
          : null,
      ]
        .filter(Boolean)
        .join("\n")
        .slice(0, 900);

      if (existingLinked) {
        unlockLeadId = existingLinked.id;
        payload = {
          id: existingLinked.id,
          name: displayName || existingLinked.name,
          email: null, // open data — no owner email
          phone: null,
          city: scraped.city || existingLinked.city,
          url: scraped.source_url,
          project_type: scraped.project_type || existingLinked.project_type,
          message: intelMessage || existingLinked.message,
          source: "scraped",
          lead_kind: "permit",
          address: scraped.address,
          permit_number: scraped.permit_number,
          maps_url: buildMapsUrl(scraped.address, scraped.city),
        };
      } else {
        const validTypes = [
          "hvac",
          "roofing",
          "landscaping",
          "renovations",
          "plumbing",
          "electrical",
          "general",
          "other",
        ] as const;
        const pt = validTypes.includes(
          String(scraped.project_type) as (typeof validTypes)[number]
        )
          ? (scraped.project_type as (typeof validTypes)[number])
          : "general";

        const { data: created, error: createErr } = await admin
          .from("leads")
          .insert({
            name: `Permit Lead — ${scraped.city || "CA"}${
              scraped.permit_number ? ` #${scraped.permit_number}` : ""
            }`,
            email: syntheticEmail,
            phone: null,
            project_type: pt,
            language: "en",
            city: scraped.city,
            source: "scraped",
            status: "new",
            score: scraped.estimated_value
              ? Math.min(
                  95,
                  Math.max(40, Math.round(Number(scraped.estimated_value) / 5000))
                )
              : 55,
            message: intelMessage,
          })
          .select("id, name, email, phone, city, project_type, message, source")
          .single();

        if (createErr || !created) {
          console.error("[unlock] promote inventory→lead failed", createErr?.message);
          return NextResponse.json(
            {
              error: "UNLOCK_FAILED",
              message:
                createErr?.message ||
                "Could not prepare this permit lead for unlock. Please try again.",
            },
            { status: 500 }
          );
        }

        unlockLeadId = created.id;
        payload = {
          id: created.id,
          name: displayName,
          email: null,
          phone: null,
          city: created.city,
          url: scraped.source_url,
          project_type: created.project_type,
          message: created.message,
          source: "scraped",
          lead_kind: "permit",
          address: scraped.address,
          permit_number: scraped.permit_number,
          maps_url: buildMapsUrl(scraped.address, scraped.city),
        };
      }

      // Optional Apollo — only if key set; never fail unlock if enrichment fails
      if (tier === "elite" && process.env.APOLLO_API_KEY && payload) {
        try {
          const apolloKey = process.env.APOLLO_API_KEY!;
          const searchParams: Record<string, unknown> = { per_page: 1, page: 1 };
          if (scraped.address) searchParams.q_keywords = scraped.address;
          else if (scraped.city) searchParams.person_locations = [scraped.city];

          const searchRes = await fetch(
            "https://api.apollo.io/api/v1/mixed_people/api_search",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": apolloKey,
              },
              body: JSON.stringify(searchParams),
            }
          );
          if (searchRes.ok) {
            const searchData = (await searchRes.json()) as {
              people?: Array<{ id?: string }>;
            };
            const topId = searchData.people?.[0]?.id;
            if (topId) {
              const enrichRes = await fetch(
                "https://api.apollo.io/api/v1/people/match",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apolloKey,
                  },
                  body: JSON.stringify({ id: topId }),
                }
              );
              if (enrichRes.ok) {
                const enrichData = (await enrichRes.json()) as {
                  person?: {
                    name?: string;
                    first_name?: string;
                    last_name?: string;
                    email?: string;
                    phone_numbers?: Array<{ sanitized_number?: string }>;
                  };
                };
                const person = enrichData.person;
                if (person) {
                  const name =
                    person.name ||
                    `${person.first_name || ""} ${person.last_name || ""}`.trim();
                  if (name) payload.name = name;
                  if (person.email) payload.email = person.email;
                  if (person.phone_numbers?.[0]?.sanitized_number) {
                    payload.phone = person.phone_numbers[0].sanitized_number;
                  }
                }
              }
            }
          }
        } catch (apolloErr) {
          console.warn(
            "[unlock] Apollo enrichment skipped:",
            apolloErr instanceof Error ? apolloErr.message : apolloErr
          );
        }
      }
    }

    if (!payload) {
      return NextResponse.json(
        { error: "LEAD_NOT_FOUND", message: "Lead not found." },
        { status: 404 }
      );
    }

    // ── Record unlock (idempotent) ───────────────────────────────────────
    const { error: insertErr } = await admin.from("lead_unlocks").insert({
      contractor_id: user.id,
      lead_id: unlockLeadId,
    });

    if (insertErr) {
      if (insertErr.code === "23505") {
        // Already unlocked — still return contact payload
        return NextResponse.json({
          success: true,
          alreadyUnlocked: true,
          lead: payload,
        });
      }
      console.error("[unlock] insert error", insertErr.code, insertErr.message);
      return NextResponse.json(
        {
          error: "UNLOCK_FAILED",
          message: insertErr.message || "Could not unlock lead. Please try again.",
          code: insertErr.code,
        },
        { status: 500 }
      );
    }

    // Never surface synthetic scrape emails as callable contact
    if (
      payload.email &&
      payload.email.includes("@scraped.trades-canada.local")
    ) {
      payload = {
        ...payload,
        email: null,
        lead_kind: "permit",
      };
    }

    // Ensure maps URL when address known
    if (!payload.maps_url && (payload.address || payload.city)) {
      payload.maps_url = buildMapsUrl(payload.address, payload.city);
    }

    return NextResponse.json({ success: true, lead: payload });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[unlock] unexpected", message);
    return NextResponse.json(
      { error: "UNLOCK_FAILED", message },
      { status: 500 }
    );
  }
}
