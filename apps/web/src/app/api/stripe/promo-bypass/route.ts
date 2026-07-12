import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase service role credentials not configured.");
  }
  return createSupabaseAdminClient<Database>(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { code } = (await req.json()) as { code?: string };
    const cleanCode = code?.replace(/\s+/g, "").toUpperCase();

    if (!cleanCode) {
      return NextResponse.json({ error: "Promo code is required." }, { status: 400 });
    }

    const allowedCodes = ["VIP_DOMINATOR", "DOMINATOR", "VIP", "ADMIN"];
    if (!allowedCodes.includes(cleanCode)) {
      return NextResponse.json({ error: "Invalid promo code." }, { status: 400 });
    }

    // Bypass check passes — upgrade profile to dominator using service role
    const admin = getAdminSupabase();
    const { error: updateError } = await admin
      .from("profiles")
      .update({
        subscription_tier: "dominator",
        stripe_customer_id: "cus_bypass_dominator",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({ success: true, tier: "dominator" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
