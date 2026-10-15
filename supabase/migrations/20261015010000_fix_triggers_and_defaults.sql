-- ==============================================================================
-- AndiNu.cc Migration: Fix RLS Recursion, Triggers & Set UUID Defaults
-- Timestamp: 20261015010000_fix_triggers_and_defaults.sql
-- ==============================================================================

-- 1. Ensure extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Non-recursive Membership Helper Functions (LANGUAGE plpgsql prevents inlining)
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

-- 3. Replace Household & Member Policies (Eliminates Infinite Recursion)
DROP POLICY IF EXISTS "Households viewable by members" ON public.households;
CREATE POLICY "Households viewable by members"
  ON public.households FOR SELECT
  USING (public.is_household_member(id));

DROP POLICY IF EXISTS "Households modifiable by members" ON public.households;
CREATE POLICY "Households modifiable by members"
  ON public.households FOR ALL
  USING (public.is_household_member(id))
  WITH CHECK (public.is_household_member(id));

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

-- 4. Ensure all primary key ID columns have DEFAULT gen_random_uuid()
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

-- 5. Idempotent Triggers
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

-- 6. RPC: Initialize or Get User Household
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

