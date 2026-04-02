-- Auto-create a profiles row every time a new auth.users row is inserted.
-- Without this, new signups have no profile and subscription updates silently
-- fail because profiles.update().eq("id", userId) matches zero rows.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    display_name,
    company_name,
    preferred_language,
    subscription_tier
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    COALESCE(
      (NEW.raw_user_meta_data->>'language')::public.preferred_language,
      'en'::public.preferred_language
    ),
    NULL  -- no subscription until Stripe webhook confirms
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop first to make migration idempotent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: create profile rows for any auth users who don't have one yet
INSERT INTO public.profiles (id, display_name, company_name, preferred_language)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'display_name', ''),
  COALESCE(u.raw_user_meta_data->>'company_name', ''),
  'en'::public.preferred_language
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);
