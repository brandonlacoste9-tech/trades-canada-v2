# Trades Canada: Production Launch Checklist

The project has been audited and prepared for production. All critical build-blocking TypeScript errors in the contractor dashboard have been resolved.

## 1. System Status
- [x] **Type Check**: PASSED (`tsc --noEmit` is clean)
- [x] **Linting**: PASSED (`next lint` is clean)
- [x] **Security**: 
  - [x] RLS enabled on all Supabase tables (`profiles`, `leads`, `unlocks`).
  - [x] `NEXT_PUBLIC_` prefixes properly handled (secrets are server-side only).
  - [x] CSP and Security Headers configured in `next.config.ts`.
- [x] **Infrastructure**:
  - [x] Sentry Error Monitoring initialized via `instrumentation.ts`.
  - [x] Meta Pixel / CAPI tracking ready for marketing launch.
  - [x] Stripe Webhook robustly handles subscriptions and cancellations.

## 2. Environment Variable Checklist
Ensure these are set in the **Vercel Dashboard** and **Supabase Dashboard**:

### Vercel (Web App)
| Key | Value Source | Usage |
|-----|--------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard | Frontend data access |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard | Frontend data access |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard | Admin operations (API) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard | Checkout initialization |
| `STRIPE_SECRET_KEY` | Stripe Dashboard | Payment processing |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard | Order fulfillment |
| `NEXT_PUBLIC_SITE_URL` | `https://trades-canada.com` | Metadata & Redirects |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry Dashboard | Error logging |

### Supabase (Edge Functions)
Set these using `supabase secrets set ...`:
| Key | Value Source | Usage |
|-----|--------------|-------|
| `STRIPE_SECRET_KEY` | Stripe Dashboard | Sub sync functions |
| `FIRECRAWL_API_KEY` | Firecrawl Dashboard | Lead Radar scraping |
| `APOLLO_API_KEY` | Apollo.io Dashboard | Lead enrichment |

## 3. Deployment Steps

### Phase 1: Database
1. Push local migrations to production: `supabase db push`
2. Deploy Edge Functions: `supabase functions deploy`
3. Verify RLS policies are active in the Supabase Dashboard.

### Phase 2: Web App
1. Connect `trades-canada-v2` repository to Vercel.
2. Set the Project Root to `apps/web`.
3. Override Build Command to: `pnpm run build` (if not auto-detected).
4. Deploy the `main` branch.

### Phase 3: Post-Launch
1. Configure Stripe Webhook in the Stripe Dashboard to point to `https://trades-canada.com/api/webhooks/stripe`.
2. Generate production types: `pnpm gen:types` once live to capture schema changes.
3. Test a live $0.00 or test-mode payment to verify end-to-end sync.

---
> [!NOTE]
> All hardcoded `localhost` references have been removed and replaced with dynamic environment variables.
