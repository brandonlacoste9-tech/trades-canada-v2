-- Allow authenticated users to read their own related logs
-- (logs that reference a lead they own or were involved with)
-- Also allows admins to read all logs via service_role (already unrestricted)

-- Contractors can see logs related to leads they own
CREATE POLICY "Contractors can view own lead logs" ON public.automated_logs
  FOR SELECT TO authenticated
  USING (
    lead_id IN (
      SELECT id FROM public.leads WHERE contractor_id = auth.uid()
    )
    OR
    recipient = auth.uid()::text
    OR
    lead_id IS NULL
  );
