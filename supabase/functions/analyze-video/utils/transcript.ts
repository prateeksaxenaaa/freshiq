
/**
 * Fetches transcript from YouTube video
 * Custom implementation based on youtube-transcript + robust error handling
 */

export async function fetchYouTubeTranscript(videoId: string): Promise<{ text: string | null, error?: string, details?: string }> {
    try {
        console.log(`[Transcript] Fetching page for videoId: ${videoId}`);
        
        // 1. Fetch video page
        // Use a generic User-Agent to avoid bot detection
        const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });

        if (!response.ok) {
            return { text: null, error: `HTTP ${response.status}`, details: response.statusText };
        }

        const html = await response.text();

        // 2. Extract captionTracks
        let captionTracks: any[] | null = null;
        
        // Strategy A: Direct captionTracks regex (Success often relies on this)
        const captionMatch = html.match(/"captionTracks":(\[.*?\])/);
        if (captionMatch) {
            try {
                // Sometimes the JSON is jagged with escaped quotes
                const jsonStr = captionMatch[1].replace(/\\"/g, '"'); 
                captionTracks = JSON.parse(captionMatch[1]);
            } catch (e) {
                console.error('[Transcript] Strategy A JSON parse error', e);
            }
        }

        // Strategy B: ytInitialPlayerResponse (More reliable for modern YouTube)
        if (!captionTracks) {
            // New regex to capture the full object more reliably
            const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/);
            if (playerResponseMatch) {
                try {
                    const playerResponse = JSON.parse(playerResponseMatch[1]);
                    captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
                } catch (e) {
                    console.error('[Transcript] Strategy B JSON parse error', e);
                }
            }
        }

        // Strategy C: Search for "captions": inside the text as a fallback
        if (!captionTracks) {
            const index = html.indexOf('"captions":');
            if (index > -1) {
                // Try to snip a valid JSON chunk around it
                const snippet = html.substring(index, index + 5000); // 5kb window
                const trackMatch = snippet.match(/"captionTracks":\s*(\[.*?\])/);
                if (trackMatch) {
                     try {
                        const jsonStr = trackMatch[1];
                        // Basic cleanup for unescaped quotes if needed
                        captionTracks = JSON.parse(jsonStr);
                    } catch (e) {
                        console.error('[Transcript] Strategy C JSON parse error', e);
                    }
                }
            }
        }
        
        if (!captionTracks) {
             console.log('[Transcript] No captionTracks found in HTML');
             // Log partial HTML for debug? No, too large.
             // Check for consent page or recaptcha
             if (html.includes('consent.youtube.com')) return { text: null, error: 'Consent Page Block', details: 'Bot detection' };
             if (html.includes('g-recaptcha')) return { text: null, error: 'Recaptcha Block', details: 'Bot detection' };
             
             return { text: null, error: 'No captionTracks found', details: 'Regex failed to match captions' };
        }

        // 3. Find suitable track (English)
        const track = captionTracks.find((t: any) => t.languageCode === 'en') 
                   || captionTracks.find((t: any) => t.languageCode.startsWith('en'))
                   || captionTracks[0]; // Fallback to first available

        if (!track || !track.baseUrl) {
            return { text: null, error: 'No valid track URL found' };
        }

        // 4. Fetch transcript XML
        const transcriptUrl = track.baseUrl;
        const transcriptResponse = await fetch(transcriptUrl);
        
        if (!transcriptResponse.ok) {
            return { text: null, error: `Transcript XML HTTP ${transcriptResponse.status}` };
        }
        
        const transcriptXml = await transcriptResponse.text();

        // 5. Parse XML to text
        // Simple regex to extract text content
        const textMatches = transcriptXml.matchAll(/<text[^>]*>(.*?)<\/text>/g);
        const lines = Array.from(textMatches).map(m => decodeHTMLEntities(m[1]));
        
        const fullText = lines.join(' ').replace(/\s+/g, ' ').trim();
        
        if (fullText.length < 50) {
             return { text: null, error: 'Transcript too short or empty' };
        }

        return { text: fullText };

    } catch (error) {
        console.error('[Transcript] Unknown Error:', error);
        return { text: null, error: 'Exception', details: String(error) };
    }
}

function decodeHTMLEntities(text: string): string {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, "/");
}
