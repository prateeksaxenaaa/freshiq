import Colors from '@/constants/Colors';
import { useAutosave } from '@/hooks/useAutosave';
import { useCookbooks, useMoveRecipeToCookbook, useRecipeCookbooks } from '@/hooks/useCookbooks';
import { useUpdateRecipe } from '@/hooks/useRecipeDetail';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    useColorScheme,
    View,
} from 'react-native';

interface RecipeHeaderProps {
    recipeId: string;
    recipe: any;
    editable?: boolean;
}

export const RecipeHeader = ({ recipeId, recipe, editable = false }: RecipeHeaderProps) => {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const updateRecipe = useUpdateRecipe();

    const [localTitle, setLocalTitle] = useState(recipe.title || '');
    const [dropdownVisible, setDropdownVisible] = useState(false);

    // Cookbook Management
    const { data: cookbooks } = useCookbooks();
    const { data: recipeCookbooks } = useRecipeCookbooks(recipeId);
    const moveRecipeToCookbook = useMoveRecipeToCookbook();

    // Derive current cookbook ID (assuming single assignment for UI simplicity for now)
    const currentCookbookId = recipeCookbooks && recipeCookbooks.length > 0 ? recipeCookbooks[0].id : null;

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

    const handleCookbookChange = async (newCookbookId: string | null) => {
        if (newCookbookId === currentCookbookId) return;

        try {
            await moveRecipeToCookbook.mutateAsync({
                recipeId,
                cookbookId: newCookbookId,
            });
            setDropdownVisible(false); // Close dropdown on success
        } catch (error) {
            console.error('Failed to move recipe:', error);
            // Optionally show an alert
        }
    };

    return (
        <View style={[styles.header, { backgroundColor: colors.background }]}>
            {/* Back Button Removed - Using System Header */}

            {/* Thumbnail */}
            {recipe.image_url ? (
                <Image
                    source={{ uri: recipe.image_url }}
                    style={[styles.thumbnail, { backgroundColor: colors.surface }]}
                    resizeMode="cover"
                />
            ) : (
                <View style={[styles.thumbnail, styles.placeholderThumbnail, { backgroundColor: colors.surface }]}>
                    <Ionicons name="image-outline" size={40} color={colors.neutral} />
                </View>
            )}

            {/* Title */}
            {editable ? (
                <TextInput
                    style={[styles.titleInput, { color: colors.text }]}
                    value={localTitle}
                    onChangeText={handleTitleChange}
                    onBlur={handleTitleBlur}
                    placeholder="Recipe Title"
                    placeholderTextColor={colors.neutral}
                    multiline
                />
            ) : (
                <Text style={[styles.titleInput, { color: colors.text }]}>{localTitle}</Text>
            )}

            {/* Cookbook Dropdown Selector */}
            <View style={[styles.cookbookSection, { zIndex: 100 }]}>
                {editable && (
                    <Text style={[styles.cookbookLabel, { color: colors.neutral }]}>Select Cookbook</Text>
                )}

                {editable ? (
                    <Pressable
                        style={[styles.dropdownTrigger, { backgroundColor: colors.surface }]}
                        onPress={() => setDropdownVisible(!dropdownVisible)}
                    >
                        <Ionicons name="book-outline" size={16} color={colors.text} style={{ marginRight: 8 }} />
                        <Text style={[styles.dropdownText, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                            {currentCookbookId ? (cookbooks?.find(c => c.id === currentCookbookId)?.name || 'Select Cookbook') : 'Uncategorized'}
                        </Text>
                        <Ionicons name={dropdownVisible ? "chevron-up" : "chevron-down"} size={16} color={colors.neutral} style={{ marginLeft: 8 }} />
                    </Pressable>
                ) : (
                    <View style={[styles.dropdownTrigger, { backgroundColor: colors.surface, borderWidth: 0, paddingLeft: 0 }]}>
                        <Ionicons name="book-outline" size={16} color={colors.text} style={{ marginRight: 8 }} />
                        <Text style={[styles.dropdownText, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                            {currentCookbookId ? (cookbooks?.find(c => c.id === currentCookbookId)?.name || 'Uncategorized') : 'Uncategorized'}
                        </Text>
                    </View>
                )}

                {dropdownVisible && (
                    <View style={[styles.dropdownList, { backgroundColor: colors.surface, borderColor: colors.neutral }]}>
                        <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                            {/* Uncategorized Option */}
                            <Pressable
                                style={[styles.dropdownItem, currentCookbookId === null && styles.dropdownItemSelected]}
                                onPress={() => {
                                    handleCookbookChange(null);
                                    setDropdownVisible(false);
                                }}
                            >
                                <Text style={[styles.dropdownItemText, { color: colors.text, flex: 1 }]} numberOfLines={1}>Uncategorized</Text>
                                {currentCookbookId === null && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                            </Pressable>

                            {/* Cookbooks */}
                            {cookbooks?.map((cookbook) => (
                                <Pressable
                                    key={cookbook.id}
                                    style={[styles.dropdownItem, currentCookbookId === cookbook.id && styles.dropdownItemSelected]}
                                    onPress={() => {
                                        handleCookbookChange(cookbook.id);
                                        setDropdownVisible(false);
                                    }}
                                >
                                    <Text style={[styles.dropdownItemText, { color: colors.text, flex: 1 }]} numberOfLines={1}>{cookbook.name}</Text>
                                    {currentCookbookId === cookbook.id && <Ionicons name="checkmark" size={16} color={colors.primary} />}
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
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        marginBottom: 12,
    },
    thumbnail: {
        width: 100,
        height: 100,
        borderRadius: 16,
        marginBottom: 12,
    },
    placeholderThumbnail: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleInput: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 12,
        paddingVertical: 4,
    },
    cookbookSection: {
        marginTop: 8,
        position: 'relative',
        zIndex: 100, // Ensure dropdown floats above other elements
    },
    dropdownTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    dropdownText: {
        fontSize: 14,
        fontWeight: '500',
    },
    dropdownList: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        marginTop: 4,
        borderRadius: 8,
        borderWidth: 1,
        paddingVertical: 4,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        zIndex: 101,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    dropdownItemSelected: {
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    dropdownItemText: {
        fontSize: 14,
    },
    cookbookLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
        marginLeft: 2,
    },
});
