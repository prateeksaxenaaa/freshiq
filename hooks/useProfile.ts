import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface Profile {
    id: string;
    email: string;
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    avatar_url: string | null;
}

export const useProfile = () => {
    const { session } = useAuth();
    const queryClient = useQueryClient();

    const profileQuery = useQuery({
        queryKey: ['profile', session?.user?.id],
        queryFn: async () => {
            if (!session?.user?.id) return null;
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (error) throw error;
            return data as Profile;
        },
        enabled: !!session?.user?.id,
    });

    const updateProfileMutation = useMutation({
        mutationFn: async (updates: Partial<Profile>) => {
            if (!session?.user?.id) throw new Error('Not authenticated');
            
            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', session.user.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', session?.user?.id] });
        },
    });

    return {
        profile: profileQuery.data,
        isLoading: profileQuery.isLoading,
        error: profileQuery.error,
        updateProfile: updateProfileMutation.mutateAsync,
        isUpdating: updateProfileMutation.isPending,
    };
};
