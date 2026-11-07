import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input, ErrorState } from '@/shared/ui';
import { createCoupleSchema, type CreateCoupleInput } from '../schemas';
import { useCreateCouple } from '../hooks/useCouple';
import { theme } from '@/shared/theme';

export interface CreateCoupleCardProps {
  onSuccess?: () => void;
}

export const CreateCoupleCard: React.FC<CreateCoupleCardProps> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const { mutateAsync: createCouple, isPending, error, reset } = useCreateCouple();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCoupleInput>({
    resolver: zodResolver(createCoupleSchema),
    defaultValues: {
      coupleName: '',
    },
  });

  const onSubmit = async (data: CreateCoupleInput) => {
    try {
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
  submitButton: {
    marginTop: 8,
  },
});
