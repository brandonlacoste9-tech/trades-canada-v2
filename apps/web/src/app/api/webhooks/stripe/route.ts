import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import type { Database } from "@/types/marketplace";





function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase service role credentials not configured.");
  }
  return createSupabaseAdminClient<Database>(url, key, { auth: { persistSession: false } });
}

// Map Stripe Price IDs to internal subscription tiers
const priceToTierMap: Record<string, string> = {
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER || ""]: "starter",
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || ""]: "engine",
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE || ""]: "dominator",
};

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-06-20",
  } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
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

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const customerId = session.customer as string;

        if (!userId) break;

        // Fetch subscription to get the price ID
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        const priceId = subscription.items.data[0].price.id;
        const tier = priceToTierMap[priceId] || "starter";

        console.log(`🔔 Checkout completed for user ${userId}, tier: ${tier}`);

        await admin.from("profiles").update({
          stripe_customer_id: customerId,
          subscription_tier: tier,
        }).eq("id", userId);
        
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0].price.id;
        const tier = priceToTierMap[priceId] || "starter";

        console.log(`🔔 Subscription updated for customer ${customerId}, new tier: ${tier}`);

        // Set status to starter if canceled but not yet expired
        const newTier = subscription.status === "active" ? tier : "starter";

        await admin.from("profiles").update({
          subscription_tier: newTier,
        }).eq("stripe_customer_id", customerId);

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log(`🔔 Subscription deleted for customer ${customerId}`);

        await admin.from("profiles").update({
          subscription_tier: "starter",
        }).eq("stripe_customer_id", customerId);

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
