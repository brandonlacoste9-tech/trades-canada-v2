import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// ─── Lazy clients ────────────────────────────────────────────────────────────
let _stripe: Stripe | null = null;
let _supabase: ReturnType<typeof createClient<Database>> | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-02-25.clover",
    });
  }
  return _stripe;
}

function getSupabase(): ReturnType<typeof createClient<Database>> {
  if (!_supabase) {
    _supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabase;
}

// ─── Tier mapping ────────────────────────────────────────────────────────────
type SubscriptionTier = "starter" | "pro" | "elite" | "free";

function getTier(priceId: string): SubscriptionTier {
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER) return "starter";
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO) return "pro";
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE) return "elite";
  return "starter";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function getProfileByCustomerId(customerId: string) {
  const db = getSupabase();
  const { data } = await db
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();
  return data;
}

async function updateSubscription(
  customerId: string,
  tier: SubscriptionTier,
  status: string,
  subscriptionId: string | null
) {
  const db = getSupabase();
  const profile = await getProfileByCustomerId(customerId);
  if (!profile) {
    console.error(`[stripe-webhook] No profile found for customer ${customerId}`);
    return;
  }

  await db
    .from("profiles")
    .update({
      subscription_tier: tier,
      subscription_status: status,
      stripe_subscription_id: subscriptionId,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", profile.id);

  await db.from("automation_log").insert({
    contractor_id: profile.id,
    event_type: "subscription_updated",
    payload: { tier, status, stripe_subscription_id: subscriptionId },
    created_at: new Date().toISOString(),
  } as never);
}

// ─── Route handler ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[stripe-webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log(`[stripe-webhook] Processing event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id ?? "";
        const tier = getTier(priceId);

        await updateSubscription(customerId, tier, "active", subscriptionId);

        if (session.metadata?.userId) {
          const db = getSupabase();
          await db
            .from("profiles")
            .update({ stripe_customer_id: customerId } as never)
            .eq("id", session.metadata.userId);
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const priceId = sub.items.data[0]?.price.id ?? "";
        const tier = getTier(priceId);
        const status = sub.status === "active" ? "active" : sub.status;
        await updateSubscription(customerId, tier, status, sub.id);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        await updateSubscription(customerId, "free", "cancelled", null);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const subscriptionId = (invoice as { subscription?: string }).subscription ?? null;
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = sub.items.data[0]?.price.id ?? "";
          const tier = getTier(priceId);
          await updateSubscription(customerId, tier, "active", subscriptionId);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const profile = await getProfileByCustomerId(customerId);
        if (profile) {
          const db = getSupabase();
          await db
            .from("profiles")
            .update({ subscription_status: "past_due" } as never)
            .eq("id", profile.id);
        }
        break;
      }

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("[stripe-webhook] Error processing event:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
