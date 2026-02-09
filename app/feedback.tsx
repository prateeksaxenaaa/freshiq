import Colors from '@/constants/Colors';
import { FeatureRequest, useFeedback } from '@/hooks/useFeedback';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    LayoutAnimation,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View,
    useColorScheme
} from 'react-native';

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

    const filteredFeatures = useMemo(() => {
        return features.filter(f => f.status === activeTab);
    }, [features, activeTab]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ title: 'Feedback & Ideas' }} />

            {/* Note Section */}
            <View style={[styles.noteBanner, { backgroundColor: colors.surface }]}>
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
            <View style={styles.tabBar}>
                {TABS.map(tab => {
                    const isActive = activeTab === tab.key;
                    return (
                        <TouchableOpacity
                            key={tab.key}
                            style={[
                                styles.tab,
                                isActive && { borderBottomColor: colors.primary, borderBottomWidth: 3 }
                            ]}
                            onPress={() => {
                                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                setActiveTab(tab.key);
                            }}
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
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                >
                    {filteredFeatures.length > 0 ? (
                        filteredFeatures.map(item => (
                            <FeatureCard
                                key={item.id}
                                feature={item}
                                colors={colors}
                                onUpvote={() => toggleUpvote(item.id)}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="bulb-outline" size={64} color={colors.surface} />
                            <Text style={[styles.emptyText, { color: colors.neutral }]}>
                                No features in this category yet.
                            </Text>
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
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
                                elevation: feature.user_has_upvoted ? 4 : 0,
                                shadowColor: colors.primary,
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: feature.user_has_upvoted ? 0.3 : 0,
                                shadowRadius: 4,
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
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
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
        borderBottomColor: '#f1f1f1',
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
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
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
