import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    useColorScheme
} from 'react-native';

export default function LanguageScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ title: 'Language' }} />

            <View style={styles.content}>
                <Ionicons name="language-outline" size={80} color={colors.surface} />
                <Text style={[styles.title, { color: colors.text }]}>Feature Coming Soon</Text>
                <Text style={[styles.subtitle, { color: colors.neutral }]}>
                    We are working hard to bring multi-language support to FreshIQ. Stay tuned for future updates!
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        gap: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
});
