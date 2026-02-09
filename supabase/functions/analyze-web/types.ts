// Types for web analysis
// Cloned from analyze-video to maintain independence
export interface WebMetadata {
    url: string;
    domain: string;
    title?: string;
    description?: string;
    siteName?: string;
    thumbnailUrl?: string; // OG Image
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
            section_title?: string; // "Preparation", "Sauce", etc.
        }>;
    };
    error?: string;
    extraction_layer: 'web_scraping'; // Static for this function
}

export interface AnalyzeWebRequest {
    web_url: string;
    import_id: string;
    user_id: string;
}

export interface AnalyzeWebResponse {
    success: boolean;
    import_id: string;
    extraction?: RecipeExtraction;
    error?: string;
    insertion_debug?: any;
}
