import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, useColorScheme } from 'react-native';

interface NewCookbookCardProps {
    onPress: () => void;
}

export const NewCookbookCard = ({ onPress }: NewCookbookCardProps) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <TouchableOpacity
                style={[styles.card, { borderColor: colors.accent }]}
                onPress={onPress}
            >
                <Ionicons name="add" size={40} color={colors.accent} />
            </TouchableOpacity>
            <Text style={[styles.label, { color: colors.text }]}>New cookbook</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '48%',
        marginBottom: 20,
    },
    card: {
        width: '100%',
        aspectRatio: 1.3, // Rectangular shape like ReciMe
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
    },
});
