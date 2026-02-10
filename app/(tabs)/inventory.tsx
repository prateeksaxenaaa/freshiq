import { CreateStorageSheet } from '@/components/inventory/CreateStorageSheet';
import { BottomSheet } from '@/components/ui/BottomSheet';
import Colors from '@/constants/Colors';
import { useHousehold } from '@/contexts/HouseholdProvider';
import { useStorageLocations } from '@/hooks/useInventory';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// System defaults configuration
const SYSTEM_STORAGE_CONFIG: Record<string, any> = {
    'freezer': { icon: 'snow-outline', color: '#E0F2FE', textColor: '#0284C7' },
    'fridge': { icon: 'thermometer-outline', color: '#DCFCE7', textColor: '#16A34A' },
    'pantry': { icon: 'basket-outline', color: '#FEF3C7', textColor: '#D97706' },
    'shelf': { icon: 'reorder-four-outline', color: '#F1F5F9', textColor: '#475569' },
    'other': { icon: 'cube-outline', color: '#F8FAFC', textColor: '#64748B' },
};

export default function InventoryScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const { data: storageLocations, isLoading } = useStorageLocations();
    const { household } = useHousehold();
    const [isUploadSheetVisible, setUploadSheetVisible] = useState(false);
    const [isAddStorageVisible, setAddStorageVisible] = useState(false);

    // Self-healing: Ensure system storage locations exist
    React.useEffect(() => {
        const verifyDefaults = async () => {
            if (!household?.id || !storageLocations) return;

            const existingTypes = storageLocations.map(l => l.type?.toLowerCase());
            const defaults = [
                { name: 'Fridge', type: 'fridge' },
                { name: 'Freezer', type: 'freezer' },
                { name: 'Pantry', type: 'pantry' },
            ];

            for (const item of defaults) {
                if (!existingTypes.includes(item.type)) {
                    console.log(`Self-healing: Recreating ${item.name}`);
                    await supabase.from('storage_locations').insert({
                        household_id: household.id,
                        name: item.name,
                        type: item.type as any
                    });
                }
            }
        };

        if (!isLoading) {
            verifyDefaults();
        }
    }, [storageLocations, isLoading, household?.id]);

    const storageGridData = useMemo(() => {
        const formatted = (storageLocations || []).map(loc => {
            const type = (loc.type || loc.name || 'other').toLowerCase();
            const config = SYSTEM_STORAGE_CONFIG[type] ||
                SYSTEM_STORAGE_CONFIG[Object.keys(SYSTEM_STORAGE_CONFIG).find(k => type.includes(k)) || 'other'];

            return {
                ...loc,
                ...config
            };
        });
        return [...formatted, { id: 'add_new', name: 'Add Storage' }];
    }, [storageLocations]);

    const pickImage = async (mode: 'camera' | 'gallery') => {
        setUploadSheetVisible(false);

        try {
            let result;
            if (mode === 'camera') {
                const permission = await ImagePicker.requestCameraPermissionsAsync();
                if (permission.status !== 'granted') {
                    Alert.alert('Permission needed', 'Camera permission is required to scan items.');
                    return;
                }
                result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    quality: 0.5,
                });
            } else {
                const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (permission.status !== 'granted') {
                    Alert.alert('Permission needed', 'Gallery permission is required to import items.');
                    return;
                }
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    quality: 0.5,
                });
            }

            if (!result.canceled) {
                router.push({
                    pathname: '/inventory/review',
                    params: { imageUri: result.assets[0].uri }
                });
            }
        } catch (error) {
            console.error("Image Picker Error:", error);
            Alert.alert("Error", "Failed to pick image");
        }
    };

    const handleStoragePress = (id: string, name: string) => {
        router.push({
            pathname: '/storage/[id]',
            params: { id, name } // Pass name for header
        });
    };

    const renderStorageCard = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: item.color }]}
            onPress={() => handleStoragePress(item.id, item.name)}
        >
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.6)' }]}>
                <Ionicons name={item.icon as any} size={32} color={item.textColor} />
            </View>
            <Text style={[styles.cardTitle, { color: item.textColor }]}>{item.name}</Text>
            <View style={styles.arrowContainer}>
                <Ionicons name="arrow-forward" size={20} color={item.textColor} style={{ opacity: 0.6 }} />
            </View>
        </TouchableOpacity>
    );

    const renderAddCard = () => (
        <TouchableOpacity
            style={[styles.card, styles.addCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setAddStorageVisible(true)}
        >
            <View style={[styles.addIconContainer, { backgroundColor: colors.background }]}>
                <Ionicons name="add" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text, opacity: 0.8 }]}>Add Storage</Text>
            {/* Invisible spacer to match layout of other cards */}
            <View style={{ height: 20 }} />
        </TouchableOpacity>
    );

    if (isLoading && !storageLocations) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>My Kitchen</Text>
                <Text style={[styles.subtitle, { color: colors.neutral }]}>Manage your kitchen</Text>
            </View>

            <FlatList
                data={storageGridData}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                    if (item.id === 'add_new') return renderAddCard();
                    return renderStorageCard({ item });
                }}
            />

            <Pressable
                style={[styles.fab, { backgroundColor: colors.primary }]}
                onPress={() => setUploadSheetVisible(true)}
            >
                <Ionicons name="scan-outline" size={28} color="white" />
            </Pressable>

            <BottomSheet
                visible={isUploadSheetVisible}
                onClose={() => setUploadSheetVisible(false)}
                title="Add Items"
                minHeight={220} // Compact height for simpler icons
            >
                <View style={styles.sheetOptions}>
                    <TouchableOpacity
                        style={[styles.sheetButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => pickImage('gallery')}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="images" size={30} color={colors.primary} />
                        <Text style={[styles.sheetButtonText, { color: colors.text }]}>Gallery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.sheetButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => pickImage('camera')}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="camera" size={30} color={colors.primary} />
                        <Text style={[styles.sheetButtonText, { color: colors.text }]}>Camera</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>

            <CreateStorageSheet
                visible={isAddStorageVisible}
                onClose={() => setAddStorageVisible(false)}
            />
        </SafeAreaView>
    );
}

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
        paddingHorizontal: 20,
        paddingVertical: 20,
        marginBottom: 10,
    },
    title: {
        fontSize: 32, // Large title
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        marginTop: 4,
    },
    listContent: {
        padding: 20,
        paddingTop: 0,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        gap: 16, // Gap between columns
    },
    card: {
        flex: 1,
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        minHeight: 140,
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        maxWidth: '48%',
    },
    addCard: {
        borderWidth: 1,
        borderColor: '#E2E8F0', // Fallback color
        justifyContent: 'center',
        alignItems: 'center',
        borderStyle: 'solid',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30, // Circle
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 12,
    },
    arrowContainer: {
        alignSelf: 'flex-end',
    },
    // FAB
    fab: {
        position: 'absolute',
        bottom: 50,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sheetOptions: {
        flexDirection: 'row',
        gap: 16,
        paddingBottom: 10,
    },
    sheetButton: {
        flex: 1,
        height: 130, // Fixed height for consistency
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
    },
    sheetIconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    sheetButtonText: {
        fontSize: 15,
        fontWeight: '600',
    }
});
