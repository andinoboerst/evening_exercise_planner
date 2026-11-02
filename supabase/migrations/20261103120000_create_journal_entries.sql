-- ==============================================================================
-- Journal: long-form letters between partners, with photos and scanned notes
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  title TEXT,
  body TEXT NOT NULL DEFAULT '',
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Storage object paths inside the journal-images bucket
  image_paths JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_household ON public.journal_entries(household_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON public.journal_entries(entry_date DESC, created_at DESC);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Journal entries viewable by household" ON public.journal_entries;
CREATE POLICY "Journal entries viewable by household"
  ON public.journal_entries FOR SELECT
  USING (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Journal entries insertable by household" ON public.journal_entries;
CREATE POLICY "Journal entries insertable by household"
  ON public.journal_entries FOR INSERT
  WITH CHECK (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Journal entries updatable by household" ON public.journal_entries;
CREATE POLICY "Journal entries updatable by household"
  ON public.journal_entries FOR UPDATE
  USING (household_id IN (SELECT public.current_user_household_ids()))
  WITH CHECK (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Journal entries deletable by household" ON public.journal_entries;
CREATE POLICY "Journal entries deletable by household"
  ON public.journal_entries FOR DELETE
  USING (household_id IN (SELECT public.current_user_household_ids()));

-- ==============================================================================
-- Private storage bucket for journal photos / scanned pages.
-- Objects live at <household_id>/<file>, so the first path segment gates access.
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('journal-images', 'journal-images', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Journal images readable by household" ON storage.objects;
CREATE POLICY "Journal images readable by household"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'journal-images'
    AND (storage.foldername(name))[1] IN (SELECT public.current_user_household_ids()::text)
  );

DROP POLICY IF EXISTS "Journal images uploadable by household" ON storage.objects;
CREATE POLICY "Journal images uploadable by household"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'journal-images'
    AND (storage.foldername(name))[1] IN (SELECT public.current_user_household_ids()::text)
  );

DROP POLICY IF EXISTS "Journal images deletable by household" ON storage.objects;
CREATE POLICY "Journal images deletable by household"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'journal-images'
    AND (storage.foldername(name))[1] IN (SELECT public.current_user_household_ids()::text)
  );
