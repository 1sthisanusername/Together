import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button, Input, ErrorState } from '@/shared/ui';
import { loginSchema, type LoginInput } from '../schemas';
import { useAuthStore } from '../hooks/useAuth';

export interface LoginFormProps {
  onSuccess?: () => void;
  onNavigateToSignUp?: () => void;
  onNavigateToForgotPassword?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onNavigateToSignUp,
  onNavigateToForgotPassword,
}) => {
  const { t } = useTranslation();
  const { signIn, signInWithGoogle, isLoading, error, setError } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setError(null);
    const result = await signIn(data);
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

      {onNavigateToForgotPassword ? (
        <Button
          title={t('auth.forgotPassword')}
          variant="ghost"
          size="sm"
          onPress={onNavigateToForgotPassword}
          style={styles.forgotButton}
        />
      ) : null}

      <Button
        title={t('auth.login')}
        variant="primary"
        size="lg"
        loading={isLoading}
        onPress={handleSubmit(onSubmit)}
        style={styles.submitButton}
      />

      {onNavigateToSignUp ? (
        <Button
          title={t('auth.needAccount')}
          variant="ghost"
          size="md"
          onPress={onNavigateToSignUp}
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
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 12,
  },
  switchButton: {
    marginTop: 8,
  },
});

