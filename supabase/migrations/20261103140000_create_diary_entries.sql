-- ==============================================================================
-- Diary: shared blog-style entries about trips and days spent together.
-- Content is an ordered list of blocks so photos and maps can sit anywhere in
-- the text:
--   [{ "id": "...", "type": "text",  "text": "..." },
--    { "id": "...", "type": "image", "kind": "photo" | "map", "path": "...", "caption": "..." }]
-- Images reuse the private journal-images bucket (<household_id>/<file>).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  location TEXT,
  author TEXT NOT NULL DEFAULT 'Both',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  cover_path TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diary_entries_household ON public.diary_entries(household_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_start ON public.diary_entries(start_date DESC);

ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Diary entries viewable by household" ON public.diary_entries;
CREATE POLICY "Diary entries viewable by household"
  ON public.diary_entries FOR SELECT
  USING (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Diary entries insertable by household" ON public.diary_entries;
CREATE POLICY "Diary entries insertable by household"
  ON public.diary_entries FOR INSERT
  WITH CHECK (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Diary entries updatable by household" ON public.diary_entries;
CREATE POLICY "Diary entries updatable by household"
  ON public.diary_entries FOR UPDATE
  USING (household_id IN (SELECT public.current_user_household_ids()))
  WITH CHECK (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Diary entries deletable by household" ON public.diary_entries;
CREATE POLICY "Diary entries deletable by household"
  ON public.diary_entries FOR DELETE
  USING (household_id IN (SELECT public.current_user_household_ids()));
