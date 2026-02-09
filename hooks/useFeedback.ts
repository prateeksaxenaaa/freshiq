import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface FeatureRequest {
    id: string;
    title: string;
    description: string;
    status: 'open' | 'implementing' | 'implemented';
    upvote_count: number;
    user_has_upvoted: boolean;
    created_at: string;
}

export function useFeedback() {
    const { session } = useAuth();
    const queryClient = useQueryClient();

    const fetchFeatures = async () => {
        const { data, error } = await supabase.rpc('get_features_with_user_vote', {
            p_user_id: session?.user?.id || null
        });

        if (error) {
            console.error('Error fetching features:', error);
            throw error;
        }
        return data as FeatureRequest[];
    };

    const { data: features = [], isLoading, error, refetch } = useQuery({
        queryKey: ['features', session?.user?.id || 'anonymous'],
        queryFn: fetchFeatures,
        staleTime: 0, // Always get fresh data
    });

    const toggleUpvote = useMutation({
        mutationFn: async (featureId: string) => {
            if (!session?.user) throw new Error('Must be logged in to upvote');
            const { data, error } = await supabase.rpc('toggle_feature_upvote', {
                p_feature_id: featureId
            });
            if (error) throw error;
            return data; // returns true for upvoted, false for unvoted
        },
        onMutate: async (featureId) => {
            const queryKey = ['features', session?.user?.id || 'anonymous'];
            await queryClient.cancelQueries({ queryKey });
            const previousFeatures = queryClient.getQueryData<FeatureRequest[]>(queryKey);

            queryClient.setQueryData(queryKey, (old: FeatureRequest[] | undefined) => {
                return old?.map(f => {
                    if (f.id === featureId) {
                        const isNowUpvoted = !f.user_has_upvoted;
                        return {
                            ...f,
                            upvote_count: isNowUpvoted ? f.upvote_count + 1 : Math.max(0, f.upvote_count - 1),
                            user_has_upvoted: isNowUpvoted
                        };
                    }
                    return f;
                });
            });

            return { previousFeatures };
        },
        onError: (err, variables, context) => {
            const queryKey = ['features', session?.user?.id || 'anonymous'];
            queryClient.setQueryData(queryKey, context?.previousFeatures);
            console.error('Toggle error:', err);
        },
        onSettled: () => {
            const queryKey = ['features', session?.user?.id || 'anonymous'];
            queryClient.invalidateQueries({ queryKey });
        }
    });

    return {
        features,
        isLoading,
        error,
        toggleUpvote: (id: string) => toggleUpvote.mutate(id),
        refetch
    };
}
