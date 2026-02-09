// Platform types for video analysis
export type Platform = 'youtube' | 'instagram' | 'tiktok';

export interface VideoMetadata {
    platform: Platform;
    videoId: string;
    url: string;
    title?: string;
    description?: string;
    hashtags: string[];
    creator?: string;
    caption?: string;
    duration?: number;
    thumbnailUrl?: string;
}

export interface RecipeExtraction {
    success: boolean;
    confidence: number; // 0-1
    recipe?: {
        title: string;
        description?: string;
        servings?: number;
        prep_time_minutes?: number;
        cook_time_minutes?: number;
        is_vegetarian?: boolean;
        ingredients: Array<{
            name: string;
            quantity?: string;
            unit?: string;
        }>;
        steps: Array<{
            step_number: number;
            instruction: string;
            section_title?: string;
        }>;
    };
    error?: string;
    extraction_layer: 'metadata' | 'transcript' | 'speech-to-text';
}

export interface AnalyzeVideoRequest {
    video_url: string;
    import_id:string | string;
    user_id: string;
}

export interface AnalyzeVideoResponse {
    success: boolean;
    import_id: string;
    extraction?: RecipeExtraction;
    error?: string;
}
