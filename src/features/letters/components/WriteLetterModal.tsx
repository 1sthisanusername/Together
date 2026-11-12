import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { FormSheet, Input, ErrorState, DatePickerField } from '@/shared/ui';
import { useSendLetter, StationeryTheme, SealSticker } from '../hooks/useLetters';
import { theme, scale, triggerHaptic } from '@/shared/theme';

export interface WriteLetterModalProps {
  visible: boolean;
  onClose: () => void;
  partnerName: string;
}

const THEMES: { id: StationeryTheme; label: string; bg: string; border: string; text: string }[] = [
  { id: 'parchment_cream', label: 'Parchment', bg: '#FFF0ED', border: '#FBE9E7', text: '#3E2723' },
  { id: 'rose_petal', label: 'Rose Petal', bg: '#FCE4EC', border: '#F48FB1', text: '#3E2723' },
  { id: 'matcha_mint', label: 'Matcha Mint', bg: '#EBF7F2', border: '#B2DFDB', text: '#2B4C43' },
  { id: 'midnight_sky', label: 'Midnight', bg: '#2A1C1A', border: '#FFB74D', text: '#FFFDFB' },
];

const SEALS: SealSticker[] = ['❤️', '💌', '🌸', '🌙', '✨'];

export const WriteLetterModal: React.FC<WriteLetterModalProps> = ({
  visible,
  onClose,
  partnerName,
}) => {
  const { t } = useTranslation();
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
      setTitle('');
      setContent('');
      setUnlockDate('');
      setSelectedTheme('parchment_cream');
      setSelectedSeal('❤️');
      setIsVault(false);
      setPhotoUrl(null);
      onClose();
    } catch {
      // Handled by error state
    }
  };

  const isFormValid = !!title.trim() && !!content.trim();
  const disabledReason = !title.trim()
    ? 'Please enter a title for your letter'
    : !content.trim()
    ? 'Please write your message before sending'
    : null;

  return (
    <FormSheet
      visible={visible}
      onClose={onClose}
      title={t('letters.writeNew')}
      primaryLabel={isVault ? 'Save to Vault 🔒' : t('letters.sendLetter')}
      onPrimary={handleSend}
      primaryDisabled={!isFormValid}
      primaryLoading={isPending}
      disabledReason={disabledReason}
    >
      <View style={styles.container}>
        {error ? (
          <ErrorState
            title={t('common.errorTitle')}
            message={error.message}
            onRetry={reset}
            retryTitle={t('common.retry')}
          />
        ) : null}

        <Input
          label="Letter Title (When to open)"
          placeholder="e.g. Open when you feel lonely..."
          value={title}
          onChangeText={setTitle}
        />

        {/* Stationery Theme Selector */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>Stationery Style</Text>
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
          <Text style={styles.sectionLabel}>Wax Seal Sticker</Text>
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
          label="Your Letter"
          placeholder="Write from your heart..."
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={6}
          style={styles.contentInput}
        />

        {/* Media Attachments */}
        <View style={styles.attachmentSection}>
          <Text style={styles.sectionLabel}>Add Memory / Photo</Text>
          {photoUrl ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: photoUrl }} style={styles.previewThumb} />
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
              <Text style={styles.addMediaText}>📷 Attach a Photo to Letter</Text>
            </TouchableOpacity>
          )}
        </View>

        <DatePickerField
          label="Optional Lock Date"
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
            <Text style={styles.vaultToggleTitle}>Lock in Private Vault</Text>
            <Text style={styles.vaultToggleSub}>
              Only viewable with your couple PIN inside the Vault
            </Text>
          </View>
          <View style={[styles.toggleCheckbox, isVault && styles.toggleCheckboxChecked]}>
            {isVault ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
        </TouchableOpacity>
      </View>
    </FormSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: scale(12),
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
    height: scale(130),
    textAlignVertical: 'top',
  },
  attachmentSection: {
    marginVertical: scale(10),
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
    fontWeight: '700',
    color: theme.colors.text,
  },
  previewContainer: {
    position: 'relative',
    width: scale(90),
    aspectRatio: 1,
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
  sendButton: {
    marginTop: scale(8),
  },
});

