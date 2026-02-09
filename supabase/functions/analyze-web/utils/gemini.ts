import type { RecipeExtraction, WebMetadata } from '../types.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Extract recipe from HTML or Text using Gemini AI
 * Adapted from video extraction but tuned for web content
 */
export async function extractRecipeFromWeb(
    metadata: WebMetadata,
    htmlContent: string,
): Promise<RecipeExtraction> {
    if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not configured');
    }

    // Limit context window (Gemini Flash can handle lots, but let's be safe and cost effective)
    // 2.5 Flash has 1M token context, so 100k chars is trivial.
    const truncatedContent = htmlContent.substring(0, 150000); 

    console.log('[Gemini] Starting Web Extraction. Context Length:', truncatedContent.length);
    
    const prompt = createWebPrompt(metadata, truncatedContent);
    const result = await callGemini(prompt);
    
    return {
        ...result,
        extraction_layer: 'web_scraping',
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

        const data = await response.json();
        
        // Handle potential blocked response (safety filters)
        if (data.promptFeedback?.blockReason) {
             console.error('Gemini Blocked:', data.promptFeedback);
             return { success: false, confidence: 0, error: `AI Safety Block: ${data.promptFeedback.blockReason}` };
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!text) return { success: false, confidence: 0, error: 'No response text from AI' };
        return parseGeminiResponse(text);
    } catch (error) {
        console.error('Gemini API error:', error);
        return { success: false, confidence: 0, error: (error as Error).message };
    }
}

function createWebPrompt(metadata: WebMetadata, content: string): string {
    return `You are a professional recipe extraction AI. Your task is to extract structured recipe data from the raw HTML content of a webpage.

PAGE CONTEXT:
URL: ${metadata.url}
Title: ${metadata.title || 'N/A'}
Site: ${metadata.siteName || 'N/A'}

RAW HTML CONTENT:
${content}

Your Goal:
1. Identify if this page contains a recipe.
2. If yes, extract it into the specified JSON format.
3. If multiple recipes exist (e.g. "10 Best Dinners"), extract ONLY the main recipe described in the title, or the first full recipe if ambiguous.
4. If it's just a blog post or listicle without full steps/ingredients, return success: false.

Crucial Extraction Rules:
- **Title**: Use the recipe title, NOT the page <title> if it contains SEO junk (e.g. "Best Lasagna Recipe | Easy Dinner | FoodNetwork" -> "Best Lasagna").
- **Ingredients**: Extract Name, Quantity, and Unit. Normalize quantities (e.g. "1 1/2" -> "1.5").
- **Steps**: 
    - MUST be granular. Break paragraphs into single actions.
    - Group into sections if the recipe does (e.g. "For the Sauce", "For the Dough").
    - If no sections, use "Preparation".
    - PRESERVE order exactly.
- **Image**: If the metadata thumbnail is missing or generic, try to find the main recipe image URL in the HTML (look for og:image or high-res img tags inside the recipe container).

Output JSON Structure:
{
    "success": true/false,
    "confidence": 0.0-1.0 (High confidence if ingredients AND steps found),
    "recipe": {
        "title": "Recipe Title",
        "description": "Short description (max 30 words)",
        "servings": number or null,
        "prep_time_minutes": number or null,
        "cook_time_minutes": number or null,
        "is_vegetarian": true/false/null,
        "ingredients": [
            {"name": "ingredient", "quantity": "amount", "unit": "unit"}
        ],
        "steps": [
            {"step_number": 1, "instruction": "Step text", "section_title": "Section Name"}
        ]
    }
}

Return ONLY valid JSON. No markdown.`;
}

/**
 * Parse Gemini's JSON response with error recovery
 * (Cloned from video analysis for consistency)
 */
function parseGeminiResponse(text: string): any {
    try {
        // 1. Clean markdown
        let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();

        // 2. Find JSON bounds
        const start = clean.indexOf('{');
        const end = clean.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
            clean = clean.substring(start, end + 1);
        }

        const parsed = JSON.parse(clean);
        return validateAndReturn(parsed);
    } catch (error) {
        console.error('JSON Parse failed:', error);
        return { success: false, confidence: 0, error: 'Failed to parse AI response' };
    }
}

function validateAndReturn(parsed: any): any {
    if (typeof parsed.success !== 'boolean') {
        parsed.success = false;
        parsed.error = 'Invalid response structure';
    }
    return parsed;
}
