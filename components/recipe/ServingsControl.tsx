import Colors from '@/constants/Colors';
import { useRecalculateServings } from '@/hooks/useRecipeDetail';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

interface ServingsControlProps {
    recipeId: string;
    servings: number;
    ingredients: any[];
    onUpdate?: (newServings: number) => void;
}

export const ServingsControl = ({ recipeId, servings, ingredients, onUpdate }: ServingsControlProps) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const recalculateServings = useRecalculateServings();

    const handleServingsChange = (delta: number) => {
        const newServings = Math.max(1, servings + delta);
        if (newServings === servings) return;

        if (onUpdate) {
            onUpdate(newServings);
        } else {
            recalculateServings.mutate({
                recipeId,
                oldServings: servings,
                newServings,
                ingredients,
            });
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
            <Text style={[styles.label, { color: colors.text }]}>Servings</Text>

            <View style={styles.controls}>
                <Pressable
                    style={[styles.button, { backgroundColor: colors.background }]}
                    onPress={() => handleServingsChange(-1)}
                    disabled={servings <= 1}
                >
                    <Ionicons name="remove" size={20} color={servings <= 1 ? colors.neutral : colors.text} />
                </Pressable>

                <Text style={[styles.servingsText, { color: colors.text }]}>{servings}</Text>

                <Pressable
                    style={[styles.button, { backgroundColor: colors.background }]}
                    onPress={() => handleServingsChange(1)}
                >
                    <Ionicons name="add" size={20} color={colors.text} />
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginHorizontal: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    button: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    servingsText: {
        fontSize: 18,
        fontWeight: '700',
        minWidth: 30,
        textAlign: 'center',
    },
});
