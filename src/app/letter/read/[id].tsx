import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useOpenLetter, useLetters, type EnhancedLetter } from '@/features/letters/hooks/useLetters';
import { VoiceNotePlayer } from '@/features/messages';
import { theme, scale, triggerHaptic } from '@/shared/theme';
import { useActiveCouple } from '@/features/couple';

const THEME_PALETTES: Record<
  string,
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

export default function LetterReadScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: coupleData } = useActiveCouple();
  const partnerName = coupleData?.partner?.display_name || 'Partner';

  // Fetch all letters and find the one with matching ID
  const { data: letters, isLoading } = useLetters();
  const { mutate: openLetter, isPending } = useOpenLetter();

  const letter = letters?.find((l) => l.id === id) ?? null;

  const handleTearOpen = () => {
    triggerHaptic('medium');
    if (letter) {
      openLetter(letter.id);
    }
  };

  const handleClose = () => {
    router.dismiss();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!letter) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('letters.title')}</Text>
          <View style={styles.backBtnSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('letters.notFound')}</Text>
          <TouchableOpacity onPress={handleClose} style={styles.backBtnFull}>
            <Text style={styles.backBtnText}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isLocked =
    letter.unlock_at && new Date(letter.unlock_at).getTime() > Date.now();
  const isOpened = !!letter.opened_at;
  const seal = letter.seal_sticker || '❥';
  const themeKey: string = letter.stationery_theme || 'parchment_cream';
  const palette = THEME_PALETTES[themeKey] || THEME_PALETTES.parchment_cream;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {letter.title}
        </Text>
        <View style={styles.backBtnSpacer} />
      </View>

      {isLocked && !isOpened ? (
        /* Locked State */
        <View style={styles.lockedContainer}>
          <View style={styles.lockedIconWrapper}>
            <Text style={styles.lockIcon}>🔒</Text>
            <View style={styles.waxStampSmall}>
              <Text style={styles.waxStampText}>{seal}</Text>
            </View>
          </View>
          <Text style={styles.lockedTitle}>{t('letters.sealedUntil')}</Text>
          <Text style={styles.lockedDate}>
            {new Date(letter.unlock_at!).toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <Text style={styles.lockedSub}>
            {t('letters.sealedUntilSub')}
          </Text>
        </View>
      ) : !isOpened ? (
        /* Ready to Open State */
        <View style={styles.readyContainer}>
          <View style={styles.envelopeGraphic}>
            <Text style={styles.sealedIcon}>✉️</Text>
            <View style={styles.waxSealCenter}>
              <Text style={styles.waxSealBig}>{seal}</Text>
            </View>
          </View>
          <Text style={styles.readyTitle}>{t('letters.fromPartner', { partner: partnerName })}</Text>
          <Text style={styles.readySubtitle}>{t('letters.readyToOpen')}</Text>

          <TouchableOpacity
            style={styles.openBtn}
            onPress={handleTearOpen}
            disabled={isPending}
            activeOpacity={0.85}
          >
            {isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.openBtnText}>{t('letters.breakWaxSealAndRead')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveLaterBtn}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Text style={styles.saveLaterBtnText}>{t('letters.openLater')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Unlocked - Show Letter Content */
        <View style={styles.letterBody}>
          <View
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
                <Text style={styles.attachedVoiceLabel}>{t('letters.voiceNoteFrom', { partner: partnerName })}</Text>
                <VoiceNotePlayer
                  mediaSignedUrl={letter.voice_url}
                  durationSeconds={letter.voice_duration_seconds || 0}
                  isMyMessage={false}
                />
              </View>
            ) : null}

            <View style={styles.signatureBlock}>
              <Text style={[styles.signature, { color: palette.subText }]}>
                {t('letters.withAllMyLove')}
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
          </View>
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(24),
  },
  errorText: {
    fontSize: scale(16),
    color: theme.colors.textSecondary,
    marginBottom: scale(16),
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    width: scale(44),
    height: scale(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: scale(24),
    color: theme.colors.text,
  },
  backBtnSpacer: {
    width: scale(44),
  },
  headerTitle: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(18),
    fontWeight: '800',
    color: theme.colors.text,
    flex: 1,
    marginLeft: scale(8),
  },
  scrollContent: {
    flexGrow: 1,
  },
  lockedContainer: {
    alignItems: 'center',
    paddingVertical: scale(40),
    paddingHorizontal: scale(24),
  },
  lockedIconWrapper: {
    position: 'relative',
    marginBottom: scale(16),
  },
  lockIcon: {
    fontSize: scale(64),
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
    marginTop: scale(8),
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
    paddingVertical: scale(40),
    paddingHorizontal: scale(24),
  },
  envelopeGraphic: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(20),
  },
  sealedIcon: {
    fontSize: scale(80),
  },
  waxSealCenter: {
    position: 'absolute',
    width: scale(44),
    height: scale(44),
    borderRadius: 9999,
    backgroundColor: theme.colors.primary,
    borderWidth: 1,
    borderColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hardSm,
  },
  waxSealBig: {
    fontSize: scale(22),
  },
  readyTitle: {
    fontSize: scale(22),
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: scale(8),
    textAlign: 'center',
  },
  readySubtitle: {
    fontSize: scale(14),
    color: theme.colors.textSecondary,
    marginBottom: scale(28),
    textAlign: 'center',
  },
  openBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 9999,
    paddingVertical: scale(16),
    paddingHorizontal: scale(32),
    minWidth: scale(240),
    alignItems: 'center',
    ...theme.shadows.hardSm,
  },
  openBtnText: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(16),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  saveLaterBtn: {
    marginTop: scale(16),
    paddingVertical: scale(12),
    paddingHorizontal: scale(24),
  },
  saveLaterBtnText: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(14),
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  letterBody: {
    padding: scale(16),
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
  backBtnFull: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 9999,
    paddingVertical: scale(12),
    paddingHorizontal: scale(24),
  },
  backBtnText: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(14),
    fontWeight: '700',
    color: theme.colors.text,
  },
  bottomPadding: {
    height: scale(32),
  },
});
