/**
 * Server-only: reconcile profiles.subscription_tier + stripe_customer_id from Stripe.
 * Used after checkout when the webhook is delayed or profile has no customer id yet.
 */

import Stripe from "stripe";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { buildPriceToTierMap } from "@/lib/stripe-prices";

export type StripeSyncResult = {
  tier: string | null;
  stripeCustomerId: string | null;
  synced: boolean;
  previousTier: string | null;
};

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin not configured.");
  return createSupabaseAdminClient<Database>(url, key, { auth: { persistSession: false } });
}

/**
 * Resolve tier from Stripe for a user. If profile has no stripe_customer_id but
 * the user email matches a Stripe customer (e.g. checkout just completed), link it.
 */
export async function syncUserSubscriptionFromStripe(
  userId: string,
  userEmail: string | null | undefined
): Promise<StripeSyncResult> {
  const admin = getAdmin();
  const stripe = getStripe();
  const priceToTier = buildPriceToTierMap();

  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id, subscription_tier")
    .eq("id", userId)
    .single();

  let customerId = profile?.stripe_customer_id ?? null;
  const previousTier = profile?.subscription_tier ?? null;

  if (!customerId && userEmail) {
    const list = await stripe.customers.list({ email: userEmail.trim().toLowerCase(), limit: 3 });
    if (list.data.length > 0) {
      customerId = list.data[0].id;
      await admin.from("profiles").upsert(
        { id: userId, stripe_customer_id: customerId },
        { onConflict: "id" }
      );
    }
  }

  if (!customerId) {
    return {
      tier: previousTier,
      stripeCustomerId: null,
      synced: false,
      previousTier,
    };
  }

  const active = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 5,
  });
  const trialing = await stripe.subscriptions.list({
    customer: customerId,
    status: "trialing",
    limit: 5,
  });

  const subs = [...active.data, ...trialing.data].sort(
    (a, b) => (b.created ?? 0) - (a.created ?? 0)
  );

  let newTier: string | null = null;
  if (subs.length > 0) {
    const priceId = subs[0].items.data[0]?.price.id ?? "";
    newTier = priceToTier[priceId] ?? "starter";
  }

  if (!newTier) {
    return {
      tier: previousTier,
      stripeCustomerId: customerId,
      synced: false,
      previousTier,
    };
  }

  if (newTier !== previousTier) {
    const { error } = await admin.from("profiles").upsert(
      { id: userId, stripe_customer_id: customerId, subscription_tier: newTier },
      { onConflict: "id" }
    );
    if (error) {
      console.error("[stripe-subscription-sync] upsert failed:", error.message);
      return {
        tier: previousTier,
        stripeCustomerId: customerId,
        synced: false,
        previousTier,
      };
    }
    return {
      tier: newTier,
      stripeCustomerId: customerId,
      synced: true,
      previousTier,
    };
  }

  return {
    tier: newTier,
    stripeCustomerId: customerId,
    synced: false,
    previousTier,
  };
}
