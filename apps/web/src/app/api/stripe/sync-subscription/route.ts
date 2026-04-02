import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const LOG = "[stripe/sync-subscription]";

// Map Stripe Price IDs → internal tiers (same as webhook)
function buildPriceToTierMap(): Record<string, string> {
  const map: Record<string, string> = {
    "price_1TCyD0CzqBvMqSYFhDyf6YDp": "starter",
    "price_1TCyDeCzqBvMqSYFl3sEMMw2": "engine",
    "price_1TCyHwCzqBvMqSYFbv2HxlVh": "dominator",
  };
  const envStarter = process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER;
  const envPro = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO;
  const envElite = process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE;
  if (envStarter) map[envStarter] = "starter";
  if (envPro) map[envPro] = "engine";
  if (envElite) map[envElite] = "dominator";
  return map;
}

const priceToTierMap = buildPriceToTierMap();

/**
 * GET /api/stripe/sync-subscription
 *
 * Fetches the user's active Stripe subscription directly from the Stripe API
 * and reconciles their profiles.subscription_tier. Solves the webhook
 * race-condition: call this endpoint immediately after the Stripe checkout
 * success redirect (?success=1) or from the Settings billing tab.
 *
 * Returns: { tier, synced, previous_tier }
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 503 });
  }

  const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!adminUrl || !adminKey) {
    return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });
  }

  const admin = createSupabaseAdminClient<Database>(adminUrl, adminKey, { auth: { persistSession: false } });

  // Fetch or create profile
  const { data: profile } = await admin
    .from("profiles")
    .select("id, stripe_customer_id, subscription_tier")
    .eq("id", user.id)
    .single();

  const previousTier = profile?.subscription_tier ?? null;

  // No Stripe customer → no paid subscription
  if (!profile?.stripe_customer_id) {
    console.info(`${LOG} no stripe_customer_id for user ${user.id} — no subscription to sync`);
    return NextResponse.json({ tier: previousTier ?? "starter", synced: false, previous_tier: previousTier });
  }

  try {
    const stripe = new Stripe(stripeKey, { apiVersion: "2026-02-25.clover" });

    // Fetch all active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: "active",
      limit: 5,
    });

    let newTier = "starter";

    if (subscriptions.data.length > 0) {
      // Use the most recent active subscription
      const sub = subscriptions.data[0];
      const priceId = sub.items.data[0]?.price.id ?? "";
      newTier = priceToTierMap[priceId] ?? "starter";
    } else {
      // Check for trialing subscriptions too
      const trialingSubscriptions = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id,
        status: "trialing",
        limit: 1,
      });
      if (trialingSubscriptions.data.length > 0) {
        const sub = trialingSubscriptions.data[0];
        const priceId = sub.items.data[0]?.price.id ?? "";
        newTier = priceToTierMap[priceId] ?? "starter";
      }
    }

    // Only write if the tier changed (avoid unnecessary writes)
    if (newTier !== previousTier) {
      const { error: updateError } = await admin
        .from("profiles")
        .upsert({ id: user.id, subscription_tier: newTier }, { onConflict: "id" });

      if (updateError) {
        console.error(`${LOG} profile update failed for user ${user.id}:`, updateError.message);
        return NextResponse.json({ error: "Failed to update profile.", tier: previousTier }, { status: 500 });
      }

      console.info(`${LOG} synced user ${user.id}: ${previousTier ?? "null"} → ${newTier}`);
    } else {
      console.info(`${LOG} user ${user.id} tier already correct: ${newTier}`);
    }

    return NextResponse.json({ tier: newTier, synced: newTier !== previousTier, previous_tier: previousTier });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`${LOG} Stripe error for user ${user.id}:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
