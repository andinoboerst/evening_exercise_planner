-- ==============================================================================
-- Couples Weekly Life, Sleep & Schedule Planner (/planner)
-- Tables: planner_settings, planner_sleep_defaults, planner_day_plans, planner_events
-- ==============================================================================

-- 1. Table: planner_settings
CREATE TABLE IF NOT EXISTS public.planner_settings (
  household_id UUID PRIMARY KEY REFERENCES public.households(id) ON DELETE CASCADE,
  my_display_name TEXT NOT NULL DEFAULT 'Me',
  her_display_name TEXT NOT NULL DEFAULT 'Her',
  calendar_feed_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Table: planner_sleep_defaults (Recurring Mon-Sun sleep & alarm template)
CREATE TABLE IF NOT EXISTS public.planner_sleep_defaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1 = Monday, 7 = Sunday
  sleep_location TEXT NOT NULL DEFAULT 'my_place' CHECK (sleep_location IN ('my_place', 'her_place', 'apart', 'away')),
  bedtime TIME NOT NULL DEFAULT '23:00',
  wake_time TIME NOT NULL DEFAULT '07:30',
  my_wake_time TIME,
  her_wake_time TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_planner_sleep_defaults_household_day UNIQUE (household_id, day_of_week)
);

-- 3. Table: planner_day_plans (Date-specific sleep, alarm & partner status overrides)
CREATE TABLE IF NOT EXISTS public.planner_day_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  sleep_location TEXT CHECK (sleep_location IN ('my_place', 'her_place', 'apart', 'away')),
  location_note TEXT,
  bedtime TIME,
  wake_time TIME,
  my_wake_time TIME,
  her_wake_time TIME,
  my_status_note TEXT,
  her_status_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_planner_day_plans_household_date UNIQUE (household_id, plan_date)
);

-- 4. Table: planner_events (One-time and recurring events)
CREATE TABLE IF NOT EXISTS public.planner_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  location TEXT,
  owner_type TEXT NOT NULL DEFAULT 'together' CHECK (owner_type IN ('me', 'her', 'together')),
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  is_all_day BOOLEAN NOT NULL DEFAULT false,
  recurrence_type TEXT NOT NULL DEFAULT 'none' CHECK (recurrence_type IN ('none', 'weekly')),
  recurrence_days INT[] DEFAULT '{}', -- ISO weekdays 1..7 (1=Monday, 7=Sunday)
  recurrence_end_date DATE,
  excluded_dates DATE[] DEFAULT '{}',
  gcal_event_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_planner_settings_token ON public.planner_settings(calendar_feed_token);
CREATE INDEX IF NOT EXISTS idx_planner_sleep_defaults_hh ON public.planner_sleep_defaults(household_id);
CREATE INDEX IF NOT EXISTS idx_planner_day_plans_hh_date ON public.planner_day_plans(household_id, plan_date);
CREATE INDEX IF NOT EXISTS idx_planner_events_hh_date ON public.planner_events(household_id, event_date);
CREATE INDEX IF NOT EXISTS idx_planner_events_recurrence ON public.planner_events(household_id, recurrence_type);

-- Enable Row Level Security (RLS)
ALTER TABLE public.planner_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planner_sleep_defaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planner_day_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planner_events ENABLE ROW LEVEL SECURITY;

