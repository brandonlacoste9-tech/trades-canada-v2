-- Allow service role / backend to insert scraped permits.
-- (service_role JWT bypasses RLS; this policy helps authenticated service accounts
--  and documents intent. Anon remains read-only.)

ALTER TABLE public.scraped_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view inventory" ON public.scraped_inventory;
CREATE POLICY "Authenticated can view inventory"
ON public.scraped_inventory
FOR SELECT
TO authenticated
USING (true);

-- Optional: allow authenticated paid backend roles if you use custom claims later.
-- Primary writer is SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).

DROP POLICY IF EXISTS "Service role full access inventory" ON public.scraped_inventory;
-- Note: service_role bypasses RLS automatically; no policy required for that role.
