import Colors from '@/constants/Colors';
import { useAutosave } from '@/hooks/useAutosave';
import {
    useAddIngredient,
    useAddToShoppingList,
    useDeleteIngredient,
    useUpdateIngredient,
} from '@/hooks/useRecipeDetail';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    useColorScheme,
    View,
} from 'react-native';

interface IngredientsSectionProps {
    recipeId: string;
    ingredients: any[];
    editable?: boolean;
}

export const IngredientsSection = ({ recipeId, ingredients, editable = false }: IngredientsSectionProps) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const updateIngredient = useUpdateIngredient();
    const addIngredient = useAddIngredient();
    const deleteIngredient = useDeleteIngredient();
    const addToShoppingList = useAddToShoppingList();

    const [showAddInput, setShowAddInput] = useState(false);
    const [newIngredientText, setNewIngredientText] = useState('');

    const handleAddIngredient = () => {
        if (!newIngredientText.trim()) return;

        addIngredient.mutate({
            recipeId,
            raw_text: newIngredientText,
        });

        setNewIngredientText('');
        setShowAddInput(false);
    };

    const handleAddToShoppingList = (ingredient: any) => {
        addToShoppingList.mutate({
            name: ingredient.name || ingredient.raw_text,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
        });

        Alert.alert('Added to Shopping List', `${ingredient.name || ingredient.raw_text} has been added.`);
    };

    return (
        <View style={styles.section}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Ingredients</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.neutral }}>({ingredients.length} items)</Text>
            </View>

            {/* Availability Legend */}
            <View style={styles.legendContainer}>
                <View style={styles.legendRow}>
                    <Text style={[styles.legendLabel, { color: colors.neutral }]}>Item match rate</Text>
                    <View style={styles.legendItems}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                            <Text style={[styles.legendText, { color: colors.text }]}>In stock</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                            <Text style={[styles.legendText, { color: colors.text }]}>Low stock</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: colors.destructive }]} />
                            <Text style={[styles.legendText, { color: colors.text }]}>Missing</Text>
                        </View>
                    </View>
                </View>
            </View>

            {
                ingredients.map((ingredient) => (
                    <IngredientRow
                        key={ingredient.id}
                        ingredient={ingredient}
                        recipeId={recipeId}
                        colors={colors}
                        editable={editable}
                        onUpdate={updateIngredient.mutate}
                        onDelete={() => deleteIngredient.mutate({ id: ingredient.id, recipeId })}
                        onAddToShoppingList={() => handleAddToShoppingList(ingredient)}
                    />
                ))
            }

            {/* Add Ingredient - Only in Edit Mode */}
            {
                editable && (
                    showAddInput ? (
                        <View style={[styles.addInputRow, { backgroundColor: colors.surface }]}>
                            <TextInput
                                style={[styles.addInput, { color: colors.text }]}
                                value={newIngredientText}
                                onChangeText={setNewIngredientText}
                                placeholder="e.g., 2 large onions, diced"
                                placeholderTextColor={colors.neutral}
                                autoFocus
                                onSubmitEditing={handleAddIngredient}
                                onBlur={() => {
                                    if (!newIngredientText.trim()) setShowAddInput(false);
                                }}
                            />
                            <Pressable onPress={handleAddIngredient}>
                                <Ionicons name="checkmark" size={24} color={colors.primary} />
                            </Pressable>
                        </View>
                    ) : (
                        <Pressable
                            style={[styles.addButton, { backgroundColor: colors.surface }]}
                            onPress={() => setShowAddInput(true)}
                        >
                            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                            <Text style={[styles.addButtonText, { color: colors.primary }]}>Add Ingredient</Text>
                        </Pressable>
                    )
                )
            }
        </View >
    );
};

interface IngredientRowProps {
    ingredient: any;
    recipeId: string;
    colors: any;
    editable: boolean;
    onUpdate: (data: any) => void;
    onDelete: () => void;
    onAddToShoppingList: () => void;
}

