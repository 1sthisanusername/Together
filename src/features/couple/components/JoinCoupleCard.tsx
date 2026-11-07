import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input, ErrorState } from '@/shared/ui';
import { acceptInviteSchema, type AcceptInviteInput } from '../schemas';
import { useAcceptInvite } from '../hooks/useCouple';

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
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  codeInput: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: 8,
  },
});

