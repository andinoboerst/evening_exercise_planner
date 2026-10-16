-- ==============================================================================
-- Rolling calendar: meals are keyed by real date (not weekday) so the planner can
-- always start from today. Past days are consumed + removed by the app.
-- ==============================================================================

ALTER TABLE public.meal_plan_days
  ADD COLUMN IF NOT EXISTS meal_date DATE,
  ADD COLUMN IF NOT EXISTS ingredients_consumed BOOLEAN NOT NULL DEFAULT false;

-- Backfill from the owning weekly plan (week_start_date is a Monday, day_of_week 0 = Monday)
UPDATE public.meal_plan_days d
SET meal_date = p.week_start_date + d.day_of_week
FROM public.meal_plans p
WHERE d.meal_plan_id = p.id
  AND d.meal_date IS NULL;

-- Legacy entries from days that are already over must not wipe the pantry
UPDATE public.meal_plan_days
SET ingredients_consumed = true
WHERE meal_date < current_date;

ALTER TABLE public.meal_plan_days ALTER COLUMN meal_date SET NOT NULL;

-- One entry per plan, calendar date and slot (replaces the weekday-based uniqueness,
-- which would clash once the window spans two calendar weeks).
ALTER TABLE public.meal_plan_days DROP CONSTRAINT IF EXISTS uq_meal_plan_day_slot;
ALTER TABLE public.meal_plan_days
  ADD CONSTRAINT uq_meal_plan_date_slot UNIQUE (meal_plan_id, meal_date, slot_type);

CREATE INDEX IF NOT EXISTS idx_meal_plan_days_date ON public.meal_plan_days(meal_date);
