import Colors from '@/constants/Colors';
import { useCookbooks } from '@/hooks/useCookbooks';
import { useCreateRecipe } from '@/hooks/useRecipeDetail';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    useColorScheme,
    View
} from 'react-native';

interface CreateRecipeSheetProps {
    onClose: () => void;
    onSuccess: (recipeId: string) => void;
}

export const CreateRecipeSheet = ({ onClose, onSuccess }: CreateRecipeSheetProps) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const createRecipe = useCreateRecipe();
    const { data: cookbooks } = useCookbooks();


    const [title, setTitle] = useState('');

    const handleCreate = async () => {
        if (!title.trim()) return;

        try {
            const newRecipe = await createRecipe.mutateAsync({
                title: title.trim(),
                cookbook_id: null,
            });

            onClose();
            onSuccess(newRecipe.id);
        } catch (error) {
            console.error('Failed to create recipe:', error);
            Alert.alert('Error', 'Failed to create recipe. Please try again.');
        }
    };

    return (
        <View style={styles.container}>
            {/* Title Input */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Recipe Title *</Text>
                <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.surface }]}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g. Spicy Chicken Pasta"
                    placeholderTextColor={colors.neutral}
                    autoFocus
                    onSubmitEditing={handleCreate}
                />
            </View>

            {/* Create Button */}
            <Pressable
                style={[
                    styles.createButton,
                    {
                        backgroundColor: title.trim() ? colors.primary : '#E0E0E0',
                        opacity: title.trim() ? 1 : 0.6,
                    },
                ]}
                onPress={handleCreate}
                disabled={!title.trim() || createRecipe.isPending}
            >
                {createRecipe.isPending ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <>
                        <Ionicons name="checkmark-circle" size={20} color="white" style={{ marginRight: 8 }} />
                        <Text style={styles.createButtonText}>Create Recipe</Text>
                    </>
                )}
            </Pressable>

            {/* Error Message */}
            {createRecipe.error && (
                <Text style={[styles.errorText, { color: colors.destructive }]}>
                    Failed to create recipe. Please try again.
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        fontSize: 16,
    },
    cookbookList: {
        flexDirection: 'row',
        gap: 8,
    },
    cookbookChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 8,
    },
    cookbookChipText: {
        fontSize: 14,
        fontWeight: '600',
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 10,
    },
    createButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    errorText: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 12,
    },
});
