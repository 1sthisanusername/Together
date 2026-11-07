import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button, Input, ErrorState } from '@/shared/ui';
import { resetPasswordSchema, type ResetPasswordInput } from '../schemas';
import { useAuthStore } from '../hooks/useAuth';

export interface ResetPasswordFormProps {
  onNavigateToLogin?: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  onNavigateToLogin,
}) => {
  const { t } = useTranslation();
  const { resetPassword, isLoading, error, setError } = useAuthStore();
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setError(null);
    const result = await resetPassword(data);
    if (!result.error) {
      setIsSuccess(true);
    }
  };

  return (
    <View style={styles.container}>
      {isSuccess ? (
        <View style={styles.successContainer}>
          <Text style={styles.successTitle}>✓</Text>
          <Text style={styles.successText}>{t('auth.resetLinkSent')}</Text>
          {onNavigateToLogin ? (
            <Button
              title={t('auth.login')}
              variant="primary"
              size="md"
              onPress={onNavigateToLogin}
              style={styles.backButton}
            />
          ) : null}
        </View>
      ) : (
        <>
          {error ? (
            <ErrorState
              title={t('common.errorTitle')}
              message={error}
              onRetry={() => setError(null)}
              retryTitle={t('common.retry')}
            />
          ) : null}

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

          <Button
            title={t('auth.sendResetLink')}
            variant="primary"
            size="lg"
            loading={isLoading}
            onPress={handleSubmit(onSubmit)}
            style={styles.submitButton}
          />

          {onNavigateToLogin ? (
            <Button
              title={t('auth.login')}
              variant="ghost"
              size="md"
              onPress={onNavigateToLogin}
              style={styles.switchButton}
            />
          ) : null}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 12,
  },
  submitButton: {
    marginTop: 12,
    marginBottom: 12,
  },
  switchButton: {
    marginTop: 8,
  },
  successContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  successTitle: {
    fontSize: 32,
    color: '#16A34A',
    fontWeight: '700',
    marginBottom: 8,
  },
  successText: {
    fontSize: 15,
    color: '#15803D',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  backButton: {
    width: '100%',
  },
});

