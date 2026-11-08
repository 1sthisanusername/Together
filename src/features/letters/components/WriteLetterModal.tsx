import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useTranslation } from 'react-i18next';
import { Sheet, Input, Button, ErrorState, DatePickerField } from '@/shared/ui';
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
      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        bottomOffset={24}
      >
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

        <DatePickerField
          label="Optional Lock Date"
          placeholder="Select unlock date"
          value={unlockDate}
          minDate={new Date()}
          onChange={setUnlockDate}
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
      </KeyboardAwareScrollView>
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

