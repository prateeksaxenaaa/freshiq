-- First, let's verify the table exists and see its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'recipe_imports'
ORDER BY ordinal_position;

-- If the table doesn't exist or has wrong structure, drop and recreate
DROP TABLE IF EXISTS public.recipe_imports CASCADE;

-- Create recipe_imports table with correct structure
CREATE TABLE public.recipe_imports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_type TEXT CHECK (source_type IN ('url', 'image', 'text', 'youtube', 'instagram', 'tiktok', 'unknown')),
  content_payload TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  parsed_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.recipe_imports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can insert their own imports" ON public.recipe_imports;
DROP POLICY IF EXISTS "Users can view their own imports" ON public.recipe_imports;
DROP POLICY IF EXISTS "Users can update their own imports" ON public.recipe_imports;
DROP POLICY IF EXISTS "Users can delete their own imports" ON public.recipe_imports;

-- Policy: Users can insert their own imports
CREATE POLICY "Users can insert their own imports"
  ON public.recipe_imports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own imports
CREATE POLICY "Users can view their own imports"
  ON public.recipe_imports
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own imports
CREATE POLICY "Users can update their own imports"
  ON public.recipe_imports
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own imports
CREATE POLICY "Users can delete their own imports"
  ON public.recipe_imports
  FOR DELETE
  USING (auth.uid() = user_id);
