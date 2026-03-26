-- Add geocoding columns to scraped_inventory
-- These are inserted by firecrawl-scrape-permits via Google Maps Geocoding API
ALTER TABLE public.scraped_inventory
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Index for geo queries
CREATE INDEX IF NOT EXISTS idx_scraped_inventory_coords
  ON public.scraped_inventory (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Fix unique constraint to handle NULL permit_number correctly.
-- The original constraint UNIQUE(url, permit_number) allows multiple NULLs per URL
-- because NULL != NULL in SQL — this creates phantom duplicates on re-scrapes.
-- Solution: drop the old constraint, add a smarter partial unique index.

ALTER TABLE public.scraped_inventory
  DROP CONSTRAINT IF EXISTS unique_permit;

-- Unique index for rows WITH a permit number (exact dedup)
CREATE UNIQUE INDEX IF NOT EXISTS uq_scraped_inventory_url_permit
  ON public.scraped_inventory (url, permit_number)
  WHERE permit_number IS NOT NULL;

-- Unique index for rows WITHOUT a permit number (dedup by url + title hash)
CREATE UNIQUE INDEX IF NOT EXISTS uq_scraped_inventory_url_title_null
  ON public.scraped_inventory (url, title)
  WHERE permit_number IS NULL;
