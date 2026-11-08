import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuthStore } from '@/features/auth';
import { useActiveCouple } from '@/features/couple';
import {
  useMessages,
  useSendTextMessage,
  useSendVoiceNote,
} from '../hooks/useMessages';
import { MessageItem } from './MessageItem';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';
import { LoadingState, EmptyState } from '@/shared/ui';
import { theme } from '@/shared/theme';

export interface ChatThreadProps {
  onBack?: () => void;
}

export const ChatThread: React.FC<ChatThreadProps> = ({ onBack }) => {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const { data: coupleData } = useActiveCouple();
  const partnerName = coupleData?.partner?.display_name || 'Partner';

  const { data: messages, isLoading } = useMessages();
  const { mutateAsync: sendText, isPending: isSendingText } = useSendTextMessage();
  const { mutateAsync: sendVoice, isPending: isSendingVoice } = useSendVoiceNote();

  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<any>(null);

  const viewerTimezone = profile?.timezone || 'UTC';

  const handleSendText = async () => {
    if (!inputText.trim() || isSendingText) return;
    const textToSend = inputText.trim();
    setInputText('');

    try {
      await sendText({ content: textToSend });
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      // Handled by optimistic failure status
    }
  };

  const handleSendVoiceNote = async (fileBytes: Uint8Array, durationSeconds: number) => {
    await sendVoice({
      fileBytes,
      durationSeconds,
    });
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.partnerTitle}>{partnerName}</Text>
          <Text style={styles.coupleSubtitle}>Private Couple Thread</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <LoadingState message="Loading messages..." />
        </View>
      ) : !messages || messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyTitle}>Your Private Messages</Text>
          <Text style={styles.emptySubtitle}>
            Send sweet notes and voice messages to {partnerName}. No read receipts, no guilt.
          </Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              isMyMessage={msg.sender_id === user?.id}
              viewerTimezone={viewerTimezone}
            />
          ))}
        </ScrollView>
      )}

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder={`Message ${partnerName}...`}
          placeholderTextColor={theme.colors.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
        />

        {inputText.trim().length > 0 ? (
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={handleSendText}
            disabled={isSendingText}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        ) : (
          <VoiceNoteRecorder
            onSendVoiceNote={handleSendVoiceNote}
            isUploading={isSendingVoice}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    backgroundColor: theme.colors.surface,
  },
  backBtn: {
    marginRight: 12,
    padding: 6,
  },
  backIcon: {
    fontSize: 20,
    color: theme.colors.text,
  },
  headerInfo: {
    flex: 1,
  },
  partnerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.text,
  },
  coupleSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  emptyEmoji: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  messageList: {
    paddingVertical: 14,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    gap: 10,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    color: theme.colors.text,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
});
