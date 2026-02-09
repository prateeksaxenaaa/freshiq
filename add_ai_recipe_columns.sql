-- Add missing columns to recipes table for AI extraction
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS is_vegetarian BOOLEAN,
ADD COLUMN IF NOT EXISTS prep_time_minutes INTEGER,
ADD COLUMN IF NOT EXISTS cook_time_minutes INTEGER,
ADD COLUMN IF NOT EXISTS servings INTEGER;
