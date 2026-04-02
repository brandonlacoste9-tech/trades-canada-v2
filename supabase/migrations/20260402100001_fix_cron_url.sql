-- Fix: Replace hardcoded Supabase project URL in pg_cron schedule
-- with a dynamic reference using database config settings.
--
-- Before applying, set the config on your Supabase project:
--   ALTER DATABASE postgres SET app.settings.supabase_url = 'https://<project-ref>.supabase.co';
--   ALTER DATABASE postgres SET app.settings.service_role_key = '<your-service-role-key>';

SELECT cron.unschedule('firecrawl-scrape-every-6-hours');

SELECT cron.schedule(
  'firecrawl-scrape-every-6-hours',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/firecrawl-scrape-permits',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);
