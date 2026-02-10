import { useHousehold } from '@/contexts/HouseholdProvider';
import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Fetch all cookbooks for the current household
 */
export function useCookbooks() {
    const { household } = useHousehold();

    return useQuery({
        queryKey: ['cookbooks', household?.id],
        queryFn: async () => {
            if (!household) return [];

            const { data, error } = await supabase
                .from('cookbooks')
                .select('*')
                .eq('household_id', household.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        enabled: !!household,
    });
}

/**
 * Create a new cookbook
 */
export function useCreateCookbook() {
    const { household } = useHousehold();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { name: string; description?: string }) => {
            console.log('Creating cookbook with household_id:', household?.id);
            if (!household?.id) {
                throw new Error('No household ID available via useHousehold()');
            }

            const { data: newCookbook, error } = await supabase
                .from('cookbooks')
                .insert({
                    household_id: household?.id || null,
                    name: data.name,
                    description: data.description || null,
                })
                .select()
                .single();

            if (error) throw error;
            return newCookbook;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cookbooks'] });
        },
    });
}

/**
 * Add a recipe to a cookbook (creates junction table entry)
 */
export function useAddRecipeToCookbook() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { recipeId: string; cookbookId: string }) => {
            const { error } = await supabase
                .from('recipe_cookbooks')
                .upsert({
                    recipe_id: data.recipeId,
                    cookbook_id: data.cookbookId,
                }, { onConflict: 'recipe_id,cookbook_id', ignoreDuplicates: true });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cookbooks'] });
            queryClient.invalidateQueries({ queryKey: ['recipes'] });
            queryClient.invalidateQueries({ queryKey: ['uncategorized-recipes'] });
            queryClient.invalidateQueries({ queryKey: ['uncategorized-recipes-count'] });
            queryClient.invalidateQueries({ queryKey: ['recipe-cookbooks'] });
            queryClient.invalidateQueries({ queryKey: ['cookbook-recipes'] });
        },
    });
}

/**
 * Remove a recipe from a cookbook
 */
export function useRemoveRecipeFromCookbook() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { recipeId: string; cookbookId: string }) => {
            const { error } = await supabase
                .from('recipe_cookbooks')
                .delete()
                .eq('recipe_id', data.recipeId)
                .eq('cookbook_id', data.cookbookId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cookbooks'] });
            queryClient.invalidateQueries({ queryKey: ['recipes'] });
            queryClient.invalidateQueries({ queryKey: ['uncategorized-recipes'] });
            queryClient.invalidateQueries({ queryKey: ['uncategorized-recipes-count'] });
            queryClient.invalidateQueries({ queryKey: ['recipe-cookbooks'] });
            queryClient.invalidateQueries({ queryKey: ['cookbook-recipes'] });
        },
    });
}

/**
 * Move recipe to a different cookbook (or uncategorize)
 * Uses the RPC function 'move_recipe_to_cookbook'
 */
export function useMoveRecipeToCookbook() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { recipeId: string; cookbookId: string | null }) => {
            const { error } = await supabase.rpc('move_recipe_to_cookbook', {
                p_recipe_id: data.recipeId,
                p_cookbook_id: data.cookbookId,
            });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cookbooks'] });
            queryClient.invalidateQueries({ queryKey: ['recipes'] });
            queryClient.invalidateQueries({ queryKey: ['uncategorized-recipes'] });
            queryClient.invalidateQueries({ queryKey: ['uncategorized-recipes-count'] });
            queryClient.invalidateQueries({ queryKey: ['recipe-cookbooks'] });
            queryClient.invalidateQueries({ queryKey: ['cookbook-recipes'] });
        },
    });
}

/**
 * Get all recipes in a specific cookbook
 */
