-- ==============================================================================
-- Multi-day planner events: optional end_date (NULL = single-day event)
-- ==============================================================================

ALTER TABLE public.planner_events
  ADD COLUMN IF NOT EXISTS end_date DATE;

ALTER TABLE public.planner_events
  DROP CONSTRAINT IF EXISTS planner_events_end_date_check;
ALTER TABLE public.planner_events
  ADD CONSTRAINT planner_events_end_date_check
  CHECK (end_date IS NULL OR end_date >= event_date);

-- Keep ongoing multi-day events in the iCal feed even if they started before the window
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
    AND (e.recurrence_type IN ('weekly', 'monthly', 'annually')
         OR coalesce(e.end_date, e.event_date) >= (CURRENT_DATE - INTERVAL '14 days'));

  RETURN jsonb_build_object(
    'settings', v_settings,
    'defaults', v_defaults,
    'day_plans', v_plans,
    'events', v_events
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_planner_feed_data(UUID) TO anon, authenticated;
