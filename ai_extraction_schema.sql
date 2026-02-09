-- Add tracking fields for AI extraction to recipe_imports table

ALTER TABLE recipe_imports
ADD COLUMN IF NOT EXISTS extraction_layer TEXT,
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS metadata_json JSONB,
ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER;

-- Add source tracking to recipes table
ALTER TABLE recipes
ADD COLUMN IF NOT EXISTS source_platform TEXT,
ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_recipe_imports_status ON recipe_imports(status);
CREATE INDEX IF NOT EXISTS idx_recipe_imports_user_id ON recipe_imports(user_id);
