import type { Platform, VideoMetadata } from '../types.ts';

/**
 * Detect platform from video URL
 */
export function detectPlatform(url: string): Platform | null {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        return 'youtube';
    }
    if (url.includes('instagram.com')) {
        return 'instagram';
    }
    if (url.includes('tiktok.com')) {
        return 'tiktok';
    }
    return null;
}

/**
 * Extract YouTube video ID from various URL formats
 */
function extractYouTubeId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/,
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

/**
 * Extract Instagram Reel ID
 */
function extractInstagramId(url: string): string | null {
    const match = url.match(/instagram\.com\/reel\/([^\/\?]+)/);
    return match ? match[1] : null;
}

/**
 * Extract TikTok video ID
 */
function extractTikTokId(url: string): string | null {
    const match = url.match(/tiktok\.com\/@[^\/]+\/video\/(\d+)/);
    return match ? match[1] : null;
}

/**
 * Extract video ID from URL based on platform
 */
export function extractVideoId(url: string, platform: Platform): string | null {
    switch (platform) {
        case 'youtube':
            return extractYouTubeId(url);
        case 'instagram':
            return extractInstagramId(url);
        case 'tiktok':
            return extractTikTokId(url);
        default:
            return null;
    }
}

/**
 * Fetch YouTube video metadata using YouTube Data API v3
 */
export async function fetchYouTubeMetadata(videoId: string): Promise<VideoMetadata> {
    const apiKey = Deno.env.get('YOUTUBE_API_KEY');
    if (!apiKey) {
        throw new Error('YOUTUBE_API_KEY not configured');
    }

    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`YouTube API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
        throw new Error('Video not found or is private');
    }

    const snippet = data.items[0].snippet;
    const thumbnails = snippet.thumbnails || {};
    const bestThumbnail = thumbnails.maxres?.url || thumbnails.standard?.url || thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url;
    
    return {
        platform: 'youtube',
        videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        title: snippet.title,
        description: snippet.description,
        hashtags: extractHashtags(snippet.description || ''),
        creator: snippet.channelTitle,
        thumbnailUrl: bestThumbnail,
    };
}

/**
 * Fetch Instagram Reel metadata
 * Note: Instagram Graph API requires app review and access tokens
 * For MVP, we'll use a simpler approach (oEmbed or scraping fallback)
 */
export async function fetchInstagramMetadata(videoId: string): Promise<VideoMetadata> {
    const url = `https://www.instagram.com/reel/${videoId}/`;
    const accessToken = Deno.env.get('INSTAGRAM_ACCESS_TOKEN');

    // 1. Try Official API if token exists
    if (accessToken) {
        try {
            const oembedUrl = `https://graph.facebook.com/v12.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${accessToken}`;
            const response = await fetch(oembedUrl);
            if (response.ok) {
                const data = await response.json();
                return {
                    platform: 'instagram',
                    videoId,
                    url,
                    title: data.title || 'Instagram Reel',
                    caption: data.title, // oEmbed title often contains the caption
                    hashtags: extractHashtags(data.title || ''),
                    creator: data.author_name,
                    thumbnailUrl: data.thumbnail_url,
                };
            }
        } catch (e) {
            console.warn('Instagram API failed, trying fallback:', e);
        }
    }

    // 2. Fallback: Scrape OD Metadata (Best effort without API Key)
    try {
        console.log('Scraping Instagram page:', url);
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        });

        if (response.ok) {
            const html = await response.text();
            
            // Extract og:description
            // Format is usually: "Count Likes, Count Comments - Creator (@handle) on Instagram: "The Caption Text...""
            const ogDescMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i);
            const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/i); // Add og:image scraping
            const titleMatch = html.match(/<title>([^<]*)<\/title>/i);

            if (ogDescMatch) {
                let caption = ogDescMatch[1];
                // Clean up the "Likes, Comments - Creator on Instagram:" prefix if present
                const captionStartCoords = caption.indexOf(': "');
                if (captionStartCoords !== -1) {
                     caption = caption.substring(captionStartCoords + 3);
                     if (caption.endsWith('"')) caption = caption.substring(0, caption.length - 1);
                }

                console.log('Scraped Instagram caption:', caption.substring(0, 50) + '...');

                return {
                    platform: 'instagram',
                    videoId,
                    url,
                    title: titleMatch ? titleMatch[1] : 'Instagram Reel',
                    caption: caption,
                    description: caption, // AI uses this
                    hashtags: extractHashtags(caption),
                    creator: 'Unknown',
                    thumbnailUrl: ogImageMatch ? ogImageMatch[1] : undefined,
                };
            }
        }
    } catch (scrapeError) {
        console.warn('Instagram scraping failed:', scrapeError);
    }

    // 3. Ultimate Fallback (Empty)
    return {
        platform: 'instagram',
        videoId,
        url,
        title: 'Instagram Reel',
        hashtags: [],
    };
}

/**
 * Fetch TikTok video metadata
 * Note: TikTok API access is restricted
 * For MVP, we'll use a fallback approach
 */
export async function fetchTikTokMetadata(videoId: string): Promise<VideoMetadata> {
    // TikTok oEmbed API (public)
    const url = `https://www.tiktok.com/oembed?url=https://www.tiktok.com/@user/video/${videoId}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`TikTok API error: ${response.statusText}`);
        }

        const data = await response.json();
        
        return {
            platform: 'tiktok',
            videoId,
            url: `https://www.tiktok.com/@user/video/${videoId}`,
            title: data.title || 'TikTok Video',
            caption: data.title,
            hashtags: extractHashtags(data.title || ''),
            creator: data.author_name,
            thumbnailUrl: data.thumbnail_url, // TikTok oEmbed has thumbnail_url
        };
    } catch (error) {
        console.warn('TikTok API failed, using fallback:', error);
        return {
            platform: 'tiktok',
            videoId,
            url: `https://www.tiktok.com/@user/video/${videoId}`,
            title: 'TikTok Video',
            hashtags: [],
        };
    }
}

/**
 * Extract hashtags from text
 */
function extractHashtags(text: string): string[] {
    const matches = text.match(/#[\w]+/g);
    return matches ? matches.map(tag => tag.substring(1)) : [];
}
