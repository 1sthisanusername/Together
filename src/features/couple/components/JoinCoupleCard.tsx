import React from 'react';
import { View, Text, StyleSheet, Keyboard, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input, ErrorState } from '@/shared/ui';
import { acceptInviteSchema, type AcceptInviteInput } from '../schemas';
import { useAcceptInvite } from '../hooks/useCouple';
import { theme } from '@/shared/theme';

export interface JoinCoupleCardProps {
  onSuccess?: () => void;
}

export const JoinCoupleCard: React.FC<JoinCoupleCardProps> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const { mutateAsync: acceptInvite, isPending, error, reset } = useAcceptInvite();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInviteInput>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      inviteCode: '',
    },
  });

  const onSubmit = async (data: AcceptInviteInput) => {
    Keyboard.dismiss();
    try {
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
    padding: 24,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderLight,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text, // #42362e
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary, // #a8917f
    lineHeight: 20,
    marginBottom: 18,
  },
  codeInput: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: Platform.OS === 'ios' ? 4 : 0,
    textAlign: 'center',
    color: theme.colors.text, // #42362e
  },
  submitButton: {
    marginTop: 8,
  },
});
