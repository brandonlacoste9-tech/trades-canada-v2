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

async function wasEventProcessed(eventId: string): Promise<boolean> {
  const db = getSupabase();
  const { data } = await db
    .from("automated_logs")
    .select("id")
    .eq("channel", "stripe")
    .eq("event_type", "stripe.webhook")
    .contains("metadata", { stripe_event_id: eventId } as never)
    .limit(1);

  return Boolean(data?.length);
}

async function writeWebhookLog(
  event: Stripe.Event,
  status: "sent" | "failed",
  subject: string,
  recipient: string | null = null
) {
  const db = getSupabase();
  await db.from("automated_logs").insert({
    event_type: "stripe.webhook",
    channel: "stripe",
    status,
    subject,
    recipient,
    metadata: {
      stripe_event_id: event.id,
      stripe_event_type: event.type,
    },
  });
}

async function updateSubscription(customerId: string, tier: SubscriptionTier) {
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
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);
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
    if (await wasEventProcessed(event.id)) {
      return NextResponse.json({ received: true, deduplicated: true });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id ?? "";
        const tier = getTier(priceId);

        // Support both metadata conventions.
        const userId = session.metadata?.userId ?? session.metadata?.user_id;
        if (userId) {
          const db = getSupabase();
          await db.from("profiles").update({ stripe_customer_id: customerId }).eq("id", userId);
        }

        await updateSubscription(customerId, tier);
        await writeWebhookLog(event, "sent", "Subscription activated", session.customer_email);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const priceId = sub.items.data[0]?.price.id ?? "";
        const tier = getTier(priceId);
        await updateSubscription(customerId, tier);
        await writeWebhookLog(event, "sent", `Subscription updated (${sub.status})`);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        await updateSubscription(customerId, "free");
        await writeWebhookLog(event, "sent", "Subscription cancelled");
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
          await updateSubscription(customerId, tier);
        }
        await writeWebhookLog(event, "sent", "Invoice payment succeeded", invoice.customer_email);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await writeWebhookLog(event, "failed", "Invoice payment failed", invoice.customer_email);
        break;
      }

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
        await writeWebhookLog(event, "sent", `Unhandled event: ${event.type}`);
    }
  } catch (err) {
    console.error("[stripe-webhook] Error processing event:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
