-- ==============================================================================
-- AndiNu.cc Unified Personal App Hub Migration
-- Timestamp: 20261015000000_init_andinu_hub.sql
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. HOUSEHOLDS & COLLABORATION
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Our Home',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_household_member UNIQUE (household_id, email)
);

CREATE INDEX IF NOT EXISTS idx_household_members_user_id ON public.household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_household_members_email ON public.household_members(email);

-- Helper functions to check member household IDs without RLS inlining or recursion
CREATE OR REPLACE FUNCTION public.current_user_household_ids()
RETURNS SETOF UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT hm.household_id
  FROM public.household_members hm
  WHERE hm.user_id = auth.uid()
     OR lower(hm.email) = lower(coalesce(auth.jwt() ->> 'email', ''));
END;
$$;

CREATE OR REPLACE FUNCTION public.is_household_member(p_household_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.household_members hm
    WHERE hm.household_id = p_household_id
      AND (
        hm.user_id = auth.uid()
        OR lower(hm.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.current_user_household_ids() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_household_member(UUID) TO authenticated, anon;

-- Auto-link newly authenticated users to existing household invitations
CREATE OR REPLACE FUNCTION public.handle_user_link_household()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.household_members
  SET user_id = NEW.id
  WHERE lower(email) = lower(NEW.email)
    AND (user_id IS NULL OR user_id <> NEW.id);
  RETURN NEW;
END;
$$;

-- Trigger to link user on auth.users changes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'users') THEN
    DROP TRIGGER IF EXISTS on_auth_user_link_household ON auth.users;
    CREATE TRIGGER on_auth_user_link_household
      AFTER INSERT OR UPDATE OF email ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_user_link_household();
  END IF;
END $$;

-- ==============================================================================
-- 3. APP 2: MEAL PREP, PANTRY & WEEKLY PLANNER
-- ==============================================================================

-- Normalizer trigger function for ingredients
CREATE OR REPLACE FUNCTION public.normalize_ingredient_name()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.normalized_name := lower(trim(coalesce(NEW.normalized_name, NEW.ingredient_name, '')));
  RETURN NEW;
END;
$$;

-- Recipes table
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  prep_time_minutes INTEGER DEFAULT 30,
  tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recipes_household ON public.recipes(household_id);

-- Recipe Ingredients table
CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT '',
  category TEXT DEFAULT 'Other',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON public.recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_norm_name ON public.recipe_ingredients(normalized_name);

DROP TRIGGER IF EXISTS trg_normalize_recipe_ingredient ON public.recipe_ingredients;
CREATE TRIGGER trg_normalize_recipe_ingredient
  BEFORE INSERT OR UPDATE ON public.recipe_ingredients
  FOR EACH ROW EXECUTE FUNCTION public.normalize_ingredient_name();

-- Pantry Items table
CREATE TABLE IF NOT EXISTS public.pantry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT '',
  in_stock BOOLEAN NOT NULL DEFAULT true,
  category TEXT DEFAULT 'Pantry',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_pantry_household_ingredient UNIQUE (household_id, normalized_name)
);

CREATE INDEX IF NOT EXISTS idx_pantry_items_household_stock ON public.pantry_items(household_id, in_stock);

DROP TRIGGER IF EXISTS trg_normalize_pantry_ingredient ON public.pantry_items;
CREATE TRIGGER trg_normalize_pantry_ingredient
  BEFORE INSERT OR UPDATE ON public.pantry_items
  FOR EACH ROW EXECUTE FUNCTION public.normalize_ingredient_name();

-- Meal Plans table
CREATE TABLE IF NOT EXISTS public.meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_meal_plan_week UNIQUE (household_id, week_start_date)
);

CREATE INDEX IF NOT EXISTS idx_meal_plans_household ON public.meal_plans(household_id);

