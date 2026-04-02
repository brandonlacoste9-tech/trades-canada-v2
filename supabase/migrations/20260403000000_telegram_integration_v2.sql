-- Add Telegram integration columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telegram_verification_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telegram_bot_token TEXT;

-- Create index for verification code lookup
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_code ON public.profiles(telegram_verification_code);

-- Update RLS for profiles to allow system to update chat_id via service role (already handles by default for service role)
-- but ensure users can't edit their own chat_id manually to prevent bypass
-- We already have SELECT and UPDATE policies for own profile.
