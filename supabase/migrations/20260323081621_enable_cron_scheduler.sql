-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- SECURITY NOTE:
-- Do not hardcode bearer tokens in migrations.
-- Set a DB setting first (example):
--   ALTER DATABASE postgres SET app.settings.supabase_anon_key = 'your-anon-key';
-- Then this job reads it with current_setting(..., true).

-- 2. Schedule the Scraper Function to run every 6 hours
SELECT cron.schedule(
  'firecrawl-scrape-every-6-hours',
  '0 */6 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://sgvoqnyyfzqzkexortqc.supabase.co/functions/v1/firecrawl-scrape-permits',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || coalesce(current_setting('app.settings.supabase_anon_key', true), '')
      ),
      body:='{}'::jsonb
    );
  $$
);
