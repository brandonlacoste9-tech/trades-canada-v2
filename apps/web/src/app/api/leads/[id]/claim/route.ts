import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { evaluateLeadEligibility } from "@/lib/leadEligibility";

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase service role credentials not configured.");
  }
  return createSupabaseAdminClient<Database>(url, key, { auth: { persistSession: false } });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    if (!leadId) {
      return NextResponse.json({ error: "Missing lead id." }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const admin = getAdminSupabase();
    const [{ data: lead }, { data: profile }] = await Promise.all([
      admin.from("leads").select("*").eq("id", leadId).single(),
      admin
        .from("profiles")
        .select("id, subscription_tier, city, services")
        .eq("id", user.id)
        .single(),
    ]);

    if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    if (!profile) return NextResponse.json({ error: "Contractor profile not found." }, { status: 404 });

    const eligibility = evaluateLeadEligibility(lead, profile);
    if (!eligibility.eligible) {
      return NextResponse.json(
        {
          error: "Lead not eligible for claim yet.",
          reason: eligibility.reason,
          waitMinutesRemaining: eligibility.waitMinutesRemaining,
        },
        { status: 403 }
      );
    }

    const { data: updatedLead, error: updateError } = await admin
      .from("leads")
      .update({
        contractor_id: user.id,
        claimed_at: new Date().toISOString(),
        status: "qualified",
      })
      .eq("id", leadId)
      .is("contractor_id", null)
      .select("id")
      .single();

    if (updateError || !updatedLead) {
      return NextResponse.json({ error: "Lead was already claimed." }, { status: 409 });
    }

    await admin.from("automated_logs").insert({
      event_type: "lead.claimed",
      channel: "dashboard",
      status: "sent",
      subject: "Lead claimed by contractor",
      lead_id: leadId,
      metadata: {
        contractor_id: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
