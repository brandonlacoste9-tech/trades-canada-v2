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
  const tier = profile.subscription_tier ?? "starter";
  const { data: plan } = await admin
    .from("subscription_plans")
    .select("lead_limit")
    .eq("id", tier)
    .single();

  const leadLimit: number | null = plan?.lead_limit ?? null;

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
      const { data: existingLead } = await admin
        .from("leads")
        .select("id, name, email, phone, message, city, project_type")
        .eq("id", leadId)
        .single();
      return NextResponse.json(
        { error: "ALREADY_UNLOCKED", message: "You've already unlocked this lead.", lead: existingLead ?? null },
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
  const { data: lead } = await admin
    .from("leads")
    .select("id, name, email, phone, message, city, project_type")
    .eq("id", leadId)
    .single();

  return NextResponse.json({ success: true, lead: lead ?? null });
}
