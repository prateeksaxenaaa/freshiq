-- Enable RLS on inventory_items (just in case)
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- 1. Policy: Allow Viewing Items (Select)
DROP POLICY IF EXISTS "Users can view household inventory" ON public.inventory_items;
CREATE POLICY "Users can view household inventory" ON public.inventory_items
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    )
  );

-- 2. Policy: Allow Creating Items (Insert)
DROP POLICY IF EXISTS "Users can create inventory items" ON public.inventory_items;
CREATE POLICY "Users can create inventory items" ON public.inventory_items
  FOR INSERT WITH CHECK (
    household_id IN (
      SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    )
  );

-- 3. Policy: Allow Updating Items (Update)
DROP POLICY IF EXISTS "Users can update inventory items" ON public.inventory_items;
CREATE POLICY "Users can update inventory items" ON public.inventory_items
  FOR UPDATE USING (
    household_id IN (
      SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    )
  );

-- 4. Policy: Allow Deleting Items (Delete)
DROP POLICY IF EXISTS "Users can delete inventory items" ON public.inventory_items;
CREATE POLICY "Users can delete inventory items" ON public.inventory_items
  FOR DELETE USING (
    household_id IN (
      SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    )
  );

-- Grant permissions to authenticated users
GRANT ALL ON public.inventory_items TO authenticated;
GRANT ALL ON public.inventory_items TO service_role;
