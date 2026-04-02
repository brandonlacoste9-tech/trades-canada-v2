-- Persistent rate-limit store for /api/leads.
-- Replaces the in-memory Map which resets on every serverless cold start.
-- We store one row per IP, update the count in a single atomic operation,
-- and auto-expire old windows by deleting rows where reset_at has passed.

CREATE TABLE IF NOT EXISTS public.rate_limits (
  ip        TEXT       NOT NULL,
  count     INTEGER    NOT NULL DEFAULT 1,
  reset_at  TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (ip)
);

-- No RLS required — only accessible via service_role key in API routes
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- Deny all client-side access; API routes use service_role which bypasses RLS
