import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Sheet, Button, Card } from '@/shared/ui';
import type { EnhancedLetter, StationeryTheme } from '../hooks/useLetters';
import { useOpenLetter } from '../hooks/useLetters';
import { theme } from '@/shared/theme';

export interface ReadLetterModalProps {
  letter: EnhancedLetter | null;
  visible: boolean;
  onClose: () => void;
  partnerName: string;
}

const THEME_PALETTES: Record<
  StationeryTheme,
  { bg: string; text: string; subText: string; accent: string; border: string }
> = {
  parchment_cream: {
    bg: '#FFF8EE',
    text: '#2B2118',
    subText: '#7A6B5D',
    accent: '#FF5A3C',
    border: '#2B2118',
  },
  rose_petal: {
    bg: '#FFF0F5',
    text: '#4A1525',
    subText: '#883A50',
    accent: '#FF8FB1',
    border: '#2B2118',
  },
  matcha_mint: {
    bg: '#E8F8F5',
    text: '#0E3B33',
    subText: '#235D53',
    accent: '#2EC4B6',
    border: '#2B2118',
  },
  midnight_sky: {
    bg: '#201B2B',
    text: '#FDFBF7',
    subText: '#D2CCC4',
    accent: '#A29BFE',
    border: '#FFEAA7',
  },
};

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
  const seal = letter.seal_sticker || '❤️';
  const themeKey: StationeryTheme = letter.stationery_theme || 'parchment_cream';
  const palette = THEME_PALETTES[themeKey] || THEME_PALETTES.parchment_cream;

  const handleTearOpen = () => {
    openLetter(letter.id);
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={letter.title}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {isLocked && !isOpened ? (
          <View style={styles.lockedContainer}>
            <View style={styles.lockedIconWrapper}>
              <Text style={styles.lockIcon}>🔒</Text>
              <View style={styles.waxStampSmall}>
                <Text style={styles.waxStampText}>{seal}</Text>
              </View>
            </View>
            <Text style={styles.lockedTitle}>Sealed Until</Text>
            <Text style={styles.lockedDate}>
              {new Date(letter.unlock_at!).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <Text style={styles.lockedSub}>
              This letter is sealed with love and resting patiently until that special day.
            </Text>
          </View>
        ) : !isOpened ? (
          <View style={styles.readyContainer}>
            <View style={styles.envelopeGraphic}>
              <Text style={styles.sealedIcon}>✉️</Text>
              <View style={styles.waxSealCenter}>
                <Text style={styles.waxSealBig}>{seal}</Text>
              </View>
            </View>
            <Text style={styles.readyTitle}>A letter from {partnerName}</Text>
            <Text style={styles.readySubtitle}>Ready for you to break the seal and read!</Text>

            <Button
              title="Break Wax Seal & Read 💌"
              variant="primary"
              size="lg"
              loading={isPending}
              onPress={handleTearOpen}
              style={styles.openBtn}
            />
          </View>
        ) : (
          <View style={styles.letterBody}>
            <Card
              style={[
                styles.parchmentCard,
                { backgroundColor: palette.bg, borderColor: palette.border },
              ]}
            >
              <View style={styles.parchmentHeader}>
                <Text style={[styles.openedDate, { color: palette.subText }]}>
                  {t('letters.openedOn', {
                    date: new Date(letter.opened_at!).toLocaleDateString(),
                  })}
                </Text>
                <View style={[styles.waxStampInline, { borderColor: palette.border }]}>
                  <Text style={styles.waxStampInlineEmoji}>{seal}</Text>
                </View>
              </View>

              <Text
                style={[
                  styles.letterContent,
                  { color: palette.text, fontFamily: theme.typography.families.handwritten || undefined },
                ]}
              >
                {letter.content}
              </Text>

              <View style={styles.signatureBlock}>
                <Text style={[styles.signature, { color: palette.subText }]}>
                  With all my love,
                </Text>
                <Text
                  style={[
                    styles.signatureName,
                    {
                      color: palette.text,
                      fontFamily: theme.typography.families.handwritten || undefined,
                    },
                  ]}
                >
                  {partnerName}
                </Text>
              </View>
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
    paddingVertical: 28,
  },
  lockedIconWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  lockIcon: {
    fontSize: 52,
  },
  waxStampSmall: {
    position: 'absolute',
    bottom: -4,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF5A3C',
    borderWidth: 1.5,
    borderColor: '#2B2118',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waxStampText: {
    fontSize: 14,
  },
  lockedTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7A6B5D',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  lockedDate: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2B2118',
    marginTop: 6,
    marginBottom: 10,
    textAlign: 'center',
  },
  lockedSub: {
    fontSize: 14,
    color: '#5C4A3A',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 24,
  },
  readyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  envelopeGraphic: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  sealedIcon: {
    fontSize: 64,
  },
  waxSealCenter: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF5A3C',
    borderWidth: 2,
    borderColor: '#2B2118',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2B2118',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  waxSealBig: {
    fontSize: 18,
  },
  readyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2B2118',
    marginBottom: 6,
  },
  readySubtitle: {
    fontSize: 14,
    color: '#5C4A3A',
    marginBottom: 20,
    textAlign: 'center',
  },
  openBtn: {
    width: '100%',
  },
  letterBody: {
    width: '100%',
  },
  parchmentCard: {
    padding: 24,
    borderRadius: 18,
    borderWidth: 2,
    marginBottom: 16,
    shadowColor: '#2B2118',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  parchmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2B211822',
    paddingBottom: 8,
  },
  openedDate: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  waxStampInline: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FF5A3C',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waxStampInlineEmoji: {
    fontSize: 13,
  },
  letterContent: {
    fontSize: 20,
    lineHeight: 30,
    marginBottom: 24,
  },
  signatureBlock: {
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#2B211822',
    paddingTop: 12,
  },
  signature: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  signatureName: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  doneBtn: {
    width: '100%',
  },
});

