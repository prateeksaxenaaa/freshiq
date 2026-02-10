import type { RecipeExtraction } from '../types.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Extract recipe from an Image using Gemini Vision
 */
export async function extractRecipeFromImage(
    imageBase64: string,
    mimeType: string,
): Promise<RecipeExtraction> {
    if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not configured');
    }

    console.log('[Gemini] Starting Image Analysis...');
    
    // We send base64 data directly to Gemini in the prompt
    // For large images, we might want to resize first, but let's assume client sends reasonable sizes.
    // Gemini 2.5 Flash supports images inline.

    const prompt = createVisionPrompt();
    const result = await callGeminiVision(prompt, imageBase64, mimeType);
    
    return {
        ...result,
        extraction_layer: 'image_vision',
    };
}

async function callGeminiVision(prompt: string, imageBase64: string, mimeType: string): Promise<any> {
    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: imageBase64
                            }
                        }
                    ]
                }],
                generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
            }),
        });

        const data = await response.json();
        
        // Handle blocked response
        if (data.promptFeedback?.blockReason) {
             console.error('Gemini Blocked:', data.promptFeedback);
             return { success: false, confidence: 0, error: `AI Safety Block: ${data.promptFeedback.blockReason}` };
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!text) return { success: false, confidence: 0, error: 'No response text from AI Vision' };
        return parseGeminiResponse(text);
    } catch (error) {
        console.error('Gemini API Vision error:', error);
        
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
        } catch (e) {
            console.log('Failed to fetch model list:', e);
        }

        return { success: false, confidence: 0, error: (error as Error).message };
    }
}

function createVisionPrompt(): string {
    return `You are a culinary expert AI. Analyze the uploaded image and extract a structured recipe.

The image could be:
1. A photo of a finished dish (e.g. a plate of pasta). -> INFER the likely recipe.
2. A photo of a cookbook page or magazine. -> EXTRACT the text (OCR) and structure it.
3. A photo of handwritten notes. -> DECIPHER and structure it.

Your Task:
1. Identify what the image depicts.
2. If it's a dish, generate a high-quality, plausible recipe for it. Call the title clearly (e.g. "Spaghetti Carbonara").
3. If it's text (cookbook/handwritten), transcribe it accurately into the recipe structure.
4. If it's not food-related at all, return success: false.

Output JSON Structure:
{
    "success": true/false,
    "confidence": 0.0-1.0 (High if text is clearly readable, Medium if inferring from a dish photo),
    "recipe": {
        "title": "Dish Name",
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

Rules:
- Be precise with quantities if visible.
- Infer reasonable steps if only the dish is visible.
- Return ONLY valid JSON.
`;
}

function parseGeminiResponse(text: string): any {
    try {
        let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
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
