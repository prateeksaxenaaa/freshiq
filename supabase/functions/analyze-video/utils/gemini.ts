import type { RecipeExtraction, VideoMetadata } from '../types.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Extract recipe from video metadata using Gemini AI
 */
export async function extractRecipeFromMetadata(
    metadata: VideoMetadata,
    transcript: string | null = null,
): Promise<RecipeExtraction> {
    if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not configured');
    }

    // PASS 1: Main Extraction
    console.log('[Gemini] Starting Pass 1: Main Extraction');
    const prompt1 = createMetadataPrompt(metadata, transcript);
    let result1 = await callGemini(prompt1);
    
    if (!result1.success) {
        return { ...result1, extraction_layer: 'metadata' };
    }

    // PASS 2: Step Refinement (if steps are weak)
    // Criteria: Success but < 3 steps, OR steps have very short text, AND we have a transcript
    const steps = result1.recipe?.steps || [];
    const needsRefinement = transcript && (steps.length < 3 || steps.some(s => s.instruction.length < 10));

    if (needsRefinement) {
        console.log('[Gemini] Starting Pass 2: Step Refinement (Steps found: ' + steps.length + ')');
        const prompt2 = createStepRefinementPrompt(metadata, transcript, result1.recipe);
        const result2 = await callGemini(prompt2);

        if (result2.success && result2.recipe?.steps && result2.recipe.steps.length > steps.length) {
             console.log('[Gemini] Pass 2 successful. Improved steps from ' + steps.length + ' to ' + result2.recipe.steps.length);
             // Merge ingredients from Pass 1 (usually better) with Steps from Pass 2
             result1.recipe.steps = result2.recipe.steps;
        } else {
             console.log('[Gemini] Pass 2 did not improve results. Keeping Pass 1.');
        }
    }

    return {
        ...result1,
        extraction_layer: transcript ? 'transcript' : 'metadata',
    };
}

async function callGemini(prompt: string): Promise<any> {
    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API error: ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!text) return { success: false, confidence: 0, error: 'No response from AI' };
        return parseGeminiResponse(text);
    } catch (error) {
        console.error('Gemini API error:', error);

        // Debug: Try to list models if API call fails
        try {
            const listModelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
            const listResp = await fetch(listModelsUrl);
            if (listResp.ok) {
                const listData = await listResp.json();
                console.log('Available Gemini Models:', JSON.stringify(listData));
            } else {
                console.log('Failed to list models:', await listResp.text());
            }
        } catch (e) {}

        return { success: false, confidence: 0, error: (error as Error).message };
    }
}

function createStepRefinementPrompt(metadata: VideoMetadata, transcript: string | null, partialRecipe: any): string {
    return `You are a cooking expert. I have a recipe for "${metadata.title}" but I missed the specific cooking steps.
    
    Here is the transcript/text:
    ${transcript ? transcript.substring(0, 15000) : ''}

    Here are the ingredients we found:
    ${JSON.stringify(partialRecipe.ingredients)}

    TASK:
    1. Read the transcript rigorously.
    2. Extract a detailed, step-by-step cooking method.
    3. Break down narrative paragraphs into single actions.
    4. Return ONLY the "steps" array in JSON format.

    JSON Structure:
    {
        "success": true,
        "confidence": 0.9,
        "recipe": {
            "steps": [
                {"step_number": 1, "instruction": "...", "section_title": "..."}
            ]
        }
    }
    `;
}

