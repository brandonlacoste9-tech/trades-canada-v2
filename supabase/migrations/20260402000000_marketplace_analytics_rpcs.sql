-- ── MARKETPLACE ANALYTICS RPCs ───────────────────────────────────────────────────

-- 1. Add role column to profiles if it doesn't already exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'contractor';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscription_plans' AND column_name = 'is_active') THEN
        ALTER TABLE public.subscription_plans ADD COLUMN is_active BOOLEAN DEFAULT TRUE NOT NULL;
    END IF;
END $$;

-- 2. get_unlock_trends: Counts unlocks per day for the last 30 days
CREATE OR REPLACE FUNCTION public.get_unlock_trends()
RETURNS TABLE (date TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        to_char(d.day, 'YYYY-MM-DD') as date,
        COUNT(lu.id)::BIGINT as count
    FROM 
        generate_series(
            CURRENT_DATE - INTERVAL '29 days',
            CURRENT_DATE,
            '1 day'::interval
        ) d(day)
    LEFT JOIN 
        public.lead_unlocks lu ON date_trunc('day', lu.unlocked_at) = d.day
    GROUP BY 
        d.day
    ORDER BY 
        d.day ASC;
END;
$$;

-- 3. get_unlock_city_stats: Counts unlocks per city
CREATE OR REPLACE FUNCTION public.get_unlock_city_stats()
RETURNS TABLE (city TEXT, count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(l.city, 'Unknown') as city,
        COUNT(lu.id)::BIGINT as count
    FROM 
        public.lead_unlocks lu
    JOIN 
        public.leads l ON lu.lead_id = l.id
    GROUP BY 
        l.city
    ORDER BY 
        count DESC;
END;
$$;
