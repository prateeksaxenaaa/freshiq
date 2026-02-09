-- ========================================
-- FIX NULL HOUSEHOLDS (Data Repair)
-- ========================================

-- 1. Get the current user's household ID (for manual execution reference)
-- You will need to Replace 'YOUR_USER_ID' if running manually, 
-- implies running this in the SQL Editor while logged in uses auth.uid() context if applicable.
-- BUT: For a repair script, it's safer to just update everything that is NULL
-- to the household of the user running the script IF we can determine it.

-- BETTER STRATEGY: Update invalid records data to the first household found for the current user.

DO $$
DECLARE
  v_household_id UUID;
BEGIN
  -- Get the household ID for the current executing user
  SELECT household_id INTO v_household_id
  FROM public.household_members
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_household_id IS NOT NULL THEN
    
    -- 1. Fix Recipes with NULL household_id
    UPDATE public.recipes
    SET household_id = v_household_id
    WHERE household_id IS NULL;

    -- 2. Fix Cookbooks with NULL household_id
    UPDATE public.cookbooks
    SET household_id = v_household_id
    WHERE household_id IS NULL;
    
    RAISE NOTICE 'Fixed orphaned records using household_id: %', v_household_id;
  ELSE
    RAISE NOTICE 'No household found for current user. Cannot fix records.';
  END IF;
END $$;
