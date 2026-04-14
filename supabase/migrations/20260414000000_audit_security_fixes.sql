-- ── CRITICAL SECURITY FIX: PII PROTECTION ─────────────────────────────────────
-- Partition sensitive contact data to prevent unauthorized lead scraping.

-- 1. Create lead_contacts table
CREATE TABLE IF NOT EXISTS public.lead_contacts (
    lead_id UUID PRIMARY KEY REFERENCES public.leads(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Migrate existing data from leads to lead_contacts
INSERT INTO public.lead_contacts (lead_id, name, email, phone)
SELECT id, name, email, phone FROM public.leads
ON CONFLICT (lead_id) DO NOTHING;

-- 3. Set up RLS for lead_contacts
-- ONLY visible to the contractor who has unlocked the lead OR who owns it.
ALTER TABLE public.lead_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View unlocked contacts" 
ON public.lead_contacts
FOR SELECT 
TO authenticated
USING (
    lead_id IN (
        SELECT lead_id FROM public.lead_unlocks WHERE contractor_id = auth.uid()
    )
    OR 
    lead_id IN (
        SELECT id FROM public.leads WHERE contractor_id = auth.uid()
    )
);

-- 4. Set up RLS for lead_unlocks (already exists, but make sure it allows insert)
-- ... exists in previous migrations

-- 5. Enrichment Persistence for Municipal Intel
ALTER TABLE public.scraped_inventory
ADD COLUMN IF NOT EXISTS enriched_name TEXT,
ADD COLUMN IF NOT EXISTS enriched_email TEXT,
ADD COLUMN IF NOT EXISTS enriched_phone TEXT,
ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMPTZ;

-- 6. Add policy for lead_unlocks to allow viewing enriched data in scraped_inventory
-- We'll handle this in the API for now, but in the future we could have a view.

-- 7. CLEANUP: Once the app code is updated, we SHOULD drop name, email, phone from public.leads
-- For now we leave them to avoid breaking the build immediately, but we should clear the data.
-- UPDATE public.leads SET name = 'Protected', email = 'protected@trades-canada.com', phone = NULL;

