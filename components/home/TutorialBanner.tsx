import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, useColorScheme } from 'react-native';

interface TutorialBannerProps {
    onPress: () => void;
}

export const TutorialBanner = ({ onPress }: TutorialBannerProps) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: colors.surface }]}
            onPress={onPress}
        >
            <Text style={[styles.text, { color: colors.text }]}>🚀 Import guides & tips</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.neutral} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
    },
});
