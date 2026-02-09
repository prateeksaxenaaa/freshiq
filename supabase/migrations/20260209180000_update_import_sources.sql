-- Allow new source types for recipe_imports
ALTER TABLE recipe_imports DROP CONSTRAINT IF EXISTS recipe_imports_source_type_check;

ALTER TABLE recipe_imports
ADD CONSTRAINT recipe_imports_source_type_check
CHECK (source_type IN ('youtube', 'instagram', 'tiktok', 'web', 'image_scan', 'unknown'));
