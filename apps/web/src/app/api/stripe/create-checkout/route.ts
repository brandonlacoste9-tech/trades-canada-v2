import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const STATIC_ALLOWED_PRICE_IDS = new Set([
  "price_1TCyD0CzqBvMqSYFhDyf6YDp",
  "price_1TCyDeCzqBvMqSYFl3sEMMw2",
  "price_1TCyHwCzqBvMqSYFbv2HxlVh",
]);

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

function getAllowedPriceIds(): Set<string> {
  const dynamic = [
    process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER,
    process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE,
  ].filter((v): v is string => Boolean(v));

  return new Set([...STATIC_ALLOWED_PRICE_IDS, ...dynamic]);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { priceId?: string; lang?: string };
    const priceId = body.priceId?.trim();
    const lang = body.lang === "fr" ? "fr" : "en";

    if (!priceId) {
      return NextResponse.json({ error: "Missing priceId." }, { status: 400 });
    }

    if (!getAllowedPriceIds().has(priceId)) {
      return NextResponse.json({ error: "Invalid plan selected." }, { status: 400 });
    }

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

    const stripe = getStripe();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
    const successUrl = `${siteUrl}/${lang}/dashboard?success=1`;
    const cancelUrl = `${siteUrl}/${lang}#pricing`;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId: user.id },
      customer_email: user.email,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    };

    if (profile?.stripe_customer_id) {
      sessionParams.customer = profile.stripe_customer_id;
      delete sessionParams.customer_email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    if (!session.url) {
      return NextResponse.json({ error: "Could not create checkout session." }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
