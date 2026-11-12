import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { theme, scale } from '@/shared/theme';
import { Button, FormSheet } from '@/shared/ui';

export interface PhotoPreviewModalProps {
  visible: boolean;
  imageUri: string | null;
  isSending?: boolean;
  onSend: (params: { uri: string; caption?: string }) => void;
  onCancel: () => void;
}

export const PhotoPreviewModal: React.FC<PhotoPreviewModalProps> = ({
  visible,
  imageUri,
  isSending = false,
  onSend,
  onCancel,
}) => {
  const [caption, setCaption] = useState('');

  if (!visible || !imageUri) return null;

  const handleSend = () => {
    if (isSending) return;
    onSend({
      uri: imageUri,
      caption: caption.trim() || undefined,
    });
    setCaption('');
  };

  const handleCancel = () => {
    if (isSending) return;
    setCaption('');
    onCancel();
  };

  return (
    <FormSheet
      visible={visible}
      onClose={handleCancel}
      title="Send Photo 📷"
      primaryLabel="Send Photo ↑"
      onPrimary={handleSend}
      primaryDisabled={isSending}
      primaryLoading={isSending}
      secondary={
        <Button
          title="Cancel"
          variant="outline"
          size="md"
          onPress={handleCancel}
          disabled={isSending}
        />
      }
    >
      <View style={styles.contentContainer}>
        {/* Photo Preview Thumbnail */}
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: imageUri }}
            style={styles.previewImage}
            contentFit="contain"
          />
        </View>

        {/* Caption Input */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.captionInput}
            placeholder="Add a sweet note or caption…"
            placeholderTextColor={theme.colors.textSecondary}
            value={caption}
            onChangeText={setCaption}
            maxLength={200}
            editable={!isSending}
          />
        </View>
      </View>
    </FormSheet>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(62, 39, 35, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(20),
  },
  cardWrapper: {
    width: '100%',
    maxWidth: scale(360),
    position: 'relative',
  },
  cardSurface: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: scale(18),
    ...theme.shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(14),
  },
  title: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(18),
    color: theme.colors.text,
  },
  closeBtn: {
    padding: 6,
  },
  closeIcon: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
  },
  imageWrapper: {
    width: '100%',
    height: scale(220),
    borderRadius: theme.roundness.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceBlush,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: scale(14),
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.md,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    marginBottom: scale(16),
  },
  captionInput: {
    fontFamily: theme.typography.families.body,
    fontSize: scale(14),
    color: theme.colors.text,
    minHeight: scale(36),
  },
  actionsRow: {
    flexDirection: 'row',
    gap: scale(10),
  },
  btn: {
    flex: 1,
    height: scale(46),
    borderRadius: theme.roundness.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelBtn: {
    backgroundColor: theme.colors.surfaceBlush,
  },
  cancelBtnText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(14),
    color: theme.colors.text,
  },
  sendBtn: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  sendBtnText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(14),
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  contentContainer: {
    paddingBottom: scale(12),
  },
});

