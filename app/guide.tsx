import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function GuideScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    const ContentSection = ({
        title,
        subtitle,
        children,
        image,
        isComingSoon
    }: {
        title: string,
        subtitle?: string,
        children: React.ReactNode,
        image?: any,
        isComingSoon?: boolean
    }) => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
                {isComingSoon && (
                    <View style={[styles.comingSoonBadge, { backgroundColor: colors.accent + '20' }]}>
                        <Text style={[styles.comingSoonText, { color: colors.accent }]}>COMING SOON</Text>
                    </View>
                )}
            </View>

            {subtitle && (
                <Text style={[styles.sectionSubtitle, { color: colors.neutral }]}>{subtitle}</Text>
            )}

            {image ? (
                <Image source={image} style={styles.sectionImage} resizeMode="cover" />
            ) : (
                <View style={[styles.imagePlaceholder, { backgroundColor: colors.surface }]}>
                    <Ionicons name="image-outline" size={40} color={colors.neutral} />
                    <Text style={{ color: colors.neutral, marginTop: 8 }}>Screenshot Placeholder</Text>
                </View>
            )}

            <View style={styles.contentContainer}>
                {children}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Guides & Tips</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Header with Logo */}
                <View style={styles.logoContainer}>
                    <Image
                        source={require('@/assets/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={[styles.subtitle, { color: colors.neutral }]}>
                        Master your kitchen with FreshIQ
                    </Text>
                </View>

                {/* Introduction */}
                <View style={[styles.introCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.introTitle, { color: colors.text }]}>Welcome to FreshIQ! 🍳</Text>
                    <Text style={[styles.introText, { color: colors.neutral }]}>
                        Cooking should be fun, not a chore. Here's how you can use FreshIQ to save time and reduce food waste.
                    </Text>
                </View>

                {/* 1. Import Recipes Section */}
                <ContentSection title="Import Recipes">
                    <Text style={[styles.bodyText, { color: colors.neutral }]}>
                        Bring your favorite recipes from anywhere into your digital cookbook. Tap the <Text style={{ fontWeight: '700', color: colors.accent }}>(+) button</Text> on the home screen to see your options:
                    </Text>

                    <View style={styles.bulletList}>
                        <View style={styles.bulletItem}>
                            <Text style={[styles.bulletPoint, { color: colors.primary }]}>•</Text>
                            <View>
                                <Text style={[styles.bulletTitle, { color: colors.text }]}>Browser 🌐</Text>
                                <Text style={[styles.bulletDesc, { color: colors.neutral }]}>
                                    Find any recipe on the web. Our AI extracts it instantly. Great for blog posts!
                                </Text>
                            </View>
                        </View>

                        <View style={styles.bulletItem}>
                            <Text style={[styles.bulletPoint, { color: colors.primary }]}>•</Text>
                            <View>
                                <Text style={[styles.bulletTitle, { color: colors.text }]}>Camera 📸</Text>
                                <Text style={[styles.bulletDesc, { color: colors.neutral }]}>
                                    Take a photo of a physical cookbook or hand-written note. Magic OCR happens!
                                </Text>
                            </View>
                        </View>

                        <View style={styles.bulletItem}>
                            <Text style={[styles.bulletPoint, { color: colors.primary }]}>•</Text>
                            <View>
                                <Text style={[styles.bulletTitle, { color: colors.text }]}>Paste Link 🔗</Text>
                                <Text style={[styles.bulletDesc, { color: colors.neutral }]}>
                                    Copy URLs from YouTube or TikTok. We turn videos into readable recipes.
                                </Text>
                            </View>
                        </View>

                        <View style={styles.bulletItem}>
                            <Text style={[styles.bulletPoint, { color: colors.primary }]}>•</Text>
                            <View>
                                <Text style={[styles.bulletTitle, { color: colors.text }]}>From Scratch ✍️</Text>
                                <Text style={[styles.bulletDesc, { color: colors.neutral }]}>
                                    Have your own secret family recipe? Type it in manually and keep it safe.
                                </Text>
                            </View>
                        </View>
                    </View>
                </ContentSection>

                {/* 2. Managing Your Kitchen Section */}
                <ContentSection
                    title="Managing Your Kitchen"
                    subtitle="Turn your fridge into a high-performance workspace! ✨"
                >
                    <Text style={[styles.bodyText, { color: colors.neutral }]}>
                        FreshIQ helps you keep track of what you have so nothing goes to waste.
                    </Text>

                    <View style={styles.bulletList}>
                        <View style={styles.bulletItem}>
                            <Text style={[styles.bulletPoint, { color: colors.primary }]}>•</Text>
                            <Text style={[styles.bulletDesc, { color: colors.neutral }]}>
                                <Text style={{ fontWeight: '700', color: colors.text }}>Start with a Scan:</Text> Go to the Inventory tab and import your first items using your <Text style={{ color: colors.primary }}>Camera or Gallery</Text>. 🖼️
                            </Text>
                        </View>
                        <View style={styles.bulletItem}>
                            <Text style={[styles.bulletPoint, { color: colors.primary }]}>•</Text>
                            <Text style={[styles.bulletDesc, { color: colors.neutral }]}>
                                <Text style={{ fontWeight: '700', color: colors.text }}>Smart Tracking:</Text> Categorize items by Fridge, Pantry, or Freezer to find them in a flash. ⚡
                            </Text>
                        </View>
                        <View style={styles.bulletItem}>
                            <Text style={[styles.bulletPoint, { color: colors.primary }]}>•</Text>
                            <Text style={[styles.bulletDesc, { color: colors.neutral }]}>
                                <Text style={{ fontWeight: '700', color: colors.text }}>Low Stock Alerts:</Text> Never run out of milk again! (Coming soon) 🥛
                            </Text>
                        </View>
                    </View>
                </ContentSection>

                {/* 3. Weekly Planning Section */}
                <ContentSection
                    title="Weekly Planning"
                    isComingSoon={true}
                >
                    <Text style={[styles.bodyText, { color: colors.neutral }]}>
                        We're building a powerful tool to help you plan your week's meals in advance. 🗓️
                    </Text>
                    <View style={styles.teaserBox}>
                        <Ionicons name="sparkles" size={24} color={colors.accent} />
                        <Text style={[styles.teaserText, { color: colors.text }]}>
                            Soon you'll be able to drag and drop recipes into your week and auto-generate grocery lists!
                        </Text>
                    </View>
                </ContentSection>

                {/* 4. Pro Cooking Tips Section */}
                <ContentSection title="Pro Cooking Tips">
                    <View style={styles.bulletList}>
                        <View style={styles.bulletItem}>
                            <Text style={[styles.bulletPoint, { color: colors.primary }]}>•</Text>
                            <Text style={[styles.bulletDesc, { color: colors.neutral }]}>
                                <Text style={{ fontWeight: '700', color: colors.text }}>Prep First:</Text> Always read the recipe steps fully before starting your stove. 👨‍🍳
                            </Text>
                        </View>
                        <View style={styles.bulletItem}>
                            <Text style={[styles.bulletPoint, { color: colors.primary }]}>•</Text>
                            <Text style={[styles.bulletDesc, { color: colors.neutral }]}>
                                <Text style={{ fontWeight: '700', color: colors.text }}>Save Time:</Text> Use the "Import from Video" for long YouTube tutorials to skip the chatter. ⏩
                            </Text>
                        </View>
                        <View style={styles.bulletItem}>
                            <Text style={[styles.bulletPoint, { color: colors.primary }]}>•</Text>
                            <Text style={[styles.bulletDesc, { color: colors.neutral }]}>
                                <Text style={{ fontWeight: '700', color: colors.text }}>Organize:</Text> Add recipes to specific cookbooks like "Quick Weeknight" or "Fancy Dinner". 📚
                            </Text>
                        </View>
                        <View style={styles.bulletItem}>
                            <Text style={[styles.bulletPoint, { color: colors.primary }]}>•</Text>
                            <Text style={[styles.bulletDesc, { color: colors.neutral }]}>
                                <Text style={{ fontWeight: '700', color: colors.text }}>Scale Up:</Text> Use our recipe scaling to adjust ingredients for your guest count. ⚖️
                            </Text>
                        </View>
                    </View>
                </ContentSection>

                {/* Footer */}
                <View style={[styles.footer, { borderTopColor: colors.surface }]}>
                    <Text style={[styles.footerText, { color: colors.neutral }]}>
                        Stay hungry for more! ❤️{'\n'}The FreshIQ Team
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        padding: 24,
        paddingBottom: 60,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logo: {
        width: 150,
        height: 50,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    introCard: {
        padding: 24,
        borderRadius: 28,
        marginBottom: 40,
    },
    introTitle: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 6,
    },
    introText: {
        fontSize: 16,
        lineHeight: 24,
    },
    section: {
        marginBottom: 48,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    sectionSubtitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 20,
        lineHeight: 22,
    },
    comingSoonBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    comingSoonText: {
        fontSize: 10,
        fontWeight: '800',
    },
    imagePlaceholder: {
        width: '100%',
        height: 220,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionImage: {
        width: '100%',
        height: 220,
        borderRadius: 24,
        marginBottom: 20,
    },
    contentContainer: {
        paddingHorizontal: 4,
    },
    bodyText: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 20,
    },
    bulletList: {
        gap: 16,
    },
    bulletItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    bulletPoint: {
        fontSize: 20,
        marginRight: 10,
        marginTop: -2,
    },
    bulletTitle: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 4,
    },
    bulletDesc: {
        fontSize: 15,
        lineHeight: 22,
        flex: 1,
    },
    teaserBox: {
        padding: 20,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#f0f0f0',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    teaserText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        lineHeight: 20,
    },
    footer: {
        marginTop: 20,
        alignItems: 'center',
        borderTopWidth: 1,
        paddingTop: 40,
    },
    footerText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        fontStyle: 'italic',
    },
});
