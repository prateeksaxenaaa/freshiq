import Colors from '@/constants/Colors';
import { useSubscription } from '@/hooks/useSubscription';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';

import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SubscriptionsScreen() {
    const { subscription, isSubLoading, billingHistory, isBillingLoading } = useSubscription();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const renderBillingItem = ({ item }: { item: any }) => (
        <View style={[styles.billingCard, { backgroundColor: colors.surface }]}>
            <View style={styles.billingLeft}>
                <View style={[styles.billingIcon, { backgroundColor: colors.background }]}>
                    <Ionicons name="receipt-outline" size={20} color={colors.primary} />
                </View>
                <View>
                    <Text style={[styles.billingDate, { color: colors.text }]}>
                        {new Date(item.billing_date).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                        })}
                    </Text>
                    <Text style={[styles.billingStatus, { color: item.status === 'paid' ? colors.primary : colors.destructive }]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            </View>
            <View style={styles.billingRight}>
                <Text style={[styles.billingAmount, { color: colors.text }]}>
                    {item.currency === 'USD' ? '$' : item.currency}
                    {item.amount.toFixed(2)}
                </Text>
                {item.invoice_url && (
                    <TouchableOpacity onPress={() => Linking.openURL(item.invoice_url)}>
                        <Ionicons name="download-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    if (isSubLoading || isBillingLoading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ title: 'My Subscriptions' }} />
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const isActive = subscription && new Date(subscription.valid_until) > new Date();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Standard Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>My Subscriptions</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Active Plan Card */}
                <View style={[styles.planCard, { backgroundColor: isActive ? colors.primary : colors.surface }]}>
                    <View style={styles.planHeader}>
                        <View style={styles.planInfo}>
                            <Text style={[styles.planLabel, { color: isActive ? 'white' : colors.neutral }]}>CHOSEN PLAN</Text>
                            <Text style={[styles.planTitle, { color: isActive ? 'white' : colors.text }]}>
                                {isActive ? (subscription?.tier === 'pro' ? 'FreshIQ Pro' : 'Premium') : 'Free Plan'}
                            </Text>
                        </View>
                        <Ionicons name={isActive ? "shield-checkmark" : "alert-circle"} size={32} color={isActive ? "white" : colors.neutral} />
                    </View>

                    {isActive ? (
                        <View style={styles.planDetails}>
                            <Text style={styles.expiryText}>
                                Renews on {new Date(subscription.valid_until).toLocaleDateString()}
                            </Text>
                            <TouchableOpacity style={styles.manageButton}>
                                <Text style={[styles.manageButtonText, { color: colors.primary }]}>Manage Plan</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.planDetails}>
                            <Text style={[styles.expiryText, { color: colors.neutral }]}>
                                No active subscription found. Unlock pro features to level up your kitchen!
                            </Text>
                            <TouchableOpacity
                                style={[styles.upgradeButton, { backgroundColor: isActive ? 'white' : colors.primary }]}
                                onPress={() => console.log('Upgrade pressed')}
                            >
                                <Text style={[styles.upgradeButtonText, { color: isActive ? colors.primary : 'white' }]}>View Plans</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Billing History Section */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Billing History</Text>

                {billingHistory.length > 0 ? (
                    <View style={styles.billingList}>
                        {billingHistory.map((item) => (
                            <View key={item.id}>
                                {renderBillingItem({ item })}
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="receipt-outline" size={48} color={colors.surface} />
                        <Text style={[styles.emptyText, { color: colors.neutral }]}>No payment history found</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

// Fixed import for ScrollView
import { ScrollView } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        marginRight: 6,
        padding: 4,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    scrollContent: {
        padding: 20,
    },
    planCard: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    planInfo: {
        flex: 1,
    },
    planLabel: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 4,
    },
    planTitle: {
        fontSize: 24,
        fontWeight: '800',
    },
    planDetails: {
        gap: 16,
    },
    expiryText: {
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 20,
    },
    manageButton: {
        backgroundColor: 'white',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    manageButtonText: {
        fontSize: 14,
        fontWeight: '700',
    },
    upgradeButton: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    upgradeButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
        marginLeft: 4,
    },
    billingList: {
        gap: 12,
    },
    billingCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
    },
    billingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    billingIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    billingDate: {
        fontSize: 14,
        fontWeight: '600',
    },
    billingStatus: {
        fontSize: 11,
        fontWeight: '700',
        marginTop: 2,
    },
    billingRight: {
        alignItems: 'flex-end',
        gap: 4,
    },
    billingAmount: {
        fontSize: 14,
        fontWeight: '700',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 40,
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
        fontWeight: '500',
    }
});
