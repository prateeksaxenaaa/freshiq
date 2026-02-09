import { BottomSheet } from '@/components/ui/BottomSheet';
import Colors from '@/constants/Colors';
import { useCreateStorageLocation } from '@/hooks/useInventory';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';

const STORAGE_TYPES = [
    { label: 'Fridge', value: 'fridge', icon: 'thermometer-outline' },
    { label: 'Freezer', value: 'freezer', icon: 'snow-outline' },
    { label: 'Pantry', value: 'pantry', icon: 'basket-outline' },
    { label: 'Shelf', value: 'shelf', icon: 'reorder-four-outline' },
    { label: 'Other', value: 'other', icon: 'cube-outline' },
];

const PROTECTED_NAMES = ['fridge', 'freezer', 'pantry'];

interface CreateStorageSheetProps {
    visible: boolean;
    onClose: () => void;
}

export const CreateStorageSheet = ({ visible, onClose }: CreateStorageSheetProps) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const createStorage = useCreateStorageLocation();

    const [name, setName] = useState('');
    const [selectedType, setSelectedType] = useState<any>('shelf');

    const handleCreate = async () => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            Alert.alert('Error', 'Please enter a name for the storage location.');
            return;
        }

        if (PROTECTED_NAMES.includes(trimmedName.toLowerCase())) {
            Alert.alert(
                'Reserved Name',
                `"${trimmedName}" is a reserved system name. Please use a more specific name like "Garage ${trimmedName}" (e.g., Garage ${trimmedName}).`
            );
            return;
        }

        try {
            await createStorage.mutateAsync({
                name: trimmedName,
                type: selectedType,
            });
            Alert.alert('Success', `"${trimmedName}" has been created!`);
            handleClose();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to create storage location.');
        }
    };

    const handleClose = () => {
        setName('');
        setSelectedType('shelf');
        onClose();
    };

    return (
        <BottomSheet
            visible={visible}
            onClose={handleClose}
            title="Create Storage"
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.scrollContent}
                >
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.neutral }]}>Storage Name</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, backgroundColor: colors.surface }]}
                            placeholder="e.g. Garage Fridge"
                            placeholderTextColor={colors.neutral}
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <Text style={[styles.label, { color: colors.neutral, marginBottom: 16 }]}>Storage Type</Text>
                    <View style={styles.typeGrid}>
                        {STORAGE_TYPES.map((type) => (
                            <TouchableOpacity
                                key={type.value}
                                style={[
                                    styles.typeButton,
                                    { backgroundColor: colors.surface },
                                    selectedType === type.value && { borderColor: colors.primary, borderWidth: 2 }
                                ]}
                                onPress={() => setSelectedType(type.value)}
                            >
                                <Ionicons
                                    name={type.icon as any}
                                    size={24}
                                    color={selectedType === type.value ? colors.primary : colors.neutral}
                                />
                                <Text style={[
                                    styles.typeText,
                                    { color: selectedType === type.value ? colors.text : colors.neutral }
                                ]}>
                                    {type.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[styles.createButton, { backgroundColor: colors.primary }]}
                        onPress={handleCreate}
                        disabled={createStorage.isPending}
                    >
                        <Text style={styles.createButtonText}>
                            {createStorage.isPending ? 'Creating...' : 'Create Storage'}
                        </Text>
                    </TouchableOpacity>

                    <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
                        <Ionicons name="information-circle-outline" size={20} color={colors.neutral} />
                        <Text style={[styles.infoText, { color: colors.neutral }]}>
                            Default storage (Fridge, Freezer, Pantry) are reserved for system use.
                        </Text>
                    </View>

                    {/* Safe space for keyboard / end of scroll */}
                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </BottomSheet>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingTop: 10,
        paddingBottom: 20,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    input: {
        height: 56,
        borderRadius: 14,
        paddingHorizontal: 16,
        fontSize: 17,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    typeButton: {
        width: '48%',
        paddingVertical: 18,
        borderRadius: 14,
        alignItems: 'center',
        gap: 8,
        borderWidth: 2,
        borderColor: 'transparent',
        marginBottom: 16,
    },
    typeText: {
        fontSize: 15,
        fontWeight: '700',
    },
    createButton: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    createButtonText: {
        color: 'white',
        fontSize: 17,
        fontWeight: '800',
    },
    infoBox: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 14,
        marginTop: 24,
        gap: 12,
        alignItems: 'center',
    },
    infoText: {
        fontSize: 12,
        flex: 1,
        lineHeight: 18,
        fontWeight: '500',
    }
});
