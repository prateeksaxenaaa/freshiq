-- Enable RLS on recipe_ingredients
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT (View ingredients)
CREATE POLICY "Users can view ingredients for their household recipes"
ON recipe_ingredients FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM recipes
        JOIN household_members ON recipes.household_id = household_members.household_id
        WHERE recipes.id = recipe_ingredients.recipe_id
        AND household_members.user_id = auth.uid()
    )
);

-- Policy for INSERT (Add ingredients)
CREATE POLICY "Users can add ingredients to their household recipes"
ON recipe_ingredients FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM recipes
        JOIN household_members ON recipes.household_id = household_members.household_id
        WHERE recipes.id = recipe_ingredients.recipe_id
        AND household_members.user_id = auth.uid()
    )
);

-- Policy for UPDATE (Edit ingredients)
CREATE POLICY "Users can update ingredients for their household recipes"
ON recipe_ingredients FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM recipes
        JOIN household_members ON recipes.household_id = household_members.household_id
        WHERE recipes.id = recipe_ingredients.recipe_id
        AND household_members.user_id = auth.uid()
    )
);

-- Policy for DELETE (Remove ingredients)
CREATE POLICY "Users can delete ingredients for their household recipes"
ON recipe_ingredients FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM recipes
        JOIN household_members ON recipes.household_id = household_members.household_id
        WHERE recipes.id = recipe_ingredients.recipe_id
        AND household_members.user_id = auth.uid()
    )
);


-- Enable RLS on recipe_steps
ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT (View steps)
CREATE POLICY "Users can view steps for their household recipes"
ON recipe_steps FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM recipes
        JOIN household_members ON recipes.household_id = household_members.household_id
        WHERE recipes.id = recipe_steps.recipe_id
        AND household_members.user_id = auth.uid()
    )
);

-- Policy for INSERT (Add steps)
CREATE POLICY "Users can add steps to their household recipes"
ON recipe_steps FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM recipes
        JOIN household_members ON recipes.household_id = household_members.household_id
        WHERE recipes.id = recipe_steps.recipe_id
        AND household_members.user_id = auth.uid()
    )
);

-- Policy for UPDATE (Edit steps)
CREATE POLICY "Users can update steps for their household recipes"
ON recipe_steps FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM recipes
        JOIN household_members ON recipes.household_id = household_members.household_id
        WHERE recipes.id = recipe_steps.recipe_id
        AND household_members.user_id = auth.uid()
    )
);

-- Policy for DELETE (Remove steps)
CREATE POLICY "Users can delete steps for their household recipes"
ON recipe_steps FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM recipes
        JOIN household_members ON recipes.household_id = household_members.household_id
        WHERE recipes.id = recipe_steps.recipe_id
        AND household_members.user_id = auth.uid()
    )
);
