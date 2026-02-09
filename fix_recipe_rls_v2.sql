-- ========================================
-- FIX RLS V2: THE "NUCLEAR OPTION"
-- ========================================

-- This script simplifies RLS to ensure you can definitely see your data.

-- 1. HOUSEHOLD & MEMBERS (The Foundation)
-- Ensure you can read your own membership
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own membership" ON public.household_members;
CREATE POLICY "Users can view their own membership" ON public.household_members
FOR SELECT USING (user_id = auth.uid());

-- 2. RECIPES (The Missing Data)
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view household recipes" ON public.recipes;
-- Simplified: If you are in the household, you can see the recipe.
CREATE POLICY "Users can view household recipes" ON public.recipes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_members.household_id = recipes.household_id
    AND household_members.user_id = auth.uid()
  )
);

-- 3. COOKBOOKS
ALTER TABLE public.cookbooks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view household cookbooks" ON public.cookbooks;
CREATE POLICY "Users can view household cookbooks" ON public.cookbooks
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_members.household_id = cookbooks.household_id
    AND household_members.user_id = auth.uid()
  )
);

-- 4. RECIPE_COOKBOOKS (The Junction)
ALTER TABLE public.recipe_cookbooks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view household recipe links" ON public.recipe_cookbooks;
-- Logic: If you can see the cookbook, you can see what's in it.
CREATE POLICY "Users can view household recipe links" ON public.recipe_cookbooks
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.cookbooks
    WHERE cookbooks.id = recipe_cookbooks.cookbook_id
    AND EXISTS (
        SELECT 1 FROM public.household_members
        WHERE household_members.household_id = cookbooks.household_id
        AND household_members.user_id = auth.uid()
    )
  )
);

-- 5. WRITE POLICIES (So you can actually save)
-- Recipes
DROP POLICY IF EXISTS "Users can insert household recipes" ON public.recipes;
CREATE POLICY "Users can insert household recipes" ON public.recipes
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_members.household_id = household_id
    AND household_members.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update household recipes" ON public.recipes;
CREATE POLICY "Users can update household recipes" ON public.recipes
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_members.household_id = household_id
    AND household_members.user_id = auth.uid()
  )
);

-- Recipe Cookbooks (Junction)
DROP POLICY IF EXISTS "Users can insert recipe links" ON public.recipe_cookbooks;
CREATE POLICY "Users can insert recipe links" ON public.recipe_cookbooks
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.cookbooks
    WHERE cookbooks.id = cookbook_id
    AND EXISTS (
        SELECT 1 FROM public.household_members
        WHERE household_members.household_id = cookbooks.household_id
        AND household_members.user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Users can delete recipe links" ON public.recipe_cookbooks;
CREATE POLICY "Users can delete recipe links" ON public.recipe_cookbooks
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.cookbooks
    WHERE cookbooks.id = cookbook_id
    AND EXISTS (
        SELECT 1 FROM public.household_members
        WHERE household_members.household_id = cookbooks.household_id
        AND household_members.user_id = auth.uid()
    )
  )
);
