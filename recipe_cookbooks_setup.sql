-- ========================================
-- Recipe-Cookbook Many-to-Many Junction Table
-- ========================================
-- This allows recipes to belong to multiple cookbooks
-- and cookbooks to contain multiple recipes.

-- 1. Create the junction table
CREATE TABLE IF NOT EXISTS public.recipe_cookbooks (
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
  cookbook_id UUID REFERENCES public.cookbooks(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (recipe_id, cookbook_id)
);

-- 2. Enable Row Level Security
ALTER TABLE public.recipe_cookbooks ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage their household's recipe-cookbook links" ON public.recipe_cookbooks;

-- 4. RLS Policy: Users can manage recipe-cookbook links for their household
CREATE POLICY "Users can manage their household's recipe-cookbook links"
ON public.recipe_cookbooks
FOR ALL
USING (
  cookbook_id IN (
    SELECT id FROM public.cookbooks 
    WHERE household_id IN (
      SELECT household_id FROM public.household_members 
      WHERE user_id = auth.uid()
    )
  )
);

-- 5. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_recipe_cookbooks_recipe_id ON public.recipe_cookbooks(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_cookbooks_cookbook_id ON public.recipe_cookbooks(cookbook_id);

-- ========================================
-- NOTES:
-- ========================================
-- - Recipes can now exist WITHOUT being in any cookbook (uncategorized)
-- - Recipes can be in MULTIPLE cookbooks simultaneously
-- - Deleting a recipe removes all cookbook associations (CASCADE)
-- - Deleting a cookbook removes associations but keeps recipes (CASCADE)
