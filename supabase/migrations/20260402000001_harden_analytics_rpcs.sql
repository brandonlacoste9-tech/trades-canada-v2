-- ── HARDEN ANALYTICS RPC SECURITY ────────────────────────────────────────────────
-- Both functions are SECURITY DEFINER and called exclusively server-side via
-- the service_role key. Regular users (anon / authenticated) must never be
-- able to call them directly through the client-facing API.
--
-- Pattern:
--   1. Fix search_path so a malicious schema cannot shadow public tables.
--   2. Revoke EXECUTE from the default PUBLIC grant (covers anon + authenticated).
--   3. Grant EXECUTE back to service_role only.
-- ─────────────────────────────────────────────────────────────────────────────────

-- get_unlock_trends
ALTER FUNCTION public.get_unlock_trends()
  SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.get_unlock_trends() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_unlock_trends() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_unlock_trends() FROM authenticated;

GRANT  EXECUTE ON FUNCTION public.get_unlock_trends() TO service_role;


-- get_unlock_city_stats
ALTER FUNCTION public.get_unlock_city_stats()
  SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.get_unlock_city_stats() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_unlock_city_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_unlock_city_stats() FROM authenticated;

GRANT  EXECUTE ON FUNCTION public.get_unlock_city_stats() TO service_role;
