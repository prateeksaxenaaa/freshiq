-- ========================================
-- DEBUG: Verification Script
-- ========================================

-- 1. Check if I exist in profiles
SELECT * FROM public.profiles WHERE id = auth.uid();

-- 2. Check if I have a household member entry
SELECT * FROM public.household_members WHERE user_id = auth.uid();

-- 3. Check if I have a household
SELECT * FROM public.households 
WHERE id IN (SELECT household_id FROM public.household_members WHERE user_id = auth.uid());

-- 4. Check Cookbooks RLS policy availability
SELECT * FROM pg_policies WHERE tablename = 'cookbooks';

-- 5. Force create a household if missing (Safety - run this if result 2 is empty)
-- INSERT INTO public.households (name, created_by) VALUES ('Debug Household', auth.uid());
-- INSERT INTO public.household_members (user_id, household_id, role) 
-- VALUES (auth.uid(), (SELECT id FROM public.households WHERE created_by = auth.uid() LIMIT 1), 'admin');
