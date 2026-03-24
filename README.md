# Trades-Canada — Monorepo

**The sovereign growth engine for Canadian contractors. Rebuilt from scratch.**

## Architecture

This is a **Turborepo** monorepo with the following workspaces:

| Workspace | Stack | Purpose |
| :--- | :--- | :--- |
| `apps/web` | Next.js 15 App Router, TypeScript, Tailwind CSS | Public marketing site + Contractor dashboard |
| `supabase/functions` | Deno Edge Functions | Stripe, Firecrawl, Telegram, Email Queue |

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router, Server Components) |
| **Language** | TypeScript (strict) |
| **Styling** | Tailwind CSS 3 + custom amber-glassmorphism design system |
| **Animations** | Framer Motion 12 |
| **Database & Auth** | Supabase (PostgreSQL + Row Level Security) |
| **Payments** | Stripe (Checkout Sessions + Webhooks) |
| **Notifications** | Telegram Bot API |
| **Web Scraping** | Firecrawl API |
| **Email** | Resend + pgmq queue |
| **i18n** | Custom bilingual EN/FR routing via Next.js App Router |
| **Monorepo** | Turborepo |

## Key Architectural Decisions

### SSR/SSG for SEO Sovereignty

All public-facing pages (`/`, `/city/:slug`, `/booking`) are **Server Components** with `generateStaticParams()`, ensuring fully rendered HTML is served to search engine crawlers. This directly addresses the SPA anti-pattern in the previous Vite build.

### Bilingual i18n Routing

URLs are structured as `/{lang}/{page}` (e.g., `/en/city/toronto`, `/fr/city/montreal`). The Next.js middleware handles automatic language detection and redirection. Both EN and FR versions are indexed independently with proper `hreflang` tags.

### Edge Functions as Worker Bees

The backend automation layer lives entirely in Supabase Edge Functions (Deno runtime):

- `stripe-webhook` — Legacy fallback only (disabled by default)
- `create-checkout-session` — Secure server-side Stripe session creation
- `telegram-lead-alert` — Instant lead notifications to contractors
- `firecrawl-scrape-permits` — Daily permit data scraping across 6 Canadian cities
- `send-email-queue` — pgmq-based reliable email delivery via Resend

### Stripe Webhook Source of Truth

To prevent duplicate billing updates, use **one webhook handler only**:

- **Primary:** `apps/web/src/app/api/webhooks/stripe/route.ts`
- **Legacy:** `supabase/functions/stripe-webhook` (kept for emergency fallback, disabled by default)

Set Stripe's endpoint to:

- `https://<your-domain>/api/webhooks/stripe`

### Dashboard Architecture

The authenticated dashboard uses a hybrid approach:

- **Server Components** for data fetching (leads, logs, profile)
- **Client Components** for interactive UI (LeadList, SettingsClient, LeadRadarClient)
- **Middleware** for auth protection (no client-side redirects)

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Start only web app
pnpm dev:web

# Build for production
pnpm build

# Fast validation for web app
pnpm check:web
```

## Environment Variables

Copy `apps/web/.env.example` to `apps/web/.env.local` and fill in your keys.
Copy `supabase/.env.example` to `supabase/.env` for Edge Function secrets.

## Deployment

The `apps/web` Next.js app is designed for **Vercel** deployment.

### Vercel Root Directory (important)

1. Open your Vercel project → **Settings** → **General**.
2. Find **Root Directory** and set it to **`apps/web`**, then save.
3. Redeploy. After this, `pnpm install` in the build log should list **`next`** (and other app deps), not only `turbo` and `typescript`.

If **Root Directory is empty**, Vercel uses the repository root. That triggers “No Next.js version detected” unless the root `package.json` also lists `next` (this repo does for that case). The clean setup is still **`apps/web`**.

The file `apps/web/vercel.json` applies when Root Directory is `apps/web`. Root `vercel.json` only matters when the deployment root is the monorepo root.

Supabase Edge Functions are deployed via `supabase functions deploy`.

### Stripe Webhook Deployment Notes

- Keep `SUPABASE_ENABLE_LEGACY_STRIPE_WEBHOOK=false` in Supabase function secrets (default behavior).
- Only set it to `true` temporarily if you intentionally switch Stripe to call the Supabase function.

## Cursor Free Workflow

- Project rule file: `.cursor/rules/trades-canada-free-workflow.mdc`
- Quick setup doc: `docs/cursor-free-setup.md`

## City Coverage

| City | Province | Slug |
| :--- | :--- | :--- |
| Toronto | Ontario | `toronto` |
| Montréal | Québec | `montreal` |
| Vancouver | British Columbia | `vancouver` |
| Calgary | Alberta | `calgary` |
| Ottawa | Ontario | `ottawa` |
| Edmonton | Alberta | `edmonton` |
| Winnipeg | Manitoba | `winnipeg` |
| Halifax | Nova Scotia | `halifax` |
| Saskatoon | Saskatchewan | `saskatoon` |
| Regina | Saskatchewan | `regina` |
