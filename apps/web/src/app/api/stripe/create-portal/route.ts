import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

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

    const admin = getAdminSupabase();
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: "No Stripe customer found." }, { status: 400 });
    }

    const stripe = getStripe();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
    
    // We expect the path to be like /en/settings or /fr/settings
    // This is a bit of a hack to get the referer's locale
    const referer = req.headers.get("referer") || "";
    const lang = referer.includes("/fr") ? "fr" : "en";
    const returnUrl = `${siteUrl}/${lang}/settings`;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
