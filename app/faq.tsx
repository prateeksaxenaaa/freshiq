// Standardized FAQ Screen with Custom Header
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FAQ_DATA = [
    {
        question: 'How do I import a recipe from a video?',
        answer: 'You can import recipes by tapping the "+" button on the home screen and choosing "Paste Link". We support YouTube, Instagram, and TikTok links.'
    },
    {
        question: 'Can I scan physical recipe books?',
        answer: 'Yes! Use the "Camera" option in the add recipe menu to take a photo of any cookbook page or handwritten note. Our AI will extract the ingredients and steps for you.'
    },
    {
        question: 'What is FreshIQ Premium?',
        answer: 'Premium gives you unlimited recipe imports, AI-powered nutritional analysis, and advanced grocery list categorization.'
    },
    {
        question: 'How do I manage my inventory?',
        answer: 'Go to the Inventory tab. You can add items manually or use the "Scan Receipt" feature to automatically populate your fridge and pantry.'
    },
    {
        question: 'Can I share my cookbooks?',
        answer: 'Currently, cookbooks are private to your household. We are working on a public sharing feature for the next update!'
    }
];

export default function FAQScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Help & FAQs</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {FAQ_DATA.map((faq, index) => (
                    <View key={index} style={[styles.card, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.question, { color: colors.text }]}>{faq.question}</Text>
                        <Text style={[styles.answer, { color: colors.neutral }]}>{faq.answer}</Text>
                    </View>
                ))}
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
    content: {
        padding: 16,
        paddingTop: 8,
    },
    card: {
        padding: 20,
        borderRadius: 20,
        marginBottom: 16,
    },
    question: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8,
    },
    answer: {
        fontSize: 14,
        lineHeight: 20,
    },
});
