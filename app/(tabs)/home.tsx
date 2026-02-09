import { CookbookCard } from '@/components/home/CookbookCard';
import { CreateCookbookSheet } from '@/components/home/CreateCookbookSheet';
import { NewCookbookCard } from '@/components/home/NewCookbookCard';
import { ShoppingListCard } from '@/components/home/ShoppingListCard';
import { TutorialBanner } from '@/components/home/TutorialBanner';
import { ImageReviewSheet } from '@/components/import/ImageReviewSheet';
import { PasteLinkSheet } from '@/components/import/PasteLinkSheet';
import { PasteWebLinkSheet } from '@/components/import/PasteWebLinkSheet';
import { CreateRecipeSheet } from '@/components/recipe/CreateRecipeSheet';
import { BottomSheet } from '@/components/ui/BottomSheet';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthProvider';
import { useCookbooks, useCreateCookbook, useUncategorizedRecipesCount } from '@/hooks/useCookbooks';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
    const { data: cookbooks, isLoading, error } = useCookbooks();
    const { data: uncategorizedCount } = useUncategorizedRecipesCount();
    const createCookbook = useCreateCookbook();

    // Sheets State
    const [isCreateSheetVisible, setCreateSheetVisible] = useState(false); // Create Cookbook
    const [isAddRecipeSheetVisible, setAddRecipeSheetVisible] = useState(false); // Add Recipe FAB
    const [isPasteLinkVisible, setIsPasteLinkVisible] = useState(false);
    const [isPasteWebLinkVisible, setIsPasteWebLinkVisible] = useState(false);
    const [isImageReviewVisible, setIsImageReviewVisible] = useState(false);
    const [isCreateRecipeVisible, setCreateRecipeVisible] = useState(false);

    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { session } = useAuth();
    const router = useRouter();

    const handleCreateCookbook = async (name: string) => {
        await createCookbook.mutateAsync({ name });
    };

    const handleRecipeCreated = (recipeId: string) => {
        router.push(`/recipe/${recipeId}`);
    };

    if (isLoading) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* 1. Top App Bar */}
            <View style={[styles.appBar, { backgroundColor: colors.background }]}>
                <Image
                    source={require('@/assets/logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                />
            </View>

            <UserCookbookGrid
                cookbooks={cookbooks || []}
                uncategorizedCount={uncategorizedCount || 0}
                onAddPress={() => setCreateSheetVisible(true)}
                colors={colors}
            />

            {/* Floating Action Button (FAB) - For Recipes */}
            <Pressable
                style={[styles.fab, { backgroundColor: colors.accent }]}
                onPress={() => setAddRecipeSheetVisible(true)}
            >
                <Ionicons name="add" size={30} color="white" />
            </Pressable>

            {/* Create Cookbook Sheet */}
            <BottomSheet
                visible={isCreateSheetVisible}
                onClose={() => setCreateSheetVisible(false)}
                title="Create cookbook"
            >
                <CreateCookbookSheet
                    onSubmit={handleCreateCookbook}
                    onClose={() => setCreateSheetVisible(false)}
                />
            </BottomSheet>

            {/* Add Recipe Bottom Sheet */}
            <BottomSheet
                visible={isAddRecipeSheetVisible}
                onClose={() => setAddRecipeSheetVisible(false)}
                title="Import recipe"
            >
                <View style={styles.optionsContainer}>
                    <TouchableOpacity
                        style={[styles.optionButton, { backgroundColor: colors.surface }]}
                        onPress={() => {
                            setAddRecipeSheetVisible(false);
                            setTimeout(() => setIsPasteWebLinkVisible(true), 300);
                        }}
                    >
                        <Ionicons name="globe-outline" size={24} color={colors.accent} />
                        <Text style={[styles.optionText, { color: colors.text }]}>Browser</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.optionButton, { backgroundColor: colors.surface }]}
                        onPress={() => {
                            setAddRecipeSheetVisible(false);
                            setTimeout(() => setIsImageReviewVisible(true), 300);
                        }}
                    >
                        <Ionicons name="camera-outline" size={24} color={colors.accent} />
                        <Text style={[styles.optionText, { color: colors.text }]}>Camera</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.optionButton, { backgroundColor: colors.surface }]}
                        onPress={() => {
                            setAddRecipeSheetVisible(false);
                            setTimeout(() => setIsPasteLinkVisible(true), 300);
                        }}
                    >
                        <Ionicons name="link-outline" size={24} color={colors.accent} />
                        <Text style={[styles.optionText, { color: colors.text }]}>Paste Link</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.scratchButton, { backgroundColor: colors.surface }]}
                    onPress={() => {
                        setAddRecipeSheetVisible(false);
                        setTimeout(() => setCreateRecipeVisible(true), 300);
                    }}
                >
                    <Ionicons name="create-outline" size={20} color={colors.text} />
                    <Text style={[styles.scratchText, { color: colors.text }]}>Write from scratch</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.guideLink, { marginTop: 16 }]}
                    onPress={() => {
                        setAddRecipeSheetVisible(false);
                        router.push('/guide');
                    }}
                >
                    <Ionicons name="help-circle-outline" size={18} color={colors.primary} />
                    <Text style={[styles.guideLinkText, { color: colors.primary }]}>How to import? View Guides & Tips</Text>
                </TouchableOpacity>
            </BottomSheet>

            {/* Paste Link Sheet */}
            <BottomSheet
                visible={isPasteLinkVisible}
                onClose={() => setIsPasteLinkVisible(false)}
                title="Import from Video"
            >
                <PasteLinkSheet onClose={() => setIsPasteLinkVisible(false)} />
            </BottomSheet>

            {/* Paste Web Link Sheet */}
            <BottomSheet
                visible={isPasteWebLinkVisible}
                onClose={() => setIsPasteWebLinkVisible(false)}
                title="Import from Web"
            >
                <PasteWebLinkSheet onClose={() => setIsPasteWebLinkVisible(false)} />
            </BottomSheet>

            {/* Image Import Sheet */}
            <BottomSheet
                visible={isImageReviewVisible}
                onClose={() => setIsImageReviewVisible(false)}
                title="Import from Image"
            >
                <ImageReviewSheet onClose={() => setIsImageReviewVisible(false)} />
            </BottomSheet>

            {/* Create Recipe Sheet */}
            <BottomSheet
                visible={isCreateRecipeVisible}
                onClose={() => setCreateRecipeVisible(false)}
                title="Create Recipe"
            >
                <CreateRecipeSheet
                    onClose={() => setCreateRecipeVisible(false)}
                    onSuccess={handleRecipeCreated}
                />
            </BottomSheet>

        </SafeAreaView>
    );
}

