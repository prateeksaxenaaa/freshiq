import Colors from '@/constants/Colors';
import { useCookbookRecipes } from '@/hooks/useCookbooks';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';

interface CookbookCardProps {
    cookbook: {
        id: string;
        name: string;
        cover_url?: string | null;
        count?: number; // For Uncategorized card
    };
    onPress: () => void;
    style?: any;
}

export const CookbookCard = ({ cookbook, onPress, style }: CookbookCardProps) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    // Fetch recipes for this cookbook to get the count
    const { data: recipes } = useCookbookRecipes(cookbook.id);
    const recipeCount = cookbook.count ?? recipes?.length ?? 0;

    return (
        <TouchableOpacity
            style={[styles.container, style]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
                {cookbook.cover_url ? (
                    <Image source={{ uri: cookbook.cover_url }} style={styles.image} />
                ) : (
                    <View style={[styles.placeholder, { backgroundColor: colors.surface }]} />
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
    title: {
        fontSize: 14,
        fontWeight: '600',
    },
    count: {
        fontSize: 12,
        marginTop: 2,
    },
});
