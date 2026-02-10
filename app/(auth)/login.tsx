import Colors from '@/constants/Colors';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    const colors = Colors.light;

    // Generate the Redirect URL that points back to this app
    const redirectTo = makeRedirectUri({
        scheme: 'freshiq',
        path: 'auth',
    });

    // Handle the Deep Link when the browser redirects back
    const createSessionFromUrl = async (url: string) => {
        const { params, errorCode } = QueryParams.getQueryParams(url);

        if (errorCode) throw new Error(errorCode);

        const { access_token, refresh_token } = params;

        if (!access_token) return;

        const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
        });

        if (error) console.error('Error parsing session', error);
    };

    // Listen for incoming links
    useEffect(() => {
        const handleDeepLink = ({ url }: { url: string }) => {
            createSessionFromUrl(url);
        };

        // Handle app launched from link
        Linking.getInitialURL().then((url) => {
            if (url) createSessionFromUrl(url);
        });

        // Handle link while app is open
        const subscription = Linking.addEventListener('url', handleDeepLink);

        return () => {
            subscription.remove();
        };
    }, []);

    const performGoogleLogin = async () => {
        // 1. Get the OAuth URL from Supabase
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo,
                skipBrowserRedirect: true, // We will handle opening the browser
            },
        });

        if (error) {
            console.error('Login Error:', error);
            return;
        }

        // 2. Open the browser manually
        if (data?.url) {
            const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

            // 3. Handle the result
            if (result.type === 'success' && result.url) {
                createSessionFromUrl(result.url);
            }
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Soft Abstract Background Decorations */}
            <View style={styles.bgCircleTop} />
            <View style={styles.bgCircleBottom} />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Image
                            source={require('../../assets/images/logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={[styles.mainCopy, { color: colors.text }]}>
                            A Recipe and Kitchen match maker
                        </Text>
                        <View style={styles.copyDivider} />
                    </View>

                    <View style={styles.descriptionSection}>
                        <View style={styles.featureItem}>
                            <View style={[styles.featureIcon, { backgroundColor: '#F0FDF4' }]}>
                                <Ionicons name="camera-outline" size={20} color={colors.primary} />
                            </View>
                            <View style={styles.featureTextContainer}>
                                <Text style={[styles.featureText, { color: colors.text }]}>
                                    <Text style={styles.featureHighlight}>Snap & Sort:</Text> Add groceries by uploading a photo
                                </Text>
                            </View>
                        </View>

                        <View style={styles.featureItem}>
                            <View style={[styles.featureIcon, { backgroundColor: '#F0F9FF' }]}>
                                <Ionicons name="link-outline" size={20} color="#0EA5E9" />
                            </View>
                            <View style={styles.featureTextContainer}>
                                <Text style={[styles.featureText, { color: colors.text }]}>
                                    <Text style={styles.featureHighlight}>Universal Recipe Import:</Text> From Video, Socials, Blogs & Web
                                </Text>
                            </View>
                        </View>

                        <View style={styles.featureItem}>
                            <View style={[styles.featureIcon, { backgroundColor: '#FFFBEB' }]}>
                                <Ionicons name="sync-outline" size={20} color="#F59E0B" />
                            </View>
                            <View style={styles.featureTextContainer}>
                                <Text style={[styles.featureText, { color: colors.text }]}>
                                    <Text style={styles.featureHighlight}>Smart Kitchen Sync:</Text> Matches ingredients with available items
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.actionSection}>
                        <TouchableOpacity
                            style={[styles.googleButton, { backgroundColor: '#FFFFFF' }]}
                            onPress={performGoogleLogin}
                            activeOpacity={0.85}
                        >
                            <View style={styles.googleIconContainer}>
                                <FontAwesome name="google" size={18} color="#EA4335" />
                            </View>
                            <Text style={[styles.buttonText, { color: '#0F172A' }]}>Continue with Google</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.helpButton}
                            onPress={() => Linking.openURL('https://freshiq.app/help')}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.helpLink, { color: colors.neutral }]}>Need help? Visit our guide</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: colors.neutral }]}>
                            By continuing, you agree to our{"\n"}
                            <Text style={[styles.footerLink, { color: colors.text }]}>Terms of Service</Text> & <Text style={[styles.footerLink, { color: colors.text }]}>Privacy Policy</Text>
                        </Text>
                    </View>
                </View>
            </SafeAreaView>

            {/* Hidden debug info */}
            <View style={styles.subtleDebug}>
                <Text style={styles.debugText}>Redirect: {redirectTo}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    bgCircleTop: {
        position: 'absolute',
        top: -height * 0.1,
        right: -width * 0.2,
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: width * 0.4,
        backgroundColor: '#F0FDF4',
        zIndex: -1,
    },
    bgCircleBottom: {
        position: 'absolute',
        bottom: -height * 0.05,
        left: -width * 0.1,
        width: width * 0.5,
        height: width * 0.5,
        borderRadius: width * 0.25,
        backgroundColor: '#F8FAFC',
        zIndex: -1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingVertical: 40,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginTop: height * 0.05,
        width: '100%',
    },
    logo: {
        width: 140,
        height: 60,
        marginBottom: 32,
    },
    mainCopy: {
        fontSize: 30,
        fontWeight: '900',
        textAlign: 'center',
        lineHeight: 38,
        letterSpacing: -0.8,
        paddingHorizontal: 12,
    },
    copyDivider: {
        width: 32,
        height: 4,
        backgroundColor: '#10B981',
        borderRadius: 2,
        marginTop: 20,
    },
    descriptionSection: {
        width: '100%',
        marginVertical: 32,
        gap: 24,
        backgroundColor: '#FFFFFF',
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 4,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
    },
    featureIcon: {
        width: 44,
        height: 44,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureTextContainer: {
        flex: 1,
        paddingTop: 2,
    },
    featureHighlight: {
        fontWeight: '800',
    },
    featureText: {
        fontSize: 16,
        fontWeight: '500',
        lineHeight: 22,
    },
    actionSection: {
        width: '100%',
        alignItems: 'center',
        gap: 16,
    },
    googleButton: {
        flexDirection: 'row',
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    googleIconContainer: {
        marginRight: 12,
    },
    buttonText: {
        fontSize: 17,
        fontWeight: '700',
    },
    helpButton: {
        paddingVertical: 8,
    },
    helpLink: {
        fontSize: 14,
        fontWeight: '600',
    },
    footerStatus: {
        width: '100%',
        alignItems: 'center',
    },
    footer: {
        marginBottom: 10,
    },
    footerText: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
    },
    footerLink: {
        fontWeight: '700',
    },
    subtleDebug: {
        position: 'absolute',
        bottom: 5,
        alignSelf: 'center',
        opacity: 0.1,
    },
    debugText: {
        fontSize: 8,
        color: '#94A3B8',
    },
});

