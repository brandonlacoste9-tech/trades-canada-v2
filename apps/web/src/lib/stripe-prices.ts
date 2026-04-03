/**
 * Stripe price ID → internal subscription tier mapping.
 *
 * Hardcoded IDs are the production Stripe price IDs captured at setup time.
 * They act as fallback when the NEXT_PUBLIC_STRIPE_PRICE_* env vars are not
 * available (e.g. during a cold build before env vars are populated).
 *
 * Always prefer the env vars — update these constants if you recreate the
 * prices in Stripe.
 */

export const HARDCODED_PRICE_IDS = {
  starter: "price_1TDOBMCzqBvMqSYF3JIUcIoZ",
  engine: "price_1TDOBdCzqBvMqSYFxhVj30bZ",
  dominator: "price_1TDOBrCzqBvMqSYFIpdKuwPF",
} as const;

/** Returns the canonical price ID for each tier, preferring env vars. */
export function getCanonicalPriceIds(): { starter: string; engine: string; dominator: string } {
  return {
    starter: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER || HARDCODED_PRICE_IDS.starter,
    engine: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || HARDCODED_PRICE_IDS.engine,
    dominator: process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE || HARDCODED_PRICE_IDS.dominator,
  };
}

/** Returns a Set of all valid price IDs (env + hardcoded). */
export function getAllowedPriceIds(): Set<string> {
  const { starter, engine, dominator } = getCanonicalPriceIds();
  return new Set([
    starter,
    engine,
    dominator,
    // Always include the hardcoded constants so they're valid even when env
    // vars point to different IDs (e.g. after a price recreation in Stripe).
    HARDCODED_PRICE_IDS.starter,
    HARDCODED_PRICE_IDS.engine,
    HARDCODED_PRICE_IDS.dominator,
  ]);
}

/** Returns a price ID → tier name map covering both env and hardcoded IDs. */
export function buildPriceToTierMap(): Record<string, string> {
  const { starter, engine, dominator } = getCanonicalPriceIds();
  return {
    [HARDCODED_PRICE_IDS.starter]: "starter",
    [HARDCODED_PRICE_IDS.engine]: "engine",
    [HARDCODED_PRICE_IDS.dominator]: "dominator",
    [starter]: "starter",
    [engine]: "engine",
    [dominator]: "dominator",
  };
}
