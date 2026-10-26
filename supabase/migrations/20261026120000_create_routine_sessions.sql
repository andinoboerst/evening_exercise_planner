-- ==============================================================================
-- Night routine history, shared by every device (phone, TV browser, ...)
-- ==============================================================================
-- The routine page is public so a TV browser can run it without signing in, so this
-- table is deliberately NOT tied to a household or a user. It only holds which
-- exercises were done on which night. Anyone can read and add rows; nobody can
-- change or delete them through the API.

CREATE TABLE IF NOT EXISTS public.routine_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_date DATE NOT NULL,
  exercise_ids TEXT[] NOT NULL CHECK (cardinality(exercise_ids) BETWEEN 1 AND 40),
  seconds INTEGER NOT NULL CHECK (seconds BETWEEN 1 AND 7200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_routine_sessions_created ON public.routine_sessions(created_at DESC);

ALTER TABLE public.routine_sessions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.routine_sessions TO anon, authenticated;

DROP POLICY IF EXISTS "Routine sessions readable by anyone" ON public.routine_sessions;
CREATE POLICY "Routine sessions readable by anyone"
  ON public.routine_sessions FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Routine sessions insertable by anyone" ON public.routine_sessions;
CREATE POLICY "Routine sessions insertable by anyone"
  ON public.routine_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
