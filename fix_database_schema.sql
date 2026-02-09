-- AI Video Analysis Schema Update
-- Run this in Supabase Dashboard > SQL Editor

ALTER TABLE public.recipes 
ADD COLUMN IF NOT EXISTS is_vegetarian BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS prep_time_minutes INTEGER,
ADD COLUMN IF NOT EXISTS cook_time_minutes INTEGER,
ADD COLUMN IF NOT EXISTS servings INTEGER;

-- Force schema cache reload just in case
NOTIFY pgrst, 'reload schema';
