import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MealPlanScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* 1. Top App Bar */}
            <View style={[styles.appBar, { backgroundColor: colors.background }]}>
                <Image
                    source={require('@/assets/logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* 2. Main Title */}
                <View style={styles.headerSection}>
                    <Text style={[styles.title, { color: colors.text }]}>Meal Plan</Text>
                    <View style={[styles.badge, { backgroundColor: colors.accent + '20' }]}>
                        <Text style={[styles.badgeText, { color: colors.accent }]}>COMING SOON</Text>
                    </View>
                </View>

                {/* 3. Hero Visual */}
                <View style={[styles.heroCard, { backgroundColor: colors.surface }]}>
                    <View style={styles.illustrationContainer}>
                        <Ionicons name="calendar" size={80} color={colors.primary} style={{ opacity: 0.2 }} />
                        <Ionicons
                            name="restaurant"
                            size={40}
                            color={colors.primary}
                            style={{ position: 'absolute', top: 20, right: -10 }}
                        />
                        <Ionicons
                            name="checkbox"
                            size={30}
                            color={colors.accent}
                            style={{ position: 'absolute', bottom: 10, left: -10 }}
                        />
                    </View>
                    <Text style={[styles.heroTitle, { color: colors.text }]}>Planning made perfect</Text>
                    <Text style={[styles.heroText, { color: colors.neutral }]}>
                        Say goodbye to "What's for dinner?" We're building the ultimate kitchen assistant.
                    </Text>
                </View>

                {/* 4. Feature List */}
                <View style={styles.featureList}>
                    <FeatureItem
                        icon="move-outline"
                        title="Drag & Drop Scheduling"
                        desc="Easily plan your entire week by dragging your favorite recipes into the calendar."
                        colors={colors}
                    />
                    <FeatureItem
                        icon="list-outline"
                        title="Auto-Grocery Lists"
                        desc="FreshIQ will automatically combine ingredients from your plan into a smart shopping list."
                        colors={colors}
                    />
                    <FeatureItem
                        icon="notifications-outline"
                        title="Defrost Reminders"
                        desc="Get notified when it's time to take ingredients out of the freezer for tomorrow's meal."
                        colors={colors}
                    />
                </View>

                {/* 5. Call to Action */}
                <TouchableOpacity
                    style={[styles.ctaButton, { backgroundColor: colors.primary }]}
                    onPress={() => router.push('/feedback')}
                >
                    <Text style={styles.ctaText}>VOTE FOR THIS FEATURE</Text>
                    <Ionicons name="arrow-forward" size={18} color="white" />
                </TouchableOpacity>

                <Text style={[styles.footerText, { color: colors.neutral }]}>
                    Want it sooner? Upvote it in our Feedback portal!
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const FeatureItem = ({ icon, title, desc, colors }: any) => (
    <View style={styles.featureItem}>
        <View style={[styles.iconBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Ionicons name={icon} size={24} color={colors.primary} />
        </View>
        <View style={styles.featureText}>
            <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.featureDesc, { color: colors.neutral }]}>{desc}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    appBar: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 4,
        justifyContent: 'center',
        height: 68,
    },
    logoImage: {
        width: 120,
        height: 40,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    headerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        gap: 12,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -1,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '900',
    },
    heroCard: {
        padding: 30,
        borderRadius: 32,
        alignItems: 'center',
        textAlign: 'center',
        marginBottom: 32,
    },
    illustrationContainer: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    heroTitle: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 10,
    },
    heroText: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    featureList: {
        gap: 24,
        marginBottom: 40,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 4,
    },
    featureDesc: {
        fontSize: 14,
        lineHeight: 20,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 20,
        gap: 10,
        marginBottom: 16,
    },
    ctaText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
    },
    footerText: {
        fontSize: 13,
        textAlign: 'center',
        opacity: 0.8,
    },
});

