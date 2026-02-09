-- AUTOMATIC TEST RECIPE - Run this entire script at once!
-- This will create a recipe, add ingredients and steps, and link it to your import

-- REPLACE THIS with your actual import ID from recipe_imports table:
-- You can find it by running: SELECT id FROM recipe_imports WHERE status = 'pending' LIMIT 1;
DO $$
DECLARE
    v_recipe_id UUID;
    v_import_id UUID := 'YOUR_IMPORT_ID_HERE'; -- ⚠️ REPLACE THIS FIRST!
BEGIN
    -- Step 1: Create recipe
    INSERT INTO public.recipes (
        household_id,
        title,
        description,
        prep_time_minutes,
        cook_time_minutes,
        servings
    ) VALUES (
        NULL,
        'Test Pasta Carbonara',
        'A classic Italian pasta dish with creamy sauce',
        15,
        20,
        4
    ) RETURNING id INTO v_recipe_id;

    RAISE NOTICE 'Created recipe with ID: %', v_recipe_id;

    -- Step 2: Add ingredients
    INSERT INTO public.recipe_ingredients (recipe_id, raw_text, name, quantity, unit) VALUES
    (v_recipe_id, '400g spaghetti', 'spaghetti', 400, 'g'),
    (v_recipe_id, '4 large eggs', 'eggs', 4, 'pcs'),
    (v_recipe_id, '150g pancetta, diced', 'pancetta', 150, 'g'),
    (v_recipe_id, '100g Pecorino Romano cheese, grated', 'Pecorino Romano', 100, 'g'),
    (v_recipe_id, 'Black pepper to taste', 'black pepper', null, null);

    RAISE NOTICE 'Added 5 ingredients';

    -- Step 3: Add cooking steps
    INSERT INTO public.recipe_steps (recipe_id, step_number, instruction_text, section_label) VALUES
    (v_recipe_id, 1, 'Bring a large pot of salted water to boil.', 'Preparation'),
    (v_recipe_id, 2, 'Cook spaghetti according to package directions until al dente.', 'Preparation'),
    (v_recipe_id, 3, 'While pasta cooks, whisk eggs and grated cheese together in a bowl.', 'Preparation'),
    (v_recipe_id, 4, 'Cook pancetta in a large skillet over medium heat until crispy.', 'Cooking'),
    (v_recipe_id, 5, 'Reserve 1 cup pasta water, then drain pasta.', 'Cooking'),
    (v_recipe_id, 6, 'Add hot pasta to the skillet with pancetta, remove from heat.', 'Assembly'),
    (v_recipe_id, 7, 'Quickly stir in egg mixture, adding pasta water as needed for creamy sauce.', 'Assembly'),
    (v_recipe_id, 8, 'Season with black pepper and serve immediately.', 'Assembly');

    RAISE NOTICE 'Added 8 steps';

    -- Step 4: Link to import and mark as completed
    UPDATE public.recipe_imports
    SET 
        status = 'completed',
        parsed_data = jsonb_build_object('recipe_id', v_recipe_id)
    WHERE id = v_import_id;

    RAISE NOTICE 'Updated import % with recipe %', v_import_id, v_recipe_id;
    RAISE NOTICE '✅ Done! Your app should now navigate to the recipe detail screen.';
END $$;
