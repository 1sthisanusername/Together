import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '@/shared/i18n';
import { useAuthStore } from '@/features/auth';
import { supabase } from '@/services';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 30, // 30 seconds
    },
  },
});

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
