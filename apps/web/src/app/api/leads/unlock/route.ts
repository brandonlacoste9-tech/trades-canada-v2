import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── POST /api/leads/unlock ───────────────────────────────────────────────────
// Authenticated route. Checks the contractor's subscription plan lead_limit,
// counts how many they've already unlocked this billing cycle, then inserts
// into lead_unlocks if they have capacity left.
//
// NOTE: subscription_plans and lead_unlocks are new tables not yet reflected
// in the generated database.ts types — all queries against them use explicit
// `as` casts to avoid TypeScript inferring `never`.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // 1. Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse body
  let leadId: string;
  try {
    const body = await req.json();
    leadId = body.leadId;
    if (!leadId || typeof leadId !== "string") throw new Error("missing leadId");
  } catch {
    return NextResponse.json(
      { error: "Invalid request body. Provide { leadId: string }." },
      { status: 400 }
    );
  }

  // 3. Fetch contractor's profile and subscription tier
  // profiles.subscription_tier may not be in generated types yet — cast to known shape
  const { data: profileRaw, error: profileErr } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  if (profileErr || !profileRaw) {
    console.error("[unlock] profile fetch error", profileErr);
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const profile = profileRaw as { subscription_tier: string | null };

  // 4. Fetch matching subscription plan to get lead_limit
  // subscription_plans is a new table not yet in generated types — cast explicitly
  const tier = profile.subscription_tier ?? "starter";
  const { data: planRaw } = await supabase
    .from("subscription_plans")
    .select("lead_limit")
    .eq("id", tier)
    .single();

  const plan = planRaw as { lead_limit: number | null } | null;
  const leadLimit: number | null = plan?.lead_limit ?? null;

  // 5. If plan has a lead_limit, count monthly unlocks
  if (leadLimit !== null) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // lead_unlocks is a new table — use untyped client to avoid `never` inference
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { count, error: countErr } = await db
      .from("lead_unlocks")
      .select("id", { count: "exact", head: true })
      .eq("contractor_id", user.id)
      .gte("unlocked_at", startOfMonth.toISOString()) as { count: number | null; error: unknown };

    if (countErr) {
      console.error("[unlock] count error", countErr);
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertErr } = await (supabase as any)
    .from("lead_unlocks")
    .insert({ contractor_id: user.id, lead_id: leadId });

  if (insertErr) {
    // 23505 = unique_violation (already unlocked)
    if ((insertErr as { code?: string }).code === "23505") {
      return NextResponse.json(
        { error: "ALREADY_UNLOCKED", message: "You've already unlocked this lead." },
        { status: 409 }
      );
    }
    console.error("[unlock] insert error", insertErr);
    return NextResponse.json(
      { error: "Could not unlock lead. Please try again." },
      { status: 500 }
    );
  }

  // 7. Fetch the lead's contact details to return
  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("id, name, email, phone, message, city, project_type")
    .eq("id", leadId)
    .single();

  if (leadErr || !lead) {
    return NextResponse.json({ success: true, lead: null });
  }

  return NextResponse.json({ success: true, lead });
}
