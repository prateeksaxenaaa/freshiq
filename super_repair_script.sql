-- ========================================
-- SUPER REPAIR SCRIPT: Fix Everything
-- ========================================

-- 1. Get the current user's household ID (if it exists)
-- You (the user) MUST run this. It uses 'auth.uid()'.

-- 2. Link ALL recipes owned by this user (or with no household) to their household
-- We find recipes that have NO household_id
-- We assume they belong to the current user (dangerous in production, but fine for single-user dev cleanup)
-- OR we look for recipes created by this user? (Recipe table has no created_by column in the schema doc, but let's check).
-- IF recipes has NO created_by and NO household_id, they are effectively garbage unless we link them to the ONLY household.

-- Safe bet for standard user:
UPDATE public.recipes
SET household_id = (
  SELECT household_id 
  FROM public.household_members 
  WHERE user_id = auth.uid() 
  LIMIT 1
)
WHERE household_id IS NULL;

-- 3. Link ALL cookbooks similarly
UPDATE public.cookbooks
SET household_id = (
  SELECT household_id 
  FROM public.household_members 
  WHERE user_id = auth.uid() 
  LIMIT 1
)
WHERE household_id IS NULL;

-- 4. Ensure junction table integrity
-- Remove duplicates if any
DELETE FROM public.recipe_cookbooks a USING public.recipe_cookbooks b
WHERE a.ctid < b.ctid AND a.recipe_id = b.recipe_id AND a.cookbook_id = b.cookbook_id;
