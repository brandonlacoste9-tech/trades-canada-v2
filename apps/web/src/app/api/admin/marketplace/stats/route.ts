import { NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import type { Database } from "@/types/marketplace";

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase service role credentials not configured.");
  }
  return createSupabaseAdminClient<Database>(url, key, { auth: { persistSession: false } });
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // 2. Admin Security Check — Use service role client to verify role
    const admin = getAdminSupabase();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      console.warn(`[admin] unauthorized access attempt by user ${user.id} (${user.email})`);
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    // 1. Total Unlocks
    const { count: totalUnlocks } = await admin
      .from("lead_unlocks")
      .select("*", { count: "exact", head: true });

    // 2. Recent Unlocks (last 20) with user and lead details
    const { data: recentUnlocks } = await admin
      .from("lead_unlocks")
      .select(`
        id,
        unlocked_at,
        profiles (display_name, company_name),
        leads (project_type, city, status)
      `)
      .order("unlocked_at", { ascending: false })
      .limit(20);

    // 3. Unlock Trends (Grouped by date - last 30 days)
    // Using a raw query for date grouping if possible, or manual grouping
    const { data: trendData } = await admin.rpc("get_unlock_trends");

    // 4. City distribution
    const { data: cityStats } = await admin.rpc("get_unlock_city_stats");

    // 5. Revenue Estimates
    // We can count subscribers by tier
    const { data: tierCounts } = await admin
      .from("profiles")
      .select("subscription_tier");

    const revenue = (tierCounts || []).reduce((acc, p) => {
      if (p.subscription_tier === "engine") return acc + 299;
      if (p.subscription_tier === "dominator") return acc + 999;
      return acc;
    }, 0);

    return NextResponse.json({
      summary: {
        totalUnlocks: totalUnlocks || 0,
        estimatedMonthlyRevenue: revenue,
        totalSubscribers: (tierCounts || []).filter(p => p.subscription_tier && p.subscription_tier !== "starter").length
      },
      recentUnlocks,
      trends: trendData || [],
      cityStats: cityStats || []
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
