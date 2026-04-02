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

const ALLOWED_ORIGIN = Deno.env.get("SITE_URL") ?? "https://trades-canada.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { price_id, success_url, cancel_url, lang } = await req.json();
    if (!price_id) throw new Error("price_id is required");

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, display_name, company_name")
      .eq("id", user.id)
      .single();

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: price_id, quantity: 1 }],
      success_url: success_url ?? `${Deno.env.get("SITE_URL")}/${lang ?? "en"}/dashboard?success=1`,
      cancel_url: cancel_url ?? `${Deno.env.get("SITE_URL")}/${lang ?? "en"}#pricing`,
      metadata: { user_id: user.id },
      customer_email: user.email,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    };

    // Attach existing Stripe customer if available
    if (profile?.stripe_customer_id) {
      sessionParams.customer = profile.stripe_customer_id;
      delete sessionParams.customer_email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
