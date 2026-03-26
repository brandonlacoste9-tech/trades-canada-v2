-- Migration: Add geocoordinates to scraped_inventory
-- Required by firecrawl-scrape-permits Edge Function which geocodes permit addresses

ALTER TABLE public.scraped_inventory
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Index for geo-proximity queries
CREATE INDEX IF NOT EXISTS idx_scraped_inventory_coords
  ON public.scraped_inventory (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Also fix the unique constraint so NULL permit_number doesn't conflict
-- Current: UNIQUE (url, permit_number) — NULLs are never equal so all null-number rows insert fine
-- But the upsert onConflict="url,permit_number" won't dedupe NULL rows — add a partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_scraped_unique_url
  ON public.scraped_inventory (url)
  WHERE permit_number IS NULL;
