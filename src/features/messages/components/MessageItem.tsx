import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { ChatMessage } from '../types';
import { VoiceNotePlayer } from './VoiceNotePlayer';
import { PhotoMessageViewer } from './PhotoMessageViewer';
import { useDeleteChatMessage, useMarkVoicePlayed } from '../hooks/useMessages';
import { MessageErrorBoundary, ThemedConfirmDialog } from '@/shared/ui';
import { theme, scale } from '@/shared/theme';

export interface MessageItemProps {
  message: ChatMessage;
  isMyMessage: boolean;
  viewerTimezone: string;
  onRetry?: (message: ChatMessage) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isMyMessage,
  viewerTimezone,
  onRetry,
}) => {
  const { mutate: deleteMessage, isPending: isDeleting } = useDeleteChatMessage();
  const { mutate: markVoicePlayed } = useMarkVoicePlayed();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Convert message created_at timestamp to viewer's local timezone
  const formattedTime = new Date(message.created_at).toLocaleTimeString('en-US', {
    timeZone: viewerTimezone,
    hour: 'numeric',
    minute: '2-digit',
  });

  const handleDeleteConfirm = () => {
    deleteMessage(
      { messageId: message.id },
      {
        onSettled: () => {
          setShowDeleteDialog(false);
        },
      }
    );
  };

  // Explicit attachment differentiation
  const mimeType = message.media?.mime_type || '';
  const isImage =
    mimeType.startsWith('image/') ||
    (!!message.mediaSignedUrl &&
      !mimeType.startsWith('audio/') &&
      !message.media?.duration_seconds &&
      !message.content);

  const isVoiceNote =
    !isImage &&
    (mimeType.startsWith('audio/') || (!message.content && !!message.media_id));

  return (
    <View style={[styles.row, isMyMessage ? styles.rowMy : styles.rowPartner]}>
      {isImage ? (
        // Photo message bubble with String & Stickers styling
        <View style={[styles.photoBubbleContainer, isMyMessage ? styles.bubbleMyAlign : styles.bubblePartnerAlign]}>
          <TouchableOpacity
            activeOpacity={0.9}
            onLongPress={isMyMessage ? () => setShowDeleteDialog(true) : undefined}
          >
            <PhotoMessageViewer
              mediaSignedUrl={message.mediaSignedUrl}
              caption={message.content}
              isMyMessage={isMyMessage}
              status={message.status}
              createdAt={message.created_at}
              onRetry={() => onRetry?.(message)}
            />
          </TouchableOpacity>
          <View style={styles.footerRow}>
            <Text style={styles.photoTimeText}>{formattedTime}</Text>
            {isMyMessage && (
              <View style={styles.statusIndicator}>
                {message.status === 'sending' ? (
                  <Text style={styles.statusIcon}>⏳</Text>
                ) : message.status === 'failed' ? (
                  <Text style={styles.statusFailed}>⚠️</Text>
                ) : (
                  <Text style={styles.statusIcon}>✓</Text>
                )}
              </View>
            )}
          </View>
        </View>
      ) : (
        // Standard text or voice note bubble
        <TouchableOpacity
          activeOpacity={isMyMessage ? 0.75 : 1}
          onLongPress={isMyMessage ? () => setShowDeleteDialog(true) : undefined}
          onPress={() => {
            if (message.status === 'failed' && onRetry) {
              onRetry(message);
            }
          }}
          style={[
            styles.bubble,
            isMyMessage ? styles.bubbleMy : styles.bubblePartner,
            message.status === 'failed' && styles.bubbleFailed,
          ]}
        >
          <MessageErrorBoundary isMyMessage={isMyMessage}>
            {isVoiceNote ? (
              <VoiceNotePlayer
                mediaSignedUrl={message.mediaSignedUrl}
                bucketPath={message.media?.bucket_path}
                mediaId={message.media_id}
                durationSeconds={message.media?.duration_seconds}
                playedAt={message.played_at}
                isMyMessage={isMyMessage}
                onPlayed={() => markVoicePlayed({ messageId: message.id })}
              />
            ) : (
              <Text style={[styles.messageText, isMyMessage ? styles.textMy : styles.textPartner]}>
                {message.content}
              </Text>
            )}
          </MessageErrorBoundary>

          <View style={styles.footerRow}>
            <Text style={[styles.timeText, isMyMessage ? styles.timeMy : styles.timePartner]}>
              {formattedTime}
            </Text>

            {isMyMessage && (
              <View style={styles.statusIndicator}>
                {message.status === 'sending' ? (
                  <Text style={styles.statusIcon}>⏳</Text>
                ) : message.status === 'failed' ? (
                  <Text style={styles.statusFailed}>⚠️ Failed</Text>
                ) : (
                  <Text style={styles.statusIcon}>✓</Text>
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      )}

      {/* Themed Confirmation Dialog for Deletion */}
      <ThemedConfirmDialog
        visible={showDeleteDialog}
        emoji="🗑️"
        title="Delete Message"
        message="Delete this message for both of you? If it has an attachment, the media will also be removed."
        confirmLabel="Delete"
        cancelLabel="Keep"
        isDestructive
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    marginVertical: 4,
    paddingHorizontal: 16,
    flexDirection: 'row',
    width: '100%',
  },
  rowMy: {
    justifyContent: 'flex-end',
  },
  rowPartner: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border, // #FBE9E7
    ...theme.shadows.hardSm,
  },
  bubbleMy: {
    backgroundColor: theme.colors.rose, // Blushing Rose #F48FB1
    borderColor: theme.colors.rose,
    borderBottomRightRadius: 6,
  },
  bubblePartner: {
    backgroundColor: theme.colors.surfaceBlush, // Soft pale blush #FFF0ED
    borderBottomLeftRadius: 6,
  },
  bubbleFailed: {
    backgroundColor: theme.colors.surfaceDisabled, // #FBE9E7
    borderColor: theme.colors.danger,
  },
  photoBubbleContainer: {
    maxWidth: '82%',
  },
  bubbleMyAlign: {
    alignItems: 'flex-end',
  },
  bubblePartnerAlign: {
    alignItems: 'flex-start',
  },
  messageText: {
    fontSize: scale(15),
    lineHeight: scale(21),
    fontFamily: theme.typography.families.body,
  },
  textMy: {
    color: theme.colors.text,
  },
  textPartner: {
    color: theme.colors.text,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: scale(6),
    marginTop: scale(4),
  },
  timeText: {
    fontSize: scale(10),
    fontWeight: '500',
    fontFamily: theme.typography.families.body,
  },
  photoTimeText: {
    fontSize: scale(10),
    fontWeight: '500',
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.families.body,
  },
  timeMy: {
    color: 'rgba(62, 39, 35, 0.7)',
  },
  timePartner: {
    color: theme.colors.textSecondary,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: scale(10),
    color: 'rgba(62, 39, 35, 0.75)',
  },
  statusFailed: {
    fontSize: scale(10),
    fontWeight: '700',
    color: theme.colors.danger,
  },
});
