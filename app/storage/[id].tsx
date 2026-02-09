
import Colors from '@/constants/Colors';
import { InventoryItem, useCreateInventoryItem, useInventory, useStorageLocations, useUpdateInventoryItem } from '@/hooks/useInventory';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COMMON_UNITS = ['pcs', 'g', 'kg', 'ml', 'l', 'oz', 'lb'];

export default function StorageDetailScreen() {
    const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const { data: inventory, isLoading } = useInventory();
    const { data: allStorageLocations } = useStorageLocations(); // Fetch bins for moving
    const updateItem = useUpdateInventoryItem();
    const createItem = useCreateInventoryItem();

    const [realStorageId, setRealStorageId] = useState<string | null>(null);

    // Fetch UUID if param is not UUID (e.g. from static card)
    useEffect(() => {
        const fetchId = async () => {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (id && uuidRegex.test(id)) {
                setRealStorageId(id);
            } else {
                // Try to find by name
                const { data } = await supabase
                    .from('storage_locations')
                    .select('id')
                    .ilike('name', name)
                    .limit(1)
                    .maybeSingle();

                if (data) setRealStorageId(data.id);
            }
        };
        fetchId();
    }, [id, name]);

    // Derived storage ID to use for filtering
    const targetStorageId = realStorageId || id;

    const filteredInventory = inventory?.filter(item =>
        // Filter by name (legacy/link) OR by ID
        (item.storage_locations?.name && item.storage_locations.name === name) ||
        (item.storage_id && item.storage_id === targetStorageId)
    ) || [];

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ name: '', quantity: '', unit: '', storageId: '' });

    // Add State
    const [isAddModalVisible, setAddModalVisible] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', quantity: '', unit: 'pcs' });

    // Unit Picker State
    const [unitPickerTarget, setUnitPickerTarget] = useState<'edit' | 'add' | null>(null);

    // Storage Picker (Move Item)
    const [isStoragePickerVisible, setStoragePickerVisible] = useState(false);

    // Styling Constants
    const BORDER_COLOR = '#E5E7EB';

    const getFreshnessColor = (item: InventoryItem) => {
        return '#4ADE80';
    };

    const startEditing = (item: InventoryItem) => {
        if (editingId === item.id) {
            setEditingId(null);
        } else {
            setEditingId(item.id);
            setEditForm({
                name: item.name || '',
                quantity: String(item.quantity || ''),
                unit: item.unit || 'pcs',
                storageId: item.storage_id || targetStorageId // Initialize with current storage
            });
        }
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        try {
            await updateItem.mutateAsync({
                id: editingId,
                updates: {
                    name: editForm.name,
                    quantity: parseFloat(editForm.quantity) || 0,
                    unit: editForm.unit,
                    storage_id: editForm.storageId // Persist move
                }
            });
            setEditingId(null);
        } catch (e) {
            Alert.alert("Error", "Failed to update item.");
        }
    };

    const handleConsume = (id: string) => {
        Alert.alert("Consume Item", "Mark this item as fully used?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Yes, Mark Used",
                style: 'destructive',
                onPress: () => updateItem.mutateAsync({ id, updates: { status: 'consumed' } }) // Soft Delete
            }
        ]);
    };

    const handleAddItem = async () => {
        if (!addForm.name.trim()) {
            Alert.alert("Required", "Please enter an item name.");
            return;
        }

        if (!realStorageId) {
            Alert.alert("Configuration Error", "Could not find storage ID.");
            return;
        }

        try {
            await createItem.mutateAsync({
                name: addForm.name,
                quantity: parseFloat(addForm.quantity) || 1,
                unit: addForm.unit,
                storage_id: realStorageId,
            });
            setAddModalVisible(false);
            setAddForm({ name: '', quantity: '', unit: 'pcs' });
        } catch (e: any) {
            Alert.alert("Error", "Failed to add item: " + e.message);
        }
    };

    const openUnitPicker = (target: 'edit' | 'add') => {
        setUnitPickerTarget(target);
    };

    const selectUnit = (unit: string) => {
        if (unitPickerTarget === 'edit') {
            setEditForm(prev => ({ ...prev, unit }));
        } else if (unitPickerTarget === 'add') {
            setAddForm(prev => ({ ...prev, unit }));
        }
        setUnitPickerTarget(null);
    };

    const selectNewStorage = (newStorageId: string) => {
        setEditForm(prev => ({ ...prev, storageId: newStorageId }));
        setStoragePickerVisible(false);
    };

    const renderItem = ({ item }: { item: InventoryItem }) => {
        const isEditing = editingId === item.id;
        // Find current storage name if moving
        const currentStorageName = allStorageLocations?.find(s => s.id === editForm.storageId)?.name || 'Storage';

        return (
            <View style={[styles.itemCard, { backgroundColor: colors.surface }]}>
                <TouchableOpacity
                    style={styles.itemRow}
                    onPress={() => startEditing(item)}
                    activeOpacity={0.9}
                >
                    <View style={styles.indicators}>
                        <View style={[styles.dot, { backgroundColor: getFreshnessColor(item) }]} />
                    </View>

                    <View style={styles.itemInfo}>
                        <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                        <Text style={[styles.itemQty, { color: colors.neutral }]}>
                            {item.quantity} {item.unit}
                        </Text>
                    </View>

                    {!isEditing && (
                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: 'rgba(74, 222, 128, 0.1)' }]}
                                onPress={() => handleConsume(item.id)}
                            >
                                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>Mark Used</Text>
                            </TouchableOpacity>
                            <Ionicons name="pencil" size={20} color={colors.neutral} />
                        </View>
                    )}
                </TouchableOpacity>

                {isEditing && (
                    <View style={[styles.editForm, { borderTopColor: BORDER_COLOR }]}>
                        <Text style={[styles.label, { color: colors.neutral }]}>Edit Details</Text>

                        <TextInput
                            style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: BORDER_COLOR }]}
                            value={editForm.name}
                            onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
                            placeholder="Item Name"
                            placeholderTextColor={colors.neutral}
                        />

                        <View style={styles.rowInputs}>
                            <TextInput
                                style={[styles.input, { flex: 1, color: colors.text, backgroundColor: colors.background, borderColor: BORDER_COLOR }]}
                                value={editForm.quantity}
                                onChangeText={(text) => setEditForm(prev => ({ ...prev, quantity: text }))}
                                placeholder="Qty"
                                keyboardType="numeric"
                                placeholderTextColor={colors.neutral}
                            />

                            <TouchableOpacity
                                style={[styles.unitSelector, { backgroundColor: colors.background, borderColor: BORDER_COLOR }]}
                                onPress={() => openUnitPicker('edit')}
                            >
                                <Text style={{ color: colors.text }}>{editForm.unit || 'Unit'}</Text>
                                <Ionicons name="chevron-down" size={16} color={colors.neutral} />
                            </TouchableOpacity>
                        </View>

                        {/* Move Item Section */}
                        <Text style={[styles.label, { color: colors.neutral, marginTop: 4 }]}>Location</Text>
                        <TouchableOpacity
                            style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.background, borderColor: BORDER_COLOR }]}
                            onPress={() => setStoragePickerVisible(true)}
                        >
                            <Text style={{ color: colors.text }}>{currentStorageName}</Text>
                            <Ionicons name="swap-horizontal" size={20} color={colors.neutral} />
                        </TouchableOpacity>

                        <View style={styles.editActions}>
                            <TouchableOpacity
                                style={[styles.editBtn, { backgroundColor: colors.surface, borderColor: BORDER_COLOR, borderWidth: 1 }]}
                                onPress={() => setEditingId(null)}
                            >
                                <Text style={{ color: colors.text }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.editBtn, { backgroundColor: colors.primary }]}
                                onPress={handleSaveEdit}
                            >
                                <Text style={{ color: '#fff', fontWeight: '600' }}>Save Changes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <Stack.Screen options={{ headerShown: false }} />

                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={28} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>{name || 'Storage'}</Text>
                </View>

                {/* Legend (Hidden if list empty? No keep it) */}
                <View style={styles.legendContainer}>
                    <View style={styles.legendRow}>
                        <Text style={[styles.legendLabel, { color: colors.neutral }]}>Freshness:</Text>
                        <View style={styles.legendItems}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#4ADE80' }]} />
                                <Text style={[styles.legendText, { color: colors.text }]}>Good</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#FACC15' }]} />
                                <Text style={[styles.legendText, { color: colors.text }]}>Expiring</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                                <Text style={[styles.legendText, { color: colors.text }]}>Expired</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* List */}
                {isLoading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                ) : (
                    <FlatList
                        data={filteredInventory}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="cube-outline" size={64} color={colors.neutral} />
                                <Text style={[styles.emptyText, { color: colors.text }]}>
                                    No items in {name}.
                                </Text>
                                <TouchableOpacity onPress={() => setAddModalVisible(true)}>
                                    <Text style={{ color: colors.primary, marginTop: 8, fontWeight: '600' }}>
                                        + Add your first item
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        }
                    />
                )}
            </KeyboardAvoidingView>

            {/* FAB */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.primary }]}
                onPress={() => setAddModalVisible(true)}
            >
                <Ionicons name="add" size={32} color="white" />
            </TouchableOpacity>

            {/* Add Modal */}
            <Modal
                visible={isAddModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setAddModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Add to {name}</Text>
                            <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.neutral} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: BORDER_COLOR }]}
                            value={addForm.name}
                            onChangeText={(text) => setAddForm(prev => ({ ...prev, name: text }))}
                            placeholder="Item Name (e.g. Milk)"
                            placeholderTextColor={colors.neutral}
                            autoFocus
                        />

                        <View style={styles.rowInputs}>
                            <TextInput
                                style={[styles.input, { flex: 1, color: colors.text, backgroundColor: colors.background, borderColor: BORDER_COLOR }]}
                                value={addForm.quantity}
                                onChangeText={(text) => setAddForm(prev => ({ ...prev, quantity: text }))}
                                placeholder="Qty"
                                keyboardType="numeric"
                                placeholderTextColor={colors.neutral}
                            />

                            <TouchableOpacity
                                style={[styles.unitSelector, { backgroundColor: colors.background, borderColor: BORDER_COLOR }]}
                                onPress={() => openUnitPicker('add')}
                            >
                                <Text style={{ color: colors.text }}>{addForm.unit}</Text>
                                <Ionicons name="chevron-down" size={16} color={colors.neutral} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                            onPress={handleAddItem}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Add Item</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Unit Picker Modal */}
            <Modal
                visible={!!unitPickerTarget}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setUnitPickerTarget(null)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setUnitPickerTarget(null)}
                >
                    <View style={[styles.unitModalContent, { backgroundColor: colors.background }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Select Unit</Text>
                        <View style={styles.unitGrid}>
                            {COMMON_UNITS.map(unit => (
                                <TouchableOpacity
                                    key={unit}
                                    style={[
                                        styles.unitOption,
                                        {
                                            backgroundColor: colors.surface,
                                            borderColor: (unitPickerTarget === 'edit' ? editForm.unit : addForm.unit) === unit ? colors.primary : BORDER_COLOR
                                        }
                                    ]}
                                    onPress={() => selectUnit(unit)}
                                >
                                    <Text style={{ color: (unitPickerTarget === 'edit' ? editForm.unit : addForm.unit) === unit ? colors.primary : colors.text }}>
                                        {unit}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Storage Picker Modal (For Move) */}
            <Modal
                visible={isStoragePickerVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setStoragePickerVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setStoragePickerVisible(false)}
                >
                    <View style={[styles.unitModalContent, { backgroundColor: colors.background }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Move to...</Text>
                        <View style={{ gap: 8, marginTop: 10 }}>
                            {allStorageLocations?.map(loc => (
                                <TouchableOpacity
                                    key={loc.id}
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor: colors.surface,
                                            borderColor: editForm.storageId === loc.id ? colors.primary : BORDER_COLOR,
                                            flexDirection: 'row',
                                            justifyContent: 'space-between'
                                        }
                                    ]}
                                    onPress={() => selectNewStorage(loc.id)}
                                >
                                    <Text style={{ color: colors.text, fontWeight: '500' }}>{loc.name}</Text>
                                    {editForm.storageId === loc.id && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 28, fontWeight: '800' },
    legendContainer: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', backgroundColor: 'rgba(0,0,0,0.02)' },
    legendRow: { flexDirection: 'row', alignItems: 'center' },
    legendLabel: { fontSize: 13, fontWeight: '600', width: 100 },
    legendItems: { flexDirection: 'row', gap: 16 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 13, fontWeight: '500' },
    listContent: { padding: 20, paddingBottom: 100 },
    itemCard: { borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, overflow: 'hidden' },
    itemRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    indicators: { marginRight: 12, justifyContent: 'center' },
    dot: { width: 10, height: 10, borderRadius: 5 },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 17, fontWeight: '700', marginBottom: 2 },
    itemQty: { fontSize: 14, fontWeight: '500' },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    actionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    editForm: { padding: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    label: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
    input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 16 },
    rowInputs: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    unitSelector: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 10, justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row' },
    editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
    editBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { alignItems: 'center', marginTop: 60 },
    emptyText: { marginTop: 16, fontSize: 16 },

    // FAB
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 40,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '90%', padding: 20, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, elevation: 10 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    submitBtn: { padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },

    unitModalContent: { width: '80%', padding: 20, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, elevation: 10 },
    unitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
    unitOption: { paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderRadius: 8, minWidth: 60, alignItems: 'center' },
});
