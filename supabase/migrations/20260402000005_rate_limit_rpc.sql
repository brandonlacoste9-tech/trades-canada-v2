-- Atomic rate-limit upsert function called from /api/leads.
-- Returns { blocked: true } if the IP has exceeded p_max requests in the window.
CREATE OR REPLACE FUNCTION public.upsert_rate_limit(
  p_ip         TEXT,
  p_max        INTEGER,
  p_window_sec INTEGER,
  p_now        TIMESTAMPTZ,
  p_reset_at   TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count  INTEGER;
  v_row    public.rate_limits%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.rate_limits WHERE ip = p_ip FOR UPDATE;

  IF NOT FOUND OR v_row.reset_at <= p_now THEN
    -- First request in this window, or old window expired
    INSERT INTO public.rate_limits (ip, count, reset_at)
    VALUES (p_ip, 1, p_reset_at)
    ON CONFLICT (ip) DO UPDATE
      SET count = 1, reset_at = EXCLUDED.reset_at;
    RETURN jsonb_build_object('blocked', false, 'count', 1);
  ELSE
    v_count := v_row.count + 1;
    UPDATE public.rate_limits SET count = v_count WHERE ip = p_ip;
    RETURN jsonb_build_object('blocked', v_count > p_max, 'count', v_count);
  END IF;
END;
$$;

-- Only allow the service_role to call this function
REVOKE EXECUTE ON FUNCTION public.upsert_rate_limit(TEXT, INTEGER, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.upsert_rate_limit(TEXT, INTEGER, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ) FROM anon;
REVOKE EXECUTE ON FUNCTION public.upsert_rate_limit(TEXT, INTEGER, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.upsert_rate_limit(TEXT, INTEGER, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;

-- Periodic cleanup: delete expired windows (called via cron or inline)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.rate_limits WHERE reset_at <= now();
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;
