import Colors from '@/constants/Colors';
import { useCookbookRecipes, useDeleteCookbook, useUncategorizedRecipes, useUpdateCookbook } from '@/hooks/useCookbooks';
import { useInventory } from '@/hooks/useInventory';
import { Ionicons } from '@expo/vector-icons';
import { Link, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CookbookDetailScreen() {
    const { id, name: initialName } = useLocalSearchParams<{ id: string; name: string }>();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    const updateCookbook = useUpdateCookbook();
    const deleteCookbook = useDeleteCookbook();

    const [isEditModalVisible, setEditModalVisible] = useState(false);
    const [newName, setNewName] = useState(initialName || '');

    const isUncategorized = id === 'uncategorized';

    // Fetch regular cookbook recipes OR uncategorized recipes
    const { data: cookbookRecipes, isLoading: isLoadingCookbook } = useCookbookRecipes(
        isUncategorized ? null : id
    );
    const { data: uncategorizedRecipes, isLoading: isLoadingUncategorized } = useUncategorizedRecipes();
    const { data: inventory } = useInventory();

    const rawRecipes = isUncategorized ? uncategorizedRecipes : cookbookRecipes;
    const isLoading = isUncategorized ? isLoadingUncategorized : isLoadingCookbook;

    const inventoryNames = useMemo(() => {
        return (inventory || []).map(item => item.name?.toLowerCase().trim());
    }, [inventory]);

    const recipesWithMatch = useMemo(() => {
        if (!rawRecipes) return [];

        const processed = rawRecipes.map(recipe => {
            const ingredients = (recipe as any).recipe_ingredients || [];
            if (ingredients.length === 0) {
                return { ...recipe, matchPriority: 3, matchText: 'Need ingredients', missingCount: 0 };
            }

            const available = ingredients.filter((ing: any) =>
                inventoryNames.some(invName => invName === ing.name?.toLowerCase().trim())
            );

            const missingCount = ingredients.length - available.length;
            let matchText = '';
            let matchPriority = 3;
            let matchColor = colors.neutral;

            if (missingCount === 0) {
                matchText = '✅ All ingredients ready!';
                matchPriority = 1;
                matchColor = colors.primary;
            } else if (missingCount <= 3) {
                matchText = `⚠️ Missing ${missingCount} ingredient${missingCount > 1 ? 's' : ''}`;
                matchPriority = 2;
                matchColor = '#F59E0B'; // Amber
            } else {
                matchText = `🛒 Need ingredients (${available.length}/${ingredients.length})`;
                matchPriority = 3;
                matchColor = colors.neutral;
            }

            return {
                ...recipe,
                matchPriority,
                matchText,
                matchColor,
                missingCount
            };
        });

        // Sort by priority (1: ready, 2: almost, 3: need)
        return processed.sort((a, b) => a.matchPriority - b.matchPriority);
    }, [rawRecipes, inventoryNames, colors]);

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
                <View style={styles.headerLeft}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </Pressable>
                    <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                        {isUncategorized ? 'Uncategorized' : initialName}
                    </Text>
                </View>

                {!isUncategorized && (
                    <TouchableOpacity
                        onPress={() => setEditModalVisible(true)}
                        style={styles.editHeaderButton}
                    >
                        <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Recipe List */}
            <FlatList
                data={recipesWithMatch}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <Link href={`/recipe/${item.id}`} asChild>
                        <Pressable style={styles.recipeCard}>
                            {/* Image Section */}
                            <View style={styles.imageContainer}>
                                {item.image_url ? (
                                    <Image source={{ uri: item.image_url }} style={styles.recipeImage} resizeMode="cover" />
                                ) : (
                                    <View style={[styles.placeholderImage, { backgroundColor: colors.surface }]}>
                                        <Ionicons name="restaurant-outline" size={40} color={colors.neutral} />
                                    </View>
                                )}
                            </View>

                            <View style={styles.recipeInfo}>
                                <Text style={[styles.recipeTitle, { color: colors.text }]} numberOfLines={2}>
                                    {item.title}
                                </Text>

                                {/* Meta Info Grid: Pos 1, 2, 3 */}
                                <View style={styles.metaGrid}>
                                    {/* Position 1: Veg/Non-Veg Indicator */}
                                    {item.is_vegetarian !== null && (
                                        <View style={[styles.dietBadge, { backgroundColor: item.is_vegetarian ? '#DEF7EC' : '#FDE8E8' }]}>
                                            <View style={[styles.dietDot, { backgroundColor: item.is_vegetarian ? '#059669' : '#DC2626' }]} />
                                            <Text style={[styles.dietText, { color: item.is_vegetarian ? '#03543F' : '#9B1C1C' }]}>
                                                {item.is_vegetarian ? 'VEG' : 'NON-VEG'}
                                            </Text>
                                        </View>
                                    )}

                                    {/* Position 2: Prep Time */}
                                    {item.prep_time_minutes ? (
                                        <View style={styles.metaItem}>
                                            <Ionicons name="time-outline" size={16} color={colors.neutral} />
                                            <Text style={[styles.metaValue, { color: colors.text }]}>{item.prep_time_minutes}m</Text>
                                        </View>
                                    ) : null}

                                    {/* Position 3: Servings */}
                                    {item.servings ? (
                                        <View style={styles.metaItem}>
                                            <Ionicons name="people-outline" size={16} color={colors.neutral} />
                                            <Text style={[styles.metaValue, { color: colors.text }]}>Serves {item.servings}</Text>
                                        </View>
                                    ) : null}
                                </View>

                                {/* Position 4: Availability Indicator */}
                                <View style={[
                                    styles.availabilityContainer,
                                    { backgroundColor: item.matchPriority === 1 ? '#DCFCE7' : item.matchPriority === 2 ? '#FEF3C7' : '#FDFCFB' }
                                ]}>
                                    <Text style={[styles.availabilityText, { color: item.matchColor }]}>
                                        {item.matchText}
                                    </Text>
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

            {/* Edit/Options Modal */}
            <Modal
                visible={isEditModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setEditModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setEditModalVisible(false)}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Cookbook Options</Text>

                        <View style={styles.renameSection}>
                            <Text style={[styles.label, { color: colors.neutral }]}>Rename Cookbook</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.surface }]}
                                value={newName}
                                onChangeText={setNewName}
                                placeholder="Cookbook Name"
                                placeholderTextColor={colors.neutral}
                            />
                            <TouchableOpacity
                                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                                onPress={async () => {
                                    if (!newName.trim()) return;
                                    await updateCookbook.mutateAsync({ id, name: newName });
                                    setEditModalVisible(false);
                                    router.setParams({ name: newName });
                                }}
                            >
                                <Text style={styles.saveBtnText}>Save Name</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.divider} />

                        <TouchableOpacity
                            style={styles.deleteOption}
                            onPress={() => {
                                Alert.alert(
                                    "Delete Cookbook",
                                    "Are you sure? This will not delete the recipes inside, they will just become uncategorized.",
                                    [
                                        { text: "Cancel", style: "cancel" },
                                        {
                                            text: "Delete",
                                            style: "destructive",
                                            onPress: async () => {
                                                await deleteCookbook.mutateAsync(id);
                                                setEditModalVisible(false);
                                                router.back();
                                            }
                                        }
                                    ]
                                );
                            }}
                        >
                            <Ionicons name="trash-outline" size={20} color={colors.destructive} />
                            <Text style={[styles.deleteText, { color: colors.destructive }]}>Delete Cookbook</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
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
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    backButton: {
        marginRight: 8,
        padding: 4,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.5,
        flex: 1,
    },
    editHeaderButton: {
        padding: 4,
    },
    listContent: {
        padding: 20,
        paddingTop: 16,
        gap: 20,
    },
    recipeCard: {
        borderRadius: 20,
        marginBottom: 20,
        backgroundColor: '#F8FAFC', // Consistent Grey background from storage cards
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        overflow: 'hidden',
    },
    imageContainer: {
        width: '100%',
        height: 200,
        position: 'relative',
    },
    recipeImage: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    recipeInfo: {
        padding: 18,
    },
    recipeTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 12,
        lineHeight: 26,
        letterSpacing: -0.3,
    },
    metaGrid: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    dietBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    dietDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    dietText: {
        fontSize: 10,
        fontWeight: '900',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    availabilityContainer: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    availabilityText: {
        fontSize: 13,
        fontWeight: '700',
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        padding: 20,
        borderRadius: 16,
        gap: 12,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 4,
    },
    renameSection: {
        width: '100%',
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        marginBottom: 10,
    },
    saveBtn: {
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 4,
    },
    deleteOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 8,
    },
    deleteText: {
        fontSize: 16,
        fontWeight: '700',
    },
});
