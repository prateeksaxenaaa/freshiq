export interface WebMetadata {
    url: string;
    domain: string;
    title?: string;
    description?: string;
    siteName?: string;
    thumbnailUrl?: string; // OG Image
}

/**
 * Fetch HTML content from a URL
 * Includes simple User-Agent rotation and basic scraping
 */
export async function fetchWebPage(url: string): Promise<{ html: string; metadata: WebMetadata } | null> {
    try {
        const response = await fetch(url, {
            headers: {
                // Mimic a real browser
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
        });

        if (!response.ok) {
            console.error(`Web Fetch failed: ${response.status} ${response.statusText}`);
            return null;
        }

        const html = await response.text();
        const metadata = extractMetadata(html, url);

        return { html, metadata };
    } catch (error) {
        console.error('Web Fetch error:', error);
        return null;
    }
}

/**
 * Simple regex-based metadata extraction (og:tags, title, description)
 */
function extractMetadata(html: string, url: string): WebMetadata {
    const domain = new URL(url).hostname;
    
    // Helper to extract content from meta tags
    const getMeta = (property: string): string | undefined => {
        // Regex to find content associated with property or name
        // <meta property="og:title" content="..."> or <meta name="description" content="...">
        const regex = new RegExp(`<meta\\s+(?:property|name)=["'](?:og:)?${property}["']\\s+content=["']([^"']*)["']`, 'i');
        const match = html.match(regex);
        return match ? match[1] : undefined;
    };

    // Title fallback hierarchy
    const title = getMeta('title') || html.match(/<title>([^<]*)<\/title>/i)?.[1] || 'Web Recipe';
    const description = getMeta('description') || undefined;
    const siteName = getMeta('site_name') || domain;
    const image = getMeta('image') || undefined;

    return {
        url,
        domain,
        title: decodeHtmlEntities(title),
        description: description ? decodeHtmlEntities(description) : undefined,
        siteName: decodeHtmlEntities(siteName),
        thumbnailUrl: image, 
    };
}

function decodeHtmlEntities(text: string): string {
    return text.replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}
