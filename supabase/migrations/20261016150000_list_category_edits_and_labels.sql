-- ==============================================================================
-- Allow custom completion labels on list categories and enable delete policy
-- ==============================================================================

-- 1. Add completed_label to list_categories (defaults to 'Done')
ALTER TABLE public.list_categories
  ADD COLUMN IF NOT EXISTS completed_label TEXT DEFAULT 'Done';

-- 2. Add RLS policy for deleting list categories
DROP POLICY IF EXISTS "List categories deletable by household" ON public.list_categories;
CREATE POLICY "List categories deletable by household"
  ON public.list_categories FOR DELETE
  USING (household_id IN (SELECT public.current_user_household_ids()));
