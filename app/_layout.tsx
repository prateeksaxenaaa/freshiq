import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider, useAuth } from '@/contexts/AuthProvider';
import { HouseholdProvider } from '@/contexts/HouseholdProvider';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HouseholdProvider>
          <RootLayoutNav />
        </HouseholdProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Check if the current route is specifically the login page
    const isLoginPage = segments[0] === '(auth)' && segments[1] === 'login';

    if (!session && !isLoginPage) {
      // Redirect to the login page if not authenticated and not already on the login page
      router.replace('/(auth)/login');
    } else if (session && isLoginPage) {
      // Redirect back to the home page if authenticated and on the login page
      router.replace('/(tabs)');
    }
  }, [session, loading, segments]);

  return (
    <ThemeProvider value={DefaultTheme}>
      <ResumeImportHandler />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="generating" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

import { usePendingImports } from '@/hooks/useRecipeImport';

function ResumeImportHandler() {
  const { data: pendingImport, isLoading } = usePendingImports();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!isLoading && pendingImport) {
      // Only redirect if we are not already on the generating screen
      const inGenerating = segments[0] === 'generating';
      if (!inGenerating) {
        console.log("Resuming import:", pendingImport.id);
        router.replace({
          pathname: '/generating',
          params: { id: pendingImport.id }
        });
      }
    }
  }, [pendingImport, isLoading, segments]);

  return null;
}
