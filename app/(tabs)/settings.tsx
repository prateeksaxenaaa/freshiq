import { Text, View } from '@/components/Themed';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase';
import { StyleSheet, TouchableOpacity } from 'react-native';

export default function SettingsScreen() {
    const { session } = useAuth();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Settings</Text>
            <View style={styles.section}>
                <Text style={styles.label}>Account</Text>
                <Text style={styles.value}>{session?.user?.email}</Text>
            </View>

            <TouchableOpacity
                style={styles.logoutButton}
                onPress={() => supabase.auth.signOut()}
            >
                <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        paddingTop: 60,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 40,
    },
    section: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: '#94A3B8',
        marginBottom: 5,
    },
    value: {
        fontSize: 16,
        fontWeight: '500',
    },
    logoutButton: {
        marginTop: 'auto',
        padding: 16,
        backgroundColor: '#EF4444',
        borderRadius: 12,
        alignItems: 'center',
    },
    logoutText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
