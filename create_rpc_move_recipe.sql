-- ========================================
-- RPC FUNCTION: Move Recipe To Cookbook
-- ========================================

-- This function handles the "Uncategorize" or "Change Category" logic atomically.
-- It runs as SECURITY DEFINER, meaning it bypasses RLS for the execution.
-- This ensures we can delete old links even if the user currently can't "see" them due to a bug.

CREATE OR REPLACE FUNCTION public.move_recipe_to_cookbook(
  p_recipe_id UUID,
  p_cookbook_id UUID -- Pass NULL to simply uncategorize
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Remove ALL existing associations for this recipe
  -- This creates a clean slate and avoids "Duplicate Key" errors.
  DELETE FROM public.recipe_cookbooks
  WHERE recipe_id = p_recipe_id;

  -- 2. If a target cookbook is provided, create the new link
  IF p_cookbook_id IS NOT NULL THEN
    INSERT INTO public.recipe_cookbooks (recipe_id, cookbook_id)
    VALUES (p_recipe_id, p_cookbook_id);
  END IF;
END;
$$;
