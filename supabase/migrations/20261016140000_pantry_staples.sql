-- Staples (oil, spices, condiments...) are never auto-removed from the pantry.
-- NULL = auto-detect in the app (by category / name); true/false = user override.
ALTER TABLE public.pantry_items
  ADD COLUMN IF NOT EXISTS is_staple BOOLEAN;
