import Colors from '@/constants/Colors';
import { useRecipeImport } from '@/hooks/useRecipeImport';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';

interface PasteLinkSheetProps {
    onClose: () => void;
}

export const PasteLinkSheet = ({ onClose }: PasteLinkSheetProps) => {
    const [url, setUrl] = useState('');
    const [validationError, setValidationError] = useState<string | null>(null);
    const { createImport, isCreating } = useRecipeImport();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const validateUrl = (text: string) => {
        setUrl(text);
        setValidationError(null);

        if (!text) return;

        const isValid =
            text.includes('youtube.com') ||
            text.includes('youtu.be') ||
            text.includes('instagram.com') ||
            text.includes('tiktok.com');

        if (!isValid) {
            setValidationError('Please enter a valid YouTube, Instagram, or TikTok link.');
        }
    };

    const handleSubmit = async () => {
        if (!url || validationError) return;

        try {
            const data = await createImport(url);
            onClose();
            // Navigate to Generating Screen with the new ID
            router.push({
                pathname: '/generating',
                params: { id: data.id }
            });
        } catch (e) {
            console.error('Import failed', e);
            setValidationError('Failed to start import. Please try again.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={[styles.label, { color: colors.text }]}>
                Paste a video link from YouTube, Instagram, or TikTok
            </Text>

            <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
                <Ionicons name="link-outline" size={20} color={colors.neutral} style={styles.icon} />
                <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="https://..."
                    placeholderTextColor={colors.neutral}
                    value={url}
                    onChangeText={validateUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>

            {validationError && (
                <Text style={styles.errorText}>
                    <Ionicons name="alert-circle" size={14} /> {validationError}
                </Text>
            )}

            <TouchableOpacity
                style={[
                    styles.button,
                    { backgroundColor: colors.primary },
                    (!url || !!validationError || isCreating) && styles.buttonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!url || !!validationError || isCreating}
            >
                {isCreating ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.buttonText}>Generate recipe</Text>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingBottom: 40,
    },
    label: {
        fontSize: 14,
        marginBottom: 12,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 50,
        marginBottom: 8,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        height: '100%',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        marginBottom: 12,
        marginLeft: 4,
    },
    button: {
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
