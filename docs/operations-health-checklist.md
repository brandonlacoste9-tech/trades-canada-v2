# Trades-Canada Operations Health Checklist

Use this checklist whenever you deploy, rotate secrets, or onboard a new operator.

## 1) Lead Intake Health

- Confirm `POST /api/leads` returns `201` for a valid submission.
- Confirm honeypot blocks bots silently:
  - submit with `website` filled and ensure no lead is inserted.
- Confirm rate limit works:
  - >8 submissions from same IP in 10 minutes should return `429`.
- Confirm logs are visible with request IDs:
  - `invalid_json`, `validation_failed`, `rate_limited`, `lead_created`, etc.

## 2) Stripe Webhook Source of Truth

- Stripe endpoint must be:
  - `https://<your-domain>/api/webhooks/stripe`
- In Supabase function secrets, keep:
  - `SUPABASE_ENABLE_LEGACY_STRIPE_WEBHOOK=false`
- Only set legacy flag `true` for emergency fallback, then set back to `false`.
- Validate webhook signature config:
  - `STRIPE_WEBHOOK_SECRET` matches the endpoint configured in Stripe.

## 3) Supabase Cron + Firecrawl Scheduler

- Verify `pg_cron` and `pg_net` extensions are enabled.
- Ensure database setting is present for cron auth header:
  - `app.settings.supabase_anon_key`
- Confirm scheduled job exists and last runs are successful.
- Ensure no hardcoded bearer tokens exist in SQL or repo history.

## 4) Required Secrets by Runtime

### Web app (`apps/web/.env.local`)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Supabase functions (`supabase/.env`)

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_ENABLE_LEGACY_STRIPE_WEBHOOK` (default: `false`)
- function-specific keys (`FIRECRAWL_API_KEY`, `RESEND_API_KEY`, etc.)

## 5) Schema and Types Consistency

- Any change to `supabase/schema.sql` must be reflected in:
  - `apps/web/src/types/database.ts`
  - API payload mappings (`/api/leads`, webhook routes)
- Run type-check before deploy:
  - `pnpm --filter @trades-canada/web type-check`

## 6) Post-Deploy Smoke Tests

- Home page loads in EN and FR.
- Lead form submission creates a lead row with:
  - `name`, `email`, `project_type`, `source='web'`.
- Dashboard still loads for authenticated contractor.
- Stripe test event (or test checkout) updates `profiles.subscription_tier`.

## 7) Incident Quick Actions

- Duplicate Stripe updates:
  - Verify only one webhook endpoint is active.
  - Confirm legacy Supabase webhook flag is `false`.
- Lead spam spike:
  - tighten API limits, enable CAPTCHA, and review source IP patterns.
- Missing lead inserts:
  - inspect `/api/leads` structured logs by `requestId`.
