import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button, Input, ErrorState } from '@/shared/ui';
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
      onSuccess?.();
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    const result = await signInWithGoogle();
    if (!result.error) {
      onSuccess?.();
    }
  };

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
});

