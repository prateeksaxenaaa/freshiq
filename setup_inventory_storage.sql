-- 1. Create storage_locations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.storage_locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ensure the UNIQUE constraint exists (SAFE FIX for 42P10 error)
DO $$
BEGIN
    -- Check if the constraint 'storage_locations_household_id_name_key' exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'storage_locations_household_id_name_key'
    ) THEN
        -- If not, verify no duplicates exist before adding it (Optional cleanup)
        DELETE FROM public.storage_locations a USING public.storage_locations b
        WHERE a.id < b.id AND a.household_id = b.household_id AND a.name = b.name;

        -- Add the constraint
        ALTER TABLE public.storage_locations 
        ADD CONSTRAINT storage_locations_household_id_name_key UNIQUE (household_id, name);
    END IF;
END $$;

-- 3. Add storage_id to inventory_items if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'storage_id') THEN
        ALTER TABLE public.inventory_items 
        ADD COLUMN storage_id UUID REFERENCES public.storage_locations(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Populate defaults (Fridge, Freezer, Pantry) for ALL existing households
DO $$
DECLARE
  h_rec RECORD;
BEGIN
  FOR h_rec IN SELECT id FROM public.households LOOP
    INSERT INTO public.storage_locations (household_id, name)
    VALUES 
      (h_rec.id, 'Fridge'),
      (h_rec.id, 'Freezer'),
      (h_rec.id, 'Pantry')
    ON CONFLICT (household_id, name) DO NOTHING;
  END LOOP;
END $$;

-- 5. Enable RLS on storage_locations
ALTER TABLE public.storage_locations ENABLE ROW LEVEL SECURITY;

-- 6. Create Policies for storage_locations
-- View
DROP POLICY IF EXISTS "Users can view their household storage" ON public.storage_locations;
CREATE POLICY "Users can view their household storage" ON public.storage_locations
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    )
  );

-- Insert
DROP POLICY IF EXISTS "Users can create storage" ON public.storage_locations;
CREATE POLICY "Users can create storage" ON public.storage_locations
  FOR INSERT WITH CHECK (
    household_id IN (
      SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    )
  );

-- Update
DROP POLICY IF EXISTS "Users can update storage" ON public.storage_locations;
CREATE POLICY "Users can update storage" ON public.storage_locations
  FOR UPDATE USING (
    household_id IN (
      SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    )
  );

-- Delete
DROP POLICY IF EXISTS "Users can delete storage" ON public.storage_locations;
CREATE POLICY "Users can delete storage" ON public.storage_locations
  FOR DELETE USING (
    household_id IN (
      SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    )
  );

-- 7. Grant permissions
GRANT ALL ON public.storage_locations TO authenticated;
GRANT ALL ON public.storage_locations TO service_role;
