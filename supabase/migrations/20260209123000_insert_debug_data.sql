-- Insert a test ingredient to verify if frontend can see data
-- Target Recipe ID: 04935193-f0c9-4284-9313-aacd38b455b9 ("The Fluffiest Pancakes" from logs)

INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, raw_text, order_index)
VALUES (
    '04935193-f0c9-4284-9313-aacd38b455b9', 
    'DEBUG TEST INGREDIENT', 
    1, 
    'unit', 
    '1 unit DEBUG TEST INGREDIENT', 
    0
);

INSERT INTO recipe_steps (recipe_id, step_number, instruction_text, section_label)
VALUES (
    '04935193-f0c9-4284-9313-aacd38b455b9',
    1,
    'DEBUG TEST STEP: If you see this, the DB connection is working.',
    'Debug Section'
);
