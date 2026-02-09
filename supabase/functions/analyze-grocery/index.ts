import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { analyzeGroceryImage } from './utils/gemini.ts';

console.log("Analyze Grocery Function Loading...");


Deno.serve(async (req) => {
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
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Server Config Error: Missing SUPABASE_URL or SERVICE_ROLE_KEY');
        }

        const { image_path } = await req.json();

        if (!image_path) {
            throw new Error('Missing image_path in request body');
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Download image from storage
        const { data: fileData, error: downloadError } = await supabase.storage
            .from('grocery-images')
            .download(image_path);


        if (downloadError) {
            throw new Error(`Failed to download image: ${downloadError.message}`);
        }

        // Convert to Base64
        const arrayBuffer = await fileData.arrayBuffer();
        const base64 = encodeBase64(arrayBuffer);

        // Analyze with Gemini
        const analysis = await analyzeGroceryImage(base64);

        return new Response(
            JSON.stringify(analysis),
            { 
                status: 200, 
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                } 
            }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { 
                status: 200, // Return 200 to allow client to read the error message
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                } 
            }
        );
    }
});

function encodeBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}
