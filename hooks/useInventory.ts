
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useHousehold } from '../contexts/HouseholdProvider';
import { supabase } from '../lib/supabase';

// Simplified type to avoid missing Database export issue
export type InventoryItem = {
    id: string;
    household_id: string;
    name: string;
    quantity?: number;
    unit?: string;
    storage_id?: string | null;
    status?: string | null;
    created_at?: string;
    storage_locations?: { name: string } | null;
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

export const useCreateStorageLocation = () => {
    const queryClient = useQueryClient();
    const { household } = useHousehold();

    return useMutation({
        mutationFn: async ({ name, type }: { name: string; type: 'fridge' | 'freezer' | 'pantry' | 'other' }) => {
            if (!household?.id) throw new Error("No household found");

            const { data, error } = await supabase
                .from('storage_locations')
                .insert({
                    household_id: household.id,
                    name,
                    type,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['storage_locations', household?.id] });
        },
    });
};

export const useDeleteStorageLocation = () => {
    const queryClient = useQueryClient();
    const { household } = useHousehold();

    return useMutation({
        mutationFn: async (id: string) => {
            if (!household?.id) throw new Error("No household found");

            // Delete storage location - RLS should handle permissions
            const { error } = await supabase
                .from('storage_locations')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['storage_locations', household?.id] });
            // Also invalidate inventory as items might have been deleted (or we should handle orphans)
            queryClient.invalidateQueries({ queryKey: ['inventory', household?.id] });
        },
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
