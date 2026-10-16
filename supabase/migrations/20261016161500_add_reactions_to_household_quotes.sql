-- Add reactions column to household_quotes
ALTER TABLE public.household_quotes 
ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '[]'::jsonb;
