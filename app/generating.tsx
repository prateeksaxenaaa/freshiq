import Colors from '@/constants/Colors';
import { useImportStatus } from '@/hooks/useRecipeImport';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GeneratingScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    // Use the new status hook
    const { data: importJob, error, refetch } = useImportStatus(id);

    // Effect to navigate when completed
    useEffect(() => {
        if (importJob?.status === 'completed' && importJob.recipe_id) {
            console.log("Import completed! Navigating to recipe:", importJob.recipe_id);
            // Small delay for smooth transition
            setTimeout(() => {
                router.replace(`/recipe/${importJob.recipe_id}`);
            }, 1000);
        }
    }, [importJob?.status, importJob?.recipe_id]);

    const handleRetry = () => {
        // Navigate back to modal to try again
        router.replace('/modal');
    };

    const handleCancel = () => {
        router.replace('/(tabs)/home');
    };

    if (!id) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.text }}>Invalid Import ID</Text>
                <TouchableOpacity onPress={handleCancel}><Text style={{ color: colors.primary }}>Go Home</Text></TouchableOpacity>
            </SafeAreaView>
        )
    }

    const renderContent = () => {
        if (error) {
            return (
                <View style={styles.center}>
                    <Ionicons name="alert-circle" size={48} color={colors.destructive} />
                    <Text style={[styles.title, { color: colors.text }]}>Connection Error</Text>
                    <Text style={[styles.subtitle, { color: colors.neutral }]}>Could not fetch status.</Text>
                    <TouchableOpacity style={[styles.button, { backgroundColor: colors.surface }]} onPress={() => refetch()}>
                        <Text style={{ color: colors.text }}>Retry Connection</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (!importJob) {
            return <ActivityIndicator size="large" color={colors.primary} />;
        }

        switch (importJob.status) {
            case 'failed':
                return (
                    <View style={styles.center}>
                        <Ionicons name="close-circle" size={64} color={colors.destructive} />
                        <Text style={[styles.title, { color: colors.text }]}>Import Failed</Text>
                        <Text style={[styles.subtitle, { color: colors.neutral }]}>
                            {importJob.error_message || "We couldn't extract the recipe from that link."}
                        </Text>
                        {importJob.confidence_score && (
                            <Text style={[styles.confidenceText, { color: colors.neutral }]}>
                                AI Confidence: {Math.round(importJob.confidence_score * 100)}%
                            </Text>
                        )}
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: colors.primary }]}
                            onPress={handleRetry}
                        >
                            <Text style={styles.buttonText}>Try Different Link</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleCancel} style={{ marginTop: 20 }}>
                            <Text style={{ color: colors.neutral }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                );

            case 'completed':
                return (
                    <View style={styles.center}>
                        <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
                        <Text style={[styles.title, { color: colors.text }]}>Recipe Ready!</Text>
                        {importJob.confidence_score && (
                            <Text style={[styles.confidenceText, { color: colors.primary }]}>
                                ✨ AI Confidence: {Math.round(importJob.confidence_score * 100)}%
                            </Text>
                        )}
                        <Text style={[styles.subtitle, { color: colors.neutral }]}>
                            Redirecting to recipe...
                        </Text>
                    </View>
                );

            case 'pending':
                return (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 20 }} />
                        <Text style={[styles.title, { color: colors.text }]}>Starting Analysis...</Text>
                        <Text style={[styles.subtitle, { color: colors.neutral }]}>
                            Fetching video metadata
                        </Text>
                        <Text style={[styles.statusTag, { color: colors.primary, backgroundColor: colors.surface }]}>
                            PENDING
                        </Text>
                    </View>
                );

            case 'processing':
                return (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 20 }} />
                        <Text style={[styles.title, { color: colors.text }]}>Analyzing Video...</Text>
                        <Text style={[styles.subtitle, { color: colors.neutral }]}>
                            AI is extracting recipe details
                        </Text>
                        <Text style={[styles.estimateText, { color: colors.neutral }]}>
                            This usually takes 10-20 seconds
                        </Text>
                        <Text style={[styles.statusTag, { color: colors.primary, backgroundColor: colors.surface }]}>
                            PROCESSING
                        </Text>
                    </View>
                );

            default:
                return (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                );
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {renderContent()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    center: {
        alignItems: 'center',
        width: '100%',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    confidenceText: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 16,
    },
    estimateText: {
        fontSize: 14,
        marginTop: 8,
        marginBottom: 16,
        fontStyle: 'italic',
    },
    button: {
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 16,
        minWidth: 200,
        alignItems: 'center',
        marginTop: 16,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    statusTag: {
        marginTop: 20,
        fontSize: 12,
        fontWeight: 'bold',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        overflow: 'hidden',
    }
});
