import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/features/auth';
import { Button, Logo, ErrorState, ResponsiveContainer, HeartIcon, PlayIcon, CameraIcon } from '@/shared/ui';
import { theme, scale } from '@/shared/theme';

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
      <ResponsiveContainer style={styles.content}>
        {/* Brand Logo & Presentation */}
        <View style={styles.logoSection}>
          <Logo size="xl" showText={true} />
          <Text style={styles.tagline} maxFontSizeMultiplier={1.35}>
            A warm, private space built exclusively for two.
          </Text>

          <View style={styles.featureList}>
            <View style={styles.featurePill}>
              <View style={styles.featureIconCircle}>
                <HeartIcon color={theme.colors.primary} size={15} focused />
              </View>
              <Text style={styles.featureLabel} maxFontSizeMultiplier={1.3}>
                Live partner presence & daily check-ins
              </Text>
            </View>
            <View style={styles.featurePill}>
              <View style={styles.featureIconCircle}>
                <PlayIcon color={theme.colors.coral} size={15} focused />
              </View>
              <Text style={styles.featureLabel} maxFontSizeMultiplier={1.3}>
                Playful games & guided dates
              </Text>
            </View>
            <View style={styles.featurePill}>
              <View style={styles.featureIconCircle}>
                <CameraIcon color={theme.colors.sunset} size={15} focused />
              </View>
              <Text style={styles.featureLabel} maxFontSizeMultiplier={1.3}>
                Shared memories, photos & secret letters
              </Text>
            </View>
          </View>
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
          />

          <Text style={styles.privacyNotice} maxFontSizeMultiplier={1.3}>
            Private & encrypted space exclusively for you and your partner.
          </Text>
        </View>
      </ResponsiveContainer>
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
    paddingHorizontal: scale(24),
    paddingVertical: scale(36),
  },
  logoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagline: {
    marginTop: scale(12),
    fontSize: scale(15),
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: scale(22),
    maxWidth: 300,
  },
  featureList: {
    marginTop: scale(24),
    gap: scale(10),
    width: '100%',
    maxWidth: 340,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceBlush,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.full,
    paddingVertical: scale(9),
    paddingHorizontal: scale(14),
    gap: scale(10),
  },
  featureIconCircle: {
    width: scale(28),
    height: scale(28),
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    fontSize: scale(13),
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  actionSection: {
    width: '100%',
    alignItems: 'center',
  },
  errorWrapper: {
    width: '100%',
    marginBottom: scale(16),
  },
  googleButton: {
    width: '100%',
  },
  privacyNotice: {
    marginTop: scale(16),
    fontSize: scale(12),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: scale(18),
  },
});
