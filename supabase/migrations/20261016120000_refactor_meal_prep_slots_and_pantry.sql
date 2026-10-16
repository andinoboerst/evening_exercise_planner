-- ==============================================================================
-- Refactor /meals: Lunch + Dinner slots, 2x "Meal Prep" carryover, simplified pantry
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. meal_plan_days -> one row per (plan, day, slot)
-- ------------------------------------------------------------------------------
ALTER TABLE public.meal_plan_days
  ADD COLUMN IF NOT EXISTS slot_type TEXT NOT NULL DEFAULT 'dinner',
  ADD COLUMN IF NOT EXISTS is_meal_prep BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS servings_multiplier NUMERIC NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS source_meal_prep_id UUID;

ALTER TABLE public.meal_plan_days
  DROP CONSTRAINT IF EXISTS chk_meal_plan_days_slot_type;
ALTER TABLE public.meal_plan_days
  ADD CONSTRAINT chk_meal_plan_days_slot_type CHECK (slot_type IN ('lunch', 'dinner'));

ALTER TABLE public.meal_plan_days
  DROP CONSTRAINT IF EXISTS chk_meal_plan_days_multiplier;
ALTER TABLE public.meal_plan_days
  ADD CONSTRAINT chk_meal_plan_days_multiplier CHECK (servings_multiplier >= 0);

-- Self reference: auto-filled lunch -> the meal prep dinner that produced it.
-- Deleting the source dinner automatically removes the linked lunch.
ALTER TABLE public.meal_plan_days
  DROP CONSTRAINT IF EXISTS fk_meal_plan_days_source_meal_prep;
ALTER TABLE public.meal_plan_days
  ADD CONSTRAINT fk_meal_plan_days_source_meal_prep
  FOREIGN KEY (source_meal_prep_id) REFERENCES public.meal_plan_days(id) ON DELETE CASCADE;

-- Existing rows were dinners; replace the one-per-day uniqueness with one-per-slot.
ALTER TABLE public.meal_plan_days DROP CONSTRAINT IF EXISTS uq_meal_plan_day;
ALTER TABLE public.meal_plan_days
  ADD CONSTRAINT uq_meal_plan_day_slot UNIQUE (meal_plan_id, day_of_week, slot_type);

-- Only dinners can be meal prep; a prep dinner cooks 2x.
UPDATE public.meal_plan_days SET is_meal_prep = false WHERE slot_type <> 'dinner';

CREATE INDEX IF NOT EXISTS idx_meal_plan_days_source ON public.meal_plan_days(source_meal_prep_id);

-- ------------------------------------------------------------------------------
-- 2. pantry_items = only what we actually have (no "out of stock" rows)
-- ------------------------------------------------------------------------------
DELETE FROM public.pantry_items WHERE in_stock = false;

DROP INDEX IF EXISTS public.idx_pantry_items_household_stock;
ALTER TABLE public.pantry_items DROP COLUMN IF EXISTS in_stock;

CREATE INDEX IF NOT EXISTS idx_pantry_items_household ON public.pantry_items(household_id);

-- ------------------------------------------------------------------------------
-- 3. Shopping list check-off -> pantry upsert; un-check -> pantry delete
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_shopping_item_pantry_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_norm_name TEXT;
BEGIN
  v_norm_name := lower(trim(coalesce(NEW.normalized_name, NEW.ingredient_name, '')));
  IF v_norm_name = '' THEN
    RETURN NEW;
  END IF;
  NEW.normalized_name := v_norm_name;
  NEW.updated_at := now();

  -- Bought: upsert straight into the pantry
  IF NEW.is_checked = true AND (TG_OP = 'INSERT' OR OLD.is_checked IS DISTINCT FROM true) THEN
    INSERT INTO public.pantry_items (
      household_id, ingredient_name, normalized_name, quantity, unit, category, updated_at
    )
    VALUES (
      NEW.household_id,
      NEW.ingredient_name,
      v_norm_name,
      COALESCE(NEW.quantity, 1),
      COALESCE(NEW.unit, ''),
      COALESCE(NEW.category, 'Pantry'),
      now()
    )
    ON CONFLICT (household_id, normalized_name)
    DO UPDATE SET
      quantity = COALESCE(EXCLUDED.quantity, pantry_items.quantity),
      unit = CASE WHEN EXCLUDED.unit <> '' THEN EXCLUDED.unit ELSE pantry_items.unit END,
      updated_at = now();

  -- Accidental tick: un-checking removes it from the pantry again
  ELSIF NEW.is_checked = false AND TG_OP = 'UPDATE' AND OLD.is_checked = true THEN
    DELETE FROM public.pantry_items
    WHERE household_id = NEW.household_id
      AND normalized_name = v_norm_name;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_shopping_item_pantry_sync ON public.meal_shopping_items;
CREATE TRIGGER trg_shopping_item_pantry_sync
  BEFORE INSERT OR UPDATE OF is_checked, ingredient_name, normalized_name, quantity, unit
  ON public.meal_shopping_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_shopping_item_pantry_sync();
