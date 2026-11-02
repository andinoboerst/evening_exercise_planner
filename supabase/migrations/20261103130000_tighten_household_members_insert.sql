-- ==============================================================================
-- Only existing household members may add members.
--
-- The previous policy also accepted rows where user_id = auth.uid() or the email
-- matched the caller, so any signed-in user who knew a household UUID could add
-- themselves to it. First-time household creation and email-invite linking run
-- inside SECURITY DEFINER functions/triggers, which bypass RLS, so they are
-- unaffected.
-- ==============================================================================

DROP POLICY IF EXISTS "Members insertable by household members" ON public.household_members;
CREATE POLICY "Members insertable by household members"
  ON public.household_members FOR INSERT
  WITH CHECK (public.is_household_member(household_id));
