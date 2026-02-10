import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    useColorScheme,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');


interface BottomSheetProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    minHeight?: number;
}

export const BottomSheet = ({ visible, onClose, title, children, minHeight = 300 }: BottomSheetProps) => { // Default to 300 to keep existing behavior
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={[styles.content, { backgroundColor: colors.background, minHeight }]}>
                            <View style={styles.header}>
                                <View style={styles.handle} />
                                {title && (
                                    <View style={styles.titleRow}>
                                        <TouchableOpacity onPress={onClose} style={styles.backButton}>
                                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                                        </TouchableOpacity>
                                        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.childrenContainer}>
                                {children}
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    content: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 12,
        paddingBottom: 34, // Increased bottom padding for safe area
        maxHeight: SCREEN_HEIGHT * 0.9,
    },
    header: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    handle: {
        width: 36,
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        marginBottom: 16,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 20,
    },
    backButton: {
        padding: 4,
        marginRight: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    childrenContainer: {
        paddingHorizontal: 20,
    },
});
