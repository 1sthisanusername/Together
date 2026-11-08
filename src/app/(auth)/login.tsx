import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/features/auth';
import { Button, Logo, ErrorState } from '@/shared/ui';
import { theme } from '@/shared/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const { signInWithGoogle, isLoading, error, setError } = useAuthStore();

  const handleGoogleSignIn = async () => {
    setError(null);
    const result = await signInWithGoogle();
    if (!result.error && useAuthStore.getState().session) {
      // Routing is resolved by the RootRouteGuard at the app root
      router.replace('/(auth)/pair');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        {/* Brand Logo & Presentation */}
        <View style={styles.logoSection}>
          <Logo size="xl" showText={true} />
        </View>

        {/* Action Section: Welcome screen has ONE button */}
        <View style={styles.actionSection}>
          {error ? (
            <View style={styles.errorWrapper}>
              <ErrorState
                title="Sign In"
                message={error}
                onRetry={() => setError(null)}
                retryTitle="Dismiss"
              />
            </View>
          ) : null}

          <Button
            title="Continue with Google"
            variant="primary"
            size="lg"
            loading={isLoading}
            onPress={handleGoogleSignIn}
            style={styles.googleButton}
            textStyle={styles.googleButtonText}
          />

          <Text style={styles.privacyNotice}>
            Private & encrypted space exclusively for you and your partner.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 48,
  },
  logoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionSection: {
    width: '100%',
    alignItems: 'center',
  },
  errorWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  googleButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E6D9D0',
    shadowColor: '#42362E',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  googleButtonText: {
    color: '#42362E',
    fontWeight: '700',
    fontSize: 16,
  },
  privacyNotice: {
    marginTop: 18,
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
