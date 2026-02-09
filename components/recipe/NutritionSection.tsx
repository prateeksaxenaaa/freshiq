import Colors from '@/constants/Colors';
import React from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

interface NutritionSectionProps {
    recipeId: string;
    recipe: any;
}

export const NutritionSection = ({ recipeId, recipe }: NutritionSectionProps) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Nutrition</Text>

            <View style={styles.nutritionGrid}>
                <View style={[styles.nutritionItem, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.nutritionLabel, { color: colors.neutral }]}>Calories</Text>
                    <Text style={[styles.nutritionValue, { color: colors.neutral }]}>—</Text>
                    <Text style={[styles.nutritionUnit, { color: colors.neutral }]}>kcal</Text>
                </View>

                <View style={[styles.nutritionItem, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.nutritionLabel, { color: colors.neutral }]}>Protein</Text>
                    <Text style={[styles.nutritionValue, { color: colors.neutral }]}>—</Text>
                    <Text style={[styles.nutritionUnit, { color: colors.neutral }]}>g</Text>
                </View>

                <View style={[styles.nutritionItem, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.nutritionLabel, { color: colors.neutral }]}>Fiber</Text>
                    <Text style={[styles.nutritionValue, { color: colors.neutral }]}>—</Text>
                    <Text style={[styles.nutritionUnit, { color: colors.neutral }]}>g</Text>
                </View>
            </View>

            <Text style={[styles.placeholderNote, { color: colors.neutral }]}>
                Nutrition info will be calculated by AI
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        paddingHorizontal: 16,
        paddingVertical: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
    },
    nutritionGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    nutritionItem: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    nutritionLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 4,
    },
    nutritionValue: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        minWidth: 50,
    },
    nutritionUnit: {
        fontSize: 12,
        marginTop: 2,
    },
    placeholderNote: {
        fontSize: 13,
        textAlign: 'center',
        marginTop: 12,
        fontStyle: 'italic',
    },
});
