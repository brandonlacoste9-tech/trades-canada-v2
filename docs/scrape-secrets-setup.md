# Contractor scrape pipeline — secrets & cron

Three production pieces that unlock the full municipal lead pipeline.

## Status checklist

| Item | Local | Production (Vercel) |
|------|--------|---------------------|
| `FIRECRAWL_API_KEY` | Optional (open-data cities work without it) | Same |
| `SUPABASE_SERVICE_ROLE_KEY` | Required for `scraped_inventory` writes | Required |
| Cron once daily (12:00 UTC) | Optional local | **Vercel Cron** or **pg_cron** |

Check anytime:

```bash
curl http://localhost:3003/api/radar/scrape
# → setup.FIRECRAWL_API_KEY / serviceRoleConfigured / cronSecretConfigured
```

---

## 1. FIRECRAWL_API_KEY

**Why:** Toronto, Montréal, Ottawa, Québec portals are HTML-only — open-data JSON isn’t used there yet.

**Get it:** [firecrawl.dev](https://www.firecrawl.dev) → Dashboard → API Keys → `fc-...`

**Set local** (`apps/web/.env.local`):

```env
FIRECRAWL_API_KEY=fc-your-key-here
```

**Set Vercel:** Project → Settings → Environment Variables → `FIRECRAWL_API_KEY`  
Redeploy after saving.

**Without it:** Calgary / Edmonton / Winnipeg / Vancouver scrapes still work.

---

## 2. SUPABASE_SERVICE_ROLE_KEY

**Why:** RLS blocks anon inserts into `scraped_inventory`. Service role (or `sb_secret_...`) bypasses RLS so the Radar inventory table fills.  
Lead **promotion** to `leads` already works with the publishable key.

**Get it:** Supabase → Project Settings → **API Keys**

| New keys | Legacy keys |
|----------|-------------|
| `sb_secret_...` | `service_role` JWT (`eyJ...`) |

**Never** put this in `NEXT_PUBLIC_*` or client code.

**Set local:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://sgvoqnyyfzqzkexortqc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...   # or service_role JWT
```

**Set Vercel:** same three vars for Production + Preview.

Restart dev after editing `.env.local`.

---

## 3. Cron (once daily, 12:00 UTC)

### Option A — Vercel Cron (recommended)

Already in `vercel.json` / `apps/web/vercel.json`:

```json
"crons": [{ "path": "/api/radar/scrape", "schedule": "0 12 * * *" }]
```

- Vercel sends `x-vercel-cron: 1` on GET → route runs scrape automatically.
- Requires **Pro** plan for crons on production (Hobby has limits).
- No `CRON_SECRET` required for the Vercel header path.

### Option B — External cron (cron-job.org, GitHub Actions)

```env
CRON_SECRET=long-random-string-at-least-32-chars
```

```bash
curl -X POST https://www.trades-canada.com/api/radar/scrape \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"promoteToLeads":true,"maxPerCity":25}'
```

Schedule: `0 12 * * *` (once daily at 12:00 UTC)

### Option C — Supabase pg_cron

See migration:

`supabase/migrations/20260712000002_cron_next_scrape_endpoint.sql`

Set DB settings first (SQL Editor):

```sql
ALTER DATABASE postgres SET app.settings.site_url = 'https://www.trades-canada.com';
ALTER DATABASE postgres SET app.settings.cron_secret = 'same-as-CRON_SECRET';
```

Then run the migration SQL.

---

## Manual trigger (paid dashboard)

Lead Radar → **Refresh scraped leads**

Or:

```bash
node scripts/test-scrape.mjs
```

---

## After all three are set

1. Redeploy Vercel  
2. `curl -X POST https://www.trades-canada.com/api/radar/scrape -H "Authorization: Bearer $CRON_SECRET"`  
3. Supabase → `leads` where `source = scraped`  
4. Log in as paid contractor → Dashboard shows municipal + scraped leads  
