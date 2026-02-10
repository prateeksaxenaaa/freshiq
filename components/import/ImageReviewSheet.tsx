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
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string | null>(null); // Only for API
    const [mimeType, setMimeType] = useState<string>('image/jpeg');
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();
    const { session } = useAuth();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    // Mutation to handle upload & analyze
    const analyzeMutation = useMutation({
        mutationFn: async () => {
            console.log('[ImageReview] 1. Triggered');

            if (!imageBase64) {
                console.error('[ImageReview] No base64 data');
                throw new Error('No image data prepared');
            }
            if (!session?.user) {
                console.error('[ImageReview] No user session');
                throw new Error('Please log in first');
            }

            // Check size
            const len = imageBase64.length;
            const approxBytes = len * 0.75;
            const limitBytes = 5 * 1024 * 1024; // 5MB Limit

            console.log(`[ImageReview] 2. Size Check: ${len} chars (~${(approxBytes / 1024 / 1024).toFixed(2)} MB)`);

            if (approxBytes > limitBytes) {
                throw new Error(`Image is too large (${(approxBytes / 1024 / 1024).toFixed(2)} MB). Please pick a smaller image.`);
            }

            // 3. Create Import Record
            console.log('[ImageReview] 3. Creating DB Record...');
            const { data: importRec, error: importError } = await supabase
                .from('recipe_imports')
                .insert({
                    user_id: session.user.id,
                    source_type: 'image_scan',
                    status: 'pending',
                    content_payload: 'image_upload',
                })
                .select()
                .single();

            if (importError) throw importError;

            console.log(`[ImageReview] 4. Record Created: ${importRec.id}. Invoking function...`);

            // 4. Invoke Function
            const { data: funcData, error: funcError } = await supabase.functions.invoke('analyze-photo', {
                body: {
                    image_base64: imageBase64,
                    mime_type: mimeType,
                    import_id: importRec.id,
                    user_id: session.user.id,
                }
            });

            if (funcError) {
                console.error('[ImageReview] Function Transport Error:', funcError);
                throw funcError;
            }

            console.log('[ImageReview] 5. Function Response:', funcData?.success);

            if (funcData && !funcData.success) {
                throw new Error(funcData.error || 'Analysis failed in cloud');
            }

            return funcData;
        },
        onSuccess: (data) => {
            console.log('[ImageReview] Success flow');
            onClose();
            if (data.import_id) {
                router.push({
                    pathname: '/generating',
                    params: { id: data.import_id }
                });
            }
        },
        onError: (e) => {
            console.error('[ImageReview] Caught Error:', e);
            setError(e.message || 'Failed to analyze image.');
        }
    });

    const pickImage = async (useCamera: boolean) => {
        setError(null);
        try {
            // @ts-ignore
            const mediaType = ImagePicker.MediaType ? ImagePicker.MediaType.Images : ImagePicker.MediaTypeOptions.Images;

            const options: ImagePicker.ImagePickerOptions = {
                mediaTypes: mediaType,
                allowsEditing: true,
                quality: 0.3,
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
                console.log('[ImagePicker] Selected:', asset.uri);

                setImageUri(asset.uri); // Use URI for display (No crash)
                setImageBase64(asset.base64 || null); // Keep base64 for API

                // Determine mime type from extension or asset
                const uri = asset.uri.toLowerCase();
                if (uri.endsWith('.png')) setMimeType('image/png');
                else if (uri.endsWith('.webp')) setMimeType('image/webp');
                else setMimeType('image/jpeg');
            }
        } catch (e) {
            console.error('[ImagePicker] Error:', e);
            setError('Failed to pick image.');
        }
    };

    // Initial View: Choose Source
    if (!imageUri) {
        return (
            <View style={styles.container}>
                <Text style={[styles.description, { color: colors.text }]}>
                    Scan a recipe from a cookbook, magazine, or handwritten note to instantly import it.
                </Text>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => pickImage(true)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="camera" size={32} color={colors.primary} />
                        <Text style={[styles.actionLabel, { color: colors.text }]}>Take Photo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => pickImage(false)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="images" size={32} color={colors.primary} />
                        <Text style={[styles.actionLabel, { color: colors.text }]}>Gallery</Text>
                    </TouchableOpacity>
                </View>

                {error && <Text style={styles.errorText}>{error}</Text>}
            </View>
        );
    }

    // Review View
    return (
        <View style={styles.container}>
            <View style={styles.reviewHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Review</Text>
                <TouchableOpacity onPress={() => { setImageUri(null); setImageBase64(null); }}>
                    <Ionicons name="close-circle" size={24} color={colors.neutral} />
                </TouchableOpacity>
            </View>

            <Image
                source={{ uri: imageUri }}
                style={styles.previewImage}
                resizeMode="contain"
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.footerActions}>
                <TouchableOpacity
                    style={[styles.secondaryButton, { borderColor: colors.border }]}
                    onPress={() => { setImageUri(null); setImageBase64(null); }}
                    disabled={analyzeMutation.isPending}
                >
                    <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Retake</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                    onPress={() => analyzeMutation.mutate()}
                    disabled={analyzeMutation.isPending}
                >
                    {analyzeMutation.isPending ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Ionicons name="sparkles" size={18} color="white" style={{ marginRight: 8 }} />
                            <Text style={styles.primaryButtonText}>Analyze Recipe</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 10,
    },
    description: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 22,
        opacity: 0.8,
        paddingHorizontal: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 20,
    },
    actionCard: {
        flex: 1,
        height: 140,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionLabel: {
        fontSize: 16,
        fontWeight: '700',
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    previewImage: {
        width: '100%',
        height: 380,
        borderRadius: 20,
        marginBottom: 20,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    errorText: {
        color: '#EF4444',
        marginBottom: 16,
        textAlign: 'center',
        fontSize: 14,
    },
    footerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    secondaryButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    primaryButton: {
        flex: 2,
        flexDirection: 'row',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    }
});
