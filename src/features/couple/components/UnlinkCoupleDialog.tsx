import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Sheet, Button, ErrorState } from '@/shared/ui';
import { useUnlinkCouple } from '../hooks/useCouple';

export interface UnlinkCoupleDialogProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const UnlinkCoupleDialog: React.FC<UnlinkCoupleDialogProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { mutateAsync: unlink, isPending, error, reset } = useUnlinkCouple();

  const handleUnlink = async () => {
    try {
      await unlink();
      onClose();
      onSuccess?.();
    } catch {
      // Handled by error state
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={t('couple.unlinkTitle')}>
      <View style={styles.container}>
        <Text style={styles.message}>{t('couple.unlinkConfirm')}</Text>

        {error ? (
          <ErrorState
            title={t('common.errorTitle')}
            message={error.message}
            onRetry={reset}
            retryTitle={t('common.retry')}
          />
        ) : null}

        <View style={styles.actions}>
          <Button
            title={t('common.cancel')}
            variant="outline"
            size="md"
            onPress={onClose}
            disabled={isPending}
            style={styles.button}
          />
          <Button
            title={t('couple.unlinkTitle')}
            variant="danger"
            size="md"
            loading={isPending}
            onPress={handleUnlink}
            style={styles.button}
          />
        </View>
      </View>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  message: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
});

