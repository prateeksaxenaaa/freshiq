import Colors from '@/constants/Colors';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';

interface CreateCookbookSheetProps {
    onSubmit: (title: string) => Promise<void>;
    onClose: () => void;
}

export const CreateCookbookSheet = ({ onSubmit, onClose }: CreateCookbookSheetProps) => {
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const handleSubmit = async () => {
        if (!title.trim()) return;
        setLoading(true);
        try {
            await onSubmit(title);
            setTitle('');
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to create cookbook');
        } finally {
            setLoading(false);
        }
    };

    const isValid = title.length > 0 && title.length <= 50;

    return (
        <View style={styles.container}>
            <Text style={[styles.label, { color: colors.neutral }]}>Title</Text>
            <TextInput
                style={[styles.input, {
                    color: colors.text,
                    borderColor: colors.accent,
                    backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : '#F8FAFC'
                }]}
                placeholder="e.g. Weeknight Dinner"
                placeholderTextColor={colors.neutral}
                value={title}
                onChangeText={setTitle}
                maxLength={50}
                autoFocus
            />
            <Text style={[styles.limit, { color: colors.neutral }]}>{title.length} / 50</Text>

            <TouchableOpacity
                style={[
                    styles.button,
                    { backgroundColor: isValid ? colors.accent : colors.surface }
                ]}
                onPress={handleSubmit}
                disabled={!isValid || loading}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={[
                        styles.buttonText,
                        { color: isValid ? 'white' : colors.neutral }
                    ]}>
                        Create cookbook
                    </Text>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: 10,
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 8,
    },
    limit: {
        textAlign: 'right',
        fontSize: 12,
        marginBottom: 24,
    },
    button: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
