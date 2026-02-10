
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export async function analyzeGroceryImage(base64: string) {
    if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not configured');
    }

    const prompt = `
    Analyze this image and identify all grocery items present.
    For each item, determine:
    1. Name (specific, e.g. "Gala Apples" instead of "Apples")
    2. Quantity (estimate count or volume)
    3. Unit (e.g. pcs, kg, g, l, ml, oz, lb, pack)
    4. Storage Type (Fridge, Freezer, or Pantry - based on item type and common storage)
    5. Freshness Status (Good, Expiring, or Expired - based on visual cues like browning, mold, or packaging date if visible)
    
    Return a strictly valid JSON object with the following structure:
    {
        "items": [
            {
                "name": "string",
                "quantity": number,
                "unit": "string",
                "storage_type": "string",
                "freshness_status": "string",
                "confidence": number (0.0 to 1.0)
            }
        ]
    }
    
    If confidence is low (< 0.5) for an item, exclude it or mark confidence low.
    Return ONLY JSON.
    `;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: "image/jpeg", data: base64 } }
                    ]
                }],
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.1
                }
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Gemini API error: ${response.statusText} - ${error}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('No response from AI');
        }

        return JSON.parse(text);

    } catch (error) {
        console.error("Gemini Analysis Error:", error);

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

        throw error;
    }
}
