-- Fix: Align subscription_plans prices with the production UI pricing
UPDATE public.subscription_plans SET amount_monthly = 149.00 WHERE id = 'starter';
UPDATE public.subscription_plans SET amount_monthly = 349.00 WHERE id = 'engine';
UPDATE public.subscription_plans SET amount_monthly = 599.00 WHERE id = 'dominator';
