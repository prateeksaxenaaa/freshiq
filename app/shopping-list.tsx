import { BottomSheet } from '@/components/ui/BottomSheet';
import Colors from '@/constants/Colors';
import { ShoppingListItem, useShoppingList } from '@/hooks/useShoppingList';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { Stack, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ShoppingListScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { items, isLoading, addItem, updateItem, deleteItem, clearList } = useShoppingList();

    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);

    // Form State
    const [itemName, setItemName] = useState('');
    const [itemQty, setItemQty] = useState('1');
    const [itemUnit, setItemUnit] = useState('');

    const handleAddItem = () => {
        if (!itemName.trim()) return;
        addItem.mutate({
            name: itemName,
            quantity: parseFloat(itemQty) || 1,
            unit: itemUnit,
        });
        resetForm();
    };

    const handleUpdateItem = () => {
        if (!editingItem || !itemName.trim()) return;
        updateItem.mutate({
            id: editingItem.id,
            updates: {
                name: itemName,
                quantity: parseFloat(itemQty) || 1,
                unit: itemUnit,
            },
        });
        resetForm();
    };

    const resetForm = () => {
        setItemName('');
        setItemQty('1');
        setItemUnit('');
        setIsAddModalVisible(false);
        setIsEditModalVisible(false);
        setEditingItem(null);
    };

    const togglePurchased = (item: ShoppingListItem) => {
        updateItem.mutate({
            id: item.id,
            updates: { is_purchased: !item.is_purchased },
        });
    };

    const handleClearList = () => {
        Alert.alert(
            'Clear Shopping List',
            'Are you sure you want to remove all items from your list?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear All', style: 'destructive', onPress: () => clearList.mutate() },
            ]
        );
    };

    const handleShareList = async () => {
        if (items.length === 0) {
            Alert.alert('Empty List', 'Add some items to your list before sharing.');
            return;
        }

        const html = `
            <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                    <style>
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; }
                        .header { display: flex; align-items: center; margin-bottom: 40px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
                        h1 { color: #10B981; margin: 0; font-size: 32px; flex: 1; }
                        .date { color: #64748b; font-size: 14px; }
                        ul { list-style-type: none; padding: 0; }
                        li { 
                            padding: 16px 0; 
                            border-bottom: 1px solid #f1f5f9; 
                            display: flex; 
                            align-items: center; 
                        }
                        .checkbox { 
                            width: 22px; 
                            height: 22px; 
                            border: 2px solid #cbd5e1; 
                            border-radius: 6px; 
                            margin-right: 18px; 
                        }
                        .item-name { 
                            font-size: 18px; 
                            font-weight: 600; 
                            flex: 1; 
                            color: #334155;
                        }
                        .item-qty { 
                            font-size: 18px; 
                            color: #10B981; 
                            font-weight: 700; 
                            background: #f0fdf4;
                            padding: 4px 12px;
                            border-radius: 8px;
                        }
                        .footer { margin-top: 60px; font-size: 14px; color: #94A3B8; text-align: center; font-style: italic; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>🛒 Shopping List</h1>
                        <span class="date">${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <ul>
                        ${items.map(item => `
                            <li>
                                <div class="checkbox"></div>
                                <span class="item-name">${item.name}</span>
                                <span class="item-qty">${item.quantity || ''} ${item.unit || ''}</span>
                            </li>
                        `).join('')}
                    </ul>
                    <div class="footer">Generated by FreshIQ - Smart Kitchen Assistant</div>
                </body>
            </html>
        `;

        try {
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to generate PDF');
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={26} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Shopping List</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={handleShareList} style={styles.headerIcon}>
                        <Ionicons name="share-outline" size={24} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleClearList} style={styles.headerIcon}>
                        <Ionicons name="trash-outline" size={24} color={colors.destructive} />
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={items}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <ShoppingItemRow
                        item={item}
                        colors={colors}
                        onToggle={() => togglePurchased(item)}
                        onDelete={() => deleteItem.mutate(item.id)}
                        onEdit={() => {
                            setEditingItem(item);
                            setItemName(item.name);
                            setItemQty(item.quantity?.toString() || '1');
                            setItemUnit(item.unit || '');
                            setIsEditModalVisible(true);
                        }}
                        onUpdateQty={(newQty: number) => {
                            updateItem.mutate({
                                id: item.id,
                                updates: { quantity: newQty }
                            });
                        }}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={[styles.emptyIconBg, { backgroundColor: colors.surface }]}>
                            <Ionicons name="cart-outline" size={60} color={colors.primary} />
                        </View>
                        <Text style={[styles.emptyText, { color: colors.text }]}>Your shopping list is empty</Text>
                        <Text style={[styles.emptySubtext, { color: colors.neutral }]}>Add items from recipes or manually using the + button</Text>
                        <TouchableOpacity
                            style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                            onPress={() => setIsAddModalVisible(true)}
                        >
                            <Text style={styles.emptyButtonText}>Add Item</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            <Pressable
                style={[styles.fab, { backgroundColor: colors.primary, bottom: insets.bottom + 50 }]}
                onPress={() => {
                    resetForm();
                    setIsAddModalVisible(true);
                }}
            >
                <Ionicons name="add" size={32} color="white" />
            </Pressable>

            {/* Add/Edit Modal */}
            <BottomSheet
                visible={isAddModalVisible || isEditModalVisible}
                onClose={resetForm}
                title={isEditModalVisible ? 'Edit Item' : 'New Shopping Item'}
            >
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={styles.modalContent}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: colors.neutral }]}>Item Name</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text, backgroundColor: colors.surface }]}
                                placeholder="e.g. Organic Milk"
                                placeholderTextColor={colors.neutral}
                                value={itemName}
                                onChangeText={setItemName}
                                autoFocus
                            />
                        </View>
                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={[styles.inputLabel, { color: colors.neutral }]}>Qty</Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text, backgroundColor: colors.surface }]}
                                    placeholder="1"
                                    placeholderTextColor={colors.neutral}
                                    value={itemQty}
                                    onChangeText={setItemQty}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 2 }]}>
                                <Text style={[styles.inputLabel, { color: colors.neutral }]}>Unit</Text>
                                <TextInput
                                    style={[styles.input, { color: colors.text, backgroundColor: colors.surface }]}
                                    placeholder="L, kg, pieces"
                                    placeholderTextColor={colors.neutral}
                                    value={itemUnit}
                                    onChangeText={setItemUnit}
                                />
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: colors.primary }]}
                            onPress={isEditModalVisible ? handleUpdateItem : handleAddItem}
                        >
                            <Text style={styles.submitButtonText}>
                                {isEditModalVisible ? 'Save Changes' : 'Add to List'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </BottomSheet>
        </SafeAreaView>
    );
}

