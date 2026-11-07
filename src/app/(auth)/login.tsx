import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoginForm } from '@/features/auth';
import { theme } from '@/shared/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.brandBadge}>🕊️ Together</Text>
          <Text style={styles.title}>{t('auth.login')}</Text>
          <Text style={styles.subtitle}>{t('auth.welcomeSubtitle')}</Text>
        </View>

        <LoginForm
          onSuccess={() => router.replace('/(auth)/pair')}
          onNavigateToSignUp={() => router.push('/(auth)/signup')}
          onNavigateToForgotPassword={() => router.push('/(auth)/reset-password')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background, // #f7f9f6
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    marginBottom: 28,
    alignItems: 'center',
  },
  brandBadge: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary, // #b69788
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.text, // #42362e
    marginBottom: 6,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary, // #a8917f
    textAlign: 'center',
    lineHeight: 22,
  },
});
