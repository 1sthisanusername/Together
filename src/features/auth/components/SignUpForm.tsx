import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button, Input, ErrorState, Card } from '@/shared/ui';
import { theme } from '@/shared/theme';
import { signUpSchema, type SignUpInput } from '../schemas';
import { useAuthStore } from '../hooks/useAuth';

export interface SignUpFormProps {
  onSuccess?: () => void;
  onNavigateToLogin?: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({
  onSuccess,
  onNavigateToLogin,
}) => {
  const { t } = useTranslation();
  const { signUp, signInWithGoogle, isLoading, error, setError } = useAuthStore();
  const [emailSent, setEmailSent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignUpInput) => {
    setError(null);
    const result = await signUp(data);
    if (!result.error) {
      if (result.needsEmailConfirmation) {
        setEmailSent(true);
      } else if (result.session || useAuthStore.getState().session) {
        onSuccess?.();
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    const result = await signInWithGoogle();
    if (!result.error && useAuthStore.getState().session) {
      onSuccess?.();
    }
  };

  if (emailSent) {
    return (
      <Card style={styles.confirmCard}>
        <View style={styles.iconCircle}>
          <Text style={styles.envelopeIcon}>✉️</Text>
        </View>
        <Text style={styles.confirmTitle}>{t('auth.checkEmailTitle')}</Text>
        <Text style={styles.confirmMessage}>{t('auth.checkEmailMessage')}</Text>
        <Button
          title={t('auth.login')}
          variant="primary"
          size="lg"
          onPress={() => onNavigateToLogin?.()}
          style={styles.confirmLoginButton}
        />
        <Button
          title={t('common.back')}
          variant="ghost"
          size="sm"
          onPress={() => setEmailSent(false)}
          style={{ marginTop: 8 }}
        />
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      {error ? (
        <ErrorState
          title={t('common.errorTitle')}
          message={error}
          onRetry={() => setError(null)}
          retryTitle={t('common.retry')}
        />
      ) : null}

      <Button
        title={t('auth.continueWithGoogle')}
        variant="outline"
        size="lg"
        loading={isLoading}
        onPress={handleGoogleSignIn}
        style={styles.googleButton}
      />

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{t('auth.orDivider')}</Text>
        <View style={styles.dividerLine} />
      </View>

      <Controller
        control={control}
        name="displayName"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t('auth.displayNameLabel')}
            placeholder={t('auth.displayNamePlaceholder')}
            autoCapitalize="words"
            autoCorrect={false}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.displayName?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t('auth.emailLabel')}
            placeholder={t('auth.emailPlaceholder')}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.email?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t('auth.passwordLabel')}
            placeholder={t('auth.passwordPlaceholder')}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.password?.message}
          />
        )}
      />

      <Button
        title={t('auth.signUp')}
        variant="primary"
        size="lg"
        loading={isLoading}
        onPress={handleSubmit(onSubmit)}
        style={styles.submitButton}
      />

      {onNavigateToLogin ? (
        <Button
          title={t('auth.alreadyHaveAccount')}
          variant="ghost"
          size="md"
          onPress={onNavigateToLogin}
          style={styles.switchButton}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 12,
  },
  googleButton: {
    marginBottom: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  submitButton: {
    marginTop: 12,
    marginBottom: 12,
  },
  switchButton: {
    marginTop: 8,
  },
  confirmCard: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderLight,
    marginTop: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  envelopeIcon: {
    fontSize: 32,
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  confirmLoginButton: {
    width: '100%',
  },
});

