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
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useColorScheme,
    View
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
    const initialCookbookId = (recipeCookbooks as any && (recipeCookbooks as any).length > 0) ? (recipeCookbooks as any)[0].id : null;

    const [selectedCookbookId, setSelectedCookbookId] = useState<string | null>(null);
    const [hasCookbookChanged, setHasCookbookChanged] = useState(false);
    const moveRecipeToCookbook = useMoveRecipeToCookbook();

    const [localServings, setLocalServings] = useState<number | null>(null);

    // Sync state with data
    useEffect(() => {
        if (data?.recipe?.servings) {
            setLocalServings(data.recipe.servings);
        }
        if (initialCookbookId !== undefined) {
            setSelectedCookbookId(initialCookbookId);
        }
    }, [data?.recipe?.servings, initialCookbookId]);

    const handleCookbookChange = (id: string | null) => {
        setSelectedCookbookId(id);
        setHasCookbookChanged(id !== initialCookbookId);
    };

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
            <StatusBar style="auto" />
            <Stack.Screen
                options={{
                    headerTitle: '',
                    headerBackVisible: false,
                    headerShadowVisible: true,
                    headerStyle: { backgroundColor: colors.background },
                    headerLeft: () => (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: Platform.OS === 'ios' ? -10 : 0 }}>
                            <Pressable
                                onPress={() => router.back()}
                                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, padding: 8 })}
                            >
                                <Ionicons name="arrow-back" size={24} color={colors.text} />
                            </Pressable>
                            <Text style={{
                                fontSize: 18,
                                fontWeight: '800',
                                color: colors.text,
                                marginLeft: -4,
                                width: 220
                            }} numberOfLines={1}>
                                {recipe?.title}
                            </Text>
                        </View>
                    ),
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
                <RecipeHeader
                    recipeId={recipe_id}
                    recipe={recipe}
                    editable={true}
                    onCookbookChange={handleCookbookChange}
                />

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
                                backgroundColor: hasCookbookChanged ? colors.primary : colors.surface,
                                borderColor: hasCookbookChanged ? colors.primary : (colors.border || '#E2E8F0'),
                                borderWidth: 1,
                                opacity: hasCookbookChanged ? 1 : 0.6
                            }
                        ]}
                        disabled={!hasCookbookChanged}
                        onPress={async () => {
                            if (hasCookbookChanged) {
                                try {
                                    await moveRecipeToCookbook.mutateAsync({
                                        recipeId: recipe_id,
                                        cookbookId: selectedCookbookId
                                    });
                                    setHasCookbookChanged(false);
                                    Alert.alert("Success", "Recipe saved to cookbook!");
                                } catch (e) {
                                    Alert.alert("Error", "Failed to save recipe");
                                }
                            }
                        }}
                    >
                        <Ionicons name="save-outline" size={20} color={hasCookbookChanged ? 'white' : colors.neutral} />
                        <Text style={[styles.manageButtonText, { color: hasCookbookChanged ? 'white' : colors.neutral }]}>Save Changes</Text>
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
