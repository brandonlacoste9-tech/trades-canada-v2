-- ── ENUMS ───────────────────────────────────────────────────────────────────────
CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE public.lead_source AS ENUM ('web', 'scraped', 'referral');
CREATE TYPE public.lead_status AS ENUM ('new', 'qualified', 'contacted', 'converted', 'lost');
CREATE TYPE public.preferred_language AS ENUM ('en', 'fr');
CREATE TYPE public.project_type AS ENUM ('hvac', 'roofing', 'landscaping', 'renovations', 'plumbing', 'electrical', 'general', 'other');

-- ── TABLES ──────────────────────────────────────────────────────────────────────

-- 1. Profiles (extends auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    company_name TEXT,
    phone TEXT,
    services TEXT[] DEFAULT '{}',
    city TEXT,
    subscription_tier TEXT,
    stripe_customer_id TEXT UNIQUE,
    telegram_chat_id TEXT UNIQUE,
    preferred_language public.preferred_language DEFAULT 'en'::public.preferred_language NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Leads
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    project_type public.project_type NOT NULL,
    language public.preferred_language DEFAULT 'en'::public.preferred_language NOT NULL,
    source public.lead_source DEFAULT 'web'::public.lead_source NOT NULL,
    status public.lead_status DEFAULT 'new'::public.lead_status NOT NULL,
    score INTEGER DEFAULT 0,
    contractor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    claimed_at TIMESTAMPTZ,
    message TEXT,
    city TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Appointments
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    notes TEXT,
    status public.appointment_status DEFAULT 'pending'::public.appointment_status NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Scraped Inventory (Firecrawl target)
CREATE TABLE public.scraped_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    permit_number TEXT,
    source TEXT,
    url TEXT,
    city TEXT,
    project_type TEXT,
    estimated_value NUMERIC,
    scraped_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT unique_permit UNIQUE (url, permit_number)
);

-- 5. Email Send Log
CREATE TABLE public.email_send_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email TEXT NOT NULL,
    template_name TEXT NOT NULL,
    status TEXT NOT NULL,
    message_id TEXT,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. Automated Logs
CREATE TABLE public.automated_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    channel TEXT NOT NULL,
    status TEXT NOT NULL,
    subject TEXT,
    recipient TEXT,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. Email Queue Table
CREATE TABLE public.email_queue (
    id BIGSERIAL PRIMARY KEY,
    queue_name TEXT NOT NULL,
    message JSONB NOT NULL,
    read_ct INTEGER DEFAULT 0 NOT NULL,
    enqueued_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    visible_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ── FUNCTIONS ───────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name TEXT, payload JSONB)
RETURNS BIGINT AS $$
DECLARE
    new_id BIGINT;
BEGIN
    INSERT INTO public.email_queue (queue_name, message)
    VALUES (queue_name, payload)
    RETURNING id INTO new_id;
    RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name TEXT, batch_size INTEGER, vt INTEGER)
RETURNS TABLE (msg_id BIGINT, read_ct INTEGER, message JSONB) AS $$
BEGIN
    RETURN QUERY
    WITH batch AS (
        SELECT id
        FROM public.email_queue q
        WHERE q.queue_name = read_email_batch.queue_name
          AND q.visible_at <= now()
        ORDER BY q.enqueued_at
        LIMIT batch_size
        FOR UPDATE SKIP LOCKED
    )
    UPDATE public.email_queue q
    SET read_ct = q.read_ct + 1,
        visible_at = now() + (vt || ' seconds')::interval
    FROM batch
    WHERE q.id = batch.id
    RETURNING q.id, q.read_ct, q.message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name TEXT, msg_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM public.email_queue
    WHERE id = msg_id AND public.email_queue.queue_name = delete_email.queue_name;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.move_to_dlq(queue_name TEXT, msg_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM public.email_queue
    WHERE id = msg_id AND public.email_queue.queue_name = move_to_dlq.queue_name;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── RLS POLICIES ────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraped_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automated_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view/edit their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can edit own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Leads: Authenticated users can view all leads (market-place style)
CREATE POLICY "Authenticated users can view leads" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert leads" ON public.leads FOR INSERT WITH CHECK (true);

-- Appointments: Participants can view
CREATE POLICY "Users can view own appointments" ON public.appointments FOR SELECT TO authenticated USING (
    (client_email = (SELECT email FROM auth.users WHERE id = auth.uid())) OR
    (lead_id IN (SELECT id FROM public.leads WHERE contractor_id = auth.uid()))
);

-- Scraped Inventory: Authenticated can view
CREATE POLICY "Authenticated can view inventory" ON public.scraped_inventory FOR SELECT TO authenticated USING (true);