const IngredientRow = ({
    ingredient,
    recipeId,
    colors,
    editable,
    onUpdate,
    onDelete,
    onAddToShoppingList,
}: IngredientRowProps) => {
    const [localName, setLocalName] = useState(ingredient.name || ingredient.raw_text);
    const [localQuantity, setLocalQuantity] = useState(ingredient.quantity?.toString() || '');
    const [localUnit, setLocalUnit] = useState(ingredient.unit || '');

    const debouncedUpdate = useAutosave(
        (updates: any) => {
            onUpdate({
                id: ingredient.id,
                recipeId,
                updates,
            });
        },
        800
    );

    const handleNameChange = (text: string) => {
        setLocalName(text);
        debouncedUpdate({ name: text });
    };

    const handleQuantityChange = (text: string) => {
        setLocalQuantity(text);
        const quantity = parseFloat(text);
        if (!isNaN(quantity)) {
            debouncedUpdate({ quantity });
        }
    };

    const handleUnitChange = (text: string) => {
        setLocalUnit(text);
        debouncedUpdate({ unit: text });
    };

    // Helper to format quantity for display
    const formatQuantity = (qty: number | null) => {
        if (qty === null || qty === undefined) return '';
        // If it's effectively an integer (0.009 tolerance)
        if (Math.abs(qty % 1) < 0.01) return qty.toFixed(0);
        return parseFloat(qty.toFixed(2)).toString();
    };

    // Placeholder: availability = random for demo
    const availability = ingredient.quantity ? 'available' : 'low';

    if (!editable) {
        return (
            <View style={styles.ingredientRow}>
                <View style={[styles.ingredientMain, { alignItems: 'center' }]}>
                    {/* Dot */}
                    <View
                        style={[
                            styles.availabilityDot,
                            {
                                backgroundColor:
                                    availability === 'available'
                                        ? colors.primary
                                        : availability === 'low'
                                            ? '#F59E0B'
                                            : colors.destructive,
                            },
                        ]}
                    />

                    {/* Read-only Text Layout */}
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        {/* Name */}
                        <Text style={[styles.ingredientName, { color: colors.text, marginBottom: 0, flex: 2, marginRight: 8 }]}>
                            {localName}
                        </Text>

                        {/* Qty & Unit */}
                        {(ingredient.quantity || ingredient.unit) && (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={[styles.readOnlyQty, { color: colors.primary }]}>
                                    {formatQuantity(ingredient.quantity)}
                                </Text>
                                <Text style={[styles.readOnlyUnit, { color: colors.neutral }]}>
                                    {ingredient.unit}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Shopping List Button (Icon only to save space) */}
                    <Pressable onPress={onAddToShoppingList} style={{ padding: 8 }}>
                        <Ionicons name="cart-outline" size={20} color={colors.primary} />
                    </Pressable>
                </View>
            </View>
        );
    }

    // Editable Mode
    return (
        <View style={styles.ingredientRow}>
            <View style={styles.ingredientMain}>
                <View style={{ flex: 1 }}>
                    <TextInput
                        style={[styles.ingredientName, { color: colors.text, borderBottomWidth: 1, borderBottomColor: colors.border || '#eee' }]}
                        value={localName}
                        onChangeText={handleNameChange}
                        placeholder="Ingredient name"
                        placeholderTextColor={colors.neutral}
                    />
                    <View style={styles.quantityRow}>
                        <TextInput
                            style={[styles.quantityInput, { color: colors.text, backgroundColor: colors.surface }]}
                            value={localQuantity}
                            onChangeText={handleQuantityChange}
                            placeholder="Qty"
                            placeholderTextColor={colors.neutral}
                            keyboardType="numeric"
                        />
                        <TextInput
                            style={[styles.unitInput, { color: colors.text, backgroundColor: colors.surface }]}
                            value={localUnit}
                            onChangeText={handleUnitChange}
                            placeholder="Unit"
                            placeholderTextColor={colors.neutral}
                        />
                    </View>
                </View>

                <Pressable onPress={onDelete} style={{ padding: 8, marginLeft: 8 }}>
                    <Ionicons name="trash-outline" size={24} color={colors.destructive} />
                </Pressable>
            </View>
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
        marginBottom: 0,
    },
    legendContainer: {
        paddingVertical: 12,
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    legendRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendLabel: {
        fontSize: 12,
        fontWeight: '600',
        width: 110,
        letterSpacing: 0,
    },
    legendItems: {
        flexDirection: 'row',
        gap: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 12,
        fontWeight: '500',
    },
    ingredientRow: {
        marginBottom: 8,
        paddingVertical: 6,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    ingredientMain: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    availabilityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 12,
    },
    ingredientName: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
    },
    readOnlyQty: {
        fontSize: 16,
        fontWeight: '600',
        marginRight: 4,
    },
    readOnlyUnit: {
        fontSize: 16,
        fontWeight: '500',
    },
    quantityRow: {
        flexDirection: 'row',
        gap: 8,
    },
    quantityInput: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        fontSize: 15,
    },
    unitInput: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        fontSize: 15,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 8,
    },
    addButtonText: {
        fontSize: 15,
        fontWeight: '600',
        marginLeft: 8,
    },
    addInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        marginTop: 8,
    },
    addInput: {
        flex: 1,
        fontSize: 15,
        marginRight: 8,
    },
});
