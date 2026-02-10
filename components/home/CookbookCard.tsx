import Colors from '@/constants/Colors';
import { useCookbookRecipes, useUncategorizedRecipes } from '@/hooks/useCookbooks';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';

interface CookbookCardProps {
    cookbook: {
        id: string;
        name: string;
        cover_url?: string | null;
        count?: number; // For Uncategorized card
        isUncategorized?: boolean;
    };
    onPress: () => void;
    style?: any;
}

export const CookbookCard = ({ cookbook, onPress, style }: CookbookCardProps) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    // Fetch recipes for this cookbook to get the count and cover image
    // Note: We use the 'enabled' flag in the hooks (internal to useCookbookRecipes) 
    // to prevent unnecessary calls if ID is null.
    const { data: cookbookRecipes } = useCookbookRecipes(cookbook.isUncategorized ? null : cookbook.id, { enabled: !cookbook.isUncategorized });
    const { data: uncategorizedRecipes } = useUncategorizedRecipes({ enabled: !!cookbook.isUncategorized });

    // We only call useUncategorizedRecipes if were on index or similar, 
    // but here every card would call it. 
    // To be efficient, useUncategorizedRecipes should also check if it's needed.
    // However, for now let's just use the data based on type.
    const recipes = cookbook.isUncategorized ? uncategorizedRecipes : cookbookRecipes;
    const recipeCount = cookbook.count ?? recipes?.length ?? 0;

    // Find the most recent recipe with an image
    const latestRecipeWithImage = recipes?.find(r => r.image_url);
    const coverImage = cookbook.cover_url || latestRecipeWithImage?.image_url;

    return (
        <TouchableOpacity
            style={[styles.container, style]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
                {coverImage ? (
                    <Image source={{ uri: coverImage }} style={styles.image} />
                ) : (
                    <View style={[styles.placeholder, { backgroundColor: colors.surface }]}>
                        <View style={styles.iconContainer}>
                            <Text style={{ fontSize: 24, opacity: 0.3 }}>📖</Text>
                        </View>
                    </View>
                )}
            </View>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                {cookbook.name}
            </Text>
            <Text style={[styles.count, { color: colors.neutral }]}>
                {recipeCount} {recipeCount === 1 ? 'Recipe' : 'Recipes'}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '48%',
        marginBottom: 20,
    },
    card: {
        width: '100%',
        aspectRatio: 1.3,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 8,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        width: '100%',
        height: '100%',
        opacity: 0.5,
    },
    iconContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
    },
    count: {
        fontSize: 12,
        marginTop: 2,
    },
});
