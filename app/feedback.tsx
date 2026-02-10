import Colors from '@/constants/Colors';
import { FeatureRequest, useFeedback } from '@/hooks/useFeedback';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    LayoutAnimation,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View,
    useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TABS = [
    { key: 'open', label: 'Open' },
    { key: 'implementing', label: 'Implementing' },
    { key: 'implemented', label: 'Implemented' }
];

export default function FeedbackScreen() {
    const { features, isLoading, toggleUpvote } = useFeedback();
    const [activeTab, setActiveTab] = useState('open');
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const router = useRouter();
    const scrollRef = useRef<ScrollView>(null);

    const onTabPress = (index: number) => {
        setActiveTab(TABS[index].key);
        scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    };

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / SCREEN_WIDTH);
        if (TABS[index] && TABS[index].key !== activeTab) {
            setActiveTab(TABS[index].key);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Feedback & Ideas</Text>
            </View>

            {/* Note Section */}
            <View style={[styles.noteBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
                <View style={styles.noteTextContainer}>
                    <Text style={[styles.noteText, { color: colors.text }]}>
                        Email feedback to <Text style={{ color: colors.primary, fontWeight: '700' }}>feedback@freshiqapp.com</Text>.
                    </Text>
                    <Text style={[styles.noteSubText, { color: colors.neutral }]}>
                        Community votes weekly. Top 3 get built.
                    </Text>
                </View>
            </View>

            {/* Custom Tabs */}
            <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
                {TABS.map((tab, index) => {
                    const isActive = activeTab === tab.key;
                    return (
                        <TouchableOpacity
                            key={tab.key}
                            style={[
                                styles.tab,
                                isActive && { borderBottomColor: colors.primary, borderBottomWidth: 3 }
                            ]}
                            onPress={() => onTabPress(index)}
                        >
                            <Text style={[
                                styles.tabLabel,
                                { color: isActive ? colors.text : colors.neutral },
                                isActive && { fontWeight: '700' }
                            ]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <ScrollView
                    ref={scrollRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={handleScroll}
                    style={{ flex: 1 }}
                >
                    {TABS.map((tab) => {
                        const tabFeatures = features.filter(f => f.status === tab.key);
                        return (
                            <View key={tab.key} style={{ width: SCREEN_WIDTH }}>
                                <ScrollView
                                    contentContainerStyle={styles.listContent}
                                    showsVerticalScrollIndicator={false}
                                >
                                    {tabFeatures.length > 0 ? (
                                        tabFeatures.map(item => (
                                            <FeatureCard
                                                key={item.id}
                                                feature={item}
                                                colors={colors}
                                                onUpvote={() => toggleUpvote(item.id)}
                                            />
                                        ))
                                    ) : (
                                        <View style={styles.emptyState}>
                                            <Ionicons name="bulb-outline" size={64} color={colors.border} />
                                            <Text style={[styles.emptyText, { color: colors.neutral }]}>
                                                No features in this category yet.
                                            </Text>
                                        </View>
                                    )}
                                </ScrollView>
                            </View>
                        );
                    })}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

function FeatureCard({ feature, colors, onUpvote }: { feature: FeatureRequest, colors: any, onUpvote: () => void }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        setIsExpanded(!isExpanded);
    };

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={toggleExpand}
            style={[styles.card, { backgroundColor: colors.surface }]}
        >
            <View style={styles.cardMain}>
                <View style={styles.cardLeft}>
                    <Text
                        style={[styles.featureTitle, { color: colors.text }]}
                        numberOfLines={2}
                    >
                        {feature.title}
                    </Text>
                    {!isExpanded && (
                        <Text
                            style={[styles.featureDescriptionShort, { color: colors.neutral }]}
                            numberOfLines={1}
                        >
                            {feature.description}
                        </Text>
                    )}
                </View>

                {feature.status === 'open' ? (
                    <TouchableOpacity
                        onPress={(e) => {
                            e.stopPropagation();
                            onUpvote();
                        }}
                        style={[
                            styles.upvoteContainer,
                            {
                                backgroundColor: feature.user_has_upvoted ? colors.primary : colors.background,
                                borderColor: feature.user_has_upvoted ? colors.primary : colors.border,
                                borderWidth: 1,
                            }
                        ]}
                    >
                        <Ionicons
                            name="caret-up"
                            size={22}
                            color={feature.user_has_upvoted ? '#FFFFFF' : colors.primary}
                        />
                        <Text style={[
                            styles.upvoteCount,
                            {
                                color: feature.user_has_upvoted ? '#FFFFFF' : colors.text,
                                fontWeight: '800'
                            }
                        ]}>
                            {feature.upvote_count}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.statusBadge}>
                        <Ionicons
                            name={feature.status === 'implemented' ? "checkmark-circle" : "construct"}
                            size={20}
                            color={feature.status === 'implemented' ? colors.primary : colors.accent}
                        />
                        <Text style={[styles.statusText, { color: feature.status === 'implemented' ? colors.primary : colors.accent }]}>
                            {feature.upvote_count}
                        </Text>
                    </View>
                )}
            </View>

            {isExpanded && (
                <View style={styles.expandedContent}>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <Text style={[styles.featureDescriptionFull, { color: colors.text }]}>
                        {feature.description}
                    </Text>
                    <View style={styles.cardFooter}>
                        <Text style={[styles.dateText, { color: colors.neutral }]}>
                            {new Date(feature.created_at).toLocaleDateString()}
                        </Text>
                        <TouchableOpacity style={styles.expandLessButton} onPress={toggleExpand}>
                            <Text style={{ color: colors.primary, fontWeight: '600' }}>Show Less</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </TouchableOpacity>
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noteBanner: {
        flexDirection: 'row',
        padding: 16,
        margin: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    noteTextContainer: {
        marginLeft: 12,
        flex: 1,
    },
    noteText: {
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 20,
    },
    noteSubText: {
        fontSize: 12,
        marginTop: 2,
    },
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: 8,
        borderBottomWidth: 1,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    tabLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
        gap: 16,
    },
    card: {
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    cardMain: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardLeft: {
        flex: 1,
        marginRight: 16,
    },
    featureTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    featureDescriptionShort: {
        fontSize: 14,
    },
    upvoteContainer: {
        width: 54,
        height: 54,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    upvoteCount: {
        fontSize: 14,
        fontWeight: '700',
        marginTop: -2,
    },
    statusBadge: {
        width: 54,
        height: 54,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 2,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    expandedContent: {
        marginTop: 12,
    },
    divider: {
        height: 1,
        marginBottom: 12,
    },
    featureDescriptionFull: {
        fontSize: 15,
        lineHeight: 22,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
    },
    dateText: {
        fontSize: 12,
    },
    expandLessButton: {
        padding: 4,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 100,
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '500',
    }
});
