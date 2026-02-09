// AI Video Analysis Edge Function
console.log('--- Module Loading (v2.39.3) ---');

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import type { AnalyzeVideoRequest, AnalyzeVideoResponse } from './types.ts';
// Import utils
import { extractRecipeFromMetadata } from './utils/gemini.ts';
import {
    detectPlatform,
    extractVideoId,
    fetchInstagramMetadata,
    fetchTikTokMetadata,
    fetchYouTubeMetadata,
} from './utils/platforms.ts';
import { fetchYouTubeTranscript } from './utils/transcript.ts';

console.log('--- Imports Complete ---');

console.log('=== Analyze Video Function Loading ===');

Deno.serve(async (req) => {
    console.log('=== Edge Function Invoked ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    
    // Log ALL headers for debugging 401
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
        // Redact auth/keys in logs
        if (key.toLowerCase().includes('auth') || key.toLowerCase().includes('key')) {
             headers[key] = '[REDACTED]';
        } else {
             headers[key] = value;
        }
    });
    console.log('Request Headers:', JSON.stringify(headers));

    // Specific Auth Check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        console.error('CRITICAL: No Authorization header present!');
    } else {
        console.log('Authorization header present (length):', authHeader.length);
    }
    
    // Environment Check
    const hasSupabaseUrl = !!Deno.env.get('SUPABASE_URL');
    const hasServiceRole = !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    console.log('Environment Configured:', { hasSupabaseUrl, hasServiceRole });

    // CORS headers
    if (req.method === 'OPTIONS') {
        console.log('Handling OPTIONS request');
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            },
        });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');

    try {
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Supabase credentials not configured');
        }
        if (!YOUTUBE_API_KEY) {
             console.warn('YOUTUBE_API_KEY missing - YouTube imports will fail');
        }

        // Parse request
        console.log('Parsing request body...');
        const requestBody = await req.json();
        
        const { video_url, import_id, user_id }: AnalyzeVideoRequest = requestBody;

        if (!video_url || !import_id || !user_id) {
            return new Response(
                JSON.stringify({ 
                    success: false,
                    error: 'Missing required fields: video_url, import_id, user_id' 
                }),
                {  
                    status: 200, 
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
                }
            );
        }

        console.log(`[${import_id}] Starting analysis for: ${video_url}`);

        // Initialize Supabase client
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Update status: Processing
        await updateImportStatus(supabase, import_id, 'processing');

        // Step 1: Detect platform
        const platform = detectPlatform(video_url);
        if (!platform) {
            throw new Error('Unsupported platform. Supported: YouTube, Instagram, TikTok');
        }

        // Step 2: Extract video ID
        const videoId = extractVideoId(video_url, platform);
        if (!videoId) {
            throw new Error(`Could not extract video ID from URL: ${video_url}`);
        }

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
            await supabase.from('recipe_imports').update({ error_message: `Failed to fetch metadata: ${error.message}` }).eq('id', import_id);
            throw new Error(`Failed to fetch metadata: ${error.message}`);
        }

        // Step 4: Fetch Transcript (YouTube only) and Extract Recipe
        console.log(`[${import_id}] Starting Gemini AI extraction...`);
        
        let transcript: string | null = null;
        let transcriptError: string | undefined;
        let transcriptDetails: string | undefined;

        if (platform === 'youtube') {
             console.log(`[${import_id}] Fetching YouTube transcript...`);
             const result = await fetchYouTubeTranscript(videoId);
             if (result.text) {
                 transcript = result.text;
                 console.log(`[${import_id}] Transcript fetched (${transcript.length} chars)`);
             } else {
                 transcriptError = result.error;
                 transcriptDetails = result.details;
                 console.log(`[${import_id}] No transcript found: ${result.error} (${result.details})`);
             }
        }

        // Check for external recipe links in description if transcript failed
        let externalContent: string = '';
        let externalLinks: string[] = [];
        
        if (!transcript && metadata.description) {
            // Find all http/https links
            const linkMatches = metadata.description.match(/https?:\/\/[^\s]+/g);
            if (linkMatches) {
                // Filter out social media and irrelevant links
                const invalidDomains = [
                    'youtube.com', 'youtu.be', 'instagram.com', 'tiktok.com', 
                    'facebook.com', 'twitter.com', 'x.com', 'pinterest.com', 
                    'amazon.com', 'amzn.to', 'goo.gl', 't.co', 'bit.ly'
                ];
                
                const validLinks = linkMatches.filter(link => {
                    try {
                        const urlObj = new URL(link);
                        const hostname = urlObj.hostname.toLowerCase();
                        
                        // 1. Check domain blocklist
                        if (invalidDomains.some(d => hostname.includes(d))) return false;

                        // 2. Specific YouTube Playlist check (just in case domain filter missed something)
                        if (urlObj.searchParams.has('list')) return false;
                        if (link.includes('playlist')) return false;

                        return true;
                    } catch { return false; }
                });

                // Take up to 2 valid links
                const linksToFetch = validLinks.slice(0, 2);
                externalLinks = linksToFetch;
                
                console.log(`[${import_id}] Found external links: ${linksToFetch.join(', ')}`);
                
                for (const link of linksToFetch) {
                    try {
                        const extResponse = await fetch(link, {
                            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FreshIQ/1.0)' }
                        });
                        if (extResponse.ok) {
                            const extHtml = await extResponse.text();
                            // Naive cleanup
                            const cleanText = extHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gmi, '')
                                                    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gmi, '')
                                                    .replace(/<[^>]+>/g, ' ')
                                                    .replace(/\s+/g, ' ')
                                                    .substring(0, 5000); // Limit context per link
                            
                            externalContent += `\n\n--- Content from ${link} ---\n${cleanText}`;
                        }
                    } catch (e) {
                        console.error(`[${import_id}] Failed to fetch link ${link}:`, e);
                    }
                }
                console.log(`[${import_id}] Total external content: ${externalContent.length} chars`);
            }
        }

        const extraction = await extractRecipeFromMetadata(metadata, transcript || (externalContent.length > 0 ? externalContent : null));
        
        const processingTime = Date.now() - startTime;
        console.log(`[${import_id}] Extraction complete. Success: ${extraction.success}, Confidence: ${extraction.confidence}`);

        if (extraction.error) {
            console.error(`[${import_id}] Extraction error:`, extraction.error);
        }

        // Step 5: If successful, create recipe in database
        if (extraction.success && extraction.recipe && extraction.confidence >= 0.5) {
            const { recipeId, ingredientsCount, stepsCount } = await createRecipe(supabase, user_id, extraction.recipe, metadata);
            
            // Update import record with success
            await supabase
                .from('recipe_imports')
                .update({
                    status: 'completed',
                    recipe_id: recipeId,
                    parsed_data: {
                        recipe_id: recipeId,
                        extraction_layer: extraction.extraction_layer,
                        confidence_score: extraction.confidence,
                        metadata: metadata,
                        processing_time_ms: processingTime,
                        completed_at: new Date().toISOString(),
                    },
                })
                .eq('id', import_id);

            console.log(`[${import_id}] Recipe created: ${recipeId}`);

            return new Response(
                JSON.stringify({
                    success: true,
                    import_id,
                    extraction,
                    insertion_debug: {
                        ingredients_extracted: extraction.recipe.ingredients?.length,
                        steps_extracted: extraction.recipe.steps?.length,
                        ingredients_inserted: ingredientsCount,
                        steps_inserted: stepsCount,
                        transcript_status: transcript ? `Fetched (${transcript.length} chars)` : `Failed: ${transcriptError || 'Unknown'} (${transcriptDetails || 'No details'})`,
                        metadata_len: metadata.description?.length,
                        external_link: externalLinks.length > 0 ? externalLinks[0] : null,
                        external_content_len: externalContent?.length,
                    }
                } as AnalyzeVideoResponse),
                { 
                    status: 200,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                }
            );
        } else {
            // Low confidence or failed extraction
            await supabase
                .from('recipe_imports')
                .update({
                    status: 'failed',
                    error_message: extraction.error || `Low confidence: ${extraction.confidence}`,
                    parsed_data: {
                        extraction_layer: extraction.extraction_layer,
                        confidence_score: extraction.confidence,
                        metadata: metadata,
                        processing_time_ms: processingTime,
                        completed_at: new Date().toISOString(),
                    }
                })
                .eq('id', import_id);

            return new Response(
                JSON.stringify({
                    success: false,
                    import_id,
                    error: extraction.error || `Could not extract recipe (confidence: ${extraction.confidence})`,
                } as AnalyzeVideoResponse),
                { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
            );
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error in analyze-video function:', errorMessage);
        
        try {
            const requestBody = await req.clone().json();
            if (requestBody.import_id) {
                const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
                await supabase.from('recipe_imports').update({ status: 'failed', error_message: errorMessage }).eq('id', requestBody.import_id);
            }
        } catch (e) {}
        
        return new Response(
            JSON.stringify({ success: false, error: errorMessage }),
            { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
    }
});

// --- HELPERS ---

async function updateImportStatus(supabase: any, importId: string, status: string) {
    await supabase.from('recipe_imports').update({ status }).eq('id', importId);
}

async function createRecipe(supabase: any, userId: string, recipe: any, metadata: any) {
    const { data: member } = await supabase.from('household_members').select('household_id').eq('user_id', userId).single();
    if (!member) throw new Error('Could not find user household');

    const { data: newRecipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
            household_id: member.household_id,
            title: recipe.title,
            description: recipe.description || null,
            servings: recipe.servings || 4,
            prep_time_minutes: recipe.prep_time_minutes || null,
            cook_time_minutes: recipe.cook_time_minutes || null,
            is_vegetarian: recipe.is_vegetarian,
            image_url: metadata.thumbnailUrl || null,
            source_url: metadata.url,
            source_platform: metadata.platform,
        })
        .select()
        .single();

    if (recipeError) throw new Error(`Failed to create recipe: ${recipeError.message}`);

    const recipeId = newRecipe.id;
    let ingredientsCount = 0;
    let stepsCount = 0;

    // Create ingredients
    if (recipe.ingredients && recipe.ingredients.length > 0) {
        console.log(`[CreateRecipe] Found ${recipe.ingredients.length} raw ingredients`);
        
        const ingredients = recipe.ingredients.map((ing: any, index: number) => ({
            recipe_id: recipeId,
            name: ing.name,
            quantity: parseQuantity(ing.quantity),
            unit: ing.unit || null,
            order_index: index,
            raw_text: `${ing.quantity || ''} ${ing.unit || ''} ${ing.name}`.trim(),
        }));

        console.log(`[CreateRecipe] Prepared ingredients for insert:`, JSON.stringify(ingredients));

        const { data: insertedData, error: ingError } = await supabase
            .from('recipe_ingredients')
            .insert(ingredients)
            .select();
        
        console.log(`[CreateRecipe] Ingredients Insert result error:`, ingError);
        
        if (ingError) throw new Error(`Failed to create ingredients: ${ingError.message}`);
        ingredientsCount = insertedData?.length || 0;
    } else {
        console.log('[CreateRecipe] No ingredients found in recipe object');
    }

    // Create steps
    if (recipe.steps && recipe.steps.length > 0) {
        const steps = recipe.steps.map((step: any) => ({
            recipe_id: recipeId,
            step_number: step.step_number,
            instruction_text: step.instruction,
            section_label: step.section_title || null,
        }));

        const { data: insertedSteps, error: stepError } = await supabase
            .from('recipe_steps')
            .insert(steps)
            .select();
            
        if (stepError) throw new Error(`Failed to create steps: ${stepError.message}`);
        stepsCount = insertedSteps?.length || 0;
    }

    return { recipeId, ingredientsCount, stepsCount };
}

function parseQuantity(value: any): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    const str = String(value).trim();
    if (!str) return null;
    if (str.includes('-')) {
        const parts = str.split('-').map(p => parseFloat(p.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) return (parts[0] + parts[1]) / 2;
    }
    if (str.includes('/')) {
        const parts = str.split('/').map(p => parseFloat(p.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && parts[1] !== 0) return parts[0] / parts[1];
    }
    const match = str.match(/(\d+(\.\d+)?)/);
    if (match) return parseFloat(match[0]);
    return null;
}
