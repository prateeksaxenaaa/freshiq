import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';

interface ImageReviewSheetProps {
    onClose: () => void;
    initialImage?: string; // If pre-selected (not used yet but good for future)
}

export const ImageReviewSheet = ({ onClose }: ImageReviewSheetProps) => {
    const [image, setImage] = useState<string | null>(null);
    const [mimeType, setMimeType] = useState<string>('image/jpeg');
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();
    const { session } = useAuth();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    // Mutation to handle upload & analyze
    const analyzeMutation = useMutation({
        mutationFn: async () => {
            if (!image || !session?.user) return;

            // 1. Convert URI to Base64 (if not already)
            // expo-image-picker returns base64 if requested
            let base64 = image;
            if (image.startsWith('data:')) {
                base64 = image.split(',')[1];
            }

            // 2. Create Import Record
            const { data: importRec, error: importError } = await supabase
                .from('recipe_imports')
                .insert({
                    user_id: session.user.id,
                    source_type: 'image_scan',
                    status: 'pending',
                    content_payload: 'image_upload', // Placeholder
                })
                .select()
                .single();

            if (importError) throw importError;

            // 3. Invoke Analyze Function
            const { data: funcData, error: funcError } = await supabase.functions.invoke('analyze-photo', {
                body: {
                    image_base64: base64,
                    mime_type: mimeType,
                    import_id: importRec.id,
                    user_id: session.user.id,
                }
            });

            if (funcError) throw funcError;
            if (funcData && !funcData.success) throw new Error(funcData.error || 'Analysis failed');

            return funcData;
        },
        onSuccess: (data) => {
            onClose();
            // Navigate to generating screen or recipe directly if done
            if (data.import_id) {
                router.push({
                    pathname: '/generating',
                    params: { id: data.import_id }
                });
            }
        },
        onError: (e) => {
            console.error('Image analysis failed:', e);
            setError('Failed to analyze image. Please try again.');
        }
    });

    const pickImage = async (useCamera: boolean) => {
        setError(null);
        try {
            const options: ImagePicker.ImagePickerOptions = {
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
                base64: true,
            };

            let result;
            if (useCamera) {
                await ImagePicker.requestCameraPermissionsAsync();
                result = await ImagePicker.launchCameraAsync(options);
            } else {
                await ImagePicker.requestMediaLibraryPermissionsAsync();
                result = await ImagePicker.launchImageLibraryAsync(options);
            }

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                setImage(asset.base64 || null); // We need base64 for the Edge Function
                // If base64 is missing (sometimes happens on Android without explicit option), we might need to read it.
                // But `base64: true` usually ensures it.

                // Determine mime type from extension or asset
                const uri = asset.uri.toLowerCase();
                if (uri.endsWith('.png')) setMimeType('image/png');
                else if (uri.endsWith('.webp')) setMimeType('image/webp');
                else setMimeType('image/jpeg');
            }
        } catch (e) {
            console.error('Image picker error:', e);
            setError('Failed to pick image.');
        }
    };

    // Initial View: Choose Source
    if (!image) {
        return (
            <View style={styles.container}>
                <Text style={[styles.title, { color: colors.text }]}>Add a Recipe Image</Text>
                <Text style={[styles.subtitle, { color: colors.neutral }]}>
                    Take a photo of a dish, cookbook page, or handwritten note.
                </Text>

                <View style={styles.row}>
                    <TouchableOpacity
                        style={[styles.bigButton, { backgroundColor: colors.surface }]}
                        onPress={() => pickImage(true)}
                    >
                        <Ionicons name="camera" size={32} color={colors.primary} />
                        <Text style={[styles.buttonLabel, { color: colors.text }]}>Camera</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.bigButton, { backgroundColor: colors.surface }]}
                        onPress={() => pickImage(false)}
                    >
                        <Ionicons name="images" size={32} color={colors.accent} />
                        <Text style={[styles.buttonLabel, { color: colors.text }]}>Gallery</Text>
                    </TouchableOpacity>
                </View>

                {error && <Text style={styles.errorText}>{error}</Text>}
            </View>
        );
    }

    // Review View
    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: colors.text }]}>Review Image</Text>

            <Image
                source={{ uri: `data:${mimeType};base64,${image}` }}
                style={styles.previewImage}
                resizeMode="contain"
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={[styles.textButton]}
                    onPress={() => setImage(null)}
                    disabled={analyzeMutation.isPending}
                >
                    <Text style={{ color: colors.neutral }}>Retake</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                    onPress={() => analyzeMutation.mutate()}
                    disabled={analyzeMutation.isPending}
                >
                    {analyzeMutation.isPending ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.primaryButtonText}>Analyze Recipe</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        width: '100%',
    },
    bigButton: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        maxWidth: 140,
    },
    buttonLabel: {
        marginTop: 12,
        fontWeight: '500',
    },
    previewImage: {
        width: '100%',
        height: 300,
        borderRadius: 12,
        marginBottom: 20,
    },
    errorText: {
        color: '#EF4444',
        marginBottom: 10,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        alignItems: 'center',
    },
    textButton: {
        padding: 12,
    },
    primaryButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        minWidth: 120,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: 'white',
        fontWeight: '600',
    }
});
