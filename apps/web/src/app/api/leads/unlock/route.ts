import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── POST /api/leads/unlock ───────────────────────────────────────────────────
// Authenticated route. Checks the contractor's subscription plan lead_limit,
// counts how many they've already unlocked this billing cycle, then inserts
// into lead_unlocks if they have capacity left.
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
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  if (profileErr || !profile) {
    console.error("[unlock] profile fetch error", profileErr);
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  // 4. Fetch matching subscription plan to get lead_limit
  const tier = profile.subscription_tier ?? "starter";
  const { data: plan, error: planErr } = await supabase
    .from("subscription_plans")
    .select("lead_limit")
    .eq("id", tier)
    .single();

  if (planErr || !plan) {
    // If plan lookup fails, still allow — treat as unlimited
    console.warn("[unlock] plan not found for tier:", tier);
  }

  const leadLimit: number | null = plan?.lead_limit ?? null;

  // 5. If plan has a lead_limit, count monthly unlocks
  if (leadLimit !== null) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error: countErr } = await supabase
      .from("lead_unlocks")
      .select("id", { count: "exact", head: true })
      .eq("contractor_id", user.id)
      .gte("unlocked_at", startOfMonth.toISOString());

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
  const { error: insertErr } = await supabase.from("lead_unlocks").insert({
    contractor_id: user.id,
    lead_id: leadId,
  });

  if (insertErr) {
    // 23505 = unique_violation (already unlocked)
    if (insertErr.code === "23505") {
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
    // Unlock succeeded but we couldn't fetch contact data — still a success
    return NextResponse.json({ success: true, lead: null });
  }

  return NextResponse.json({ success: true, lead });
}
