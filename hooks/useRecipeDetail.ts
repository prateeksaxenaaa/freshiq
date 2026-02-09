import { useAuth } from '@/contexts/AuthProvider';
import { useHousehold } from '@/contexts/HouseholdProvider';
import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Fetch recipe with all related data (ingredients, steps)
 */
export function useRecipe(recipeId: string | null) {
    return useQuery({
        queryKey: ['recipe', recipeId],
        queryFn: async () => {
            if (!recipeId) throw new Error('No recipe ID');

            const { data: recipe, error: recipeError } = await supabase
                .from('recipes')
                .select('*')
                .eq('id', recipeId)
                .single();

            if (recipeError) throw recipeError;

            const { data: ingredients, error: ingredientsError } = await supabase
                .from('recipe_ingredients')
                .select('*')
                .eq('recipe_id', recipeId)
                .order('id');

            if (ingredientsError) throw ingredientsError;

            const { data: steps, error: stepsError } = await supabase
                .from('recipe_steps')
                .select('*')
                .eq('recipe_id', recipeId)
                .order('step_number');

            if (stepsError) throw stepsError;

            return {
                recipe,
                ingredients: ingredients || [],
                steps: steps || [],
            };
        },
        enabled: !!recipeId,
    });
}

/**
 * Create a new recipe (for "Write from scratch" flow)
 * This creates the recipe row BEFORE navigation to Recipe Detail screen
 */
export function useCreateRecipe() {
    const { session } = useAuth();
    const { household } = useHousehold();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { title: string; cookbook_id?: string | null }) => {
            if (!session?.user) throw new Error('No user logged in');

            const { data: newRecipe, error } = await supabase
                .from('recipes')
                .insert({
                    household_id: household?.id || null,
                    title: data.title,
                    servings: 4, // Default servings
                    is_verified: false,
                })
                .select()
                .single();

            if (error) throw error;
            return newRecipe;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recipes'] });
        },
    });
}

/**
 * Update recipe fields (title, servings, cookbook, nutrition, etc.)
 */
export function useUpdateRecipe() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { id: string; updates: any }) => {
            const { data: updated, error } = await supabase
                .from('recipes')
                .update({ ...data.updates, updated_at: new Date().toISOString() })
                .eq('id', data.id)
                .select()
                .single();

            if (error) throw error;
            return updated;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['recipe', variables.id] });
        },
    });
}

/**
 * Update a single ingredient
 */
export function useUpdateIngredient() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { id: string; recipeId: string; updates: any }) => {
            const { data: updated, error } = await supabase
                .from('recipe_ingredients')
                .update(data.updates)
                .eq('id', data.id)
                .select()
                .single();

            if (error) throw error;
            return updated;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['recipe', variables.recipeId] });
        },
    });
}

/**
 * Add a new ingredient to a recipe
 */
export function useAddIngredient() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { recipeId: string; raw_text: string; name?: string; quantity?: number; unit?: string }) => {
            const { data: inserted, error } = await supabase
                .from('recipe_ingredients')
                .insert({
                    recipe_id: data.recipeId,
                    raw_text: data.raw_text,
                    name: data.name || null,
                    quantity: data.quantity || null,
                    unit: data.unit || null,
                })
                .select()
                .single();

            if (error) throw error;
            return inserted;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['recipe', variables.recipeId] });
        },
    });
}

/**
 * Delete an ingredient
 */
export function useDeleteIngredient() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { id: string; recipeId: string }) => {
            const { error } = await supabase
                .from('recipe_ingredients')
                .delete()
                .eq('id', data.id);

            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['recipe', variables.recipeId] });
        },
    });
}

/**
 * Update a single step
 */
export function useUpdateStep() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { id: string; recipeId: string; updates: any }) => {
            const { data: updated, error } = await supabase
                .from('recipe_steps')
                .update(data.updates)
                .eq('id', data.id)
                .select()
                .single();

            if (error) throw error;
            return updated;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['recipe', variables.recipeId] });
        },
    });
}

/**
 * Add a new step to a recipe
 */
export function useAddStep() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { recipeId: string; step_number: number; instruction_text: string; section_label?: string }) => {
            const { data: inserted, error } = await supabase
                .from('recipe_steps')
                .insert({
                    recipe_id: data.recipeId,
                    step_number: data.step_number,
                    instruction_text: data.instruction_text,
                    section_label: data.section_label || null,
                })
                .select()
                .single();

            if (error) throw error;
            return inserted;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['recipe', variables.recipeId] });
        },
    });
}

/**
 * Delete entire recipe (cascades to ingredients and steps)
 */
export function useDeleteRecipe() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (recipeId: string) => {
            const { error } = await supabase
                .from('recipes')
                .delete()
                .eq('id', recipeId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recipes'] });
        },
    });
}

/**
 * Add ingredient to shopping list
 */
export function useAddToShoppingList() {
    const { household } = useHousehold();

    return useMutation({
        mutationFn: async (data: { name: string; quantity?: number; unit?: string }) => {
            if (!household) throw new Error('No household selected');

            const { data: inserted, error } = await supabase
                .from('shopping_list_items')
                .insert({
                    household_id: household.id,
                    name: data.name,
                    quantity: data.quantity || null,
                    unit: data.unit || null,
                    is_purchased: false,
                })
                .select()
                .single();

            if (error) throw error;
            return inserted;
        },
    });
}

/**
 * Recalculate ingredient quantities based on servings change
 */
export function useRecalculateServings() {
    const queryClient = useQueryClient();
    const updateRecipe = useUpdateRecipe();
    const updateIngredient = useUpdateIngredient();

    return useMutation({
        mutationFn: async (data: { recipeId: string; oldServings: number; newServings: number; ingredients: any[] }) => {
            const ratio = data.newServings / data.oldServings;

            // Update recipe servings
            await updateRecipe.mutateAsync({
                id: data.recipeId,
                updates: { servings: data.newServings },
            });

            // Update each ingredient quantity proportionally
            for (const ingredient of data.ingredients) {
                if (ingredient.quantity) {
                    await updateIngredient.mutateAsync({
                        id: ingredient.id,
                        recipeId: data.recipeId,
                        updates: { quantity: ingredient.quantity * ratio },
                    });
                }
            }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['recipe', variables.recipeId] });
        },
    });
}

/**
 * Delete a single step
 */
export function useDeleteStep() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { id: string; recipeId: string }) => {
            const { error } = await supabase
                .from('recipe_steps')
                .delete()
                .eq('id', data.id);

            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['recipe', variables.recipeId] });
        },
    });
}
