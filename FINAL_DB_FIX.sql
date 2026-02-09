-- FINAL DB FIX: Run this in Supabase Dashboard > SQL Editor
-- This fixes the missing columns that caused the ingredients to disappear and the import to get stuck.

-- 1. Fix Ingredients Table
ALTER TABLE public.recipe_ingredients 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS quantity TEXT,
ADD COLUMN IF NOT EXISTS unit TEXT,
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- 2. Fix Steps Table
ALTER TABLE public.recipe_steps
ADD COLUMN IF NOT EXISTS step_number INTEGER,
ADD COLUMN IF NOT EXISTS instruction TEXT,
ADD COLUMN IF NOT EXISTS section_title TEXT;

-- 3. Force schema refresh
NOTIFY pgrst, 'reload schema';
