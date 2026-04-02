-- Rate limiting table for serverless-compatible rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No RLS policies = only service_role can access

-- RPC for atomic rate limit check + increment
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  rate_key TEXT,
  window_ms BIGINT,
  max_requests INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  window_start_ts TIMESTAMPTZ := now() - (window_ms || ' milliseconds')::INTERVAL;
  current_count INTEGER;
  is_limited BOOLEAN;
BEGIN
  -- Delete expired entry
  DELETE FROM public.rate_limits
  WHERE key = rate_key AND window_start < window_start_ts;

  -- Upsert: increment if exists within window, otherwise create new
  INSERT INTO public.rate_limits (key, count, window_start)
  VALUES (rate_key, 1, now())
  ON CONFLICT (key) DO UPDATE SET count = public.rate_limits.count + 1
  RETURNING count INTO current_count;

  is_limited := current_count > max_requests;

  RETURN jsonb_build_object(
    'limited', is_limited,
    'remaining', GREATEST(0, max_requests - current_count)
  );
END;
$$;

-- Only service_role can execute
REVOKE EXECUTE ON FUNCTION public.check_rate_limit FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit FROM authenticated;

-- Cleanup expired entries every hour
SELECT cron.schedule(
  'cleanup-rate-limits',
  '0 * * * *',
  $$DELETE FROM public.rate_limits WHERE window_start < now() - interval '20 minutes'$$
);
