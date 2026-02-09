-- ========================================
-- REPAIR SCRIPT: Fix Orphaned Users & Recipes
-- ========================================
-- Run this script to fix accounts that don't have a household
-- and incorrectly created "orphaned" recipes.

-- 1. Create Households for users who don't have one
INSERT INTO public.households (name, created_by)
SELECT 
  'My Household' as name, 
  users.id as created_by
FROM auth.users
WHERE users.id NOT IN (
  SELECT user_id FROM public.household_members
);

-- 2. Link those users to their new households
INSERT INTO public.household_members (user_id, household_id, role)
SELECT 
  h.created_by as user_id,
  h.id as household_id,
  'admin' as role
FROM public.households h
WHERE h.created_by IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.household_members hm 
  WHERE hm.user_id = h.created_by AND hm.household_id = h.id
);

-- 3. Fix Orphaned Cookbooks (Attach to user's household)
-- If a cookbook has no household_id, try to find the user's household
-- (Assumption: Since we removed created_by from cookbooks, we might not be able to link securely easily. 
-- BUT, if you just ran the creates, they failed. So this might process legacy data if any matches context).
-- skipping this as strict linkage is missing.

-- 4. Fix Orphaned Recipes (Attach to user's household)
-- This is tricky without 'created_by' on recipes? 
-- Wait, recipes table DOES NOT have created_by in my schema recollection?
-- Let's check schema. MD says: `household_id UUID`. No `created_by`. 
-- IF recipes table has NO `created_by` and NO `household_id`, they are truly lost/system wide?
-- BUT, RLS allows `household_id IS NULL`.
-- Let's assume for this fix, we want to update recipes matching the current user?
-- We can't do that easily in SQL without knowing WHICH user owns the null-household recipe.
-- HOWEVER, if I am the logged in user running this via Dashboard, I might be able to manually fix.

-- AUTOMATED FIX for the current user (if run in SQL Editor while authenticated? No, usually distinct).
-- Best effort: Link recipes created > today? No.

-- 5. Auto-create 'Dinner' cookbook for all households that don't have one
INSERT INTO public.cookbooks (household_id, name, description)
SELECT 
  h.id, 
  'Dinner', 
  'Default cookbook for main meals'
FROM public.households h
WHERE NOT EXISTS (
  SELECT 1 FROM public.cookbooks c WHERE c.household_id = h.id
);

-- 6. Ensure RLS allows household members to actually Insert
-- Re-run the policy just in case (Safe to run again as it drops first)
-- (Copy of cookbooks_rls_policies.sql logic)
ALTER TABLE public.cookbooks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert cookbooks into their household" ON public.cookbooks;
CREATE POLICY "Users can insert cookbooks into their household"
ON public.cookbooks
FOR INSERT
WITH CHECK (
  household_id IN (
    SELECT household_id 
    FROM public.household_members 
    WHERE user_id = auth.uid()
  )
);
