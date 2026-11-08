import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { theme } from '@/shared/theme';

export interface VoiceNoteRecorderProps {
  onSendVoiceNote: (fileBytes: Uint8Array, durationSeconds: number) => Promise<void>;
  isUploading?: boolean;
}

export const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({
  onSendVoiceNote,
  isUploading = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isCancelled, setIsCancelled] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const durationRef = useRef(0);
  const timerRef = useRef<any>(null);
  const dragX = useRef(new Animated.Value(0)).current;

  // 2 minute maximum recording limit
  const MAX_RECORDING_SECONDS = 120;

  useEffect(() => {
    durationRef.current = durationSeconds;
    if (durationSeconds >= MAX_RECORDING_SECONDS && isRecording) {
      stopAndSend();
    }
  }, [durationSeconds, isRecording]);

  const startRecording = () => {
    setIsCancelled(false);
    setErrorText(null);
    setDurationSeconds(0);
    durationRef.current = 0;
    setIsRecording(true);

    timerRef.current = setInterval(() => {
      setDurationSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopAndSend = async () => {
    if (!isRecording) return;
    clearInterval(timerRef.current);
    setIsRecording(false);

    if (isCancelled) {
      dragX.setValue(0);
      return;
    }

    const recordedSeconds = Math.max(1, durationRef.current);
    dragX.setValue(0);

    // Create a voice audio payload
    const mockAudioBytes = new Uint8Array(1024 * Math.min(64, recordedSeconds * 2));

    try {
      await onSendVoiceNote(mockAudioBytes, recordedSeconds);
    } catch (err: any) {
      setErrorText(err.message || 'Failed to upload voice note');
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startRecording();
      },
      onPanResponderMove: (_, gestureState) => {
        // Slide left to cancel gesture (< -80px)
        if (gestureState.dx < 0) {
          dragX.setValue(gestureState.dx);
          if (gestureState.dx < -80) {
            setIsCancelled(true);
          } else {
            setIsCancelled(false);
          }
        }
      },
      onPanResponderRelease: () => {
        stopAndSend();
      },
      onPanResponderTerminate: () => {
        setIsCancelled(true);
        stopAndSend();
      },
    })
  ).current;

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isUploading) {
    return (
      <View style={styles.uploadingContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.uploadingText}>Sending voice note...</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {isRecording && (
        <View style={styles.activeOverlay}>
          <View style={styles.recordingPill}>
            <View style={styles.recordingDot} />
            <Text style={styles.timerText}>
              {formatTimer(durationSeconds)} / 2:00
            </Text>
          </View>

          <Text style={[styles.cancelText, isCancelled && styles.cancelTextActive]}>
            {isCancelled ? 'Release to cancel ✕' : '‹ Slide left to cancel'}
          </Text>
        </View>
      )}

      {errorText && (
        <TouchableOpacity onPress={() => setErrorText(null)} style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{errorText} (Tap to dismiss)</Text>
        </TouchableOpacity>
      )}

      <Animated.View
        style={[
          styles.micButtonContainer,
          isRecording && styles.micButtonActive,
          { transform: [{ translateX: dragX }] },
        ]}
        {...panResponder.panHandlers}
      >
        <Text style={styles.micIcon}>🎙️</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  micButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    transform: [{ scale: 1.15 }],
  },
  micIcon: {
    fontSize: 20,
  },
  activeOverlay: {
    position: 'absolute',
    right: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recordingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 6,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dc2626',
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#991b1b',
  },
  cancelText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  cancelTextActive: {
    color: '#dc2626',
    fontWeight: '700',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  uploadingText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  errorBanner: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  errorBannerText: {
    fontSize: 11,
    color: '#b91c1c',
  },
});

