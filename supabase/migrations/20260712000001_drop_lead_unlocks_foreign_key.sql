-- Drop the foreign key constraint on lead_unlocks.lead_id which references public.leads(id).
-- This allows lead_id to refer to either a regular lead or a municipal permit alert (from scraped_inventory).
ALTER TABLE public.lead_unlocks DROP CONSTRAINT IF EXISTS lead_unlocks_lead_id_fkey;
