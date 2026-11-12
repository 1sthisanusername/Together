import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input, ErrorState } from '@/shared/ui';
import { createCoupleSchema, type CreateCoupleInput } from '../schemas';
import { useCreateCouple } from '../hooks/useCouple';
import { useAuthStore } from '@/features/auth';
import { useUpdateProfile } from '@/features/settings/hooks/useSettings';
import { theme, scale } from '@/shared/theme';

export interface CreateCoupleCardProps {
  onSuccess?: () => void;
}

export const CreateCoupleCard: React.FC<CreateCoupleCardProps> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const profile = useAuthStore((state) => state.profile);
  const { mutateAsync: updateProfile } = useUpdateProfile();
  const { mutateAsync: createCouple, isPending, error, reset } = useCreateCouple();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCoupleInput>({
    resolver: zodResolver(createCoupleSchema),
    defaultValues: {
      nickname: profile?.display_name || '',
      coupleName: '',
    },
  });

  const onSubmit = async (data: CreateCoupleInput) => {
    try {
      if (data.nickname?.trim() && data.nickname.trim() !== profile?.display_name) {
        await updateProfile({ displayName: data.nickname.trim() });
      }
      await createCouple(data.coupleName);
      onSuccess?.();
    } catch {
      // Handled by mutation error state
    }
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{t('couple.createCouple')}</Text>
      <Text style={styles.subtitle}>{t('couple.pairSubtitle')}</Text>

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
        name="coupleName"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t('couple.coupleNameLabel')}
            placeholder={t('couple.coupleNamePlaceholder')}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.coupleName?.message}
          />
        )}
      />

      <Button
        title={t('couple.createCouple')}
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
  submitButton: {
    marginTop: scale(8),
  },
});
