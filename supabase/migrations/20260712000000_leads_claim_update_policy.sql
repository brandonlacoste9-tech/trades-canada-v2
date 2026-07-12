-- Allow authenticated contractors to claim unclaimed leads (exclusive claim model).
-- Without this, only service_role can UPDATE leads after RLS is enabled.

DROP POLICY IF EXISTS "Contractors can claim unclaimed leads" ON public.leads;

CREATE POLICY "Contractors can claim unclaimed leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (contractor_id IS NULL OR contractor_id = auth.uid())
WITH CHECK (
  contractor_id = auth.uid()
  OR contractor_id IS NULL
);

-- Public (anon) insert is already allowed for the marketing form.
-- Keep SELECT for authenticated contractors (marketplace).
