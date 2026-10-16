-- ==============================================================================
-- Household Quotes: Fridge & Mirror whiteboard quotes board
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.household_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  quote_text TEXT NOT NULL,
  author_speaker TEXT DEFAULT 'Núria',
  context_or_location TEXT DEFAULT 'On the fridge',
  style_variant TEXT NOT NULL DEFAULT 'sticky-yellow',
  magnet_icon TEXT NOT NULL DEFAULT '🧲',
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_household_quotes_household ON public.household_quotes(household_id);
CREATE INDEX IF NOT EXISTS idx_household_quotes_created ON public.household_quotes(created_at DESC);

ALTER TABLE public.household_quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Household quotes viewable by household" ON public.household_quotes;
CREATE POLICY "Household quotes viewable by household"
  ON public.household_quotes FOR SELECT
  USING (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Household quotes insertable by household" ON public.household_quotes;
CREATE POLICY "Household quotes insertable by household"
  ON public.household_quotes FOR INSERT
  WITH CHECK (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Household quotes updatable by household" ON public.household_quotes;
CREATE POLICY "Household quotes updatable by household"
  ON public.household_quotes FOR UPDATE
  USING (household_id IN (SELECT public.current_user_household_ids()))
  WITH CHECK (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Household quotes deletable by household" ON public.household_quotes;
CREATE POLICY "Household quotes deletable by household"
  ON public.household_quotes FOR DELETE
  USING (household_id IN (SELECT public.current_user_household_ids()));
