import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { theme, scale } from '@/shared/theme';

export interface PhotoMessageViewerProps {
  mediaSignedUrl?: string | null;
  caption?: string | null;
  isMyMessage: boolean;
  status?: 'sending' | 'sent' | 'failed';
  createdAt?: string;
  onRetry?: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const PhotoMessageViewer: React.FC<PhotoMessageViewerProps> = ({
  mediaSignedUrl,
  caption,
  isMyMessage,
  status = 'sent',
  createdAt,
  onRetry,
}) => {
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(true);
  const [hasError, setHasError] = useState(false);

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

  return (
    <View style={styles.container}>
      {/* Thumbnail Card */}
      <TouchableOpacity
        activeOpacity={status === 'failed' ? 0.7 : 0.9}
        onPress={() => {
          if (status === 'failed' && onRetry) {
            onRetry();
          } else if (mediaSignedUrl && !hasError) {
            setIsFullscreenOpen(true);
          }
        }}
        style={[
          styles.thumbnailWrapper,
          isMyMessage ? styles.thumbnailMy : styles.thumbnailPartner,
          status === 'failed' && styles.thumbnailFailed,
        ]}
      >
        {mediaSignedUrl && !hasError ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: mediaSignedUrl }}
              style={styles.thumbnailImage}
              contentFit="cover"
              transition={200}
              onLoadStart={() => setIsLoadingImage(true)}
              onLoadEnd={() => setIsLoadingImage(false)}
              onError={() => {
                setIsLoadingImage(false);
                setHasError(true);
              }}
            />
            {isLoadingImage && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            )}
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderIcon}>{hasError ? '⚠️' : '📷'}</Text>
            <Text style={styles.placeholderText}>
              {hasError ? 'Failed to load photo' : 'Loading photo...'}
            </Text>
          </View>
        )}

        {/* Uploading indicator */}
        {status === 'sending' && (
          <View style={styles.sendingOverlay}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.sendingText}>Sending...</Text>
          </View>
        )}

        {/* Failed indicator overlay */}
        {status === 'failed' && (
          <View style={styles.failedOverlay}>
            <Text style={styles.failedIcon}>⚠️</Text>
            <Text style={styles.failedText}>Tap to retry</Text>
          </View>
        )}

        {/* Optional Caption */}
        {caption && caption.trim().length > 0 ? (
          <View style={styles.captionContainer}>
            <Text
              style={[
                styles.captionText,
                isMyMessage ? styles.captionTextMy : styles.captionTextPartner,
              ]}
            >
              {caption}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>

      {/* Fullscreen Lightbox Modal */}
      <Modal
        visible={isFullscreenOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFullscreenOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          {/* Header Controls */}
          <View style={styles.modalHeader}>
            <View style={styles.modalMeta}>
              <Text style={styles.modalSender}>
                {isMyMessage ? 'You' : 'Partner'}
              </Text>
              {formattedDate ? (
                <Text style={styles.modalTimestamp}>{formattedDate}</Text>
              ) : null}
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setIsFullscreenOpen(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Fullscreen Image */}
          <View style={styles.modalImageContainer}>
            {mediaSignedUrl ? (
              <Image
                source={{ uri: mediaSignedUrl }}
                style={styles.fullscreenImage}
                contentFit="contain"
              />
            ) : null}
          </View>

          {/* Bottom Caption if present */}
          {caption && caption.trim().length > 0 ? (
            <View style={styles.modalCaptionContainer}>
              <Text style={styles.modalCaptionText}>{caption}</Text>
            </View>
          ) : (
            <View style={{ height: 24 }} />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: scale(2),
  },
  thumbnailWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.hardSm,
  },
  thumbnailMy: {
    backgroundColor: theme.colors.primaryLight || '#FFEBE6',
  },
  thumbnailPartner: {
    backgroundColor: '#FFFFFF',
  },
  thumbnailFailed: {
    borderColor: theme.colors.danger,
  },
  imageContainer: {
    width: scale(220),
    height: scale(220),
    backgroundColor: '#F3E9DF',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 244, 227, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(43, 33, 24, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  sendingText: {
    color: '#FFFFFF',
    fontFamily: theme.typography.families.body,
    fontSize: 12,
    fontWeight: '600',
  },
  failedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(235, 87, 87, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  failedIcon: {
    fontSize: 22,
  },
  failedText: {
    color: '#FFFFFF',
    fontFamily: theme.typography.families.bold,
    fontSize: 12,
    fontWeight: '700',
  },
  placeholderContainer: {
    width: scale(220),
    height: scale(160),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF5EE',
    padding: 16,
  },
  placeholderIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  placeholderText: {
    fontFamily: theme.typography.families.body,
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  captionContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(43, 33, 24, 0.08)',
  },
  captionText: {
    fontFamily: theme.typography.families.body,
    fontSize: 14,
    lineHeight: 19,
  },
  captionTextMy: {
    color: theme.colors.text,
  },
  captionTextPartner: {
    color: theme.colors.text,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 14, 10, 0.95)',
    justifyContent: 'space-between',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 28,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  modalMeta: {
    flex: 1,
  },
  modalSender: {
    color: '#FFFFFF',
    fontFamily: theme.typography.families.bold,
    fontSize: 16,
    fontWeight: '700',
  },
  modalTimestamp: {
    color: '#E0D6C8',
    fontFamily: theme.typography.families.body,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  fullscreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.72,
  },
  modalCaptionContainer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalCaptionText: {
    color: '#FFFFFF',
    fontFamily: theme.typography.families.body,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
});
