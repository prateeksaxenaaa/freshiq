import Colors from '@/constants/Colors';
import { useCookbookRecipes, useUncategorizedRecipes } from '@/hooks/useCookbooks';
import { Ionicons } from '@expo/vector-icons';
import { Link, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    Text,
    useColorScheme,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CookbookDetailScreen() {
    const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    const isUncategorized = id === 'uncategorized';

    // Fetch regular cookbook recipes OR uncategorized recipes
    const { data: cookbookRecipes, isLoading: isLoadingCookbook } = useCookbookRecipes(
        isUncategorized ? null : id
    );
    const { data: uncategorizedRecipes, isLoading: isLoadingUncategorized } = useUncategorizedRecipes();

    const recipes = isUncategorized ? uncategorizedRecipes : cookbookRecipes;
    const isLoading = isUncategorized ? isLoadingUncategorized : isLoadingCookbook;

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </Pressable>
                <Text style={[styles.title, { color: colors.text }]}>
                    {isUncategorized ? 'Uncategorized' : name}
                </Text>
            </View>

            {/* Recipe List */}
            <FlatList
                data={recipes}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <Link href={`/recipe/${item.id}`} asChild>
                        <Pressable style={[styles.recipeCard, { backgroundColor: colors.surface }]}>
                            {item.image_url ? (
                                <Image source={{ uri: item.image_url }} style={styles.recipeImage} resizeMode="cover" />
                            ) : (
                                <View style={[styles.placeholderImage, { backgroundColor: colors.surface }]}>
                                    <Ionicons name="restaurant-outline" size={48} color={colors.neutral} />
                                </View>
                            )}
                            <View style={styles.recipeInfo}>
                                <Text style={[styles.recipeTitle, { color: colors.text }]} numberOfLines={2}>
                                    {item.title}
                                </Text>

                                {/* Recipe Meta Info Row */}
                                <View style={styles.metaRow}>
                                    {/* Prep Time */}
                                    {item.prep_time_minutes ? (
                                        <View style={[styles.metaChip, { backgroundColor: colors.background }]}>
                                            <Ionicons name="time-outline" size={14} color={colors.primary} />
                                            <Text style={[styles.metaText, { color: colors.text }]}>
                                                {item.prep_time_minutes}m
                                            </Text>
                                        </View>
                                    ) : null}

                                    {/* Dietary Badge */}
                                    {item.is_vegetarian !== null && (
                                        <View style={[styles.metaChip, { backgroundColor: item.is_vegetarian ? '#e8f5e9' : '#ffebee' }]}>
                                            <Text style={[styles.metaText, { color: item.is_vegetarian ? '#2e7d32' : '#c62828' }]}>
                                                {item.is_vegetarian ? 'Veg' : 'Non-Veg'}
                                            </Text>
                                        </View>
                                    )}

                                    {/* Servings */}
                                    {item.servings ? (
                                        <View style={[styles.metaChip, { backgroundColor: colors.background }]}>
                                            <Ionicons name="people-outline" size={14} color={colors.primary} />
                                            <Text style={[styles.metaText, { color: colors.text }]}>
                                                {item.servings}
                                            </Text>
                                        </View>
                                    ) : null}
                                </View>
                            </View>
                        </Pressable>
                    </Link>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: colors.neutral }]}>
                            No recipes in this cookbook yet.
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 10,
    },
    backButton: {
        marginRight: 16,
        padding: 8,
        borderRadius: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    listContent: {
        padding: 20,
        paddingTop: 0,
        gap: 20,
    },
    recipeCard: {
        flexDirection: 'column', // Changed to column for full width image
        borderRadius: 16,
        marginBottom: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    recipeImage: {
        width: '100%',
        height: 180, // Taller image
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    placeholderImage: {
        width: '100%',
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    recipeInfo: {
        padding: 16,
    },
    recipeTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
        lineHeight: 24,
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
    },
    metaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
    },
});
