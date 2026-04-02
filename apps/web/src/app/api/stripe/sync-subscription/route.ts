import { NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { syncUserSubscriptionFromStripe } from "@/lib/stripe-subscription-sync";

const LOG = "[stripe/sync-subscription]";

/**
 * GET /api/stripe/sync-subscription
 *
 * Reconciles profiles.subscription_tier from Stripe (active + trialing).
 * If stripe_customer_id is missing, links the Stripe customer by account email.
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 503 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });
  }

  try {
    const result = await syncUserSubscriptionFromStripe(user.id, user.email);
    console.info(
      `${LOG} user ${user.id} tier=${result.tier} synced=${result.synced} prev=${result.previousTier}`
    );
    return NextResponse.json({
      tier: result.tier,
      synced: result.synced,
      previous_tier: result.previousTier,
      stripe_customer_id: result.stripeCustomerId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`${LOG} error for user ${user.id}:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
