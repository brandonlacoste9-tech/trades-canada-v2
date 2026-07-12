-- Point pg_cron at the Next.js scrape API (preferred) in addition to / instead of
-- only the legacy Edge Function.
--
-- BEFORE running, set secrets in the database (do not commit real values):
--
--   ALTER DATABASE postgres SET app.settings.site_url = 'https://www.trades-canada.com';
--   ALTER DATABASE postgres SET app.settings.cron_secret = 'your-long-random-CRON_SECRET';
--
-- Then run this migration (or paste into SQL Editor).

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Unschedule old job name if present (idempotent)
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname IN (
  'firecrawl-scrape-every-6-hours',
  'radar-scrape-next-every-6-hours'
);

-- Next.js API every 6 hours
SELECT cron.schedule(
  'radar-scrape-next-every-6-hours',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := rtrim(coalesce(current_setting('app.settings.site_url', true), 'https://www.trades-canada.com'), '/')
           || '/api/radar/scrape',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(current_setting('app.settings.cron_secret', true), '')
    ),
    body := jsonb_build_object(
      'promoteToLeads', true,
      'maxPerCity', 25
    )
  );
  $$
);
