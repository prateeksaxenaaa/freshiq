// AI Video Analysis Edge Function
// Extracts recipes from video links using metadata + Gemini AI

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import type { AnalyzeVideoRequest, AnalyzeVideoResponse } from './types.ts';
import { extractRecipeFromMetadata } from './utils/gemini.ts';
import {
    detectPlatform,
    extractVideoId,
    fetchInstagramMetadata,
    fetchTikTokMetadata,
    fetchYouTubeMetadata,
} from './utils/platforms.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;

Deno.serve(async (req) => {
    console.log('=== Edge Function Invoked ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    
    // CORS headers
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            },
        });
    }

    try {
        // Parse request
        console.log('Parsing request body...');
        const requestBody = await req.json();
        console.log('Request body:', JSON.stringify(requestBody));
        
        const { video_url, import_id, user_id }: AnalyzeVideoRequest = requestBody;

        if (!video_url || !import_id || !user_id) {
            console.error('Missing required fields:', { video_url: !!video_url, import_id: !!import_id, user_id: !!user_id });
            return new Response(
                JSON.stringify({ 
                    success: false,
                    error: 'Missing required fields: video_url, import_id, user_id' 
                }),
                {  
                    status: 200,  // Return 200 so client can read error
                    headers: { 
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    } 
                }
            );
        }

        console.log(`[${import_id}] Starting analysis for: ${video_url}`);

        // Check environment variables
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Supabase credentials not configured');
        }
        if (!YOUTUBE_API_KEY) {
            throw new Error('YOUTUBE_API_KEY not configured');
        }
        if (!GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY not configured');
        }

        // Initialize Supabase client
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Update status: Processing
        await updateImportStatus(supabase, import_id, 'processing');

        // Step 1: Detect platform
        const platform = detectPlatform(video_url);
        if (!platform) {
            throw new Error('Unsupported platform. Supported: YouTube, Instagram, TikTok');
        }

        console.log(`[${import_id}] Detected platform: ${platform}`);

        // Step 2: Extract video ID
        const videoId = extractVideoId(video_url, platform);
        if (!videoId) {
            throw new Error(`Could not extract video ID from URL: ${video_url}`);
        }

        console.log(`[${import_id}] Video ID: ${videoId}`);

        // Step 3: Fetch metadata
        let metadata;
        const startTime = Date.now();
        
        try {
            console.log(`[${import_id}] Fetching metadata from ${platform}...`);
            
            switch (platform) {
                case 'youtube':
                    metadata = await fetchYouTubeMetadata(videoId);
                    break;
                case 'instagram':
                    metadata = await fetchInstagramMetadata(videoId);
                    break;
                case 'tiktok':
                    metadata = await fetchTikTokMetadata(videoId);
                    break;
            }
            
            console.log(`[${import_id}] Metadata fetched successfully:`, metadata.title);
        } catch (error) {
            console.error(`[${import_id}] Metadata fetch error:`, error.message);
            await updateImportStatus(supabase, import_id, 'failed');
            await supabase
                .from('recipe_imports')
                .update({ error_message: `Failed to fetch metadata: ${error.message}` })
                .eq('id', import_id);
            
            throw new Error(`Failed to fetch metadata: ${error.message}`);
        }

        // Step 4: Extract recipe using Gemini AI
        console.log(`[${import_id}] Starting Gemini AI extraction...`);
        const extraction = await extractRecipeFromMetadata(metadata);
        
        const processingTime = Date.now() - startTime;
        console.log(`[${import_id}] Extraction complete. Success: ${extraction.success}, Confidence: ${extraction.confidence}, Time: ${processingTime}ms`);

        if (extraction.error) {
            console.error(`[${import_id}] Extraction error:`, extraction.error);
        }

        // Step 5: If successful, create recipe in database
        if (extraction.success && extraction.recipe && extraction.confidence >= 0.5) {
            const recipeId = await createRecipe(supabase, user_id, extraction.recipe, metadata);
            
            // Update import record with success
            await supabase
                .from('recipe_imports')
                .update({
                    status: 'completed',
                    recipe_id: recipeId,
                    extraction_layer: extraction.extraction_layer,
                    confidence_score: extraction.confidence,
                    metadata_json: metadata,
                    processing_time_ms: processingTime,
                    completed_at: new Date().toISOString(),
                })
                .eq('id', import_id);

            console.log(`[${import_id}] Recipe created: ${recipeId}`);

            return new Response(
                JSON.stringify({
                    success: true,
                    import_id,
                    extraction,
                } as AnalyzeVideoResponse),
                { 
                    status: 200,
                    headers: { 
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                }
            );
        } else {
            // Low confidence or failed extraction
            await supabase
                .from('recipe_imports')
                .update({
                    status: 'failed',
                    error_message: extraction.error || `Low confidence: ${extraction.confidence}`,
                    extraction_layer: extraction.extraction_layer,
                    confidence_score: extraction.confidence,
                    metadata_json: metadata,
                    processing_time_ms: processingTime,
                    completed_at: new Date().toISOString(),
                })
                .eq('id', import_id);

            return new Response(
                JSON.stringify({
                    success: false,
                    import_id,
                    error: extraction.error || `Could not extract recipe (confidence: ${extraction.confidence})`,
                } as AnalyzeVideoResponse),
                { 
                    status: 200, // Not a server error, just unsuccessful extraction
                    headers: { 
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                }
            );
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error in analyze-video function:', errorMessage);
        console.error('Full error:', error);
        
        // Try to update import status if we have an import_id
        try {
            const requestBody = await req.clone().json();
            if (requestBody.import_id) {
                const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
                await supabase
                    .from('recipe_imports')
                    .update({
                        status: 'failed',
                        error_message: errorMessage,
                    })
                    .eq('id', requestBody.import_id);
            }
        } catch (updateError) {
            console.error('Failed to update import status:', updateError);
        }
        
        return new Response(
            JSON.stringify({
                success: false,
                error: errorMessage,
                details: error instanceof Error ? error.stack : undefined,
            }),
            { 
                status: 200, // Return 200 so the client can see the error details
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }
        );
    }
});

