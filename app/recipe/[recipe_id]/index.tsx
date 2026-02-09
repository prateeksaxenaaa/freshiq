import { IngredientsSection } from '@/components/recipe/IngredientsSection';
import { NutritionSection } from '@/components/recipe/NutritionSection';
import { RecipeHeader } from '@/components/recipe/RecipeHeader';
import { ServingsControl } from '@/components/recipe/ServingsControl';
import { StepsSection } from '@/components/recipe/StepsSection';
import Colors from '@/constants/Colors';
import { useMoveRecipeToCookbook, useRecipeCookbooks } from '@/hooks/useCookbooks';
import { useDeleteRecipe, useRecipe } from '@/hooks/useRecipeDetail';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useColorScheme,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RecipeDetailScreen() {
    const { recipe_id } = useLocalSearchParams<{ recipe_id: string }>();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    const { data, isLoading, error } = useRecipe(recipe_id);
    const deleteRecipe = useDeleteRecipe();
    // Cookbook state for Save Button
    const { data: recipeCookbooks } = useRecipeCookbooks(recipe_id);
    const currentCookbookId = recipeCookbooks && recipeCookbooks.length > 0 ? recipeCookbooks[0].id : null;
    const moveRecipeToCookbook = useMoveRecipeToCookbook();

    const [localServings, setLocalServings] = useState<number | null>(null);

    // Sync local servings with recipe servings on load
    useEffect(() => {
        if (data?.recipe?.servings) {
            setLocalServings(data.recipe.servings);
        }
    }, [data?.recipe?.servings]);

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.neutral }]}>Loading recipe...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error || !data) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color={colors.destructive} />
                    <Text style={[styles.errorText, { color: colors.text }]}>Failed to load recipe</Text>
                    <Pressable
                        style={[styles.retryButton, { backgroundColor: colors.primary }]}
                        onPress={() => router.back()} // Or refetch
                    >
                        <Text style={styles.retryButtonText}>Go Back</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    const { recipe, ingredients, steps } = data;
    const currentServings = localServings || recipe.servings || 4;
    const baseServings = recipe.servings || 4;

    // Calculate scaled ingredients for display
    const scaledIngredients = ingredients.map(ing => {
        if (!ing.quantity) return ing;
        if (currentServings === baseServings) return ing;

        const ratio = currentServings / baseServings;
        return {
            ...ing,
            quantity: ing.quantity * ratio,
        };
    });

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
            <Stack.Screen
                options={{
                    headerTitle: '', // Title shown in body
                    headerBackTitleVisible: false,
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                    headerRight: () => (
                        <Pressable
                            onPress={() => router.push(`/recipe/${recipe_id}/edit`)}
                            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, padding: 8 })}
                        >
                            <MaterialCommunityIcons name="pencil" size={24} color={colors.primary} />
                        </Pressable>
                    ),
                }}
            />
            <ScrollView showsVerticalScrollIndicator={false}>
                <RecipeHeader recipeId={recipe_id} recipe={recipe} editable={false} />

                {recipe.servings && (
                    <ServingsControl
                        recipeId={recipe_id}
                        servings={currentServings}
                        ingredients={ingredients}
                        onUpdate={setLocalServings} // Use ephemeral update
                    />
                )}

                <IngredientsSection recipeId={recipe_id} ingredients={scaledIngredients} editable={false} />

                <StepsSection recipeId={recipe_id} steps={steps} editable={false} />

                <NutritionSection recipeId={recipe_id} recipe={recipe} />

                <View style={{ height: 20 }} />

                {/* Management Buttons */}
                <View style={styles.managementButtons}>
                    <Pressable
                        style={[
                            styles.manageButton,
                            {
                                backgroundColor: currentCookbookId ? colors.primary : colors.surface,
                                borderColor: currentCookbookId ? colors.primary : (colors.border || '#eee'),
                                borderWidth: 1,
                                opacity: currentCookbookId ? 1 : 0.5
                            }
                        ]}
                        disabled={!currentCookbookId}
                        onPress={() => {
                            if (currentCookbookId) {
                                // Just a confirmation act since it's already "moved" via the dropdown
                                Alert.alert("Saved", "Recipe saved to cookbook successfully!", [
                                    { text: "OK", onPress: () => router.replace('/(tabs)/home') }
                                ]);
                            }
                        }}
                    >
                        <Ionicons name="save-outline" size={20} color={currentCookbookId ? 'white' : colors.text} />
                        <Text style={[styles.manageButtonText, { color: currentCookbookId ? 'white' : colors.text }]}>Save Recipe</Text>
                    </Pressable>

                    <Pressable
                        style={[styles.manageButton, { backgroundColor: '#FFEDED', borderColor: '#FFCDCD', borderWidth: 1, marginTop: 12 }]}
                        onPress={() => {
                            Alert.alert(
                                "Delete Recipe",
                                "Are you sure you want to delete this recipe?",
                                [
                                    { text: "Cancel", style: "cancel" },
                                    {
                                        text: "Delete",
                                        style: "destructive",
                                        onPress: () => {
                                            // Handle delete
                                            deleteRecipe.mutate(recipe_id, {
                                                onSuccess: () => {
                                                    router.replace('/(tabs)/home'); // Fixed path
                                                }
                                            });
                                        }
                                    }
                                ]
                            );
                        }}
                    >
                        <Ionicons name="trash-outline" size={20} color={colors.destructive} />
                        <Text style={[styles.manageButtonText, { color: colors.destructive }]}>Delete Recipe</Text>
                    </Pressable>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 24,
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    managementButtons: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    manageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 0,
    },
    manageButtonText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});
