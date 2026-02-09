-- Disable RLS on recipe_ingredients and recipe_steps to debug visibility
ALTER TABLE recipe_ingredients DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_steps DISABLE ROW LEVEL SECURITY;
