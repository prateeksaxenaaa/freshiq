
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useHousehold } from '../contexts/HouseholdProvider';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

// Extending type manually until Database definitions are regenerated
export type InventoryItem = Database['public']['Tables']['inventory_items']['Row'] & {
    storage_id?: string | null;
    storage_locations?: { name: string } | null; 
    status?: string | null; // Added status field
};

export const useInventory = () => {
    const { household } = useHousehold();

    return useQuery({
        queryKey: ['inventory', household?.id],
        queryFn: async () => {
            if (!household?.id) return [];

            const { data, error } = await supabase
                .from('inventory_items')
                .select('*, storage_locations!inventory_items_storage_id_fkey(name)') 
                .eq('household_id', household.id)
                // Filter out consumed items (show only active or NULL for legacy)
                .or('status.eq.active,status.is.null')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching inventory:", error);
                throw error;
            }
            return data as InventoryItem[];
        },
        enabled: !!household?.id,
    });
};

export const useStorageLocations = () => {
    const { household } = useHousehold();
    
    return useQuery({
        queryKey: ['storage_locations', household?.id],
        queryFn: async () => {
            if (!household?.id) return [];
            const { data, error } = await supabase
                .from('storage_locations')
                .select('*')
                .eq('household_id', household.id);
            if (error) throw error;
            return data;
        },
        enabled: !!household?.id
    });
};

export const useCreateInventoryItem = () => {
    const queryClient = useQueryClient();
    const { household } = useHousehold();

    return useMutation({
        mutationFn: async (item: Partial<InventoryItem>) => {
            if (!household?.id) throw new Error("No household found");
            
            const newItem = {
                ...item,
                household_id: household.id,
                status: 'active' // Default status
            };

            const { data, error } = await supabase
                .from('inventory_items')
                .insert(newItem)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory', household?.id] });
        },
    });
};

export const useUpdateInventoryItem = () => {
    const queryClient = useQueryClient();
    const { household } = useHousehold();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<InventoryItem> }) => {
            const { data, error } = await supabase
                .from('inventory_items')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory', household?.id] });
        },
    });
};

export const useDeleteInventoryItem = () => {
    const queryClient = useQueryClient();
    const { household } = useHousehold();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('inventory_items')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory', household?.id] });
        },
    });
};