-- Meal Plan Days table
CREATE TABLE IF NOT EXISTS public.meal_plan_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID NOT NULL REFERENCES public.meal_plans(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Monday, ..., 6=Sunday
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  custom_meal_title TEXT,
  requested_tag TEXT,
  is_cooked BOOLEAN NOT NULL DEFAULT false,
  cooked_at TIMESTAMPTZ,
  notes TEXT,
  CONSTRAINT uq_meal_plan_day UNIQUE (meal_plan_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_meal_plan_days_plan ON public.meal_plan_days(meal_plan_id);

-- Meal Shopping Items table
CREATE TABLE IF NOT EXISTS public.meal_shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  meal_plan_id UUID REFERENCES public.meal_plans(id) ON DELETE SET NULL,
  ingredient_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT '',
  category TEXT DEFAULT 'Groceries',
  is_checked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meal_shopping_household ON public.meal_shopping_items(household_id);

-- Trigger: Shopping List Checked -> Pantry In-Stock Automatic Sync
CREATE OR REPLACE FUNCTION public.handle_shopping_item_pantry_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_norm_name TEXT;
BEGIN
  -- Compute lowercase trimmed normalized name
  v_norm_name := lower(trim(coalesce(NEW.normalized_name, NEW.ingredient_name, '')));
  IF v_norm_name = '' THEN
    RETURN NEW;
  END IF;
  NEW.normalized_name := v_norm_name;
  NEW.updated_at := now();

  -- When checked (bought), upsert into pantry_items with in_stock = true
  IF NEW.is_checked = true AND (TG_OP = 'INSERT' OR OLD.is_checked IS DISTINCT FROM true) THEN
    INSERT INTO public.pantry_items (
      household_id,
      ingredient_name,
      normalized_name,
      quantity,
      unit,
      category,
      in_stock,
      updated_at
    )
    VALUES (
      NEW.household_id,
      NEW.ingredient_name,
      v_norm_name,
      COALESCE(NEW.quantity, 1),
      COALESCE(NEW.unit, ''),
      COALESCE(NEW.category, 'Pantry'),
      true,
      now()
    )
    ON CONFLICT (household_id, normalized_name)
    DO UPDATE SET
      in_stock = true,
      quantity = COALESCE(EXCLUDED.quantity, pantry_items.quantity),
      unit = CASE WHEN EXCLUDED.unit <> '' THEN EXCLUDED.unit ELSE pantry_items.unit END,
      updated_at = now();

  -- When unchecked, mark pantry_items as in_stock = false
  ELSIF NEW.is_checked = false AND TG_OP = 'UPDATE' AND OLD.is_checked = true THEN
    UPDATE public.pantry_items
    SET in_stock = false,
        updated_at = now()
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

-- ==============================================================================
-- 4. APP 3: SHARED CHECKBOX LISTS TRACKER
-- ==============================================================================

-- List categories (e.g. Movies, Vinyl Records, Places to Visit)
CREATE TABLE IF NOT EXISTS public.list_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📋',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_list_categories_household ON public.list_categories(household_id);

-- List items
CREATE TABLE IF NOT EXISTS public.list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.list_categories(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle_or_note TEXT,
  url TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_list_items_category ON public.list_items(category_id);
CREATE INDEX IF NOT EXISTS idx_list_items_household_completed ON public.list_items(household_id, is_completed);

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_items ENABLE ROW LEVEL SECURITY;

-- Households Policies
DROP POLICY IF EXISTS "Households viewable by members" ON public.households;
CREATE POLICY "Households viewable by members"
  ON public.households FOR SELECT
  USING (public.is_household_member(id));

DROP POLICY IF EXISTS "Households modifiable by members" ON public.households;
CREATE POLICY "Households modifiable by members"
  ON public.households FOR ALL
  USING (public.is_household_member(id))
  WITH CHECK (public.is_household_member(id));

-- Household Members Policies
DROP POLICY IF EXISTS "Members viewable by household members or matching email" ON public.household_members;
CREATE POLICY "Members viewable by household members or matching email"
  ON public.household_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    OR public.is_household_member(household_id)
  );

DROP POLICY IF EXISTS "Members insertable by household members" ON public.household_members;
CREATE POLICY "Members insertable by household members"
  ON public.household_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    OR public.is_household_member(household_id)
  );

DROP POLICY IF EXISTS "Members modifiable by household members" ON public.household_members;
CREATE POLICY "Members modifiable by household members"
  ON public.household_members FOR UPDATE
  USING (public.is_household_member(household_id))
  WITH CHECK (public.is_household_member(household_id));

DROP POLICY IF EXISTS "Members deletable by household members" ON public.household_members;
CREATE POLICY "Members deletable by household members"
  ON public.household_members FOR DELETE
  USING (public.is_household_member(household_id));

-- Recipes Policies
DROP POLICY IF EXISTS "Recipes viewable by household" ON public.recipes;
CREATE POLICY "Recipes viewable by household"
  ON public.recipes FOR SELECT
  USING (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Recipes insertable by household" ON public.recipes;
CREATE POLICY "Recipes insertable by household"
  ON public.recipes FOR INSERT
  WITH CHECK (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Recipes updatable by household" ON public.recipes;
CREATE POLICY "Recipes updatable by household"
  ON public.recipes FOR UPDATE
  USING (household_id IN (SELECT public.current_user_household_ids()))
  WITH CHECK (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Recipes deletable by household" ON public.recipes;
CREATE POLICY "Recipes deletable by household"
  ON public.recipes FOR DELETE
  USING (household_id IN (SELECT public.current_user_household_ids()));

-- Recipe Ingredients Policies
DROP POLICY IF EXISTS "Recipe ingredients viewable by household" ON public.recipe_ingredients;
CREATE POLICY "Recipe ingredients viewable by household"
  ON public.recipe_ingredients FOR SELECT
  USING (recipe_id IN (SELECT id FROM public.recipes WHERE household_id IN (SELECT public.current_user_household_ids())));

DROP POLICY IF EXISTS "Recipe ingredients insertable by household" ON public.recipe_ingredients;
CREATE POLICY "Recipe ingredients insertable by household"
  ON public.recipe_ingredients FOR INSERT
  WITH CHECK (recipe_id IN (SELECT id FROM public.recipes WHERE household_id IN (SELECT public.current_user_household_ids())));

DROP POLICY IF EXISTS "Recipe ingredients updatable by household" ON public.recipe_ingredients;
CREATE POLICY "Recipe ingredients updatable by household"
  ON public.recipe_ingredients FOR UPDATE
  USING (recipe_id IN (SELECT id FROM public.recipes WHERE household_id IN (SELECT public.current_user_household_ids())));

DROP POLICY IF EXISTS "Recipe ingredients deletable by household" ON public.recipe_ingredients;
CREATE POLICY "Recipe ingredients deletable by household"
  ON public.recipe_ingredients FOR DELETE
  USING (recipe_id IN (SELECT id FROM public.recipes WHERE household_id IN (SELECT public.current_user_household_ids())));

-- Pantry Items Policies
DROP POLICY IF EXISTS "Pantry viewable by household" ON public.pantry_items;
CREATE POLICY "Pantry viewable by household"
  ON public.pantry_items FOR SELECT
  USING (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Pantry insertable by household" ON public.pantry_items;
CREATE POLICY "Pantry insertable by household"
  ON public.pantry_items FOR INSERT
  WITH CHECK (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Pantry updatable by household" ON public.pantry_items;
CREATE POLICY "Pantry updatable by household"
  ON public.pantry_items FOR UPDATE
  USING (household_id IN (SELECT public.current_user_household_ids()))
  WITH CHECK (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Pantry deletable by household" ON public.pantry_items;
CREATE POLICY "Pantry deletable by household"
  ON public.pantry_items FOR DELETE
  USING (household_id IN (SELECT public.current_user_household_ids()));

-- Meal Plans Policies
DROP POLICY IF EXISTS "Meal plans viewable by household" ON public.meal_plans;
CREATE POLICY "Meal plans viewable by household"
  ON public.meal_plans FOR SELECT
  USING (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Meal plans insertable by household" ON public.meal_plans;
CREATE POLICY "Meal plans insertable by household"
  ON public.meal_plans FOR INSERT
  WITH CHECK (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Meal plans updatable by household" ON public.meal_plans;
CREATE POLICY "Meal plans updatable by household"
  ON public.meal_plans FOR UPDATE
  USING (household_id IN (SELECT public.current_user_household_ids()))
  WITH CHECK (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Meal plans deletable by household" ON public.meal_plans;
CREATE POLICY "Meal plans deletable by household"
  ON public.meal_plans FOR DELETE
  USING (household_id IN (SELECT public.current_user_household_ids()));

-- Meal Plan Days Policies
DROP POLICY IF EXISTS "Meal plan days viewable by household" ON public.meal_plan_days;
CREATE POLICY "Meal plan days viewable by household"
  ON public.meal_plan_days FOR SELECT
  USING (meal_plan_id IN (SELECT id FROM public.meal_plans WHERE household_id IN (SELECT public.current_user_household_ids())));

DROP POLICY IF EXISTS "Meal plan days insertable by household" ON public.meal_plan_days;
CREATE POLICY "Meal plan days insertable by household"
  ON public.meal_plan_days FOR INSERT
  WITH CHECK (meal_plan_id IN (SELECT id FROM public.meal_plans WHERE household_id IN (SELECT public.current_user_household_ids())));

DROP POLICY IF EXISTS "Meal plan days updatable by household" ON public.meal_plan_days;
CREATE POLICY "Meal plan days updatable by household"
  ON public.meal_plan_days FOR UPDATE
  USING (meal_plan_id IN (SELECT id FROM public.meal_plans WHERE household_id IN (SELECT public.current_user_household_ids())));

DROP POLICY IF EXISTS "Meal plan days deletable by household" ON public.meal_plan_days;
CREATE POLICY "Meal plan days deletable by household"
  ON public.meal_plan_days FOR DELETE
  USING (meal_plan_id IN (SELECT id FROM public.meal_plans WHERE household_id IN (SELECT public.current_user_household_ids())));

-- Meal Shopping Items Policies
DROP POLICY IF EXISTS "Shopping items viewable by household" ON public.meal_shopping_items;
CREATE POLICY "Shopping items viewable by household"
  ON public.meal_shopping_items FOR SELECT
  USING (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Shopping items insertable by household" ON public.meal_shopping_items;
CREATE POLICY "Shopping items insertable by household"
  ON public.meal_shopping_items FOR INSERT
  WITH CHECK (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Shopping items updatable by household" ON public.meal_shopping_items;
CREATE POLICY "Shopping items updatable by household"
  ON public.meal_shopping_items FOR UPDATE
  USING (household_id IN (SELECT public.current_user_household_ids()))
  WITH CHECK (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Shopping items deletable by household" ON public.meal_shopping_items;
CREATE POLICY "Shopping items deletable by household"
  ON public.meal_shopping_items FOR DELETE
  USING (household_id IN (SELECT public.current_user_household_ids()));

-- List Categories Policies
DROP POLICY IF EXISTS "List categories viewable by household" ON public.list_categories;
CREATE POLICY "List categories viewable by household"
  ON public.list_categories FOR SELECT
  USING (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "List categories insertable by household" ON public.list_categories;
CREATE POLICY "List categories insertable by household"
  ON public.list_categories FOR INSERT
  WITH CHECK (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "List categories updatable by household" ON public.list_categories;
CREATE POLICY "List categories updatable by household"
  ON public.list_categories FOR UPDATE
  USING (household_id IN (SELECT public.current_user_household_ids()))
  WITH CHECK (household_id IN (SELECT public.current_user_household_ids()));

-- List Items Policies
DROP POLICY IF EXISTS "List items viewable by household" ON public.list_items;
CREATE POLICY "List items viewable by household"
  ON public.list_items FOR SELECT
  USING (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "List items insertable by household" ON public.list_items;
CREATE POLICY "List items insertable by household"
  ON public.list_items FOR INSERT
  WITH CHECK (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "List items updatable by household" ON public.list_items;
CREATE POLICY "List items updatable by household"
  ON public.list_items FOR UPDATE
  USING (household_id IN (SELECT public.current_user_household_ids()))
  WITH CHECK (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "List items deletable by household" ON public.list_items;
CREATE POLICY "List items deletable by household"
  ON public.list_items FOR DELETE
  USING (household_id IN (SELECT public.current_user_household_ids()));

-- ==============================================================================
-- 6. CONVENIENCE RPC: INITIALIZE OR GET USER HOUSEHOLD
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_or_create_initial_household()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_household_id UUID;
BEGIN
  v_user_id := auth.uid();
  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));

  IF v_user_id IS NULL AND v_email = '' THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Check existing membership
  SELECT household_id INTO v_household_id
  FROM public.household_members
  WHERE (user_id = v_user_id OR lower(email) = v_email)
  LIMIT 1;

  IF v_household_id IS NOT NULL THEN
    -- Ensure user_id is linked
    UPDATE public.household_members
    SET user_id = v_user_id
    WHERE household_id = v_household_id
      AND lower(email) = v_email
      AND user_id IS NULL;

    RETURN v_household_id;
  END IF;

  -- 2. Otherwise create a default household for this user
  INSERT INTO public.households (name)
  VALUES ('Andi & Nú')
  RETURNING id INTO v_household_id;

  INSERT INTO public.household_members (household_id, user_id, email, role)
  VALUES (v_household_id, v_user_id, v_email, 'owner');

  -- Pre-populate default list categories for the new household
  INSERT INTO public.list_categories (household_id, name, icon, display_order)
  VALUES 
    (v_household_id, 'Movies to Watch', '🎬', 1),
    (v_household_id, 'Vinyl Records to Buy', '🎵', 2),
    (v_household_id, 'Places to Visit', '✈️', 3);

  RETURN v_household_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_initial_household() TO authenticated, anon;

-- ==============================================================================
-- 7. ENSURE ALL PRIMARY KEY ID COLUMNS HAVE DEFAULT gen_random_uuid()
-- ==============================================================================

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

