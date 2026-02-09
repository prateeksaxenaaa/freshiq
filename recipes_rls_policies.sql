-- ========================================
-- Row Level Security Policies for Recipes
-- ========================================
-- Allows users to manage recipes for their household

-- Enable RLS on recipes table (if not already enabled)
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- DROP existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their household's recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can insert recipes into their household" ON public.recipes;
DROP POLICY IF EXISTS "Users can update their household's recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can delete their household's recipes" ON public.recipes;

-- 1. SELECT Policy: View recipes in your household
CREATE POLICY "Users can view their household's recipes"
ON public.recipes
FOR SELECT
USING (
  household_id IN (
    SELECT household_id 
    FROM public.household_members 
    WHERE user_id = auth.uid()
  )
  OR household_id IS NULL  -- Allow viewing recipes without household (uncategorized)
);

-- 2. INSERT Policy: Create recipes for your household
CREATE POLICY "Users can insert recipes into their household"
ON public.recipes
FOR INSERT
WITH CHECK (
  household_id IN (
    SELECT household_id 
    FROM public.household_members 
    WHERE user_id = auth.uid()
  )
  OR household_id IS NULL  -- Allow creating recipes without household
);

-- 3. UPDATE Policy: Update recipes in your household
CREATE POLICY "Users can update their household's recipes"
ON public.recipes
FOR UPDATE
USING (
  household_id IN (
    SELECT household_id 
    FROM public.household_members 
    WHERE user_id = auth.uid()
  )
  OR household_id IS NULL  -- Allow updating recipes without household
)
WITH CHECK (
  household_id IN (
    SELECT household_id 
    FROM public.household_members 
    WHERE user_id = auth.uid()
  )
  OR household_id IS NULL
);

-- 4. DELETE Policy: Delete recipes in your household
CREATE POLICY "Users can delete their household's recipes"
ON public.recipes
FOR DELETE
USING (
  household_id IN (
    SELECT household_id 
    FROM public.household_members 
    WHERE user_id = auth.uid()
  )
  OR household_id IS NULL  -- Allow deleting recipes without household
);

-- ========================================
-- RLS Policies for Recipe Ingredients
-- ========================================

ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage ingredients for their recipes" ON public.recipe_ingredients;

CREATE POLICY "Users can manage ingredients for their recipes"
ON public.recipe_ingredients
FOR ALL
USING (
  recipe_id IN (
    SELECT id FROM public.recipes 
    WHERE household_id IN (
      SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    )
    OR household_id IS NULL
  )
);

-- ========================================
-- RLS Policies for Recipe Steps
-- ========================================

ALTER TABLE public.recipe_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage steps for their recipes" ON public.recipe_steps;

CREATE POLICY "Users can manage steps for their recipes"
ON public.recipe_steps
FOR ALL
USING (
  recipe_id IN (
    SELECT id FROM public.recipes 
    WHERE household_id IN (
      SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    )
    OR household_id IS NULL
  )
);

-- ========================================
-- NOTES:
-- ========================================
-- - Users can only manage recipes in households they belong to
-- - Recipes with NULL household_id can be managed by any authenticated user
-- - This supports both personal and household-shared recipes
-- - Ingredients and steps inherit permissions from their parent recipe
