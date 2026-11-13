import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { Input, ErrorState, DatePickerField } from '@/shared/ui';
import { useSendLetter, StationeryTheme, SealSticker } from '@/features/letters/hooks/useLetters';
import { theme, scale, triggerHaptic } from '@/shared/theme';
import { useAuthStore } from '@/features/auth';
import { useActiveCouple } from '@/features/couple';

const THEMES: { id: StationeryTheme; label: string; bg: string; border: string; text: string }[] = [
  { id: 'parchment_cream', label: 'Parchment', bg: '#FFF0ED', border: '#FBE9E7', text: '#3E2723' },
  { id: 'rose_petal', label: 'Rose Petal', bg: '#FCE4EC', border: '#F48FB1', text: '#3E2723' },
  { id: 'matcha_mint', label: 'Matcha Mint', bg: '#EBF7F2', border: '#B2DFDB', text: '#2B4C43' },
  { id: 'midnight_sky', label: 'Midnight', bg: '#2A1C1A', border: '#FFB74D', text: '#FFFDFB' },
];

const SEALS: SealSticker[] = ['❤️', '💌', '🌸', '🌙', '✨'];

export default function LetterWriteScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const { data: coupleData } = useActiveCouple();
  const partnerName = coupleData?.partner?.display_name || 'your partner';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [unlockDate, setUnlockDate] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<StationeryTheme>('parchment_cream');
  const [selectedSeal, setSelectedSeal] = useState<SealSticker>('❤️');
  const [isVault, setIsVault] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const { mutateAsync: sendLetter, isPending, error, reset } = useSendLetter();

  const handlePickPhoto = async () => {
    try {
      triggerHaptic('light');
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        setPhotoUrl(res.assets[0].uri);
      }
    } catch (e) {
      console.warn('Could not pick photo for letter', e);
    }
  };

  const handleSend = async () => {
    if (!title.trim() || !content.trim()) return;
    try {
      await sendLetter({
        title: title.trim(),
        content: content.trim(),
        unlockAt: unlockDate.trim() ? new Date(unlockDate).toISOString() : null,
        stationeryTheme: selectedTheme,
        sealSticker: selectedSeal,
        isVault,
        photoUrl,
      });
      router.dismiss();
    } catch (err: any) {
      Alert.alert(t('common.errorTitle'), err.message || 'Failed to send letter');
    }
  };

  const isFormValid = !!title.trim() && !!content.trim();
  const disabledReason = !title.trim()
    ? t('letters.titleRequired')
    : !content.trim()
    ? t('letters.contentRequired')
    : null;

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.dismiss()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('letters.writeNew')}</Text>
        <View style={styles.backBtnSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
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
          label={t('letters.letterTitleLabel')}
          placeholder={t('letters.letterTitlePlaceholder')}
          value={title}
          onChangeText={setTitle}
          autoCapitalize="sentences"
        />

        {/* Stationery Theme Selector */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>{t('letters.stationeryStyle')}</Text>
          <View style={styles.themeRow}>
            {THEMES.map((item) => {
              const isSelected = selectedTheme === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.themeChip,
                    { backgroundColor: item.bg, borderColor: isSelected ? theme.colors.primary : theme.colors.border },
                    isSelected && styles.themeChipSelected,
                  ]}
                  onPress={() => setSelectedTheme(item.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.themeChipText, { color: item.text }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Wax Seal Sticker Selector */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>{t('letters.sealSticker')}</Text>
          <View style={styles.sealsRow}>
            {SEALS.map((seal) => {
              const isSelected = selectedSeal === seal;
              return (
                <TouchableOpacity
                  key={seal}
                  style={[
                    styles.sealBtn,
                    isSelected && styles.sealBtnSelected,
                  ]}
                  onPress={() => setSelectedSeal(seal)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.sealEmoji}>{seal}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Input
          label={t('letters.yourLetter')}
          placeholder={t('letters.letterContentPlaceholder')}
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={6}
          style={styles.contentInput}
          textAlignVertical="top"
        />

        {/* Media Attachments */}
        <View style={styles.attachmentSection}>
          <Text style={styles.sectionLabel}>{t('letters.addMemory')}</Text>
          {photoUrl ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: photoUrl }} style={styles.previewThumb} resizeMode="cover" />
              <TouchableOpacity
                style={styles.removePhotoBtn}
                onPress={() => setPhotoUrl(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.removePhotoText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addMediaBtn}
              onPress={handlePickPhoto}
              activeOpacity={0.8}
            >
              <Text style={styles.addMediaText}>{t('letters.attachPhoto')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <DatePickerField
          label={t('letters.optionalLockDate')}
          placeholder="Select unlock date"
          value={unlockDate}
          minDate={new Date()}
          onChange={setUnlockDate}
        />

        {/* Private Vault Toggle */}
        <TouchableOpacity
          style={[styles.vaultToggle, isVault && styles.vaultToggleActive]}
          onPress={() => setIsVault(!isVault)}
          activeOpacity={0.85}
        >
          <Text style={styles.vaultToggleIcon}>🔒</Text>
          <View style={styles.vaultToggleInfo}>
            <Text style={styles.vaultToggleTitle}>{t('letters.lockInPrivateVault')}</Text>
            <Text style={styles.vaultToggleSub}>{t('letters.privateVaultSub')}</Text>
          </View>
          <View style={[styles.toggleCheckbox, isVault && styles.toggleCheckboxChecked]}>
            {isVault ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
        </TouchableOpacity>

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.sendBtn, !isFormValid && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!isFormValid || isPending}
          activeOpacity={0.85}
        >
          <Text style={styles.sendBtnText}>
            {isVault ? `${t('letters.saveToVault')} 🔒` : t('letters.sendLetter')}
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingTop: scale(16),
    paddingBottom: scale(40),
  },
  sectionBlock: {
    marginBottom: scale(16),
  },
  sectionLabel: {
    fontSize: scale(13),
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: scale(8),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  themeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
  },
  themeChip: {
    paddingVertical: scale(8),
    paddingHorizontal: scale(14),
    borderRadius: theme.roundness.full,
    borderWidth: 1,
  },
  themeChipSelected: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    transform: [{ scale: 1.04 }],
    ...theme.shadows.hardSm,
  },
  themeChipText: {
    fontSize: scale(13),
    fontWeight: '700',
  },
  sealsRow: {
    flexDirection: 'row',
    gap: scale(12),
  },
  sealBtn: {
    width: scale(44),
    height: scale(44),
    borderRadius: 9999,
    backgroundColor: theme.colors.surfaceBlush,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealBtnSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.sunset,
    transform: [{ scale: 1.1 }],
    ...theme.shadows.hardSm,
  },
  sealEmoji: {
    fontSize: scale(22),
  },
  contentInput: {
    minHeight: scale(130),
    textAlignVertical: 'top',
  },
  attachmentSection: {
    marginVertical: scale(10),
  },
  previewContainer: {
    width: '100%',
    height: scale(200),
    borderRadius: theme.roundness.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  previewThumb: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: scale(4),
    right: scale(4),
    width: scale(22),
    height: scale(22),
    borderRadius: 9999,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: {
    color: theme.colors.textInverse,
    fontSize: scale(11),
    fontWeight: '800',
  },
  addMediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(10),
    paddingHorizontal: scale(14),
    backgroundColor: theme.colors.surfaceBlush,
    borderRadius: theme.roundness.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  addMediaText: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(13),
    color: theme.colors.text,
  },
  vaultToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(12),
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceBlush,
    marginTop: scale(8),
    marginBottom: scale(16),
  },
  vaultToggleActive: {
    backgroundColor: '#FCE4EC',
    borderColor: theme.colors.rose,
  },
  vaultToggleIcon: {
    fontSize: scale(22),
    marginRight: scale(10),
  },
  vaultToggleInfo: {
    flex: 1,
  },
  vaultToggleTitle: {
    fontSize: scale(14),
    fontWeight: '800',
    color: theme.colors.text,
  },
  vaultToggleSub: {
    fontSize: scale(11),
    color: theme.colors.textSecondary,
    marginTop: scale(2),
  },
  toggleCheckbox: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(8),
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleCheckboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: '900',
  },
  sendBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 9999,
    paddingVertical: scale(14),
    alignItems: 'center',
    marginTop: scale(8),
    ...theme.shadows.hardSm,
  },
  sendBtnDisabled: {
    backgroundColor: theme.colors.surfaceDisabled,
  },
  sendBtnText: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(16),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomPadding: {
    height: scale(20),
  },
});
