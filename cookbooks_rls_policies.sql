-- ========================================
-- Row Level Security Policies for Cookbooks
-- ========================================

-- Enable RLS
ALTER TABLE public.cookbooks ENABLE ROW LEVEL SECURITY;

-- DROP existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their household's cookbooks" ON public.cookbooks;
DROP POLICY IF EXISTS "Users can insert cookbooks into their household" ON public.cookbooks;
DROP POLICY IF EXISTS "Users can update their household's cookbooks" ON public.cookbooks;
DROP POLICY IF EXISTS "Users can delete their household's cookbooks" ON public.cookbooks;

-- 1. SELECT Policy
CREATE POLICY "Users can view their household's cookbooks"
ON public.cookbooks
FOR SELECT
USING (
  household_id IN (
    SELECT household_id 
    FROM public.household_members 
    WHERE user_id = auth.uid()
  )
);

-- 2. INSERT Policy
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

-- 3. UPDATE Policy
CREATE POLICY "Users can update their household's cookbooks"
ON public.cookbooks
FOR UPDATE
USING (
  household_id IN (
    SELECT household_id 
    FROM public.household_members 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  household_id IN (
    SELECT household_id 
    FROM public.household_members 
    WHERE user_id = auth.uid()
  )
);

-- 4. DELETE Policy
CREATE POLICY "Users can delete their household's cookbooks"
ON public.cookbooks
FOR DELETE
USING (
  household_id IN (
    SELECT household_id 
    FROM public.household_members 
    WHERE user_id = auth.uid()
  )
);
