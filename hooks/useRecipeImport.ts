import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useMutation, useQuery } from '@tanstack/react-query';

export type ImportSource = 'youtube' | 'instagram' | 'tiktok' | 'unknown';

export const useRecipeImport = () => {
    const { session } = useAuth();

    const createImportMutation = useMutation({
        mutationFn: async (url: string) => {
            if (!session?.user) throw new Error('No user logged in');

            let sourceType: ImportSource = 'unknown';
            if (url.includes('youtube.com') || url.includes('youtu.be')) sourceType = 'youtube';
            else if (url.includes('instagram.com')) sourceType = 'instagram';
            else if (url.includes('tiktok.com')) sourceType = 'tiktok';

            // Step 1: Create import record
            const { data, error } = await supabase
                .from('recipe_imports')
                .insert({
                    user_id: session.user.id,
                    source_type: sourceType,
                    status: 'pending',
                    content_payload: url,
                })
                .select()
                .single();

            if (error) throw error;

            // Step 2: Trigger Edge Function to analyze video (Fire and Forget)
            // We do NOT await this so the UI can navigate immediately to the "Analyzing" screen.
            const invokeAnalysis = async () => {
                try {
                    console.log('[useRecipeImport] Invoking Edge Function...');
                    const invocation = await supabase.functions.invoke('analyze-video', {
                        body: {
                            video_url: url,
                            import_id: data.id,
                            user_id: session.user.id,
                        },
                    });

                    console.log('[useRecipeImport] Raw invocation result:', invocation);
                    
                    const { data: functionData, error: functionError } = invocation;

                    if (functionError) {
                        console.error('Edge Function error:', functionError);
                        const errorMsg = functionError.message || functionError.toString() || 'Unknown error from Edge Function';
                        
                        await supabase
                            .from('recipe_imports')
                            .update({ 
                                status: 'failed', 
                                error_message: errorMsg
                            })
                            .eq('id', data.id);
                        return;
                    }

                    // Check if the function returned an error in the response body
                    if (functionData && !functionData.success) {
                        const errorMsg = functionData.error || 'Video analysis failed';
                        console.error('Edge Function returned error:', errorMsg);
                        
                        await supabase
                            .from('recipe_imports')
                            .update({ 
                                status: 'failed', 
                                error_message: errorMsg
                            })
                            .eq('id', data.id);
                    }
                } catch (error) {
                    console.error('Failed to invoke Edge Function:', error);
                    // Update status to failed
                     await supabase
                        .from('recipe_imports')
                        .update({ 
                            status: 'failed', 
                            error_message: 'Failed to start analysis'
                        })
                        .eq('id', data.id);
                }
            };

            // Start analysis in background
            invokeAnalysis();

            return data;
        },
    });

    return {
        createImport: createImportMutation.mutateAsync,
        isCreating: createImportMutation.isPending,
        error: createImportMutation.error,
    };
};

export const usePendingImports = () => {
    const { session } = useAuth();

    return useQuery({
        queryKey: ['pending_imports'],
        queryFn: async () => {
            if (!session?.user) return null;

            const { data, error } = await supabase
                .from('recipe_imports')
                .select('id, status')
                .in('status', ['pending', 'processing'])
                .eq('user_id', session.user.id)
                .maybeSingle();

            if (error) throw error;
            return data;
        },
        enabled: !!session?.user,
        retry: 1,
    });
};

/**
 * Hook to poll import status and navigate when complete
 */
export const useImportStatus = (importId: string) => {
    return useQuery({
        queryKey: ['import_status', importId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('recipe_imports')
                .select('status, recipe_id, error_message, confidence_score')
                .eq('id', importId)
                .single();

            if (error) throw error;
            return data;
        },
        refetchInterval: (query) => {
            const data = query.state.data;
            // Stop polling when completed or failed
            return data?.status === 'completed' || data?.status === 'failed' ? false : 2000;
        },
        enabled: !!importId,
    });
};
