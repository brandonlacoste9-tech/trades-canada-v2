-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Schedule the Scraper Function to run every 6 hours
SELECT cron.schedule(
  'firecrawl-scrape-every-6-hours',
  '0 */6 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://sgvoqnyyfzqzkexortqc.supabase.co/functions/v1/firecrawl-scrape-permits',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNndm9xbnl5ZnpxemtleG9ydHFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNjc2MzMsImV4cCI6MjA4OTY0MzYzM30.6a_Wh42-vU3jPF-0H5ZtF320XBl_9MzIrwqcgeBfkWE"}'::jsonb,
      body:='{}'::jsonb
    );
  $$
);
