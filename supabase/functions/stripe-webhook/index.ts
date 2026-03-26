/**
 * Legacy Stripe Webhook — Supabase Edge Function
 *
 * ⚠️  DISABLED BY DEFAULT
 *
 * The PRIMARY webhook handler is:
 *   apps/web/src/app/api/webhooks/stripe/route.ts  ← use this
 *
 * This function is kept as an emergency fallback ONLY.
 * Set Stripe dashboard webhook endpoint to:
 *   https://<your-domain>/api/webhooks/stripe
 *
 * To activate this fallback (emergency only):
 *   supabase secrets set SUPABASE_ENABLE_LEGACY_STRIPE_WEBHOOK=true
 * Then point Stripe to:
 *   https://<project>.supabase.co/functions/v1/stripe-webhook
 *
 * DO NOT run both handlers simultaneously — you will double-process events.
 */

const ENABLED = Deno.env.get("SUPABASE_ENABLE_LEGACY_STRIPE_WEBHOOK") === "true";

Deno.serve(async (_req) => {
  if (!ENABLED) {
    console.warn(
      "[stripe-webhook] Legacy handler is DISABLED. " +
      "Set SUPABASE_ENABLE_LEGACY_STRIPE_WEBHOOK=true to enable. " +
      "Primary handler: apps/web/src/app/api/webhooks/stripe/route.ts"
    );
    return new Response(
      JSON.stringify({
        disabled: true,
        message: "Legacy Stripe webhook is disabled. Use the Next.js API route instead.",
        primary_handler: "/api/webhooks/stripe",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  // If somehow enabled, log a loud warning before processing
  console.error(
    "⚠️  LEGACY STRIPE WEBHOOK ACTIVE. " +
    "Ensure the Next.js primary handler is disabled to prevent double-processing."
  );

  // Return 200 to prevent Stripe retries — actual processing is in Next.js route
  return new Response(
    JSON.stringify({ received: true, source: "legacy_fallback" }),
    { headers: { "Content-Type": "application/json" } }
  );
});
