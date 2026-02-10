import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthProvider';
import { useProfile } from '@/hooks/useProfile';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';

export default function EditProfileScreen() {
    const { session } = useAuth();
    const { profile, isLoading, updateProfile, isUpdating } = useProfile();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        if (profile) {
            setFirstName(profile.first_name || '');
            setLastName(profile.last_name || '');
            setUsername(profile.username || '');
            setEmail(profile.email || session?.user?.email || '');
        } else if (session?.user) {
            // Pre-fetch from Google metadata if profile is empty
            const fullName = session.user.user_metadata?.full_name || '';
            const parts = fullName.split(' ');
            if (!firstName && parts.length > 0) setFirstName(parts[0]);
            if (!lastName && parts.length > 1) setLastName(parts.slice(1).join(' '));
            setEmail(session.user.email || '');

            // Fallback username generation if not set
            if (!username) {
                const base = (parts[0] || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
                const random = Math.floor(1000 + Math.random() * 9000); // 4 random digits
                setUsername(`${base}${random}`);
            }
        }
    }, [profile, session]);

    const handleSave = async () => {
        if (!username.trim()) {
            Alert.alert('Error', 'Username is required');
            return;
        }

        try {
            await updateProfile({
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                username: username.trim().toLowerCase(),
                display_name: `${firstName.trim()} ${lastName.trim()}`.trim() || undefined,
            });
            Alert.alert('Success', 'Profile updated successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            if (error.code === '23505') {
                Alert.alert('Error', 'Username already taken. Please choose another one.');
            } else {
                Alert.alert('Error', 'Failed to update profile');
            }
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <Stack.Screen options={{ title: 'Edit Profile' }} />
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    title: 'Edit Profile',
                    headerRight: () => (
                        <TouchableOpacity onPress={handleSave} disabled={isUpdating} style={{ marginRight: 10 }}>
                            {isUpdating ? (
                                <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                                <Text style={[styles.saveText, { color: colors.primary }]}>Save</Text>
                            )}
                        </TouchableOpacity>
                    ),
                }}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.avatarSection}>
                        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
                            {profile?.avatar_url ? (
                                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                            ) : session?.user?.user_metadata?.avatar_url || session?.user?.user_metadata?.picture ? (
                                <Image source={{ uri: session.user.user_metadata.avatar_url || session.user.user_metadata.picture }} style={styles.avatarImage} />
                            ) : (
                                <Ionicons name="person" size={40} color={colors.primary} />
                            )}
                        </View>
                        <Text style={[styles.avatarLabel, { color: colors.primary }]}>Profile Picture</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.neutral }]}>First Name</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                                value={firstName}
                                onChangeText={setFirstName}
                                placeholder="First Name"
                                placeholderTextColor={colors.neutral}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.neutral }]}>Last Name</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
                                value={lastName}
                                onChangeText={setLastName}
                                placeholder="Last Name"
                                placeholderTextColor={colors.neutral}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.neutral }]}>User ID (Unique)</Text>
                            <View style={[styles.usernameInputContainer, { backgroundColor: colors.surface }]}>
                                <Text style={[styles.atSymbol, { color: colors.neutral }]}>@</Text>
                                <TextInput
                                    style={[styles.usernameInput, { color: colors.text }]}
                                    value={username}
                                    onChangeText={setUsername}
                                    placeholder="username"
                                    placeholderTextColor={colors.neutral}
                                    autoCapitalize="none"
                                />
                            </View>
                            <Text style={[styles.hint, { color: colors.neutral }]}>
                                This is your unique identifier on FreshIQ.
                            </Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.neutral }]}>Email (Read-only)</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, opacity: 0.8 }]}
                                value={email}
                                editable={false}
                            />
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
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
    saveText: {
        fontSize: 16,
        fontWeight: '700',
    },
    scrollContent: {
        padding: 24,
    },
    form: {
        gap: 20,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        overflow: 'hidden',
    },
    avatarImage: {
        width: 100,
        height: 100,
    },
    avatarLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginLeft: 4,
    },
    input: {
        height: 52,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    usernameInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 52,
        borderRadius: 12,
        paddingHorizontal: 16,
    },
    atSymbol: {
        fontSize: 16,
        fontWeight: '600',
        marginRight: 2,
    },
    usernameInput: {
        flex: 1,
        fontSize: 16,
        height: '100%',
    },
    hint: {
        fontSize: 12,
        marginLeft: 4,
        marginTop: 2,
    }
});