-- RLS: planner_settings
DROP POLICY IF EXISTS "Planner settings viewable by household" ON public.planner_settings;
CREATE POLICY "Planner settings viewable by household"
  ON public.planner_settings FOR SELECT
  USING (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Planner settings insertable by household" ON public.planner_settings;
CREATE POLICY "Planner settings insertable by household"
  ON public.planner_settings FOR INSERT
  WITH CHECK (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Planner settings updatable by household" ON public.planner_settings;
CREATE POLICY "Planner settings updatable by household"
  ON public.planner_settings FOR UPDATE
  USING (household_id IN (SELECT public.current_user_household_ids()))
  WITH CHECK (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Planner settings deletable by household" ON public.planner_settings;
CREATE POLICY "Planner settings deletable by household"
  ON public.planner_settings FOR DELETE
  USING (household_id IN (SELECT public.current_user_household_ids()));

-- RLS: planner_sleep_defaults
DROP POLICY IF EXISTS "Planner sleep defaults viewable by household" ON public.planner_sleep_defaults;
CREATE POLICY "Planner sleep defaults viewable by household"
  ON public.planner_sleep_defaults FOR SELECT
  USING (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Planner sleep defaults insertable by household" ON public.planner_sleep_defaults;
CREATE POLICY "Planner sleep defaults insertable by household"
  ON public.planner_sleep_defaults FOR INSERT
  WITH CHECK (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Planner sleep defaults updatable by household" ON public.planner_sleep_defaults;
CREATE POLICY "Planner sleep defaults updatable by household"
  ON public.planner_sleep_defaults FOR UPDATE
  USING (household_id IN (SELECT public.current_user_household_ids()))
  WITH CHECK (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Planner sleep defaults deletable by household" ON public.planner_sleep_defaults;
CREATE POLICY "Planner sleep defaults deletable by household"
  ON public.planner_sleep_defaults FOR DELETE
  USING (household_id IN (SELECT public.current_user_household_ids()));

-- RLS: planner_day_plans
DROP POLICY IF EXISTS "Planner day plans viewable by household" ON public.planner_day_plans;
CREATE POLICY "Planner day plans viewable by household"
  ON public.planner_day_plans FOR SELECT
  USING (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Planner day plans insertable by household" ON public.planner_day_plans;
CREATE POLICY "Planner day plans insertable by household"
  ON public.planner_day_plans FOR INSERT
  WITH CHECK (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Planner day plans updatable by household" ON public.planner_day_plans;
CREATE POLICY "Planner day plans updatable by household"
  ON public.planner_day_plans FOR UPDATE
  USING (household_id IN (SELECT public.current_user_household_ids()))
  WITH CHECK (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Planner day plans deletable by household" ON public.planner_day_plans;
CREATE POLICY "Planner day plans deletable by household"
  ON public.planner_day_plans FOR DELETE
  USING (household_id IN (SELECT public.current_user_household_ids()));

-- RLS: planner_events
DROP POLICY IF EXISTS "Planner events viewable by household" ON public.planner_events;
CREATE POLICY "Planner events viewable by household"
  ON public.planner_events FOR SELECT
  USING (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Planner events insertable by household" ON public.planner_events;
CREATE POLICY "Planner events insertable by household"
  ON public.planner_events FOR INSERT
  WITH CHECK (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Planner events updatable by household" ON public.planner_events;
CREATE POLICY "Planner events updatable by household"
  ON public.planner_events FOR UPDATE
  USING (household_id IN (SELECT public.current_user_household_ids()))
  WITH CHECK (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Planner events deletable by household" ON public.planner_events;
CREATE POLICY "Planner events deletable by household"
  ON public.planner_events FOR DELETE
  USING (household_id IN (SELECT public.current_user_household_ids()));

-- ==============================================================================
-- Token-based Security Definer helper functions for iCal feed & Alarm Shortcuts
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_planner_feed_data(p_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hh_id UUID;
  v_settings JSONB;
  v_defaults JSONB;
  v_plans JSONB;
  v_events JSONB;
BEGIN
  SELECT household_id, to_jsonb(s) INTO v_hh_id, v_settings
  FROM public.planner_settings s
  WHERE calendar_feed_token = p_token;

  IF v_hh_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT coalesce(jsonb_agg(to_jsonb(d) ORDER BY d.day_of_week), '[]'::jsonb)
  INTO v_defaults
  FROM public.planner_sleep_defaults d
  WHERE d.household_id = v_hh_id;

  SELECT coalesce(jsonb_agg(to_jsonb(p) ORDER BY p.plan_date), '[]'::jsonb)
  INTO v_plans
  FROM public.planner_day_plans p
  WHERE p.household_id = v_hh_id
    AND p.plan_date >= (CURRENT_DATE - INTERVAL '14 days');

  SELECT coalesce(jsonb_agg(to_jsonb(e) ORDER BY e.event_date, e.start_time), '[]'::jsonb)
  INTO v_events
  FROM public.planner_events e
  WHERE e.household_id = v_hh_id
    AND (e.recurrence_type = 'weekly' OR e.event_date >= (CURRENT_DATE - INTERVAL '14 days'));

  RETURN jsonb_build_object(
    'settings', v_settings,
    'defaults', v_defaults,
    'day_plans', v_plans,
    'events', v_events
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_planner_feed_data(UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_planner_alarm_data(p_token UUID, p_date DATE, p_user TEXT DEFAULT 'me')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hh_id UUID;
  v_day_of_week INT;
  v_override RECORD;
  v_default RECORD;
  v_bedtime TIME;
  v_wake_time TIME;
  v_location TEXT;
  v_notes TEXT;
BEGIN
  SELECT household_id INTO v_hh_id
  FROM public.planner_settings
  WHERE calendar_feed_token = p_token;

  IF v_hh_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 1=Mon .. 7=Sun
  v_day_of_week := EXTRACT(ISODOW FROM p_date)::INT;

  SELECT * INTO v_override
  FROM public.planner_day_plans
  WHERE household_id = v_hh_id AND plan_date = p_date;

  SELECT * INTO v_default
  FROM public.planner_sleep_defaults
  WHERE household_id = v_hh_id AND day_of_week = v_day_of_week;

  -- Determine location
  v_location := coalesce(v_override.sleep_location, v_default.sleep_location, 'my_place');
  v_bedtime := coalesce(v_override.bedtime, v_default.bedtime, '23:00'::TIME);

  -- Determine wake time depending on user target
  IF p_user = 'her' THEN
    v_wake_time := coalesce(v_override.her_wake_time, v_override.wake_time, v_default.her_wake_time, v_default.wake_time, '07:30'::TIME);
    v_notes := v_override.her_status_note;
  ELSE
    v_wake_time := coalesce(v_override.my_wake_time, v_override.wake_time, v_default.my_wake_time, v_default.wake_time, '07:30'::TIME);
    v_notes := v_override.my_status_note;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'date', p_date,
    'user', p_user,
    'sleep_location', v_location,
    'bedtime', to_char(v_bedtime, 'HH24:MI'),
    'wake_time', to_char(v_wake_time, 'HH24:MI'),
    'status_note', v_notes
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_planner_alarm_data(UUID, DATE, TEXT) TO anon, authenticated;
