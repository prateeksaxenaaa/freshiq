-- FIX MISSING COLUMNS causing "Hanging" and "Navigation" issues
-- 1. error_message: Needed for "Import Failed" status updates
-- 2. recipe_id: Needed for "Redirecting to recipe" navigation
-- 3. extraction_layer, confidence_score: Optional but good for analytics

ALTER TABLE public.recipe_imports
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS extraction_layer TEXT,
ADD COLUMN IF NOT EXISTS confidence_score FLOAT,
ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Force schema reload
NOTIFY pgrst, 'reload schema';
