import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

export interface Subscription {
    id: string;
    tier: string;
    valid_until: string;
    created_at: string;
}

export interface BillingHistory {
    id: string;
    amount: number;
    currency: string;
    status: 'paid' | 'pending' | 'failed' | 'refunded';
    invoice_url: string | null;
    billing_date: string;
}

export const useSubscription = () => {
    const { session } = useAuth();

    const subscriptionQuery = useQuery({
        queryKey: ['subscription', session?.user?.id],
        queryFn: async () => {
            if (!session?.user?.id) return null;
            const { data, error } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', session.user.id)
                .maybeSingle();

            if (error) throw error;
            return data as Subscription;
        },
        enabled: !!session?.user?.id,
    });

    const billingQuery = useQuery({
        queryKey: ['billing-history', session?.user?.id],
        queryFn: async () => {
            if (!session?.user?.id) return [];
            const { data, error } = await supabase
                .from('billing_history')
                .select('*')
                .eq('user_id', session.user.id)
                .order('billing_date', { ascending: false });

            if (error) throw error;
            return data as BillingHistory[];
        },
        enabled: !!session?.user?.id,
    });

    return {
        subscription: subscriptionQuery.data,
        isSubLoading: subscriptionQuery.isLoading,
        billingHistory: billingQuery.data || [],
        isBillingLoading: billingQuery.isLoading,
    };
};
