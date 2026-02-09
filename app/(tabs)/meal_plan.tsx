import { Text, View } from '@/components/Themed';
import { StyleSheet } from 'react-native';

export default function MenuScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Menu & Recipes</Text>
            <Text style={styles.subtitle}>Coming Soon</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    subtitle: {
        marginTop: 10,
        color: '#94A3B8',
    },
});
