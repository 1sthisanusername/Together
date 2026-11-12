import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Sheet, Button, Card } from '@/shared/ui';
import type { EnhancedLetter, StationeryTheme } from '../hooks/useLetters';
import { useOpenLetter } from '../hooks/useLetters';
import { VoiceNotePlayer } from '@/features/messages';
import { theme, scale, triggerHaptic } from '@/shared/theme';

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
    bg: '#FFF0ED',
    text: '#3E2723',
    subText: '#7A625A',
    accent: '#E53935',
    border: '#FBE9E7',
  },
  rose_petal: {
    bg: '#FFF0ED',
    text: '#3E2723',
    subText: '#7A625A',
    accent: '#F48FB1',
    border: '#FBE9E7',
  },
  matcha_mint: {
    bg: '#F3FAF7',
    text: '#2B4C43',
    subText: '#5A786E',
    accent: '#FF7043',
    border: '#DDF0E8',
  },
  midnight_sky: {
    bg: '#2A1C1A',
    text: '#FFFDFB',
    subText: '#D7C4BE',
    accent: '#FFB74D',
    border: '#4E3733',
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
      <View style={styles.container}>
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

            <View style={styles.openActionsCol}>
              <Button
                title="Break Wax Seal & Read 💌"
                variant="primary"
                size="lg"
                loading={isPending}
                onPress={handleTearOpen}
                style={styles.openBtn}
              />

              <Button
                title="Open Later ⏳"
                variant="ghost"
                size="md"
                onPress={() => {
                  triggerHaptic('light');
                  onClose();
                }}
                style={styles.saveLaterBtn}
              />
            </View>
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

              {/* Attached Photo */}
              {letter.photo_url ? (
                <View style={styles.attachedPhotoContainer}>
                  <Image
                    source={{ uri: letter.photo_url }}
                    style={styles.attachedPhotoImage}
                    resizeMode="cover"
                  />
                </View>
              ) : null}

              {/* Attached Voice Note */}
              {letter.voice_url ? (
                <View style={styles.attachedVoiceContainer}>
                  <Text style={styles.attachedVoiceLabel}>🎙️ Voice Note from {partnerName}</Text>
                  <VoiceNotePlayer
                    mediaSignedUrl={letter.voice_url}
                    durationSeconds={letter.voice_duration_seconds || 0}
                    isMyMessage={false}
                  />
                </View>
              ) : null}

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
      </View>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: scale(12),
  },
  lockedContainer: {
    alignItems: 'center',
    paddingVertical: scale(28),
  },
  lockedIconWrapper: {
    position: 'relative',
    marginBottom: scale(12),
  },
  lockIcon: {
    fontSize: scale(52),
  },
  waxStampSmall: {
    position: 'absolute',
    bottom: -scale(4),
    right: -scale(8),
    width: scale(28),
    height: scale(28),
    borderRadius: 9999,
    backgroundColor: theme.colors.primary,
    borderWidth: 1,
    borderColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waxStampText: {
    fontSize: scale(14),
  },
  lockedTitle: {
    fontSize: scale(13),
    fontWeight: '800',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  lockedDate: {
    fontSize: scale(20),
    fontWeight: '800',
    color: theme.colors.text,
    marginTop: scale(6),
    marginBottom: scale(10),
    textAlign: 'center',
  },
  lockedSub: {
    fontSize: scale(14),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: scale(20),
    paddingHorizontal: scale(24),
  },
  readyContainer: {
    alignItems: 'center',
    paddingVertical: scale(20),
  },
  envelopeGraphic: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(16),
  },
  sealedIcon: {
    fontSize: scale(64),
  },
  waxSealCenter: {
    position: 'absolute',
    width: scale(36),
    height: scale(36),
    borderRadius: 9999,
    backgroundColor: theme.colors.primary,
    borderWidth: 1,
    borderColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hardSm,
  },
  waxSealBig: {
    fontSize: scale(18),
  },
  readyTitle: {
    fontSize: scale(20),
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: scale(6),
  },
  readySubtitle: {
    fontSize: scale(14),
    color: theme.colors.textSecondary,
    marginBottom: scale(20),
    textAlign: 'center',
  },
  openActionsCol: {
    width: '100%',
    gap: scale(8),
    alignItems: 'center',
  },
  openBtn: {
    width: '100%',
  },
  saveLaterBtn: {
    width: '100%',
  },
  letterBody: {
    width: '100%',
  },
  attachedPhotoContainer: {
    marginVertical: scale(14),
    borderRadius: theme.roundness.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  attachedPhotoImage: {
    width: '100%',
    aspectRatio: 16 / 10,
    backgroundColor: theme.colors.surfaceBlush,
  },
  attachedVoiceContainer: {
    marginVertical: scale(12),
    padding: scale(12),
    backgroundColor: theme.colors.surfaceBlush,
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  attachedVoiceLabel: {
    fontSize: scale(12),
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: scale(8),
  },
  parchmentCard: {
    padding: scale(24),
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    marginBottom: scale(16),
    ...theme.shadows.card,
  },
  parchmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(62, 39, 35, 0.12)',
    paddingBottom: scale(8),
  },
  openedDate: {
    fontSize: scale(12),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  waxStampInline: {
    width: scale(26),
    height: scale(26),
    borderRadius: 9999,
    backgroundColor: theme.colors.primary,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waxStampInlineEmoji: {
    fontSize: scale(13),
  },
  letterContent: {
    fontSize: scale(20),
    lineHeight: scale(30),
    marginBottom: scale(24),
  },
  signatureBlock: {
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(62, 39, 35, 0.12)',
    paddingTop: scale(12),
  },
  signature: {
    fontSize: scale(14),
    fontStyle: 'italic',
  },
  signatureName: {
    fontSize: scale(22),
    fontWeight: '800',
    marginTop: scale(2),
  },
  doneBtn: {
    width: '100%',
  },
});

