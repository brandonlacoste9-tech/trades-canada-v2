import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import type { Database } from "@/types/marketplace";

const LOG = "[stripe/webhook]";

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase service role credentials not configured.");
  }
  return createSupabaseAdminClient<Database>(url, key, { auth: { persistSession: false } });
}

// Map Stripe Price IDs → internal subscription tiers.
// Env-var Price IDs always take precedence over static fallbacks.
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

/** Upsert a profile row so the update never silently fails for users
 *  who don't yet have a profiles row (e.g. signed up before the trigger
 *  migration was deployed). */
async function upsertProfileTier(
  admin: ReturnType<typeof getAdminSupabase>,
  where: { id?: string; stripe_customer_id?: string },
  payload: { subscription_tier: string; stripe_customer_id?: string }
) {
  if (where.id) {
    const { error } = await admin
      .from("profiles")
      .upsert({ id: where.id, ...payload }, { onConflict: "id" });
    if (error) {
      console.error(`${LOG} profile upsert failed (id=${where.id}):`, error.message);
    } else {
      console.info(`${LOG} profile updated (id=${where.id}, tier=${payload.subscription_tier})`);
    }
  } else if (where.stripe_customer_id) {
    const { error } = await admin
      .from("profiles")
      .update(payload)
      .eq("stripe_customer_id", where.stripe_customer_id);
    if (error) {
      console.error(`${LOG} profile update failed (customer=${where.stripe_customer_id}):`, error.message);
    } else {
      console.info(`${LOG} profile updated (customer=${where.stripe_customer_id}, tier=${payload.subscription_tier})`);
    }
  }
}

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    console.error(`${LOG} Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET`);
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2026-02-25.clover" });
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`${LOG} signature verification failed: ${message}`);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  console.info(`${LOG} received event: ${event.type} (id=${event.id})`);
  const admin = getAdminSupabase();

  try {
    switch (event.type) {

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const customerId = session.customer as string | null;

        if (!userId) {
          console.warn(`${LOG} checkout.session.completed missing userId metadata (session=${session.id})`);
          break;
        }
        if (!customerId) {
          console.warn(`${LOG} checkout.session.completed missing customer id (session=${session.id})`);
          break;
        }

        // Resolve the price ID from the subscription
        let tier = "starter";
        const subscriptionId = session.subscription as string | null;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0]?.price.id ?? "";
          tier = priceToTierMap[priceId] ?? "starter";
        }

        await upsertProfileTier(admin, { id: userId }, {
          subscription_tier: tier,
          stripe_customer_id: customerId,
        });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price.id ?? "";
        const mappedTier = priceToTierMap[priceId] ?? "starter";
        // Downgrade if not active (past_due, canceled, etc.)
        const tier = subscription.status === "active" || subscription.status === "trialing"
          ? mappedTier
          : "starter";

        await upsertProfileTier(admin, { stripe_customer_id: customerId }, { subscription_tier: tier });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        await upsertProfileTier(admin, { stripe_customer_id: customerId }, { subscription_tier: "starter" });
        break;
      }

      // Also handle invoice payment failure — downgrade if billing hard-fails
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string | null;
        const attemptCount = invoice.attempt_count ?? 0;
        if (customerId && attemptCount >= 3) {
          console.warn(`${LOG} invoice payment failed ${attemptCount}x for customer ${customerId} — downgrading`);
          await upsertProfileTier(admin, { stripe_customer_id: customerId }, { subscription_tier: "starter" });
        }
        break;
      }

      default:
        console.info(`${LOG} unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error(`${LOG} handler failed for event ${event.type}: ${message}`);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
