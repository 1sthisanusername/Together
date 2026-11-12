import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  KeyboardAvoidingView,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import { useAuthStore } from '@/features/auth';
import { useActiveCouple } from '@/features/couple';
import {
  useMessages,
  useSendTextMessage,
  useSendVoiceNote,
  useSendPhotoMessage,
  useRetryChatMessage,
} from '../hooks/useMessages';
import { MessageItem } from './MessageItem';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';
import { PhotoPreviewModal } from './PhotoPreviewModal';
import {
  LoadingState,
  EmptyState,
  CameraIcon,
  GalleryIcon,
  PlusIcon,
  ChatIcon,
} from '@/shared/ui';
import { theme, scale } from '@/shared/theme';

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
  const { mutateAsync: sendPhoto, isPending: isSendingPhoto } = useSendPhotoMessage();
  const { mutate: retryMessage } = useRetryChatMessage();

  const insets = useSafeAreaInsets();
  // Dynamically clear the user's system navigation bar (3-button bar, gesture pill, or home line)
  const bottomSafeInset = Math.max(insets.bottom, 0);
  const closedBottomPadding = bottomSafeInset > 0 ? bottomSafeInset + scale(10) : scale(14);
  const [inputText, setInputText] = useState('');
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const scrollViewRef = useRef<any>(null);

  const [recordingState, setRecordingState] = useState({
    isRecording: false,
    durationSeconds: 0,
    isCancelled: false,
    isPreviewing: false,
  });

  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (recordingState.isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [recordingState.isRecording]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

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

  const handleSendVoiceNote = async (payload: { uri?: string; fileBytes?: Uint8Array; durationSeconds: number }) => {
    await sendVoice({
      uri: payload.uri,
      fileBytes: payload.fileBytes,
      durationSeconds: payload.durationSeconds,
    });
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleCameraPress = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to snap a photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setPreviewImageUri(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to capture photo');
    }
  };

  const handleGalleryPress = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Photo library access is needed to select photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setPreviewImageUri(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to select photo');
    }
  };

  const handleSendPhotoWithCaption = async ({
    uri,
    caption,
  }: {
    uri: string;
    caption?: string;
  }) => {
    setPreviewImageUri(null);
    try {
      await sendPhoto({ uri, caption });
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      // Handled by optimistic failure status
    }
  };

  const handleMorePress = () => {
    Alert.alert('More Options', 'Select an action to share with your partner:', [
      { text: '📷 Take Photo', onPress: handleCameraPress },
      { text: '🖼️ Choose from Gallery', onPress: handleGalleryPress },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
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

      {/* Message list with keyboard dismissal */}
      <KeyboardAvoidingView
        style={styles.listContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {isLoading ? (
          <View style={styles.centerContainer}>
            <LoadingState message="Loading messages..." />
          </View>
        ) : !messages || messages.length === 0 ? (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <ChatIcon color={theme.colors.primary} size={scale(28)} />
              </View>
              <Text style={styles.emptyTitle}>Your Private Messages</Text>
              <Text style={styles.emptySubtitle}>
                Send sweet notes and voice messages to {partnerName}. No read receipts, no guilt.
              </Text>
            </View>
          </TouchableWithoutFeedback>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.messageList}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
          >
            {messages.map((msg) => (
              <MessageItem
                key={msg.id}
                message={msg}
                isMyMessage={msg.sender_id === user?.id}
                viewerTimezone={viewerTimezone}
                onRetry={(failedMsg) => retryMessage(failedMsg)}
              />
            ))}
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {/* Input bar inside KeyboardStickyView - clears nav bar/line when closed, flush above keyboard when opened */}
      <KeyboardStickyView offset={{ closed: 0, opened: bottomSafeInset }}>
        <View style={[styles.inputBarContainer, { paddingBottom: closedBottomPadding }]}>
          <View
            style={[
              styles.pill,
              recordingState.isRecording && styles.pillRecording,
              recordingState.isPreviewing && styles.pillRecording,
            ]}
          >
            {recordingState.isRecording ? (
              <View style={styles.recordingRow}>
                <View style={styles.timerPill}>
                  <Animated.View style={[styles.recordingDot, { opacity: pulseAnim }]} />
                  <Text style={styles.timerText}>
                    {formatTimer(recordingState.durationSeconds)} / 2:00
                  </Text>
                </View>

                <Text
                  style={[
                    styles.cancelHintText,
                    recordingState.isCancelled && styles.cancelHintTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {recordingState.isCancelled ? 'Release to cancel ✕' : '‹ Slide left to cancel'}
                </Text>

                <VoiceNoteRecorder
                  onSendVoiceNote={handleSendVoiceNote}
                  isUploading={isSendingVoice}
                  pillMode
                  onRecordingChange={setRecordingState}
                />
              </View>
            ) : recordingState.isPreviewing ? (
              <View style={styles.previewModeRow}>
                <Text style={styles.previewModeTitle}>Preview voice note</Text>
                <VoiceNoteRecorder
                  onSendVoiceNote={handleSendVoiceNote}
                  isUploading={isSendingVoice}
                  pillMode
                  onRecordingChange={setRecordingState}
                />
              </View>
            ) : (
              <View style={styles.normalRow}>
                {/* Left: filled round camera button (min 48x48dp target) */}
                <TouchableOpacity
                  style={styles.cameraBtn}
                  onPress={handleCameraPress}
                  activeOpacity={0.75}
                  accessibilityLabel="Take Photo"
                >
                  <CameraIcon color="#FFFFFF" size={scale(20)} />
                </TouchableOpacity>

                {/* Middle: flexible "Message…" field (grows up to ~4 lines) */}
                <TextInput
                  style={styles.textInput}
                  placeholder={`Message ${partnerName}…`}
                  placeholderTextColor={theme.colors.textSecondary}
                  value={inputText}
                  onChangeText={setInputText}
                  onFocus={() => {
                    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
                  }}
                  multiline
                  maxLength={1000}
                />

                {/* Right: icon buttons row (gallery, "+", mic/send) */}
                <View style={styles.rightIconsRow}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={handleGalleryPress}
                    activeOpacity={0.75}
                    accessibilityLabel="Choose from Gallery"
                  >
                    <GalleryIcon color={theme.colors.text} size={scale(20)} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={handleMorePress}
                    activeOpacity={0.75}
                    accessibilityLabel="More Options"
                  >
                    <PlusIcon color={theme.colors.text} size={scale(20)} />
                  </TouchableOpacity>

                  {inputText.trim().length > 0 ? (
                    <TouchableOpacity
                      style={styles.sendBtn}
                      onPress={handleSendText}
                      disabled={isSendingText}
                      activeOpacity={0.8}
                      accessibilityLabel="Send Message"
                    >
                      <Text style={styles.sendIcon}>↑</Text>
                    </TouchableOpacity>
                  ) : (
                    <VoiceNoteRecorder
                      onSendVoiceNote={handleSendVoiceNote}
                      isUploading={isSendingVoice}
                      pillMode
                      onRecordingChange={setRecordingState}
                    />
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
      </KeyboardStickyView>

      {/* Photo Preview & Caption Modal before sending */}
      <PhotoPreviewModal
        visible={!!previewImageUri}
        imageUri={previewImageUri}
        isSending={isSendingPhoto}
        onSend={handleSendPhotoWithCaption}
        onCancel={() => setPreviewImageUri(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContainer: {
    flex: 1,
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
    marginRight: scale(12),
    padding: scale(6),
  },
  backIcon: {
    fontSize: scale(20),
    color: theme.colors.text,
  },
  headerInfo: {
    flex: 1,
  },
  partnerTitle: {
    fontSize: scale(17),
    fontWeight: '800',
    color: theme.colors.text,
  },
  coupleSubtitle: {
    fontSize: scale(12),
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
    paddingHorizontal: scale(36),
  },
  emptyIconCircle: {
    width: scale(64),
    height: scale(64),
    borderRadius: 9999,
    backgroundColor: theme.colors.surfaceBlush,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(14),
  },
  emptyTitle: {
    fontSize: scale(18),
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: scale(6),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: scale(14),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: scale(20),
  },
  messageList: {
    paddingVertical: scale(14),
  },
  inputBarContainer: {
    paddingHorizontal: scale(10),
    paddingTop: scale(8),
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceBlush,
    borderRadius: theme.roundness.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: scale(6),
    paddingVertical: scale(4),
    minHeight: scale(52),
    ...theme.shadows.hardSm,
  },
  pillRecording: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  normalRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cameraBtn: {
    width: scale(44),
    height: scale(44),
    minWidth: 48,
    minHeight: 48,
    borderRadius: 9999,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    fontSize: scale(18),
  },
  textInput: {
    flex: 1,
    minHeight: scale(40),
    maxHeight: scale(110),
    paddingHorizontal: scale(12),
    paddingVertical: Platform.OS === 'ios' ? scale(8) : scale(4),
    fontSize: scale(16),
    color: theme.colors.text,
  },
  rightIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(2),
  },
  iconBtn: {
    width: scale(44),
    height: scale(44),
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
  },
  actionIcon: {
    fontSize: scale(20),
  },
  sendBtn: {
    width: scale(44),
    height: scale(44),
    minWidth: 48,
    minHeight: 48,
    borderRadius: 9999,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    color: '#ffffff',
    fontSize: scale(20),
    fontWeight: '800',
  },
  recordingRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(6),
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
    borderRadius: theme.roundness.full,
    gap: scale(6),
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  recordingDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: 9999,
    backgroundColor: '#EF4444',
  },
  timerText: {
    fontSize: scale(13),
    fontWeight: '700',
    color: '#B91C1C',
  },
  cancelHintText: {
    flex: 1,
    textAlign: 'center',
    fontSize: scale(13),
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginHorizontal: scale(8),
  },
  cancelHintTextActive: {
    color: theme.colors.danger,
    fontWeight: '800',
  },
  previewModeRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(8),
  },
  previewModeTitle: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(13),
    color: theme.colors.text,
  },
});
