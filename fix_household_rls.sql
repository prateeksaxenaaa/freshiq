-- ========================================
-- FIX: Household Members RLS
-- ========================================

-- Ensure users can view their own membership
-- This is critical for the app to know which household you belong to!

ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own membership" ON public.household_members;

CREATE POLICY "Users can view their own membership"
ON public.household_members
FOR SELECT
USING (auth.uid() = user_id);

-- Also ensure users can view the household definition they belong to
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view households they belong to" ON public.households;

CREATE POLICY "Users can view households they belong to"
ON public.households
FOR SELECT
USING (
  id IN (
    SELECT household_id 
    FROM public.household_members 
    WHERE user_id = auth.uid()
  )
);
