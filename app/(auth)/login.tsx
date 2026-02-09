import { Ionicons } from '@expo/vector-icons';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
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

            // 3. Handle the result (if successful, the deep link listener above will catch it, 
            // but WebBrowser also returns the redirect URL directly on iOS/Android sometimes)
            if (result.type === 'success' && result.url) {
                createSessionFromUrl(result.url);
            }
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Ionicons name="nutrition" size={80} color="#4ADE80" />
                    <Text style={styles.appName}>FreshIQ</Text>
                    <Text style={styles.tagline}>Smart Kitchen, Smarter You.</Text>
                </View>

                <TouchableOpacity
                    style={styles.googleButton}
                    onPress={performGoogleLogin}
                >
                    <Ionicons name="logo-google" size={24} color="white" style={styles.icon} />
                    <Text style={styles.buttonText}>Sign in with Google</Text>
                </TouchableOpacity>

                <View style={styles.debugContainer}>
                    <Text style={styles.debugLabel}>Troubleshooting:</Text>
                    <Text style={styles.debugText}>If login fails, add this URL to Supabase Redirects:</Text>
                    <Text style={styles.urlText} selectable>{redirectTo}</Text>
                </View>

                <Text style={styles.footerText}>
                    By continuing, you agree to our Terms & Privacy Policy.
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A', // Dark Slate
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        width: '100%',
        padding: 30,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 60,
    },
    appName: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#F8FAFC',
        marginTop: 10,
        letterSpacing: -1,
    },
    tagline: {
        fontSize: 18,
        color: '#94A3B8',
        marginTop: 5,
    },
    googleButton: {
        flexDirection: 'row',
        backgroundColor: '#EA4335',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#EA4335',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    icon: {
        marginRight: 12,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    footerText: {
        marginTop: 24,
        color: '#64748B',
        fontSize: 12,
        textAlign: 'center',
    },
    debugContainer: {
        marginTop: 40,
        padding: 15,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    debugLabel: {
        color: '#FACC15', // Yellow
        fontWeight: 'bold',
        marginBottom: 5,
    },
    debugText: {
        color: '#cbd5e1',
        fontSize: 12,
        textAlign: 'center',
    },
    urlText: {
        color: '#4ADE80', // Green
        fontSize: 11,
        marginTop: 5,
        textAlign: 'center',
        fontFamily: 'Courier', // Monospace if available
    },
});
