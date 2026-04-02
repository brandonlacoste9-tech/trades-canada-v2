-- Sync subscription_plans pricing with actual Stripe prices and UI
-- Previous migration had stale amounts ($49/$149/$399)
-- Actual pricing: Starter=$149/mo, Engine=$349/mo, Dominator=$599/mo

UPDATE public.subscription_plans SET
  name = 'The Lead Starter',
  amount_monthly = 149.00,
  lead_limit = 10,
  features = '["Marketplace Profile Access", "Bilingual Lead Alerts", "Real-time Telegram Engine", "Lead Radar Lite", "City-specific targeting"]'
WHERE id = 'starter';

UPDATE public.subscription_plans SET
  name = 'The Lead Engine',
  amount_monthly = 349.00,
  lead_limit = NULL,
  features = '["Everything in Lead Starter", "Unlimited Marketplace Claims", "Lead capture automation", "Planexa scheduling system", "Building Permit Intelligence", "Contractor dashboard"]'
WHERE id = 'engine';

UPDATE public.subscription_plans SET
  name = 'The Market Dominator',
  amount_monthly = 599.00,
  lead_limit = NULL,
  features = '["Everything in Lead Engine", "Market intelligence feed", "AI-powered lead scoring", "Multi-channel automation", "Priority support", "Priority Lead Access"]'
WHERE id = 'dominator';

-- Add Stripe Price IDs to plans for reference
UPDATE public.subscription_plans SET price_id = 'price_1TCyD0CzqBvMqSYFhDyf6YDp' WHERE id = 'starter';
UPDATE public.subscription_plans SET price_id = 'price_1TCyDeCzqBvMqSYFl3sEMMw2' WHERE id = 'engine';
UPDATE public.subscription_plans SET price_id = 'price_1TCyHwCzqBvMqSYFbv2HxlVh' WHERE id = 'dominator';

-- Add is_active column if missing
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
