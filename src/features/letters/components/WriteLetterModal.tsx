import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Sheet, Input, Button, ErrorState } from '@/shared/ui';
import { useSendLetter } from '../hooks/useLetters';

export interface WriteLetterModalProps {
  visible: boolean;
  onClose: () => void;
  partnerName: string;
}

export const WriteLetterModal: React.FC<WriteLetterModalProps> = ({
  visible,
  onClose,
  partnerName,
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [unlockDate, setUnlockDate] = useState('');

  const { mutateAsync: sendLetter, isPending, error, reset } = useSendLetter();

  const handleSend = async () => {
    if (!title.trim() || !content.trim()) return;
    try {
      await sendLetter({
        title: title.trim(),
        content: content.trim(),
        unlockAt: unlockDate.trim() ? new Date(unlockDate).toISOString() : null,
      });
      setTitle('');
      setContent('');
      setUnlockDate('');
      onClose();
    } catch {
      // Handled by error
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={t('letters.writeNew')}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {error ? (
          <ErrorState
            title={t('common.errorTitle')}
            message={error.message}
            onRetry={reset}
            retryTitle={t('common.retry')}
          />
        ) : null}

        <Input
          label="When should this be opened?"
          placeholder={t('letters.letterTitlePlaceholder')}
          value={title}
          onChangeText={setTitle}
        />

        <Input
          label="Your Letter"
          placeholder={t('letters.letterContentPlaceholder')}
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={6}
          style={styles.contentInput}
        />

        <Input
          label="Optional Lock Date (YYYY-MM-DD)"
          placeholder="e.g. 2026-12-25"
          value={unlockDate}
          onChangeText={setUnlockDate}
        />

        <Button
          title={t('letters.sendLetter')}
          variant="primary"
          size="lg"
          loading={isPending}
          disabled={!title.trim() || !content.trim()}
          onPress={handleSend}
          style={styles.sendButton}
        />
      </ScrollView>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  contentInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  sendButton: {
    marginTop: 16,
  },
});

