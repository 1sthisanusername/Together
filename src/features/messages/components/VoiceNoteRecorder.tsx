import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { theme } from '@/shared/theme';

export interface SendVoiceNotePayload {
  uri?: string;
  fileBytes?: Uint8Array;
  durationSeconds: number;
}

export interface VoiceNoteRecorderProps {
  onSendVoiceNote: (payload: SendVoiceNotePayload) => Promise<void>;
  isUploading?: boolean;
  onRecordingChange?: (state: { isRecording: boolean; durationSeconds: number; isCancelled: boolean }) => void;
  pillMode?: boolean;
}

export const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({
  onSendVoiceNote,
  isUploading = false,
  onRecordingChange,
  pillMode = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isCancelled, setIsCancelled] = useState(false);
  const [hintText, setHintText] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const durationRef = useRef(0);
  const timerRef = useRef<any>(null);
  const pressStartTimeRef = useRef<number>(0);
  const holdTimeoutRef = useRef<any>(null);
  const dragX = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Real native audio recorder via expo-audio
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  // 2 minute maximum recording limit
  const MAX_RECORDING_SECONDS = 120;

  useEffect(() => {
    durationRef.current = durationSeconds;
    if (durationSeconds >= MAX_RECORDING_SECONDS && isRecording) {
      stopAndSend();
    }
  }, [durationSeconds, isRecording]);

  useEffect(() => {
    onRecordingChange?.({ isRecording, durationSeconds, isCancelled });
  }, [isRecording, durationSeconds, isCancelled, onRecordingChange]);

  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const requestMicPermission = async (): Promise<boolean> => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      return granted;
    } catch (err) {
      console.warn('Microphone permission check failed:', err);
      return false;
    }
  };

  const startRecording = async () => {
    try {
      const hasPermission = await requestMicPermission();
      if (!hasPermission) {
        setErrorText('Microphone permission required');
        setTimeout(() => setErrorText(null), 3000);
        return;
      }

      // Configure audio mode for recording
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      // Prepare and start recording
      await recorder.prepareToRecordAsync();
      recorder.record();

      setIsCancelled(false);
      setErrorText(null);
      setHintText(null);
      setDurationSeconds(0);
      durationRef.current = 0;
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setDurationSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Failed to start recording:', err);
      setErrorText('Unable to start recording');
      setTimeout(() => setErrorText(null), 3000);
    }
  };

  const stopAndSend = async () => {
    clearTimeout(holdTimeoutRef.current);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const elapsedMs = Date.now() - pressStartTimeRef.current;
    setIsRecording(false);

    try {
      if (recorder.isRecording) {
        await recorder.stop();
      }
    } catch (stopErr) {
      console.warn('Error stopping recorder:', stopErr);
    }

    // Restore audio mode
    setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
    }).catch(() => {});

    // If released too quickly (< 400ms), treat as a quick tap
    if (elapsedMs < 400) {
      dragX.setValue(0);
      setHintText('Hold to record');
      setTimeout(() => setHintText(null), 2000);
      return;
    }

    if (isCancelled) {
      dragX.setValue(0);
      return;
    }

    const rawSeconds = recorder.currentTime || durationRef.current;
    if (rawSeconds < 0.5) {
      setErrorText('Recorded voice note is empty');
      setTimeout(() => setErrorText(null), 3000);
      return;
    }

    const recordedSeconds = Math.max(1, Math.round(rawSeconds));
    dragX.setValue(0);

    const uri = recorder.uri;
    if (!uri) {
      setErrorText('Recording failed: no audio file');
      setTimeout(() => setErrorText(null), 3000);
      return;
    }

    // Verify stored size is greater than 0
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (!info.exists || (info as any).size <= 0) {
        setErrorText('Recorded voice note is empty');
        setTimeout(() => setErrorText(null), 3000);
        return;
      }

      await onSendVoiceNote({
        uri,
        durationSeconds: recordedSeconds,
      });
    } catch (err: any) {
      setErrorText(err?.message || 'Failed to send voice note');
      setTimeout(() => setErrorText(null), 3000);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      // Claim touch immediately so it does not fight list scroll
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: () => {
        pressStartTimeRef.current = Date.now();
        // Trigger recording after a brief hold threshold
        holdTimeoutRef.current = setTimeout(() => {
          startRecording();
        }, 150);
      },

      onPanResponderMove: (_, gestureState) => {
        // Slide left to cancel gesture (< -70px)
        if (gestureState.dx < 0) {
          dragX.setValue(gestureState.dx);
          if (gestureState.dx < -70) {
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
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Quick tap hint */}
      {hintText && (
        <View style={styles.hintTooltip}>
          <Text style={styles.hintTooltipText}>{hintText}</Text>
        </View>
      )}

      {/* Recording live state overlay (only in standalone non-pill mode) */}
      {!pillMode && isRecording && (
        <View style={styles.activeOverlay}>
          <View style={styles.recordingPill}>
            <Animated.View style={[styles.recordingDot, { opacity: pulseAnim }]} />
            <Text style={styles.timerText}>
              {formatTimer(durationSeconds)} / 2:00
            </Text>
          </View>

          <Text style={[styles.cancelText, isCancelled && styles.cancelTextActive]}>
            {isCancelled ? 'Release to cancel ✕' : '‹ Slide left to cancel'}
          </Text>
        </View>
      )}

      {/* Error Banner */}
      {errorText && (
        <TouchableOpacity onPress={() => setErrorText(null)} style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{errorText}</Text>
        </TouchableOpacity>
      )}

      {/* Mic Button: minimum 48x48 touch target */}
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
    width: 48,
    height: 48,
    minWidth: 48,
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  micButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    transform: [{ scale: 1.1 }],
  },
  micIcon: {
    fontSize: 20,
  },
  hintTooltip: {
    position: 'absolute',
    bottom: 52,
    right: 0,
    backgroundColor: '#1f2937',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 110,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 999,
  },
  hintTooltipText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  activeOverlay: {
    position: 'absolute',
    right: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 220,
    justifyContent: 'flex-end',
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
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    position: 'absolute',
    bottom: 52,
    right: 0,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    zIndex: 999,
  },
  errorBannerText: {
    fontSize: 11,
    color: '#b91c1c',
    fontWeight: '600',
  },
});
