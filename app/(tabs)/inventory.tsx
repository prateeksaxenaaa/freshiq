import { BottomSheet } from '@/components/ui/BottomSheet';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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

// Hardcoded defaults for Phase 1
const DEFAULT_STORAGE = [
    { id: 'freezer', name: 'Freezer', icon: 'snow', color: '#E0F2FE', textColor: '#0284C7' },
    { id: 'fridge', name: 'Fridge', icon: 'thermometer-outline', color: '#DCFCE7', textColor: '#16A34A' }, // Greenish for Fresh
    { id: 'pantry', name: 'Pantry', icon: 'nutrition-outline', color: '#FEF3C7', textColor: '#D97706' },
];

export default function InventoryScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    // State for Phase 3
    const [isUploadSheetVisible, setUploadSheetVisible] = useState(false);

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

    const renderStorageCard = ({ item }: { item: typeof DEFAULT_STORAGE[0] }) => (
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
            onPress={() => console.log("Add Storage Clicked")}
        >
            <View style={[styles.addIconContainer, { backgroundColor: colors.background }]}>
                <Ionicons name="add" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text, opacity: 0.8 }]}>Add Storage</Text>
            {/* Invisible spacer to match layout of other cards */}
            <View style={{ height: 20 }} />
        </TouchableOpacity>
    );

    const data = [...DEFAULT_STORAGE, { id: 'add_new', name: 'Add Storage' }];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>My Kitchen</Text>
                <Text style={[styles.subtitle, { color: colors.neutral }]}>Manage your inventory</Text>
            </View>

            {/* Storage Grid */}
            <FlatList
                data={data}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                    if (item.id === 'add_new') return renderAddCard();
                    return renderStorageCard({ item: item as any });
                }}
            />

            {/* Green FAB for Item Upload (Phase 3 Prep) */}
            <Pressable
                style={[styles.fab, { backgroundColor: '#4ADE80' }]} // Green as requested
                onPress={() => setUploadSheetVisible(true)}
            >
                <Ionicons name="scan-outline" size={28} color="white" />
            </Pressable>

            {/* Upload Bottom Sheet (Placeholder) */}
            <BottomSheet
                visible={isUploadSheetVisible}
                onClose={() => setUploadSheetVisible(false)}
                title="Add Items"
            >
                <View style={styles.sheetOptions}>
                    <TouchableOpacity
                        style={[styles.sheetButton, { backgroundColor: colors.surface }]}
                        onPress={() => pickImage('gallery')}
                    >
                        <Ionicons name="images-outline" size={24} color={colors.primary} />
                        <Text style={[styles.sheetButtonText, { color: colors.text }]}>Gallery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.sheetButton, { backgroundColor: colors.surface }]}
                        onPress={() => pickImage('camera')}
                    >
                        <Ionicons name="camera-outline" size={24} color={colors.primary} />
                        <Text style={[styles.sheetButtonText, { color: colors.text }]}>Camera</Text>
                    </TouchableOpacity>
                </View>
            </BottomSheet>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        borderRadius: 24,
        padding: 20,
        marginBottom: 16, // Gap between rows (handled by numColumns? No needs margin) 
        // Actually Gap is better if supported, but margin safe.
        minHeight: 160,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        marginHorizontal: 0, // Handled by columnWrapper space-between? 
        // With space-between and 2 columns, we rely on container width.
        // Better to use gap in columnWrapperStyle if React Native > 0.71
        maxWidth: '48%', // Ensure 2 columns fit
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
        bottom: 20,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    sheetOptions: {
        flexDirection: 'row',
        gap: 16,
    },
    sheetButton: {
        flex: 1,
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        gap: 10,
    },
    sheetButtonText: {
        fontWeight: '600',
    }
});
