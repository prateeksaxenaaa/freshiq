import { IngredientsSection } from '@/components/recipe/IngredientsSection';
import { RecipeHeader } from '@/components/recipe/RecipeHeader';
import { StepsSection } from '@/components/recipe/StepsSection';
import Colors from '@/constants/Colors';
import { useDeleteRecipe, useRecipe } from '@/hooks/useRecipeDetail';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
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

export default function RecipeEditScreen() {
    const { recipe_id } = useLocalSearchParams<{ recipe_id: string }>();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    const { data, isLoading, error } = useRecipe(recipe_id);
    const deleteRecipe = useDeleteRecipe();

    const handleDelete = () => {
        Alert.alert(
            'Delete Recipe',
            'Are you sure you want to delete this recipe? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteRecipe.mutateAsync(recipe_id);
                            router.replace('/(tabs)/home'); // Navigate to home after delete
                        } catch (e) {
                            Alert.alert('Error', 'Failed to delete recipe');
                        }
                    },
                },
            ]
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    if (error || !data) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <Text>Error loading recipe</Text>
            </SafeAreaView>
        );
    }

    const { recipe, ingredients, steps } = data;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
            <Stack.Screen
                options={{
                    headerTitle: 'Edit Recipe',
                    headerBackTitleVisible: false,
                    headerShadowVisible: true,
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                    headerRight: () => (
                        <Pressable
                            onPress={() => router.back()}
                            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, padding: 8 })}
                        >
                            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>Done</Text>
                        </Pressable>
                    ),
                }}
            />
            <ScrollView showsVerticalScrollIndicator={false}>
                <RecipeHeader recipeId={recipe_id} recipe={recipe} editable={true} />

                {/* No ServingsControl in Edit Mode needed unless user wants to update default servants? */}
                {/* Assuming ingredients editing is for BASE recipe, so no need for servings scaling here */}

                <IngredientsSection recipeId={recipe_id} ingredients={ingredients} editable={true} />

                <StepsSection recipeId={recipe_id} steps={steps} editable={true} />

                <View style={styles.actions}>
                    <Pressable
                        style={[styles.deleteButton, { backgroundColor: '#FEE2E2' }]} // Light red
                        onPress={handleDelete}
                    >
                        <Ionicons name="trash-outline" size={20} color={colors.destructive} />
                        <Text style={[styles.deleteButtonText, { color: colors.destructive }]}>Delete Recipe</Text>
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
    actions: {
        paddingHorizontal: 16,
        paddingVertical: 20,
        marginTop: 20,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
    },
    deleteButtonText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});
