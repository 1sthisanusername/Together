import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Sheet, Button, ErrorState } from '@/shared/ui';
import { useUnlinkCouple } from '../hooks/useCouple';
import { theme } from '@/shared/theme';

export interface UnlinkCoupleDialogProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isCancel?: boolean;
}

export const UnlinkCoupleDialog: React.FC<UnlinkCoupleDialogProps> = ({
  visible,
  onClose,
  onSuccess,
  isCancel = false,
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

  const title = isCancel ? 'Cancel Space' : t('couple.unlinkTitle');

  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <View style={styles.container}>
        <Text style={styles.warningHeading}>
          {isCancel
            ? 'Cancel this pending couple space?'
            : 'What happens when you unlink:'}
        </Text>

        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>
            • Access to shared letters, chats, memories, and game sessions will end immediately for both partners.
          </Text>
          <Text style={styles.bulletItem}>
            • Active invitation codes will be revoked at once.
          </Text>
          <Text style={styles.bulletItem}>
            • You and your partner will both land on the setup screen where a new space can be created.
          </Text>
        </View>

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
            title={isCancel ? 'Cancel Space' : t('couple.unlinkTitle')}
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
  warningHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
  },
  bulletList: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 8,
  },
  bulletItem: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
});
