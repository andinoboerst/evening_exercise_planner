-- ==============================================================================
-- AndiNu.cc Migration: Fix Triggers & Set UUID Defaults
-- Timestamp: 20261015010000_fix_triggers_and_defaults.sql
-- ==============================================================================

-- 1. Ensure extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Ensure all primary key ID columns have DEFAULT gen_random_uuid()
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'list_items' AND column_name = 'id') THEN
    ALTER TABLE public.list_items ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'list_categories' AND column_name = 'id') THEN
    ALTER TABLE public.list_categories ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'meal_shopping_items' AND column_name = 'id') THEN
    ALTER TABLE public.meal_shopping_items ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pantry_items' AND column_name = 'id') THEN
    ALTER TABLE public.pantry_items ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'recipes' AND column_name = 'id') THEN
    ALTER TABLE public.recipes ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'recipe_ingredients' AND column_name = 'id') THEN
    ALTER TABLE public.recipe_ingredients ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'meal_plans' AND column_name = 'id') THEN
    ALTER TABLE public.meal_plans ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'meal_plan_days' AND column_name = 'id') THEN
    ALTER TABLE public.meal_plan_days ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'households' AND column_name = 'id') THEN
    ALTER TABLE public.households ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'household_members' AND column_name = 'id') THEN
    ALTER TABLE public.household_members ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;
END $$;

-- 3. Idempotent Triggers
DROP TRIGGER IF EXISTS trg_normalize_recipe_ingredient ON public.recipe_ingredients;
CREATE TRIGGER trg_normalize_recipe_ingredient
  BEFORE INSERT OR UPDATE ON public.recipe_ingredients
  FOR EACH ROW EXECUTE FUNCTION public.normalize_ingredient_name();

DROP TRIGGER IF EXISTS trg_normalize_pantry_ingredient ON public.pantry_items;
CREATE TRIGGER trg_normalize_pantry_ingredient
  BEFORE INSERT OR UPDATE ON public.pantry_items
  FOR EACH ROW EXECUTE FUNCTION public.normalize_ingredient_name();

DROP TRIGGER IF EXISTS trg_shopping_item_pantry_sync ON public.meal_shopping_items;
CREATE TRIGGER trg_shopping_item_pantry_sync
  BEFORE INSERT OR UPDATE OF is_checked, ingredient_name, normalized_name, quantity, unit
  ON public.meal_shopping_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_shopping_item_pantry_sync();
