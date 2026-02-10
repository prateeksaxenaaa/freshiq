// AI Image Recipe Extraction Edge Function
console.log('--- Module Loading: analyze-image ---');

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import type { AnalyzeImageRequest } from './types.ts';
import { extractRecipeFromImage } from './utils/gemini.ts';

console.log('--- Imports Complete ---');

Deno.serve(async (req) => {
    console.log('=== Image Analysis Invoked ===');

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
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Supabase configuration missing');
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        const body: AnalyzeImageRequest = await req.json();
        const { image_base64, mime_type, import_id, user_id } = body;

        if (!image_base64 || !mime_type || !import_id || !user_id) {
            return new Response(JSON.stringify({ success: false, error: 'Missing required parameters' }), { 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        console.log(`[${import_id}] Analyzing image (size: ${image_base64.length} chars)`);

        await supabase.from('recipe_imports').update({ status: 'processing' }).eq('id', import_id);

        const extraction = await extractRecipeFromImage(image_base64, mime_type);

        console.log(`[${import_id}] Extraction complete. Success: ${extraction.success} (Confidence: ${extraction.confidence})`);

        if (extraction.success && extraction.recipe && extraction.confidence > 0.6) {
            const { recipeId } = await createRecipe(supabase, user_id, extraction.recipe, import_id);
            
            await supabase.from('recipe_imports').update({
                status: 'completed',
                recipe_id: recipeId,
                parsed_data: {
                    recipe: extraction.recipe,
                    completed_at: new Date().toISOString()
                }
            }).eq('id', import_id);

            return new Response(JSON.stringify({
                success: true,
                import_id,
                extraction,
                recipe_id: recipeId
            }), { headers: { 'Content-Type': 'application/json' } });
        } else {
             const errorMsg = extraction.error || 'Low confidence in image analysis';
             await supabase.from('recipe_imports').update({
                 status: 'failed',
                 error_message: errorMsg,
                 parsed_data: { extraction }
             }).eq('id', import_id);

             return new Response(JSON.stringify({ success: false, error: errorMsg }), {
                 headers: { 'Content-Type': 'application/json' }
             });
        }

    } catch (error) {
        console.error('Image Analysis Error:', error);
        return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
            status: 200, // Return 200 so client can parse the error message
            headers: { 'Content-Type': 'application/json' }
        });
    }
});

async function createRecipe(supabase: any, userId: string, recipe: any, importId: string) {
    const { data: member } = await supabase.from('household_members').select('household_id').eq('user_id', userId).single();
    if (!member) throw new Error('User has no household');

    // For image recipes, try to upload the provided image to storage later?
    // For now, assume user might upload image to bucket client-side and provide URL, OR we just don't have a URL yet.
    // Ideally, the CLIENT uploads the image to a bucket, sends us the public URL, and we store THAT.
    // BUT user said "analyze image and create recipe". If we send base64 to Edge Function, we don't necessarily have a public URL unless client uploaded it.
    // Let's assume for MVP: No image URL in DB unless client handled upload separately. 
    // We'll leave image_url NULL for now, or maybe the client updates the recipe with the image URL after creation.

    const { data: newRecipe, error } = await supabase.from('recipes').insert({
        household_id: member.household_id,
        title: recipe.title,
        description: recipe.description || "Imported from image",
        servings: recipe.servings || 4,
        prep_time_minutes: recipe.prep_time_minutes,
        cook_time_minutes: recipe.cook_time_minutes,
        is_vegetarian: recipe.is_vegetarian,
        source_platform: 'image_scan',
        source_url: `import://${importId}`, // Internal reference
    }).select().single();

    if (error) throw error;

    const ingredients = recipe.ingredients.map((ing: any, idx: number) => ({
        recipe_id: newRecipe.id,
        name: ing.name,
        quantity: parseQuantity(ing.quantity),
        unit: ing.unit,
        order_index: idx,
        raw_text: `${ing.quantity || ''} ${ing.unit || ''} ${ing.name}`.trim(),
    }));
    if (ingredients.length > 0) await supabase.from('recipe_ingredients').insert(ingredients);

    const steps = recipe.steps.map((step: any) => ({
        recipe_id: newRecipe.id,
        step_number: step.step_number,
        instruction_text: step.instruction,
        section_label: step.section_title
    }));
    if (steps.length > 0) await supabase.from('recipe_steps').insert(steps);

    return { recipeId: newRecipe.id };
}

function parseQuantity(value: any): number | null {
    if (typeof value === 'number') return value;
    if (!value) return null;
    const str = String(value).trim();
    if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length === 2) return parseFloat(parts[0]) / parseFloat(parts[1]);
    }
    const match = str.match(/[\d\.]+/);
    return match ? parseFloat(match[0]) : null;
}
