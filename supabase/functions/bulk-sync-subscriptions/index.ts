import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import Stripe from "https://esm.sh/stripe@14?target=denonext";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } }
);

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2026-02-25",
});

const PRICE_TO_TIER: Record<string, string> = {
  price_1TCyD0CzqBvMqSYFhDyf6YDp: "starter",
  price_1TCyDeCzqBvMqSYFl3sEMMw2: "engine",
  price_1TCyHwCzqBvMqSYFbv2HxlVh: "dominator",
};

type Candidate = {
  id: string;
  stripe_customer_id: string;
  subscription_tier: string | null;
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return json(405, { error: "Method not allowed" });
  }

  const url = new URL(req.url);
  const limit = Math.max(
    1,
    Math.min(parseInt(url.searchParams.get("limit") ?? "200", 10), 500)
  );

  const { data: candidates, error } = await supabase
    .from("profiles")
    .select("id, stripe_customer_id, subscription_tier")
    .not("stripe_customer_id", "is", null)
    .or("subscription_tier.is.null,subscription_tier.eq.starter")
    .limit(limit);

  if (error) return json(500, { error: error.message });

  const results = {
    candidates: candidates?.length ?? 0,
    updated: 0,
    already_correct: 0,
    no_subscription: 0,
    errors: 0,
  };

  for (const profile of (candidates ?? []) as Candidate[]) {
    try {
      const subs = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id,
        status: "active",
        limit: 1,
      });

      if (subs.data.length === 0) {
        results.no_subscription++;
        continue;
      }

      const priceId = subs.data[0].items.data[0]?.price?.id ?? "";
      const newTier = PRICE_TO_TIER[priceId] ?? "starter";

      if (newTier === profile.subscription_tier) {
        results.already_correct++;
        continue;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ subscription_tier: newTier })
        .eq("id", profile.id);

      if (updateError) throw updateError;
      results.updated++;
    } catch (err) {
      console.error(`Failed for profile ${profile.id}:`, err);
      results.errors++;
    }
  }

  return json(200, results);
});
