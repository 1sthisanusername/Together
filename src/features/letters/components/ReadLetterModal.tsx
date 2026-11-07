import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Sheet, Button, Card } from '@/shared/ui';
import type { Letter } from '@/shared/types';
import { useOpenLetter } from '../hooks/useLetters';

export interface ReadLetterModalProps {
  letter: Letter | null;
  visible: boolean;
  onClose: () => void;
  partnerName: string;
}

export const ReadLetterModal: React.FC<ReadLetterModalProps> = ({
  letter,
  visible,
  onClose,
  partnerName,
}) => {
  const { t } = useTranslation();
  const { mutate: openLetter, isPending } = useOpenLetter();

  if (!letter) return null;

  const isLocked =
    letter.unlock_at && new Date(letter.unlock_at).getTime() > Date.now();
  const isOpened = !!letter.opened_at;

  const handleTearOpen = () => {
    openLetter(letter.id);
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={letter.title}>
      <ScrollView contentContainerStyle={styles.container}>
        {isLocked && !isOpened ? (
          <View style={styles.lockedContainer}>
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={styles.lockedTitle}>Sealed Until</Text>
            <Text style={styles.lockedDate}>
              {new Date(letter.unlock_at!).toLocaleDateString()}
            </Text>
            <Text style={styles.lockedSub}>
              This letter is resting patiently until the right day arrives.
            </Text>
          </View>
        ) : !isOpened ? (
          <View style={styles.readyContainer}>
            <Text style={styles.sealedIcon}>💌</Text>
            <Text style={styles.readyTitle}>A letter from {partnerName}</Text>
            <Text style={styles.readySubtitle}>Ready for you to tear open!</Text>

            <Button
              title={t('letters.openLetter')}
              variant="primary"
              size="lg"
              loading={isPending}
              onPress={handleTearOpen}
              style={styles.openBtn}
            />
          </View>
        ) : (
          <View style={styles.letterBody}>
            <Card style={styles.parchmentCard}>
              <Text style={styles.openedDate}>
                {t('letters.openedOn', {
                  date: new Date(letter.opened_at!).toLocaleDateString(),
                })}
              </Text>
              <Text style={styles.letterContent}>{letter.content}</Text>
              <Text style={styles.signature}>With all my love,</Text>
              <Text style={styles.signatureName}>{partnerName}</Text>
            </Card>

            <Button
              title={t('common.done')}
              variant="outline"
              size="md"
              onPress={onClose}
              style={styles.doneBtn}
            />
          </View>
        )}
      </ScrollView>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  lockedContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  lockIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  lockedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  lockedDate: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 6,
    marginBottom: 10,
  },
  lockedSub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  readyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  sealedIcon: {
    fontSize: 54,
    marginBottom: 12,
  },
  readyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  readySubtitle: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 24,
  },
  openBtn: {
    width: '100%',
  },
  letterBody: {
    width: '100%',
  },
  parchmentCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FEF3C7',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
  },
  openedDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
    marginBottom: 16,
  },
  letterContent: {
    fontSize: 16,
    color: '#451A03',
    lineHeight: 26,
    marginBottom: 24,
  },
  signature: {
    fontSize: 14,
    color: '#78350F',
    fontStyle: 'italic',
  },
  signatureName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#451A03',
    marginTop: 4,
  },
  doneBtn: {
    width: '100%',
  },
});

