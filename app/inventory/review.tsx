import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ReviewScreen() {
    const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
    const router = useRouter();
    const { session } = useAuth();
    const user = session?.user;
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [analyzedItems, setAnalyzedItems] = useState<any[]>([]);
    const [storageLocations, setStorageLocations] = useState<any[]>([]);

    useEffect(() => {
        const fetchLocations = async () => {
            if (!user?.id) return;
            // Fetch household_id first
            const { data: member } = await supabase
                .from('household_members')
                .select('household_id')
                .eq('user_id', user.id)
                .single();

            if (member?.household_id) {
                const { data } = await supabase
                    .from('storage_locations')
                    .select('*')
                    .eq('household_id', member.household_id);
                if (data) setStorageLocations(data);
            }
        };
        fetchLocations();
    }, [user?.id]);

    const handleAnalyze = async () => {
        if (!imageUri || !user) return;
        setIsAnalyzing(true);
        try {
            // 1. Compress Image (Resize to max 1024px width, 50% quality)
            const manipulatedImage = await ImageManipulator.manipulateAsync(
                imageUri,
                [{ resize: { width: 1024 } }],
                { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
            );

            // 2. Read Compressed Image as Base64
            const base64 = await FileSystem.readAsStringAsync(manipulatedImage.uri, {
                encoding: 'base64',
            });
            const fileName = `${user.id}/${Date.now()}.jpg`;

            // 3. Upload to Storage (Using decode from base64-arraybuffer)
            const { error: uploadError } = await supabase.storage
                .from('grocery-images')
                .upload(fileName, decode(base64), {
                    contentType: 'image/jpeg',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // 3. Analyze with Edge Function (Direct Fetch for Debugging)
            const functionUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/analyze-grocery`;

            console.log("Analyzing image at:", fileName);
            console.log("Calling Function:", functionUrl);

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({ image_path: fileName })
            });

            const text = await response.text();
            console.log("Function Response Status:", response.status);
            console.log("Function Response Body:", text);

            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
            }

            if (!response.ok) {
                throw new Error(data.error || `Server Error: ${response.status}`);
            }

            // Handle custom error returned as 200 OK (for debugging)
            if (data?.error) {
                throw new Error(data.error);
            }

            if (data?.items) {
                setAnalyzedItems(data.items);
            } else {
                throw new Error("No items found");
            }

        } catch (e: any) {
            console.error("Analysis Error:", e);
            Alert.alert("Error", e.message || "Failed to analyze image.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSaveItems = async () => {
        if (analyzedItems.length === 0 || !user) return;
        setIsSaving(true);
        try {
            // Get household_id
            const { data: member } = await supabase
                .from('household_members')
                .select('household_id')
                .eq('user_id', user.id)
                .single();

            const householdId = member?.household_id;
            if (!householdId) throw new Error("No household found.");

            const itemsToInsert = analyzedItems.map(item => {
                // Find matching storage ID
                const storageLoc = storageLocations.find(
                    loc => loc.name.toLowerCase() === (item.storage_type || '').toLowerCase()
                );
                // Default to Pantry if not found, or first available location
                const finalStorageId = storageLoc?.id || storageLocations.find(l => l.name === 'Pantry')?.id || storageLocations[0]?.id;

                return {
                    household_id: householdId,
                    name: item.name,
                    quantity: item.quantity || 1,
                    unit: item.unit || 'pcs',
                    storage_id: finalStorageId,
                    // confidence_score: item.confidence // Optional
                };
            });

            const { error } = await supabase.from('inventory_items').insert(itemsToInsert);
            if (error) throw error;

            Alert.alert("Success", "Items added to My Kitchen!", [
                { text: "OK", onPress: () => router.push('/(tabs)/inventory') }
            ]);

        } catch (e: any) {
            Alert.alert("Error", "Failed to save items: " + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Review Import</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {imageUri && (
                    <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
                )}

                {isAnalyzing ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={[styles.loadingText, { color: colors.neutral }]}>Analyzing your groceries...</Text>
                        <Text style={{ color: colors.neutral, fontSize: 12, marginTop: 4 }}>(This may take a few seconds)</Text>
                    </View>
                ) : (
                    <View style={styles.actions}>
                        {analyzedItems.length === 0 ? (
                            <TouchableOpacity
                                style={[styles.analyzeBtn, { backgroundColor: colors.primary }]}
                                onPress={handleAnalyze}
                            >
                                <Ionicons name="sparkles" size={20} color="white" style={{ marginRight: 8 }} />
                                <Text style={styles.btnText}>Analyze Photo</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={{ width: '100%' }}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Detected {analyzedItems.length} Items:</Text>
                                {analyzedItems.map((item, index) => (
                                    <View key={index} style={[styles.itemCard, { backgroundColor: colors.surface }]}>
                                        <View>
                                            <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                                            <Text style={{ color: colors.neutral }}>
                                                {item.quantity} {item.unit} • {item.storage_type || 'Pantry'} • {item.freshness_status || 'Good'}
                                            </Text>
                                        </View>
                                        <TouchableOpacity onPress={() => {
                                            const newItems = [...analyzedItems];
                                            newItems.splice(index, 1);
                                            setAnalyzedItems(newItems);
                                        }}>
                                            <Ionicons name="close-circle" size={24} color={colors.neutral} />
                                        </TouchableOpacity>
                                    </View>
                                ))}

                                <TouchableOpacity
                                    style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                                    onPress={handleSaveItems}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={styles.btnText}>Save All to Inventory</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 24, fontWeight: '700' },
    content: { padding: 20, paddingBottom: 50 },
    previewImage: { width: '100%', height: 300, borderRadius: 16, marginBottom: 20, backgroundColor: '#f0f0f0' },
    loadingContainer: { alignItems: 'center', marginTop: 20 },
    loadingText: { marginTop: 12, fontSize: 16 },
    actions: { alignItems: 'center', width: '100%' },
    analyzeBtn: { flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 30, alignItems: 'center' },
    btnText: { color: 'white', fontWeight: '600', fontSize: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, alignSelf: 'flex-start' },
    itemCard: {
        width: '100%',
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    itemName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    saveBtn: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 20,
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2
    }
});