export function useCookbookRecipes(cookbookId: string | null, options: { enabled?: boolean } = {}) {
    return useQuery({
        queryKey: ['cookbook-recipes', cookbookId],
        queryFn: async () => {
            if (!cookbookId) return [];

            const { data, error } = await supabase
                .from('recipe_cookbooks')
                .select('recipe_id, recipes(*, recipe_ingredients(*))')
                .eq('cookbook_id', cookbookId);

            if (error) throw error;
            // @ts-ignore - join type inference
            const recipes = data?.map((item) => item.recipes) || [];
            
            // Sort by created_at desc
            return recipes.sort((a: any, b: any) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
        },
        enabled: (options.enabled ?? true) && !!cookbookId,
    });
}

/**
 * Get all cookbooks a recipe belongs to
 */
export function useRecipeCookbooks(recipeId: string | null) {
    return useQuery({
        queryKey: ['recipe-cookbooks', recipeId],
        queryFn: async () => {
            if (!recipeId) return [];

            const { data, error } = await supabase
                .from('recipe_cookbooks')
                .select('cookbook_id, cookbooks(*)')
                .eq('recipe_id', recipeId);

            if (error) throw error;
            // @ts-ignore - join type inference
            return data?.map((item) => item.cookbooks) || [];
        },
        enabled: !!recipeId,
    });
}

/**
 * Get count of recipes not in any cookbook (Uncategorized)
 */
export function useUncategorizedRecipesCount() {
    const { household } = useHousehold();

    return useQuery({
        queryKey: ['uncategorized-recipes-count', household?.id],
        queryFn: async () => {
            if (!household) return 0;

            // Get all recipe IDs in the household
            const { data: allRecipes, error: recipesError } = await supabase
                .from('recipes')
                .select('id')
                .eq('household_id', household.id);

            if (recipesError) throw recipesError;
            if (!allRecipes || allRecipes.length === 0) return 0;

            const recipeIds = allRecipes.map(r => r.id);

            // Get all recipe IDs that ARE in a cookbook
            const { data: categorized, error: junctionError } = await supabase
                .from('recipe_cookbooks')
                .select('recipe_id')
                .in('recipe_id', recipeIds);

            if (junctionError) throw junctionError;

            const categorizedIds = new Set(categorized?.map(c => c.recipe_id));

            // Count difference
            return recipeIds.filter(id => !categorizedIds.has(id)).length;
        },
        enabled: !!household,
    });
}

/**
 * Get list of recipes not in any cookbook
 */
export function useUncategorizedRecipes(options: { enabled?: boolean } = {}) {
    const { household } = useHousehold();

    return useQuery({
        queryKey: ['uncategorized-recipes', household?.id],
        queryFn: async () => {
            if (!household) return [];

            // Get all recipes
            const { data: allRecipes, error: recipesError } = await supabase
                .from('recipes')
                .select('*, recipe_ingredients(*)')
                .eq('household_id', household.id)
                .order('created_at', { ascending: false });

            if (recipesError) throw recipesError;
            if (!allRecipes || allRecipes.length === 0) return [];

            const recipeIds = allRecipes.map(r => r.id);

            // Get categorized IDs
            const { data: categorized, error: junctionError } = await supabase
                .from('recipe_cookbooks')
                .select('recipe_id')
                .in('recipe_id', recipeIds);

            if (junctionError) throw junctionError;

            const categorizedIds = new Set(categorized?.map(c => c.recipe_id));

            // Return full recipe objects that are not in the set
            return allRecipes.filter(r => !categorizedIds.has(r.id));
        },
        enabled: (options.enabled ?? true) && !!household,
    });
}

/**
 * Update a cookbook's details
 */
export function useUpdateCookbook() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { id: string; name?: string; description?: string }) => {
            const { data: updated, error } = await supabase
                .from('cookbooks')
                .update({
                    name: data.name,
                    description: data.description,
                })
                .eq('id', data.id)
                .select()
                .single();

            if (error) throw error;
            return updated;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['cookbooks'] });
            queryClient.invalidateQueries({ queryKey: ['cookbook-recipes', data.id] });
        },
    });
}

/**
 * Delete a cookbook
 */
export function useDeleteCookbook() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('cookbooks')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cookbooks'] });
        },
    });
}
