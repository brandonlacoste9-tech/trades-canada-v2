import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const PLAN_NAMES: Record<string, string> = {
  price_1TCyD0CzqBvMqSYFhDyf6YDp: "The Web Starter",
  price_1TCyDeCzqBvMqSYFl3sEMMw2: "The Lead Engine",
  price_1TCyHwCzqBvMqSYFbv2HxlVh: "The Market Dominator",
};

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  console.log(`Processing Stripe event: ${event.type}`);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;
      const userId = session.metadata?.user_id;

      if (!userId) break;

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price.id;
      const planName = PLAN_NAMES[priceId] ?? "Unknown Plan";

      await supabase.from("profiles").update({
        stripe_customer_id: customerId,
        subscription_tier: planName,
        updated_at: new Date().toISOString(),
      }).eq("id", userId);

      // Log the event
      await supabase.from("automated_logs").insert({
        event_type: "subscription.activated",
        channel: "stripe",
        status: "sent",
        subject: `Plan activated: ${planName}`,
        recipient: session.customer_email,
        metadata: { plan: planName, subscription_id: subscriptionId },
      });

      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const priceId = sub.items.data[0]?.price.id;
      const planName = PLAN_NAMES[priceId] ?? "Unknown Plan";
      const isActive = sub.status === "active";

      await supabase.from("profiles")
        .update({
          subscription_tier: isActive ? planName : null,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_customer_id", customerId);

      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      await supabase.from("profiles")
        .update({ subscription_tier: null, updated_at: new Date().toISOString() })
        .eq("stripe_customer_id", customerId);

      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      await supabase.from("automated_logs").insert({
        event_type: "invoice.payment_failed",
        channel: "stripe",
        status: "failed",
        subject: "Payment failed",
        recipient: invoice.customer_email,
        metadata: { invoice_id: invoice.id, amount: invoice.amount_due },
      });
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
