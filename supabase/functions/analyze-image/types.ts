// Types for Image Recipe Analysis

export interface RecipeExtraction {
    success: boolean;
    confidence: number;
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
    extraction_layer: 'image_vision';
}

export interface AnalyzeImageRequest {
    image_base64: string; // The base64-encoded image (no data:image/ prefix)
    mime_type: string;    // e.g. 'image/jpeg'
    import_id: string;
    user_id: string;
}

export interface AnalyzeImageResponse {
    success: boolean;
    import_id: string;
    extraction?: RecipeExtraction;
    error?: string;
}
