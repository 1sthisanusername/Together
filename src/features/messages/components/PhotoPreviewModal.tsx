import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
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
  const [isZoomOpen, setIsZoomOpen] = useState(false);

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
    <>
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
          {/* Photo Preview Thumbnail - tap to expand fullscreen */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setIsZoomOpen(true)}
            style={styles.imageWrapper}
          >
            <Image
              source={{ uri: imageUri }}
              style={styles.previewImage}
              contentFit="contain"
            />
            <View style={styles.tapToZoomPill}>
              <Text style={styles.tapToZoomText}>🔍 Tap to expand</Text>
            </View>
          </TouchableOpacity>

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

      {/* Fullscreen Expandable Photo Modal */}
      <Modal
        visible={isZoomOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsZoomOpen(false)}
      >
        <View style={styles.zoomBackdrop}>
          <TouchableOpacity
            style={styles.zoomCloseBtn}
            onPress={() => setIsZoomOpen(false)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.zoomCloseText}>✕ Close</Text>
          </TouchableOpacity>
          <Image
            source={{ uri: imageUri }}
            style={styles.fullscreenImage}
            contentFit="contain"
          />
        </View>
      </Modal>
    </>
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
  tapToZoomPill: {
    position: 'absolute',
    bottom: scale(10),
    right: scale(10),
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: scale(10),
    paddingVertical: scale(5),
    borderRadius: theme.roundness.full,
  },
  tapToZoomText: {
    color: '#FFFFFF',
    fontSize: scale(12),
    fontFamily: theme.typography.families.medium,
  },
  zoomBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(16),
  },
  zoomCloseBtn: {
    position: 'absolute',
    top: scale(50),
    right: scale(20),
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
    borderRadius: theme.roundness.full,
  },
  zoomCloseText: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontFamily: theme.typography.families.bold,
  },
  fullscreenImage: {
    width: '100%',
    height: '85%',
  },
});

