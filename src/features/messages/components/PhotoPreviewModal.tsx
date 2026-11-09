import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { theme, scale } from '@/shared/theme';

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
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.cardWrapper}>
          {/* Hard Ink Shadow */}
          <View style={styles.cardShadow} />

          {/* Paper Surface */}
          <View style={styles.cardSurface}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>Send Photo 📷</Text>
              <TouchableOpacity
                onPress={handleCancel}
                disabled={isSending}
                style={styles.closeBtn}
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

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

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.btn, styles.cancelBtn]}
                onPress={handleCancel}
                disabled={isSending}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.sendBtn, isSending && styles.btnDisabled]}
                onPress={handleSend}
                disabled={isSending}
                activeOpacity={0.8}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.sendBtnText}>Send Photo ↑</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(43, 33, 24, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(20),
  },
  cardWrapper: {
    width: '100%',
    maxWidth: scale(360),
    position: 'relative',
  },
  cardShadow: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: -6,
    bottom: -6,
    backgroundColor: theme.colors.border,
    borderRadius: 22,
  },
  cardSurface: {
    backgroundColor: theme.colors.background, // Paper #FFF4E3
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: theme.colors.border,
    padding: scale(18),
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
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FAF5EE',
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginBottom: scale(14),
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  inputWrapper: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 14,
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
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  cancelBtn: {
    backgroundColor: theme.colors.surface,
  },
  cancelBtnText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(14),
    color: theme.colors.text,
  },
  sendBtn: {
    backgroundColor: theme.colors.primary, // Tomato #FF5A3C
  },
  sendBtnText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(14),
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.7,
  },
});
