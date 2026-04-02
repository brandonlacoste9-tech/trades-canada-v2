import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // 1. New Leads (Today)
    const { count: newToday } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(new Date().setHours(0,0,0,0)).toISOString());

    // 2. Total Market value (Sum of estimated_value)
    // we use a simple select for now, or just return a default if not fully implemented
    const { data: leads } = await supabase
      .from("leads")
      .select("score"); // placeholder for estimated value

    const totalValue = (leads || []).length * 1000; // placeholder: $1000 per lead average

    // 3. Quickest Unlock (average)
    // could be fetched from historical data but we'll return a static value if too complex
    
    // 4. Premium Leads (score > 80)
    const { count: premiumLeads } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("score", 80);

    return NextResponse.json({
      newToday: newToday || 0,
      totalMarket: totalValue,
      quickUnlock: "12s",
      premiumLeads: premiumLeads || 0
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