/**
 * Update import status in database
 */
async function updateImportStatus(supabase: any, importId: string, status: string) {
    const { error } = await supabase
        .from('recipe_imports')
        .update({ status })
        .eq('id', importId);

    if (error) {
        console.error('Failed to update import status:', error);
    }
}

/**
 * Create recipe in database from extraction
 */
async function createRecipe(supabase: any, userId: string, recipe: any, metadata: any) {
    // Get user's household_id
    const { data: member, error: memberError } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', userId)
        .single();

    if (memberError || !member) {
        throw new Error('Could not find user household');
    }

    const householdId = member.household_id;

    // Create recipe
    const { data: newRecipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
            household_id: householdId,
            title: recipe.title,
            description: recipe.description || null,
            servings: recipe.servings || 4,
            prep_time_minutes: recipe.prep_time_minutes || null,
            cook_time_minutes: recipe.cook_time_minutes || null,
            is_vegetarian: recipe.is_vegetarian,
            image_url: null, // Will be added in future phases
            source_url: metadata.url,
            source_platform: metadata.platform,
        })
        .select()
        .single();

    if (recipeError) {
        throw new Error(`Failed to create recipe: ${recipeError.message}`);
    }

    const recipeId = newRecipe.id;

    // Create ingredients
    if (recipe.ingredients && recipe.ingredients.length > 0) {
        const ingredients = recipe.ingredients.map((ing: any, index: number) => ({
            recipe_id: recipeId,
            name: ing.name,
            quantity: ing.quantity || null,
            unit: ing.unit || null,
            order_index: index,
        }));

        const { error: ingError } = await supabase
            .from('recipe_ingredients')
            .insert(ingredients);

        if (ingError) {
            console.error('Failed to create ingredients:', ingError);
        }
    }

    // Create steps
    if (recipe.steps && recipe.steps.length > 0) {
        const steps = recipe.steps.map((step: any) => ({
            recipe_id: recipeId,
            step_number: step.step_number,
            instruction: step.instruction,
            section_title: step.section_title || null,
        }));

        const { error: stepError } = await supabase
            .from('recipe_steps')
            .insert(steps);

        if (stepError) {
            console.error('Failed to create steps:', stepError);
        }
    }

    return recipeId;
}
