import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input, ErrorState } from '@/shared/ui';
import { createCoupleSchema, type CreateCoupleInput } from '../schemas';
import { useCreateCouple } from '../hooks/useCouple';

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
  submitButton: {
    marginTop: 8,
  },
});

