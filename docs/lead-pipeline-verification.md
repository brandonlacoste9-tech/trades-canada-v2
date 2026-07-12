# Lead pipeline verification

## Promise vs delivery

| Promise | Who | Status |
|--------|-----|--------|
| Homeowner submits job request | Public form | ✅ Working |
| Lead stored in Supabase | `public.leads` | ✅ Working |
| Contractor sees market leads | Paid dashboard | ✅ Code path (needs paid auth) |
| Free users see real leads | Free tier | ❌ By design — **demo/mock only** |
| Exclusive claim | Paid contractor | ⚠️ Needs UPDATE RLS policy + login |
| Telegram alert | Edge function | ⚠️ Needs service role + Telegram secrets |
| Confirmation email | `enqueue_email` + worker | ⚠️ Needs queue + Resend |

## End-to-end path

```
Homeowner LeadForm
  → POST /api/leads
  → INSERT public.leads (name, email, phone, project_type, city, …)
  → AI qualify (optional OpenAI; else heuristic)
  → email queue / Telegram (best-effort)

Contractor (paid plan)
  → /en/dashboard
  → lists unclaimed leads + their claimed leads
  → Claim → POST /api/leads/:id/claim
  → Unlock PII → POST /api/leads/unlock (tier limits)
```

## Local smoke

```bash
# Capture path
node scripts/test-leads.mjs

# Expect: 6/6 pass, row appears in Supabase Table Editor → leads
```

## Required env for production integrity

```env
NEXT_PUBLIC_SUPABASE_URL=https://sgvoqnyyfzqzkexortqc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...   # strongly recommended
```

Apply claim policy:

```bash
# SQL Editor in Supabase, run:
# supabase/migrations/20260712000000_leads_claim_update_policy.sql
```

## Free vs paid (important for “what we sell”)

- **Free** → `getMockLeads()` only (marketing demo, not real homeowners).
- **Starter / Pro / Elite** → real `leads` from DB + claim/unlock.
- Special test bypass: `brandonlacoste9@gmail.com` treated as elite.

## Municipal scrape API (contractor inventory)

Contractors get two lead sources:

1. **Homeowner form** → `source=web`
2. **Municipal permit scrape** → `source=scraped` via open-data APIs (+ optional Firecrawl)

### Endpoints

| Method | Path | Who |
|--------|------|-----|
| `GET` | `/api/radar/scrape` | Status / counts |
| `POST` | `/api/radar/scrape` | Paid user **or** `Authorization: Bearer $CRON_SECRET` |

Body (optional):

```json
{ "cities": ["calgary", "edmonton"], "promoteToLeads": true, "maxPerCity": 20 }
```

### Sources

| City | Method |
|------|--------|
| Calgary, Edmonton, Winnipeg | Socrata open-data JSON (no Firecrawl) |
| Vancouver | OpenDataSoft API |
| Toronto, Montréal, Ottawa, Québec | Firecrawl when `FIRECRAWL_API_KEY` is set |

### Smoke

```bash
node scripts/test-scrape.mjs
# AI_TEST_BASE=http://localhost:3003 CRON_SECRET=... node scripts/test-scrape.mjs
```

### UI

Paid **Lead Radar** dashboard → **Refresh scraped leads** button.
