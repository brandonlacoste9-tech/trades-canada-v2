import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import type { Database } from "@/types/marketplace";
import { buildPriceToTierMap } from "@/lib/stripe-prices";

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase service role credentials not configured.");
  }
  return createSupabaseAdminClient<Database>(url, key, { auth: { persistSession: false } });
}

/** Checkout can return subscription as an id string or an expanded object. */
async function loadSubscriptionFromCheckoutSession(
  stripe: Stripe,
  session: Stripe.Checkout.Session
): Promise<Stripe.Subscription | null> {
  const raw = session.subscription;
  if (!raw) return null;
  if (typeof raw === "string") {
    return stripe.subscriptions.retrieve(raw);
  }
  return raw;
}

function tierFromSubscription(
  subscription: Stripe.Subscription,
  priceToTierMap: Record<string, string>
): string {
  const priceId = subscription.items.data[0]?.price.id ?? "";
  return priceToTierMap[priceId] ?? "starter";
}

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
  });
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`❌ Webhook signature verification failed: ${message}`);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  const admin = getAdminSupabase();
  const priceToTierMap = buildPriceToTierMap();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const customerId = session.customer as string;

        if (!userId) {
          console.warn("⚠️ checkout.session.completed: missing userId in session metadata");
          break;
        }

        if (session.mode !== "subscription") {
          console.warn("⚠️ checkout.session.completed: mode is not subscription");
          break;
        }

        const subscription = await loadSubscriptionFromCheckoutSession(stripe, session);
        if (!subscription) {
          console.error("❌ checkout.session.completed: could not load subscription");
          break;
        }

        const tier = tierFromSubscription(subscription, priceToTierMap);

        console.log(
          `🔔 Checkout completed — user: ${userId}, priceId: ${subscription.items.data[0]?.price.id}, tier: ${tier}`
        );

        const { error } = await admin.from("profiles").upsert(
          { id: userId, stripe_customer_id: customerId, subscription_tier: tier },
          { onConflict: "id" }
        );
        if (error) {
          console.error(`❌ Profile upsert failed for user ${userId}:`, error.message);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const userId = subscription.metadata?.userId;
        const tier = tierFromSubscription(subscription, priceToTierMap);
        const newTier =
          subscription.status === "active" || subscription.status === "trialing"
            ? tier
            : "starter";

        console.log(
          `🔔 ${event.type} — customer: ${customerId}, userId: ${userId ?? "none"}, tier: ${newTier}`
        );

        if (userId) {
          const { error } = await admin.from("profiles").upsert(
            {
              id: userId,
              stripe_customer_id: customerId,
              subscription_tier: newTier,
            },
            { onConflict: "id" }
          );
          if (error) {
            console.error(`❌ Profile upsert failed for user ${userId}:`, error.message);
          }
        } else {
          await admin
            .from("profiles")
            .update({ subscription_tier: newTier })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log(`🔔 Subscription cancelled — customer: ${customerId}`);

        const { error } = await admin
          .from("profiles")
          .update({ subscription_tier: "starter" })
          .eq("stripe_customer_id", customerId);
        if (error) {
          console.error(`❌ Profile downgrade failed for customer ${customerId}:`, error.message);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const attemptCount = invoice.attempt_count ?? 0;

        console.log(`🔔 Payment failed — customer: ${customerId}, attempt: ${attemptCount}`);

        if (attemptCount >= 3) {
          await admin
            .from("profiles")
            .update({ subscription_tier: "starter" })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      default:
        console.log(`🤷 Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error(`❌ Webhook handler failed: ${message}`);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
