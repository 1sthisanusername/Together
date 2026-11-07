import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/services';
import { useAuthStore } from '@/features/auth';
import { theme } from '@/shared/theme';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<string>('Verifying authentication...');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        const url = await Linking.getInitialURL();
        if (url) {
          await processUrl(url);
        } else {
          // If no initial URL, check current session
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            useAuthStore.getState().setSession(data.session);
            router.replace('/(auth)/pair');
          } else {
            router.replace('/(auth)/login');
          }
        }
      } catch (err) {
        console.warn('Auth callback error:', err);
        setErrorMsg(err instanceof Error ? err.message : 'Authentication failed');
      }
    }

    async function processUrl(urlStr: string) {
      const parsed = Linking.parse(urlStr);

      // 1. Check for query code (PKCE flow)
      const code = parsed.queryParams?.code;
      if (code) {
        setStatus('Exchanging authorization code...');
        const { data, error } = await supabase.auth.exchangeCodeForSession(String(code));
        if (error) throw error;
        if (data.session) {
          useAuthStore.getState().setSession(data.session);
          if (data.user) {
            await useAuthStore.getState().fetchProfile(data.user.id);
          }
          router.replace('/(auth)/pair');
          return;
        }
      }

      // 2. Check for hash fragments (#access_token=...&refresh_token=...)
      if (urlStr.includes('#')) {
        const hash = urlStr.split('#')[1];
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          setStatus('Establishing secure session...');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          if (data.session) {
            useAuthStore.getState().setSession(data.session);
            if (data.user) {
              await useAuthStore.getState().fetchProfile(data.user.id);
            }
            router.replace('/(auth)/pair');
            return;
          }
        }
      }

      // 3. Fallback: Check if session is already present
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        useAuthStore.getState().setSession(data.session);
        router.replace('/(auth)/pair');
      } else {
        router.replace('/(auth)/login');
      }
    }

    handleAuthCallback();
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.statusText}>{status}</Text>
      {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    padding: 24,
  },
  statusText: {
    marginTop: 18,
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  errorText: {
    marginTop: 12,
    fontSize: 13,
    color: theme.colors.danger,
    textAlign: 'center',
  },
});
