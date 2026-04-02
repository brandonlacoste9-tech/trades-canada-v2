import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count: newToday } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfDay.toISOString());

    const { count: leadsInNetwork } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true });

    const { data: scoredRows } = await supabase.from("leads").select("score");
    const rows = (scoredRows ?? []) as { score: number | null }[];
    const scored = rows.filter((r) => r.score != null);

    const avgScore =
      scored.length > 0
        ? scored.reduce((acc, row) => acc + (row.score ?? 0), 0) / scored.length
        : 50;

    const { count: premiumLeads } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("score", 80);

    return NextResponse.json({
      newToday: newToday ?? 0,
      leadsInNetwork: leadsInNetwork ?? 0,
      pipelineScoreAvg: Math.round(avgScore),
      premiumLeads: premiumLeads ?? 0,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
