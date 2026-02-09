import { useHousehold } from '@/contexts/HouseholdProvider';
import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';

export interface ShoppingListItem {
    id: string;
    household_id: string;
    name: string;
    quantity: number | null;
    unit: string | null;
    is_purchased: boolean;
    created_at: string;
}

export function useShoppingList() {
    const { household } = useHousehold();
    const queryClient = useQueryClient();

    const { data: items = [], isLoading, error } = useQuery({
        queryKey: ['shopping_list', household?.id],
        queryFn: async () => {
            if (!household) return [];
            const { data, error } = await supabase
                .from('shopping_list_items')
                .select('*')
                .eq('household_id', household.id)
                .order('is_purchased', { ascending: true })
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as ShoppingListItem[];
        },
        enabled: !!household,
    });

    const addItem = useMutation({
        mutationFn: async (item: { name: string; quantity?: number; unit?: string }) => {
            if (!household) throw new Error('No household selected');
            const { data, error } = await supabase
                .from('shopping_list_items')
                .insert({
                    household_id: household.id,
                    name: item.name,
                    quantity: item.quantity || 1,
                    unit: item.unit || null,
                    is_purchased: false,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shopping_list', household?.id] });
        },
        onError: (err: any) => {
            console.error('Add item error:', err);
            Alert.alert('Error', 'Failed to add item: ' + err.message);
        },
    });

    const updateItem = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<ShoppingListItem> }) => {
            const { data, error } = await supabase
                .from('shopping_list_items')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shopping_list', household?.id] });
        },
        onError: (err: any) => {
            Alert.alert('Error', 'Failed to update item: ' + err.message);
        }
    });

    const deleteItem = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('shopping_list_items')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shopping_list', household?.id] });
        },
        onError: (err: any) => {
            Alert.alert('Error', 'Failed to delete item: ' + err.message);
        }
    });

    const clearList = useMutation({
        mutationFn: async () => {
            if (!household) throw new Error('No household selected');
            const { error } = await supabase
                .from('shopping_list_items')
                .delete()
                .eq('household_id', household.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shopping_list', household?.id] });
        },
        onError: (err: any) => {
            Alert.alert('Error', 'Failed to clear list: ' + err.message);
        }
    });

    return {
        items,
        isLoading,
        error,
        addItem,
        updateItem,
        deleteItem,
        clearList,
    };
}
