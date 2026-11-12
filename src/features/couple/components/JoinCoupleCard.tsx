import React from 'react';
import { View, Text, StyleSheet, Keyboard, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input, ErrorState } from '@/shared/ui';
import { acceptInviteSchema, type AcceptInviteInput } from '../schemas';
import { useAcceptInvite } from '../hooks/useCouple';
import { useAuthStore } from '@/features/auth';
import { useUpdateProfile } from '@/features/settings/hooks/useSettings';
import { theme, scale } from '@/shared/theme';

export interface JoinCoupleCardProps {
  onSuccess?: () => void;
}

export const JoinCoupleCard: React.FC<JoinCoupleCardProps> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const profile = useAuthStore((state) => state.profile);
  const { mutateAsync: updateProfile } = useUpdateProfile();
  const { mutateAsync: acceptInvite, isPending, error, reset } = useAcceptInvite();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInviteInput>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      nickname: profile?.display_name || '',
      inviteCode: '',
    },
  });

  const onSubmit = async (data: AcceptInviteInput) => {
    Keyboard.dismiss();
    try {
      if (data.nickname?.trim() && data.nickname.trim() !== profile?.display_name) {
        await updateProfile({ displayName: data.nickname.trim() });
      }
      await acceptInvite(data.inviteCode);
      onSuccess?.();
    } catch {
      // Handled by error state
    }
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{t('couple.joinPartnerTitle')}</Text>
      <Text style={styles.subtitle}>{t('couple.joinPartnerSubtitle')}</Text>

      {error ? (
        <ErrorState
          title={t('common.errorTitle')}
          message={error.message}
          onRetry={reset}
          retryTitle={t('common.retry')}
        />
      ) : null}

      <Controller
        control={control}
        name="inviteCode"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t('couple.codeLabel')}
            placeholder={t('couple.codePlaceholder')}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
            returnKeyType="done"
            onSubmitEditing={() => handleSubmit(onSubmit)()}
            onBlur={onBlur}
            onChangeText={(text) => onChange(text.toUpperCase())}
            value={value}
            error={errors.inviteCode?.message}
            style={styles.codeInput}
          />
        )}
      />

      <Button
        title={t('couple.joinButton')}
        variant="primary"
        size="md"
        loading={isPending}
        onPress={handleSubmit(onSubmit)}
        style={styles.submitButton}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: scale(24),
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderLight,
  },
  title: {
    fontSize: scale(20),
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: scale(6),
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: scale(14),
    color: theme.colors.textSecondary,
    lineHeight: scale(20),
    marginBottom: scale(18),
  },
  codeInput: {
    fontSize: scale(22),
    fontWeight: '800',
    letterSpacing: Platform.OS === 'ios' ? scale(4) : 0,
    textAlign: 'center',
    color: theme.colors.text,
  },
  submitButton: {
    marginTop: scale(8),
  },
});
