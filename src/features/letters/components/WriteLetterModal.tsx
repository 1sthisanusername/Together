import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { Sheet, Input, Button, ErrorState, DatePickerField } from '@/shared/ui';
import { useSendLetter, StationeryTheme, SealSticker } from '../hooks/useLetters';
import { theme, scale, triggerHaptic } from '@/shared/theme';

export interface WriteLetterModalProps {
  visible: boolean;
  onClose: () => void;
  partnerName: string;
}

const THEMES: { id: StationeryTheme; label: string; bg: string; border: string; text: string }[] = [
  { id: 'parchment_cream', label: 'Parchment', bg: '#FFF4E3', border: '#2B2118', text: '#2B2118' },
  { id: 'rose_petal', label: 'Rose Petal', bg: '#FFF0F5', border: '#FF8FB1', text: '#4A1525' },
  { id: 'matcha_mint', label: 'Matcha Mint', bg: '#E8F8F5', border: '#2EC4B6', text: '#0E3B33' },
  { id: 'midnight_sky', label: 'Midnight', bg: '#201B2B', border: '#A29BFE', text: '#FDFBF7' },
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
                    { backgroundColor: item.bg, borderColor: isSelected ? '#2B2118' : '#D2CCC4' },
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

        <Button
          title={isVault ? 'Save to Vault 🔒' : t('letters.sendLetter')}
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
  sectionBlock: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2B2118',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  themeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  themeChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 2,
  },
  themeChipSelected: {
    borderWidth: 2.5,
    transform: [{ scale: 1.04 }],
    shadowColor: '#2B2118',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  themeChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sealsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sealBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF4E3',
    borderWidth: 2,
    borderColor: '#D2CCC4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealBtnSelected: {
    borderColor: '#2B2118',
    backgroundColor: '#FFC93C',
    transform: [{ scale: 1.1 }],
    shadowColor: '#2B2118',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  sealEmoji: {
    fontSize: 22,
  },
  contentInput: {
    height: 130,
    textAlignVertical: 'top',
  },
  attachmentSection: {
    marginVertical: 10,
  },
  addMediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#F8F4EE',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2B2118',
    borderStyle: 'dashed',
  },
  addMediaText: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: 13,
    fontWeight: '700',
    color: '#2B2118',
  },
  previewContainer: {
    position: 'relative',
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#2B2118',
  },
  previewThumb: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF5A3C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  vaultToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#2B2118',
    backgroundColor: '#FFF4E3',
    marginTop: 8,
    marginBottom: 16,
  },
  vaultToggleActive: {
    backgroundColor: '#FFF0F5',
    borderColor: '#FF8FB1',
  },
  vaultToggleIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  vaultToggleInfo: {
    flex: 1,
  },
  vaultToggleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2B2118',
  },
  vaultToggleSub: {
    fontSize: 11,
    color: '#5C4A3A',
    marginTop: 2,
  },
  toggleCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#2B2118',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleCheckboxChecked: {
    backgroundColor: '#2EC4B6',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  sendButton: {
    marginTop: 8,
  },
});

