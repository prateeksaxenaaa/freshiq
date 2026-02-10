import Colors from '@/constants/Colors';
import { useAutosave } from '@/hooks/useAutosave';
import { useCookbooks, useRecipeCookbooks } from '@/hooks/useCookbooks';
import { useUpdateRecipe } from '@/hooks/useRecipeDetail';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useColorScheme,
    View
} from 'react-native';

interface RecipeHeaderProps {
    recipeId: string;
    recipe: any;
    editable?: boolean;
    onCookbookChange?: (id: string | null) => void;
}

export const RecipeHeader = ({ recipeId, recipe, editable = false, onCookbookChange }: RecipeHeaderProps) => {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const updateRecipe = useUpdateRecipe();

    const [localTitle, setLocalTitle] = useState(recipe.title || '');
    const [dropdownVisible, setDropdownVisible] = useState(false);

    // Cookbook Management
    const { data: cookbooks } = useCookbooks();
    const { data: recipeCookbooks } = useRecipeCookbooks(recipeId);

    // Use a local state for the UI before saving
    const initialCookbookId = (recipeCookbooks as any && (recipeCookbooks as any).length > 0) ? (recipeCookbooks as any)[0].id : null;
    const [pendingCookbookId, setPendingCookbookId] = useState<string | null>(null);

    // Sync pending with initial on load
    React.useEffect(() => {
        if (initialCookbookId !== undefined) {
            setPendingCookbookId(initialCookbookId);
        }
    }, [initialCookbookId]);

    const activeCookbookId = pendingCookbookId;

    // Autosave title on blur or after delay
    const debouncedUpdate = useAutosave(
        (title: string) => {
            updateRecipe.mutate({
                id: recipeId,
                updates: { title },
            });
        },
        800
    );

    const handleTitleChange = (text: string) => {
        setLocalTitle(text);
        debouncedUpdate(text);
    };

    const handleTitleBlur = () => {
        // Immediate save on blur
        updateRecipe.mutate({
            id: recipeId,
            updates: { title: localTitle },
        });
    };

    const handleCookbookChange = (newCookbookId: string | null) => {
        setPendingCookbookId(newCookbookId);
        onCookbookChange?.(newCookbookId);
    };

    return (
        <View style={[styles.header, { backgroundColor: colors.background }]}>
            {/* Thumbnail */}
            {recipe.image_url ? (
                <Image
                    source={{ uri: recipe.image_url }}
                    style={[styles.thumbnail, { backgroundColor: colors.surface }]}
                    resizeMode="cover"
                />
            ) : (
                <View style={[styles.thumbnail, styles.placeholderThumbnail, { backgroundColor: colors.surface }]}>
                    <Ionicons name="image-outline" size={32} color={colors.neutral} />
                </View>
            )}

            {/* Cookbook Dropdown Selector - More Prominent */}
            <View style={[styles.cookbookSection, { zIndex: 100 }]}>
                <Text style={[styles.cookbookLabel, { color: colors.neutral }]}>Recipe Category</Text>

                <Pressable
                    style={[styles.dropdownTrigger, {
                        backgroundColor: colors.surface,
                        borderColor: dropdownVisible ? colors.primary : '#F1F5F9',
                        borderWidth: 1.5,
                        shadowColor: colors.primary,
                        shadowOpacity: dropdownVisible ? 0.1 : 0,
                    }]}
                    onPress={() => setDropdownVisible(!dropdownVisible)}
                >
                    <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '10' }]}>
                        <Ionicons name="folder-outline" size={14} color={colors.primary} />
                    </View>
                    <Text style={[styles.dropdownText, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                        {activeCookbookId ? (cookbooks?.find(c => c.id === activeCookbookId)?.name || 'Loading...') : 'Uncategorized'}
                    </Text>
                    <Ionicons name={dropdownVisible ? "chevron-up" : "chevron-down"} size={16} color={colors.neutral} />
                </Pressable>

                {dropdownVisible && (
                    <View style={[styles.dropdownList, { backgroundColor: colors.surface, borderColor: '#E2E8F0' }]}>
                        <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                            {/* Uncategorized Option */}
                            <Pressable
                                style={[styles.dropdownItem, activeCookbookId === null && styles.dropdownItemSelected]}
                                onPress={() => {
                                    handleCookbookChange(null);
                                    setDropdownVisible(false);
                                }}
                            >
                                <Text style={[styles.dropdownItemText, { color: colors.text, flex: 1 }]} numberOfLines={1}>Uncategorized</Text>
                                {activeCookbookId === null && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                            </Pressable>

                            {/* Cookbooks */}
                            {cookbooks?.map((cookbook) => (
                                <Pressable
                                    key={cookbook.id}
                                    style={[styles.dropdownItem, activeCookbookId === cookbook.id && styles.dropdownItemSelected]}
                                    onPress={() => {
                                        handleCookbookChange(cookbook.id);
                                        setDropdownVisible(false);
                                    }}
                                >
                                    <Text style={[styles.dropdownItemText, { color: colors.text, flex: 1 }]} numberOfLines={1}>{cookbook.name}</Text>
                                    {activeCookbookId === cookbook.id && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        paddingTop: 10,
    },
    thumbnail: {
        width: 120,
        height: 120,
        borderRadius: 20,
        marginBottom: 16,
    },
    placeholderThumbnail: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleInput: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 16,
        paddingVertical: 4,
        letterSpacing: -0.5,
    },
    cookbookSection: {
        marginTop: 4,
        position: 'relative',
        zIndex: 100,
    },
    dropdownTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1.5,
    },
    categoryBadge: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    dropdownText: {
        fontSize: 15,
        fontWeight: '600',
    },
    dropdownList: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        marginTop: 8,
        borderRadius: 14,
        borderWidth: 1.5,
        paddingVertical: 6,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        zIndex: 101,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    dropdownItemSelected: {
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
    },
    dropdownItemText: {
        fontSize: 15,
        fontWeight: '500',
    },
    cookbookLabel: {
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 6,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
