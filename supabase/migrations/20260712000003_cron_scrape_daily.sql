-- Switch radar scrape from every 6 hours → once daily at 12:00 UTC
-- Safe to re-run: unschedules old job names first.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname IN (
  'firecrawl-scrape-every-6-hours',
  'radar-scrape-next-every-6-hours',
  'radar-scrape-next-daily'
);

SELECT cron.schedule(
  'radar-scrape-next-daily',
  '0 12 * * *',
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
