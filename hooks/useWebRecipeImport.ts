import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useMutation } from '@tanstack/react-query';

export const useWebRecipeImport = () => {
    const { session } = useAuth();

    const createWebImportMutation = useMutation({
        mutationFn: async (url: string) => {
            if (!session?.user) throw new Error('No user logged in');

            // 1. Create import record (Generic 'unknown' type for now, or assume 'web')
            // The DB constraint might limit 'source_type'. I'll use 'unknown' as safe default if 'web' isn't in DB enum yet.
            // Actually, let's try to assume the table allows text or has 'unknown'.
            const { data, error } = await supabase
                .from('recipe_imports')
                .insert({
                    user_id: session.user.id,
                    source_type: 'unknown', // Using 'unknown' to map to generic web
                    status: 'pending',
                    content_payload: url,
                })
                .select()
                .single();

            if (error) throw error;

            // 2. Trigger analyze-web
            const invokeAnalysis = async () => {
                try {
                    console.log('[useWebRecipeImport] Invoking analyze-web...');
                    const invocation = await supabase.functions.invoke('analyze-web', {
                        body: {
                            web_url: url,
                            import_id: data.id,
                            user_id: session.user.id,
                        },
                    });

                    const { data: funcData, error: funcError } = invocation;
                    
                    if (funcError || (funcData && !funcData.success)) {
                         const msg = funcError?.message || funcData?.error || 'Web analysis failed';
                         console.error('Web Analysis Error:', msg);
                         await supabase.from('recipe_imports').update({ status: 'failed', error_message: msg }).eq('id', data.id);
                    }
                } catch (e) {
                    console.error('Failed to invoke analyze-web:', e);
                    await supabase.from('recipe_imports').update({ status: 'failed', error_message: 'Invocation failed' }).eq('id', data.id);
                }
            };

            invokeAnalysis();
            return data;
        },
    });

    return {
        createWebImport: createWebImportMutation.mutateAsync,
        isCreating: createWebImportMutation.isPending,
    };
};
