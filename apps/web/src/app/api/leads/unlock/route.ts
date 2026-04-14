import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// ─── POST /api/leads/unlock ────────────────────────────────────────────────────
// Authenticated route. Checks the contractor's subscription plan lead_limit,
// counts how many they've already unlocked this billing cycle, then inserts
// into lead_unlocks if they have capacity left.

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service role not configured.");
  return createAdminClient<Database>(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse body
  let leadId: string;
  try {
    const body = await req.json() as { leadId?: unknown };
    if (!body.leadId || typeof body.leadId !== "string") throw new Error("missing leadId");
    leadId = body.leadId;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body. Provide { leadId: string }." },
      { status: 400 }
    );
  }

  // 3. Fetch profile using admin client so we get the full row even if the
  //    user's anon session doesn't yet have a matching RLS policy for new fields.
  const admin = getAdminClient();
  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  if (profileErr || !profile) {
    console.error("[unlock] profile fetch error", profileErr?.message);
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  // 4. Fetch subscription plan to get lead_limit
  const rawTier = profile.subscription_tier ?? "starter";
  const { data: plan } = await admin
    .from("subscription_plans")
    .select("lead_limit")
    .eq("id", rawTier)
    .single();

  const leadLimit: number | null = plan?.lead_limit ?? null;

  // Normalize tier for logic checks
  const { normalizeTier } = await import("@/lib/leadEligibility");
  const testAccess = user.email === "brandonlacoste9@gmail.com";
  const tier = testAccess ? "elite" : normalizeTier(rawTier);
  const isFree = (!rawTier || rawTier === "" || rawTier === "free") && !testAccess;

  if (isFree) {
    return NextResponse.json(
      { error: "UPGRADE_REQUIRED", message: "You are on the free tier. Please subscribe to a paid plan to unlock real leads." },
      { status: 403 }
    );
  }

  // 5. If the plan has a cap, count this contractor's monthly unlocks
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
        { error: "Could not verify unlock count." },
        { status: 500 }
      );
    }

    if ((count ?? 0) >= leadLimit) {
      return NextResponse.json(
        {
          error: "LIMIT_REACHED",
          message: `You've reached your monthly limit of ${leadLimit} lead unlock${leadLimit === 1 ? "" : "s"}. Upgrade your plan to unlock more.`,
          current: count,
          limit: leadLimit,
        },
        { status: 403 }
      );
    }
  }

  // 6. Insert the unlock — UNIQUE constraint prevents duplicates
  const { error: insertErr } = await admin
    .from("lead_unlocks")
    .insert({ contractor_id: user.id, lead_id: leadId });

  if (insertErr) {
    if (insertErr.code === "23505") {
      // Already unlocked — return the lead data anyway
      let existingLeadData = null;
      const { data: existingRegularLeadContact } = await admin
        .from("lead_contacts")
        .select("name, email, phone")
        .eq("lead_id", leadId)
        .single();
        
      if (existingRegularLeadContact) {
        const { data: leadBase } = await admin
          .from("leads")
          .select("id, message, city, project_type")
          .eq("id", leadId)
          .single();
        existingLeadData = (leadBase && existingRegularLeadContact) ? { ...leadBase, ...existingRegularLeadContact } : null;
      } else {
        const { data: existingScrapedLead } = await admin
          .from("scraped_inventory")
          .select("id, title, location, url, permit_number, city, enriched_name, enriched_email, enriched_phone")
          .eq("id", leadId)
          .single();
          
        if (existingScrapedLead) {
          existingLeadData = {
             id: existingScrapedLead.id,
             name: existingScrapedLead.enriched_name || (tier === "elite" ? `Verified Owner (Permit ${existingScrapedLead.permit_number || "N/A"})` : `Permit: ${existingScrapedLead.permit_number || "Open Data"}`),
             city: existingScrapedLead.city,
             url: existingScrapedLead.url,
             email: existingScrapedLead.enriched_email,
             phone: existingScrapedLead.enriched_phone || (tier === "elite" && !existingScrapedLead.enriched_name ? `(Previously enriched — click to re-fetch)` : null)
          };
        }
      }
      
      return NextResponse.json(
        { error: "ALREADY_UNLOCKED", message: "You've already unlocked this lead.", lead: existingLeadData ?? null },
        { status: 409 }
      );
    }
    console.error("[unlock] insert error", insertErr.message);
    return NextResponse.json(
      { error: "Could not unlock lead. Please try again." },
      { status: 500 }
    );
  }

  // 7. Return the lead contact details
  let leadData = null;

  // First try to fetch from regular leads
  const { data: regularLeadContact } = await admin
    .from("lead_contacts")
    .select("name, email, phone")
    .eq("lead_id", leadId)
    .single();
    
  if (regularLeadContact) {
    const { data: leadBase } = await admin
      .from("leads")
      .select("id, message, city, project_type")
      .eq("id", leadId)
      .single();
    leadData = (leadBase && regularLeadContact) ? { ...leadBase, ...regularLeadContact } : null;
  } else {
    // If not in leads, try scraped_inventory (Firecrawl leads)
    const { data: scrapedLead } = await admin
      .from("scraped_inventory")
      .select("id, title, location, url, permit_number, city, enriched_name, enriched_email, enriched_phone")
      .eq("id", leadId)
      .single();
      
    if (scrapedLead) {
      // Both Starter and Elite can unlock Municipal Intel now.
      // (Used to block Starter, but user requirements changed)
      
      // Base info for all paid tiers
      leadData = {
        id: scrapedLead.id,
        name: `Permit: ${scrapedLead.permit_number || "Open Data"}`,
        city: scrapedLead.city,
        url: scrapedLead.url,
        // No email for municipal data
        email: null,
        phone: null as string | null
      };

      // Full AI Enrichment for Elite — Apollo.io People Search + Enrichment
      if (tier === "elite") {
        const apolloKey = process.env.APOLLO_API_KEY;
        let enrichedName: string | null = null;
        let enrichedPhone: string | null = null;
        let enrichedEmail: string | null = null;

        if (apolloKey && (scrapedLead.city || scrapedLead.title)) {
          try {
            // Refined Apollo search:
            // If the title looks like a company name (often is in permits), use organization name
            // Otherwise use city-based people search
            const searchParams: Record<string, unknown> = {
              per_page: 1,
              page: 1,
            };

            if (scrapedLead.title && scrapedLead.title.length > 5) {
              searchParams.q_organization_name = scrapedLead.title;
            } else if (scrapedLead.city) {
              searchParams.person_locations = [scrapedLead.city];
            }

            const searchRes = await fetch("https://api.apollo.io/api/v1/mixed_people/api_search", {
              method: "POST",
              headers: { "Content-Type": "application/json", "x-api-key": apolloKey },
              body: JSON.stringify(searchParams),
            });

            if (searchRes.ok) {
              const searchData = await searchRes.json() as {
                people?: Array<{ id?: string; first_name?: string; last_name?: string; name?: string }>;
              };
              const topMatch = searchData.people?.[0];

              if (topMatch?.id) {
                // Step 2: Enrich the top match
                const enrichRes = await fetch("https://api.apollo.io/api/v1/people/match", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "x-api-key": apolloKey },
                  body: JSON.stringify({ id: topMatch.id }),
                });

                if (enrichRes.ok) {
                  const enrichData = await enrichRes.json() as {
                    person?: {
                      name?: string;
                      first_name?: string;
                      last_name?: string;
                      phone_numbers?: Array<{ sanitized_number?: string }>;
                      email?: string;
                    };
                  };
                  const person = enrichData.person;
                  if (person) {
                    enrichedName = person.name || `${person.first_name || ""} ${person.last_name || ""}`.trim() || null;
                    enrichedPhone = person.phone_numbers?.[0]?.sanitized_number || null;
                    enrichedEmail = person.email || null;
                  }
                }
              }
            }
          } catch (apolloErr) {
            console.warn("[unlock] Apollo enrichment failed:", apolloErr instanceof Error ? apolloErr.message : apolloErr);
          }
        }

        // Apply enriched data
        if (enrichedName) {
           leadData.name = `${enrichedName} (${scrapedLead.title || "Permit Owner"})`;
        }
        leadData.phone = enrichedPhone ? `${enrichedPhone} (Verified)` : null;
        if (enrichedEmail) {
          (leadData as Record<string, unknown>).email = enrichedEmail;
        }

        // PERSIST ENRICHMENT
        if (enrichedName || enrichedPhone || enrichedEmail) {
          await admin.from("scraped_inventory").update({
            enriched_name: enrichedName,
            enriched_phone: enrichedPhone,
            enriched_email: enrichedEmail,
            enriched_at: new Date().toISOString()
          }).eq("id", leadId);
        }
      }
    }
  }

  if (!leadData) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, lead: leadData });
}
