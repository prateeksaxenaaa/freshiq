-- Fix Ingredients and Steps Tables
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Ensure recipe_ingredients has all needed columns
ALTER TABLE public.recipe_ingredients 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS quantity TEXT, -- Changed to TEXT to be flexible (e.g. "1/2")
ADD COLUMN IF NOT EXISTS unit TEXT,
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- 2. Ensure recipe_steps has all needed columns
ALTER TABLE public.recipe_steps
ADD COLUMN IF NOT EXISTS step_number INTEGER,
ADD COLUMN IF NOT EXISTS instruction TEXT,
ADD COLUMN IF NOT EXISTS section_title TEXT;

-- 3. Fix potential type mismatch for quantity if it was numeric
-- (Safe to run even if it's already text)
-- ALTER TABLE public.recipe_ingredients ALTER COLUMN quantity TYPE TEXT;

NOTIFY pgrst, 'reload schema';
