-- Add status column if it doesn't exist
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Backfill existing items to be 'active'
UPDATE public.inventory_items 
SET status = 'active' 
WHERE status IS NULL;

-- Ensure RLS allows access to this new column (already covered by "ALL", but good practice to verify)
-- No extra RLS needed if GRANT ALL was used.
