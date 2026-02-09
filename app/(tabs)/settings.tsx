import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Image, ScrollView, Share, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SettingsItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
    showChevron?: boolean;
    color?: string;
    description?: string;
}

const SettingsItem = ({ icon, label, onPress, showChevron = true, color, description }: SettingsItemProps) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <TouchableOpacity style={[styles.itemContainer, { backgroundColor: colors.surface }]} onPress={onPress}>
            <View style={styles.itemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: color ? `${color}15` : colors.background }]}>
                    <Ionicons name={icon} size={22} color={color || colors.primary} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.itemLabel, { color: colors.text }]}>{label}</Text>
                    {description && <Text style={[styles.itemDescription, { color: colors.neutral }]}>{description}</Text>}
                </View>
            </View>
            {showChevron && <Ionicons name="chevron-forward" size={20} color={colors.neutral} />}
        </TouchableOpacity>
    );
};

export default function SettingsScreen() {
    const { session } = useAuth();
    const { profile } = useProfile();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: () => supabase.auth.signOut() }
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'This action is permanent and will delete all your data. Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => console.log('Delete account requested') }
            ]
        );
    };

    const handleInvite = async () => {
        try {
            await Share.share({
                message: 'Check out FreshIQ - The ultimate AI kitchen assistant! Download it here: https://freshiq.app/download',
                title: 'Invite to FreshIQ',
            });
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

                {/* 1. Profile Header */}
                <TouchableOpacity style={styles.profileHeader} onPress={() => router.push('/profile/edit')}>
                    <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
                        {profile?.avatar_url ? (
                            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                        ) : (
                            <Ionicons name="person" size={40} color={colors.primary} />
                        )}
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={[styles.profileName, { color: colors.text }]}>
                            {profile?.display_name || session?.user?.email?.split('@')[0] || 'User'}
                        </Text>
                        <Text style={[styles.profileEmail, { color: colors.neutral }]}>
                            {profile?.username ? `@${profile.username}` : session?.user?.email}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.neutral} />
                </TouchableOpacity>

                {/* 2. Buy Subscription - Primary Green Full Width */}
                <TouchableOpacity
                    style={[styles.premiumButton, { backgroundColor: colors.primary }]}
                    onPress={() => console.log('Buy Subscription')}
                >
                    <View style={styles.premiumContent}>
                        <Ionicons name="diamond" size={24} color="white" />
                        <View style={styles.premiumTextContainer}>
                            <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
                            <Text style={styles.premiumSubtitle}>Get unlimited recipe imports & more</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="white" />
                </TouchableOpacity>

                {/* 3. My Subscriptions */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.neutral }]}>ACCOUNT</Text>
                    <SettingsItem
                        icon="card-outline"
                        label="My Subscriptions"
                        onPress={() => router.push('/subscriptions/')}
                    />
                    <SettingsItem
                        icon="settings-outline"
                        label="Account Settings"
                        description="Delete your account"
                        onPress={handleDeleteAccount}
                    />
                </View>

                {/* 4-7. Feedbacks, Invite, Language, Help */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.neutral }]}>PREFERENCES</Text>
                    <SettingsItem
                        icon="chatbubble-ellipses-outline"
                        label="Feedbacks"
                        onPress={() => router.push('/feedback')}
                    />
                    <SettingsItem
                        icon="share-social-outline"
                        label="Invite Friend"
                        onPress={handleInvite}
                    />
                    <SettingsItem
                        icon="language-outline"
                        label="Language"
                        description="English (US)"
                        onPress={() => router.push('/language')}
                    />
                    <SettingsItem
                        icon="help-circle-outline"
                        label="Help & FAQs"
                        onPress={() => router.push('/faq')}
                    />
                </View>

                {/* 9. Logout */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
                    <Text style={[styles.logoutText, { color: colors.destructive }]}>Logout</Text>
                </TouchableOpacity>

                <Text style={[styles.versionText, { color: colors.neutral }]}>
                    Version 1.0.0
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        marginBottom: 24,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarPlaceholder: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    avatarImage: {
        width: 70,
        height: 70,
        borderRadius: 35,
    },
    editIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    profileInfo: {
        flex: 1,
        marginLeft: 16,
    },
    profileName: {
        fontSize: 20,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    profileEmail: {
        fontSize: 14,
        marginTop: 2,
    },
    premiumButton: {
        padding: 20,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 32,
        elevation: 4,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    premiumContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    premiumTextContainer: {
        marginLeft: 16,
    },
    premiumTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    premiumSubtitle: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 12,
        marginTop: 2,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 4,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
        marginBottom: 8,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        marginLeft: 12,
    },
    itemLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    itemDescription: {
        fontSize: 12,
        marginTop: 2,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        marginTop: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    versionText: {
        textAlign: 'center',
        fontSize: 12,
        marginTop: 24,
    },
});