// Helper component to handle the grid layout with "New" card
const UserCookbookGrid = ({ cookbooks, uncategorizedCount, onAddPress, colors }: any) => {
    const router = useRouter(); // Use hook inside the component
    // Preparing data: [NEW_BTN, ...cookbooks, UNCATEGORIZED (if count > 0)]
    const data = ['NEW_BTN', ...cookbooks];
    if (uncategorizedCount > 0) {
        data.push({ id: 'uncategorized', name: 'Uncategorized', count: uncategorizedCount, isUncategorized: true });
    }

    return (
        <FlatList
            data={data}
            keyExtractor={(item) => (typeof item === 'string' ? item : item.id)}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.content}
            ListHeaderComponent={
                <View style={styles.headerContainer}>
                    <TutorialBanner onPress={() => router.push('/guide')} />
                    <ShoppingListCard />
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Cookbooks</Text>
                    </View>
                </View>
            }
            renderItem={({ item }) => {
                if (item === 'NEW_BTN') {
                    return <NewCookbookCard onPress={onAddPress} />;
                }

                // Handle Uncategorized Card
                if (item.isUncategorized) {
                    return (
                        <CookbookCard
                            cookbook={item}
                            onPress={() => {
                                router.push({
                                    pathname: '/cookbook/[id]',
                                    params: { id: 'uncategorized', name: 'Uncategorized' }
                                });
                            }}
                            style={{ opacity: 0.8 }}
                        />
                    );
                }

                return (
                    <CookbookCard
                        cookbook={item}
                        onPress={() => {
                            router.push({
                                pathname: '/cookbook/[id]',
                                params: { id: item.id, name: item.name }
                            });
                        }}
                    />
                );
            }}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    appBar: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 4,
        justifyContent: 'center',
        height: 68,
    },
    logoText: {
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -1,
    },
    logoImage: {
        width: 120,
        height: 40,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 100,
    },
    headerContainer: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 4,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    sectionHeader: {
        marginBottom: 10,
    },
    // FAB Styles
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20, // Inside View relative to SafeArea (edges=['top'] means bottom is safe?) No, standard view.
        // Wait, SafeAreaView edges=['top'] means it adds padding ONLY to top.
        // So bottom is UNSAFE.
        // I should use bottom: 20 BUT inside a View that extends to bottom.
        // FlatList has paddingBottom: 100.
        // The FAB should be absolute to SafeAreaView.
        // If bottom is unsafe, I might need bottom: 20 + inset.
        // Or remove edges=['top'] and use default (all).
        // But usually Home tab has Tab Bar below it.
        // In Expo Router Tabs, the screen height ends ABOVE the tab bar.
        // So bottom: 20 is correct (20 px above tab bar).
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    optionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    optionButton: {
        flex: 1,
        aspectRatio: 1,
        marginHorizontal: 5,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionText: {
        marginTop: 8,
        fontSize: 12,
        fontWeight: '600',
    },
    scratchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
    },
    scratchText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '600',
    },
    guideLink: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    guideLinkText: {
        marginLeft: 6,
        fontSize: 14,
        fontWeight: '600',
    }
});
