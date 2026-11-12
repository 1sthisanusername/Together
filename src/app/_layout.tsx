import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as Linking from 'expo-linking';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import '@/shared/i18n';
import { useAuthStore } from '@/features/auth';
import { useActiveCouple } from '@/features/couple';
import { supabase, isSupabaseConfigured, queryClient, push, notificationRouter, restorePersistedCache } from '@/services';
import { theme } from '@/shared/theme';
import { InAppNotificationBanner, useNotificationRealtime } from '@/features/notifications';
import { ErrorState } from '@/shared/ui';
import { useFonts, BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque';
import { Figtree_400Regular, Figtree_600SemiBold, Figtree_700Bold } from '@expo-google-fonts/figtree';
import { Caveat_600SemiBold, Caveat_700Bold } from '@expo-google-fonts/caveat';

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <SafeAreaView style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>
        {error?.message || 'An unexpected error occurred. Please try again.'}
      </Text>
      <TouchableOpacity style={styles.errorRetryBtn} onPress={retry}>
        <Text style={styles.errorRetryText}>Try Again</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/**
 * RootRouteGuard: The single authoritative route guard at the app root.
 * Derives state from database:
 *   NO_COUPLE -> go to "Create couple space / Enter invite code" (pair)
 *   PENDING   -> "Waiting for partner" screen (pair)
 *   ACTIVE    -> main tabs
 * No individual screen decides routing by itself.
 */
function RootRouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { session, isInitialized } = useAuthStore();
  const { data: coupleData, isLoading: isCoupleLoading } = useActiveCouple();

  // Listen to in-app notification real-time events while app is open
  useNotificationRealtime();

  useEffect(() => {
    // Wait until local session restore has evaluated
    if (!isInitialized) return;

    const segs = segments as unknown as string[];
    const firstSegment = segs[0];
    const secondSegment = segs[1];

    const inAuthGroup = firstSegment === '(auth)';
    const isCallback = firstSegment === 'auth' && secondSegment === 'callback';

    // 1. Not authenticated -> must be on auth screens
    if (!session) {
      if (!inAuthGroup && !isCallback) {
        router.replace('/(auth)/login');
      }
      return;
    }

    // 2. Authenticated -> wait for couple state
    if (isCoupleLoading) return;

    const coupleState = coupleData?.state || 'NO_COUPLE';
    const isPairScreen = inAuthGroup && secondSegment === 'pair';
    const isRootIndex = segs.length === 0 || firstSegment === 'index';

    switch (coupleState) {
      case 'NO_COUPLE':
        // Go to Create couple space / Enter invite code
        if (!isPairScreen) {
          router.replace('/(auth)/pair');
        }
        break;

      case 'PENDING':
        // Go to Waiting for partner screen with invite code/link, resend, and cancel
        if (!isPairScreen) {
          router.replace('/(auth)/pair');
        }
        break;

      case 'ACTIVE': {
        // 2 members active -> Main tabs (or pending deep link from notification)
        notificationRouter.markReady(true);
        const pending = notificationRouter.getPendingRoute();
        if (pending) {
          notificationRouter.clearPendingRoute();
          router.replace(pending as any);
        } else if (inAuthGroup || isRootIndex) {
          router.replace('/(tabs)/home');
        }
        break;
      }
    }
  }, [session, isInitialized, isCoupleLoading, coupleData?.state, segments, router]);

  return (
    <>
      {children}
      <InAppNotificationBanner />
    </>
  );
}

export default function RootLayout() {
  const router = useRouter();
  const initAuth = useAuthStore((state) => state.initAuth);

  const [fontsLoaded] = useFonts({
    BricolageGrotesque_700Bold,
    Figtree_400Regular,
    Figtree_600SemiBold,
    Figtree_700Bold,
    Caveat_600SemiBold,
    Caveat_700Bold,
  });

  useEffect(() => {
    // Restore persisted query cache for instant app reopen
    restorePersistedCache().catch(() => {});
    const unsubscribe = initAuth();

    // Listen to deep linking events while app is open
    const subscription = Linking.addEventListener('url', async ({ url }) => {
      try {
        const parsed = Linking.parse(url);
        if (parsed.queryParams?.code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(
            String(parsed.queryParams.code)
          );
          if (!error && data.session) {
            useAuthStore.getState().setSession(data.session);
            if (data.user) {
              await useAuthStore.getState().fetchProfile(data.user.id);
            }
            router.replace('/(auth)/pair');
          }
        } else if (url.includes('#')) {
          const hash = url.split('#')[1];
          const params = new URLSearchParams(hash);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (!error && data.session) {
              useAuthStore.getState().setSession(data.session);
              if (data.user) {
                await useAuthStore.getState().fetchProfile(data.user.id);
              }
              router.replace('/(auth)/pair');
            }
          }
        }
      } catch (err) {
        console.warn('Error handling deep link in RootLayout:', err);
      }
    });

    // Register centralized notification router dispatcher
    notificationRouter.registerDispatcher((route) => {
      try {
        router.push(route as any);
      } catch (err) {
        console.warn('Navigation error in notificationRouter dispatcher:', err);
      }
    });

    // Handle deep-linking when user taps a push notification
    const removePushListener = push.setupNotificationResponseListener((deepLink) => {
      try {
        if (deepLink) {
          notificationRouter.setPendingRoute(deepLink);
        }
      } catch (err) {
        console.warn('Error handling push deep link:', err);
      }
    });

    return () => {
      notificationRouter.unregisterDispatcher();
      unsubscribe();
      subscription.remove();
      removePushListener();
    };
  }, [initAuth, router]);

  // Safety check: verify database configuration
  if (!isSupabaseConfigured) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.errorContainer}>
          <ErrorState
            title="Configuration Error"
            message="The app isn't configured correctly. Please check your Supabase environment variables."
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <KeyboardProvider statusBarTranslucent>
        <QueryClientProvider client={queryClient}>
          <RootRouteGuard>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" options={{ animation: 'none' }} />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="auth/callback" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="session/[id]" />
              <Stack.Screen name="chat" />
              <Stack.Screen name="settings" />
              <Stack.Screen name="notifications" />
            </Stack>
          </RootRouteGuard>
        </QueryClientProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  errorRetryBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  errorRetryText: {
    color: theme.colors.textInverse,
    fontSize: 15,
    fontWeight: '700',
  },
});
