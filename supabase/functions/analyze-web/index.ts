// AI Web Recipe Extraction Edge Function
// Supports scraping recipe content from standard web pages (blogs, recipe sites)
console.log('--- Module Loading: analyze-web ---');

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import type { AnalyzeWebRequest } from './types.ts';
import { extractRecipeFromWeb } from './utils/gemini.ts';
import { fetchWebPage } from './utils/scraper.ts';

console.log('--- Imports Complete ---');

Deno.serve(async (req) => {
    console.log('=== Web Analysis Invoked ===');
    console.log('Method:', req.method);

    // 1. CORS Headers
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            },
        });
    }

    try {
        // 2. Auth & Env Verification
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Supabase configuration missing');
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 3. Parse Request
        const body: AnalyzeWebRequest = await req.json();
        const { web_url, import_id, user_id } = body;

        if (!web_url || !import_id || !user_id) {
            return new Response(
                JSON.stringify({ success: false, error: 'Missing required parameters (url, import_id, user_id)' }),
                { headers: { 'Content-Type': 'application/json' } }
            );
        }

        console.log(`[${import_id}] Starting Web Analysis for: ${web_url}`);

        // Update status to processing
        await supabase.from('recipe_imports').update({ status: 'processing' }).eq('id', import_id);

        // 4. Fetch Page Content
        const pageData = await fetchWebPage(web_url);
        
        if (!pageData) {
            throw new Error('Failed to fetch webpage content (404/Block/Error)');
        }

        console.log(`[${import_id}] Page fetched. Title: ${pageData.metadata.title}`);

        // 5. Extract Details via Gemini
        const extraction = await extractRecipeFromWeb(pageData.metadata, pageData.html);

        console.log(`[${import_id}] Extraction complete. Success: ${extraction.success} (Confidence: ${extraction.confidence})`);

        if (extraction.success && extraction.recipe && extraction.confidence > 0.6) {
            // 6. Save Recipe
            const { recipeId, ingredientsCount, stepsCount } = await createRecipe(supabase, user_id, extraction.recipe, pageData.metadata);

            // Update Import Record
            await supabase.from('recipe_imports').update({
                status: 'completed',
                recipe_id: recipeId,
                parsed_data: {
                    recipe: extraction.recipe,
                    metadata: pageData.metadata,
                    completed_at: new Date().toISOString()
                }
            }).eq('id', import_id);

            return new Response(JSON.stringify({
                success: true,
                import_id,
                extraction,
                insertion_debug: { ingredientsCount, stepsCount }
            }), { headers: { 'Content-Type': 'application/json' } });

        } else {
             // Extraction Failed
             const errorMsg = extraction.error || 'Low confidence in recipe extraction';
             await supabase.from('recipe_imports').update({
                 status: 'failed',
                 error_message: errorMsg,
                 parsed_data: { extraction }
             }).eq('id', import_id);

             return new Response(JSON.stringify({
                 success: false,
                 error: errorMsg,
                 extraction
             }), { headers: { 'Content-Type': 'application/json' } });
        }

    } catch (error) {
        console.error('Web Analysis Error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: (error as Error).message
        }), { headers: { 'Content-Type': 'application/json' }, status: 500 });
    }
});

// --- HELPER: Create Recipe (Duplicated logic to avoid touching shared files) ---
async function createRecipe(supabase: any, userId: string, recipe: any, metadata: any) {
    // 1. Get household
    const { data: member } = await supabase.from('household_members').select('household_id').eq('user_id', userId).single();
    if (!member) throw new Error('User has no household');

    // 2. Insert Recipe
    const { data: newRecipe, error: recipeError } = await supabase.from('recipes').insert({
        household_id: member.household_id,
        title: recipe.title,
        description: recipe.description || metadata.description,
        servings: recipe.servings || 4,
        prep_time_minutes: recipe.prep_time_minutes,
        cook_time_minutes: recipe.cook_time_minutes,
        is_vegetarian: recipe.is_vegetarian,
        image_url: metadata.thumbnailUrl, // Use scraped OG image
        source_url: metadata.url,
        source_platform: 'web', // Custom platform type for web imports
    }).select().single();

    if (recipeError) throw recipeError;

    // 3. Insert Ingredients
    const ingredients = recipe.ingredients.map((ing: any, idx: number) => ({
        recipe_id: newRecipe.id,
        name: ing.name,
        quantity: parseQuantity(ing.quantity),
        unit: ing.unit,
        order_index: idx,
        raw_text: `${ing.quantity || ''} ${ing.unit || ''} ${ing.name}`.trim(),
    }));

     const { data: insIng } = await supabase.from('recipe_ingredients').insert(ingredients).select();

    // 4. Insert Steps
    const steps = recipe.steps.map((step: any) => ({
        recipe_id: newRecipe.id,
        step_number: step.step_number,
        instruction_text: step.instruction,
        section_label: step.section_title
    }));

    const { data: insSteps } = await supabase.from('recipe_steps').insert(steps).select();

    return { 
        recipeId: newRecipe.id, 
        ingredientsCount: insIng?.length || 0,
        stepsCount: insSteps?.length || 0 
    };
}

function parseQuantity(value: any): number | null {
    if (typeof value === 'number') return value;
    if (!value) return null;
    const str = String(value).trim();
    if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length === 2) return parseFloat(parts[0]) / parseFloat(parts[1]);
    }
    const match = str.match(/[\d\.]+/); // simplistic
    return match ? parseFloat(match[0]) : null;
}
