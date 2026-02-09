import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, useColorScheme } from 'react-native';

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
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ title: 'Help & FAQs' }} />

            <ScrollView contentContainerStyle={styles.content}>
                {FAQ_DATA.map((faq, index) => (
                    <View key={index} style={[styles.card, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.question, { color: colors.text }]}>{faq.question}</Text>
                        <Text style={[styles.answer, { color: colors.neutral }]}>{faq.answer}</Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingTop: 8,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginLeft: 8,
    },
    content: {
        padding: 20,
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
