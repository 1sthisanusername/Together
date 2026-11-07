import React, { useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Sheet, Input, Button, ErrorState } from '@/shared/ui';
import { useCreateMemory } from '../hooks/useMemories';

export interface AddMemoryModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddMemoryModal: React.FC<AddMemoryModalProps> = ({
  visible,
  onClose,
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  const { mutateAsync: createMemory, isPending, error, reset } = useCreateMemory();

  const handleSave = async () => {
    if (!title.trim()) return;
    try {
      await createMemory({
        title: title.trim(),
        note: note.trim() || undefined,
        memoryDate: date.trim() || undefined,
      });
      setTitle('');
      setNote('');
      onClose();
    } catch {
      // Handled by error
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={t('memories.addMemory')}>
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
          label={t('memories.memoryTitleLabel')}
          placeholder={t('memories.memoryTitlePlaceholder')}
          value={title}
          onChangeText={setTitle}
        />

        <Input
          label={t('memories.memoryNoteLabel')}
          placeholder={t('memories.memoryNotePlaceholder')}
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={4}
          style={styles.noteInput}
        />

        <Input
          label={t('memories.memoryDateLabel')}
          placeholder="YYYY-MM-DD"
          value={date}
          onChangeText={setDate}
        />

        <Button
          title={t('memories.saveMemory')}
          variant="primary"
          size="lg"
          loading={isPending}
          disabled={!title.trim()}
          onPress={handleSave}
          style={styles.saveBtn}
        />
      </ScrollView>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  noteInput: {
    height: 90,
    textAlignVertical: 'top',
  },
  saveBtn: {
    marginTop: 16,
  },
});

