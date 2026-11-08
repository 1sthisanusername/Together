import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import '@/shared/i18n';
import { useAuthStore } from '@/features/auth';
import { supabase } from '@/services';
import { theme } from '@/shared/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 30, // 30 seconds
    },
  },
});

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

export default function RootLayout() {
  const router = useRouter();
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
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

    return () => {
      unsubscribe();
      subscription.remove();
    };
  }, [initAuth, router]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="auth/callback" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="session/[id]" />
          <Stack.Screen name="settings" />
        </Stack>
      </QueryClientProvider>
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