function createMetadataPrompt(metadata: VideoMetadata, transcript: string | null): string {
    return `You are a recipe extraction AI. Analyze the following video metadata and transcript to extract a structured recipe.

IMPORTANT CONTEXT:
- The "Transcript" provided below might be a video transcript OR content scraped from an external recipe link found in the description.
- If the content is from an external link, it likely contains the full recipe.
- If the content is a transcript, it might be messy or conversational.

Video Platform: ${metadata.platform}
Title: ${metadata.title || 'N/A'}
Description: ${metadata.description || 'N/A'}
Creator: ${metadata.creator || 'N/A'}
Caption: ${metadata.caption || 'N/A'}
Hashtags: ${metadata.hashtags.join(', ') || 'N/A'}

${transcript ? `CONTENT SOURCE (Transcript or External Page):\n${transcript.substring(0, 25000)}...` : 'Content Source: Not available'}

Your task:
1. Determine if this constitutes a recipe (confidence 0-1).
2. Extract the recipe details into JSON.

CRITICAL INSTRUCTIONS FOR STEPS:
- **YOU MUST EXTRACT STEPS.**
- **BREAK DOWN NARRATIVE TEXT**: The transcript is likely a continuous monologue. You MUST split this into distinct, granular steps.
- **DO NOT create a single huge step.** A typical recipe has 5-15 steps. If you have fewer than 4 steps for a main dish, you are likely under-segmenting.
- **Action-based Splitting**: Start a new step for each distinct action (e.g. "Chop", "Mix", "Sauté", "Bake").
- Example: "I'm gonna chop the onions and then throw them in the pan." -> Step 1: "Chop the onions." Step 2: "Add onions to the pan."
- If explicit steps are missing but the process is described, INFER the steps from the narrative.
- If the content is an external page, look for "Preparation", "Instructions", or "Directions".
- **NEVER return an empty steps array if confident it is a recipe.**
- If you have ingredients but no clear steps, infer generic steps based on the ingredients (e.g., "Mix ingredients", "Cook until done") BUT mark confidence lower (0.6).

CRITICAL INSTRUCTIONS FOR TITLE:
- **PREFER THE ORIGINAL VIDEO TITLE** ("${metadata.title}") if it clearly describes the dish.
- Only rename if the original title is clickbait, all-caps, or doesn't name the food (e.g. "You won't believe this!").
- Example: If Video Title is "BEST Smash Burger Ever!", Recipe Title should be "Smash Burger" or "Best Smash Burger".

Return a JSON object with this structure:
{
    "success": true/false,
    "confidence": 0.0-1.0,
    "recipe": {
        "title": "EXACT VIDEO TITLE",
        "description": "Brief description (MAX 30 WORDS)",
        "servings": number or null,
        "prep_time_minutes": number or null,
        "cook_time_minutes": number or null,
        "is_vegetarian": true/false/null,
        "ingredients": [
            {"name": "ingredient", "quantity": "amount", "unit": "unit"}
        ],
        "steps": [
            {"step_number": 1, "instruction": "Step text", "section_title": "Prep"}
        ]
    }
}

CRITICAL RULES FOR TITLE:
- **USE THE ORIGINAL VIDEO TITLE "${metadata.title}" EXACTLY.**
- Do NOT rewrite, summarize, or "clean up" the title.
- ONLY change it if the original is purely clickbait (e.g. "I made this!" with no food name).

CRITICAL RULES FOR STRUCTURE:
- **GROUP STEPS INTO SECTIONS.** (e.g. "Preparation", "Sauce", "Cooking", "Assembly").
- **NEVER** return a flat list of steps. Always use \`section_title\`.
- **EXTRACT STEPS** from narrative text if needed.

CRITICAL RULES FOR QUANTITIES:
- **CROSS-REFERENCE**: usage in steps must match the ingredient list.
- If step says "Add 2 cups flour", ingredient MUST be "Flour", quantity: 2, unit: "cups".
- **DO NOT** default to "1" or null if the quantity is mentioned in the text.
- If quantity is missing in ingredients list but found in steps, USE THE QUANTITY FROM STEPS.

RULES:
- Output strictly valid JSON.
- Escape strings properly.
- No trailing commas.
- Return ONLY the JSON.`;
}

/**
 * Parse Gemini's JSON response with error recovery
 */
function parseGeminiResponse(text: string): any {
    try {
        // 1. Clean markdown and whitespace
        let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();

        // 2. Find start of JSON structure
        const firstOpenBrace = clean.indexOf('{');
        const firstOpenBracket = clean.indexOf('[');

        let start = -1;
        let isArray = false;

        if (firstOpenBracket !== -1 && (firstOpenBrace === -1 || firstOpenBracket < firstOpenBrace)) {
            start = firstOpenBracket;
            isArray = true;
        } else if (firstOpenBrace !== -1) {
            start = firstOpenBrace;
        }

        if (start !== -1) {
            let depth = 0;
            const openChar = isArray ? '[' : '{';
            const closeChar = isArray ? ']' : '}';
            let end = -1;
            
            for (let i = start; i < clean.length; i++) {
                const char = clean[i];
                if (char === openChar) depth++;
                else if (char === closeChar) depth--;
                
                if (depth === 0) {
                    end = i;
                    break;
                }
            }
            
            if (end !== -1) {
                clean = clean.substring(start, end + 1);
            }
        }

        const parsed = JSON.parse(clean);
        const result = Array.isArray(parsed) ? parsed[0] : parsed;
        return validateAndReturn(result);

    } catch (parseError) {
        console.error('Strict parsing failed:', parseError);
        
        try {
            const match = text.match(/\{[\s\S]*\}/);
            if (match) {
                const result = JSON.parse(match[0]);
                return validateAndReturn(result);
            }
        } catch (e) {
            // Ignore
        }
        throw parseError;
    }
}

function validateAndReturn(parsed: any): Omit<RecipeExtraction, 'extraction_layer'> {
    if (typeof parsed.success !== 'boolean' || typeof parsed.confidence !== 'number') {
        throw new Error('Invalid response structure: missing success or confidence');
    }
    return parsed;
}
