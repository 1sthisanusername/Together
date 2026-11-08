import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import type { ChatMessage } from '../types';
import { VoiceNotePlayer } from './VoiceNotePlayer';
import { useDeleteChatMessage, useMarkVoicePlayed } from '../hooks/useMessages';
import { MessageErrorBoundary } from '@/shared/ui';
import { theme } from '@/shared/theme';

export interface MessageItemProps {
  message: ChatMessage;
  isMyMessage: boolean;
  viewerTimezone: string;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isMyMessage,
  viewerTimezone,
}) => {
  const { mutate: deleteMessage, isPending: isDeleting } = useDeleteChatMessage();
  const { mutate: markVoicePlayed } = useMarkVoicePlayed();

  // Convert message created_at timestamp to viewer's local timezone
  const formattedTime = new Date(message.created_at).toLocaleTimeString('en-US', {
    timeZone: viewerTimezone,
    hour: 'numeric',
    minute: '2-digit',
  });

  const handleDelete = () => {
    if (!isMyMessage) return;

    Alert.alert(
      'Delete Message',
      'Delete this message for both of you? If it has a voice note, the file will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMessage({ messageId: message.id }),
        },
      ]
    );
  };

  const isVoiceNote = !!message.media_id || !message.content;

  return (
    <View style={[styles.row, isMyMessage ? styles.rowMy : styles.rowPartner]}>
      <TouchableOpacity
        activeOpacity={isMyMessage ? 0.75 : 1}
        onLongPress={isMyMessage ? handleDelete : undefined}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleMy: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  bubblePartner: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  bubbleFailed: {
    backgroundColor: '#fef2f2',
    borderColor: '#f87171',
    borderWidth: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  textMy: {
    color: '#ffffff',
  },
  textPartner: {
    color: theme.colors.text,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 4,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  timeMy: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  timePartner: {
    color: theme.colors.textSecondary,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  statusFailed: {
    fontSize: 10,
    fontWeight: '700',
    color: '#dc2626',
  },
});

