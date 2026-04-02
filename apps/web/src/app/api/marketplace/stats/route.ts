import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Run all counts in parallel
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [newTodayResult, premiumLeadsResult, avgScoreResult, unlockedTodayResult] =
      await Promise.all([
        // New leads submitted today
        supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .gte("created_at", today.toISOString()),

        // Leads with score >= 80 (premium / high-intent)
        supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .gte("score", 80)
          .is("contractor_id", null),

        // Average lead score (gives a sense of market quality)
        supabase
          .from("leads")
          .select("score")
          .not("score", "is", null)
          .is("contractor_id", null)
          .limit(500),

        // Unlocks today (proxy for market velocity)
        supabase
          .from("lead_unlocks")
          .select("*", { count: "exact", head: true })
          .gte("unlocked_at", today.toISOString()),
      ]);

    const scores = (avgScoreResult.data ?? []).map((r) => (r as { score: number }).score);
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    // Estimate total market value: leads × avg score × $100 proxy per score point
    const totalAvailableLeads = (premiumLeadsResult.count ?? 0) + (newTodayResult.count ?? 0);
    const totalMarketEstimate = totalAvailableLeads * avgScore * 100;

    return NextResponse.json({
      newToday: newTodayResult.count ?? 0,
      totalMarket: totalMarketEstimate,
      unlocksToday: unlockedTodayResult.count ?? 0,
      premiumLeads: premiumLeadsResult.count ?? 0,
      avgScore,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