const ShoppingItemRow = ({ item, colors, onToggle, onDelete, onEdit, onUpdateQty }: any) => {
    return (
        <View style={[styles.itemRow, { borderBottomColor: colors.border + '50' }]}>
            <TouchableOpacity onPress={onToggle} style={styles.checkboxContainer} activeOpacity={0.6}>
                <Ionicons
                    name={item.is_purchased ? "checkmark-circle" : "ellipse-outline"}
                    size={28}
                    color={item.is_purchased ? colors.primary : colors.neutral}
                />
            </TouchableOpacity>

            <TouchableOpacity onPress={onEdit} style={styles.itemInfo} activeOpacity={0.7}>
                <Text style={[
                    styles.itemName,
                    { color: colors.text },
                    item.is_purchased && styles.strikethrough
                ]} numberOfLines={2}>
                    {item.name}
                </Text>
                {item.unit && (
                    <Text style={[styles.itemDetail, { color: colors.neutral }]}>
                        {item.unit}
                    </Text>
                )}
            </TouchableOpacity>

            <View style={styles.rightSection}>
                <View style={[styles.counterContainer, { backgroundColor: colors.surface }]}>
                    <TouchableOpacity
                        onPress={() => onUpdateQty(Math.max(0, (item.quantity || 0) - 1))}
                        style={styles.counterBtn}
                    >
                        <Ionicons name="remove" size={20} color={colors.text} />
                    </TouchableOpacity>

                    <Text style={[styles.qtyText, { color: colors.text }]}>
                        {item.quantity || 0}
                    </Text>

                    <TouchableOpacity
                        onPress={() => onUpdateQty((item.quantity || 0) + 1)}
                        style={styles.counterBtn}
                    >
                        <Ionicons name="add" size={20} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={20} color={colors.destructive} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        padding: 4,
        marginRight: 6,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    headerIcon: {
        padding: 6,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 120,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    checkboxContainer: {
        paddingRight: 12,
    },
    itemInfo: {
        flex: 1,
        marginRight: 8,
    },
    itemName: {
        fontSize: 18,
        fontWeight: '600',
        lineHeight: 24,
    },
    itemDetail: {
        fontSize: 14,
        marginTop: 2,
        fontWeight: '500',
    },
    strikethrough: {
        textDecorationLine: 'line-through',
        opacity: 0.4,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    counterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 4,
        paddingVertical: 4,
        marginRight: 8,
    },
    counterBtn: {
        padding: 6,
    },
    qtyText: {
        fontSize: 17,
        fontWeight: '700',
        minWidth: 24,
        textAlign: 'center',
        marginHorizontal: 4,
    },
    deleteBtn: {
        padding: 8,
    },
    fab: {
        position: 'absolute',
        right: 20,
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 80,
        paddingHorizontal: 40,
    },
    emptyIconBg: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 20,
    },
    emptyButton: {
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 16,
    },
    emptyButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
    modalContent: {
        padding: 20,
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    row: {
        flexDirection: 'row',
        gap: 16,
    },
    input: {
        borderRadius: 16,
        padding: 16,
        fontSize: 17,
        fontWeight: '500',
    },
    submitButton: {
        padding: 18,
        borderRadius: 18,
        alignItems: 'center',
        marginTop: 12,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 17,
        fontWeight: '700',
    },
});
