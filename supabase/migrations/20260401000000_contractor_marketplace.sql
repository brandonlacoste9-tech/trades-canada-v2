-- ── MARKETPLACE EXTENSIONS ──────────────────────────────────────────────────────

-- 1. Subscription Plans (Reference table for frontend/stripe)
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id TEXT PRIMARY KEY, -- e.g. 'starter', 'engine', 'dominator'
    name TEXT NOT NULL,
    price_id TEXT UNIQUE, -- Stripe Price ID
    amount_monthly NUMERIC NOT NULL,
    lead_limit INTEGER, -- null for unlimited
    features JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Lead Unlocks (tracks which contractor paid for/unlocked which lead)
CREATE TABLE IF NOT EXISTS public.lead_unlocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contractor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(contractor_id, lead_id)
);

-- 3. Seed Metadata for Plans
INSERT INTO public.subscription_plans (id, name, amount_monthly, lead_limit, features) 
VALUES
('starter', 'The Web Starter', 49.00, 5, '["Bilingual Website", "Basic SEO", "5 Leads/mo"]'),
('engine', 'The Lead Engine', 149.00, 25, '["Bilingual SEO", "AI Lead Radar", "25 Leads/mo", "Telegram Alerts"]'),
('dominator', 'The Market Dominator', 399.00, NULL, '["Nationwide Targeting", "Priority Leads", "Unlimited Unlocks", "Market Intelligence"]')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    amount_monthly = EXCLUDED.amount_monthly,
    lead_limit = EXCLUDED.lead_limit,
    features = EXCLUDED.features;

-- 4. RLS POLICIES
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_unlocks ENABLE ROW LEVEL SECURITY;

-- Everyone can view plans
CREATE POLICY "Allow public read access to plans" ON public.subscription_plans FOR SELECT USING (true);

-- Contractors can view their own unlocks
CREATE POLICY "Contractors can view own unlocks" ON public.lead_unlocks FOR SELECT USING (auth.uid() = contractor_id);

-- Contractors can "buy" an unlock (simplified for now, eventually check subscription logic)
CREATE POLICY "Contractors can unlock leads" ON public.lead_unlocks FOR INSERT WITH CHECK (auth.uid() = contractor_id);

-- 5. Updated Leads View Policy
-- Allow contractors to view public data of all leads
DROP POLICY IF EXISTS "Authenticated users can view leads" ON public.leads;
CREATE POLICY "Authenticated users can view leads" ON public.leads FOR SELECT TO authenticated USING (true);

-- 6. Spatial Index for Lead Proximity
CREATE INDEX IF NOT EXISTS idx_leads_city ON public.leads (city);
