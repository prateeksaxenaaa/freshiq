import Colors from '@/constants/Colors';
import { useShoppingList } from '@/hooks/useShoppingList';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';

export const ShoppingListCard = () => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();
    const { items } = useShoppingList();

    const itemCount = items.filter(item => !item.is_purchased).length;

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/shopping-list')}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="cart" size={24} color={colors.primary} />
            </View>
            <View style={styles.textContainer}>
                <Text style={[styles.title, { color: colors.text }]}>Shopping List</Text>
                <Text style={[styles.subtitle, { color: colors.neutral }]}>
                    {itemCount === 0
                        ? 'No items to buy'
                        : `${itemCount} ${itemCount === 1 ? 'item' : 'items'} in your list`}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.neutral} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        marginBottom: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 2,
    },
});
