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
  useAudioPlayer,
  useAudioPlayerStatus,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { theme, scale } from '@/shared/theme';

export interface SendVoiceNotePayload {
  uri?: string;
  fileBytes?: Uint8Array;
  durationSeconds: number;
}

export interface VoiceNoteRecorderProps {
  onSendVoiceNote: (payload: SendVoiceNotePayload) => Promise<void>;
  isUploading?: boolean;
  onRecordingChange?: (state: {
    isRecording: boolean;
    durationSeconds: number;
    isCancelled: boolean;
    isPreviewing: boolean;
  }) => void;
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
  const [previewData, setPreviewData] = useState<{
    uri: string;
    durationSeconds: number;
  } | null>(null);

  const durationRef = useRef(0);
  const timerRef = useRef<any>(null);
  const pressStartTimeRef = useRef<number>(0);
  const holdTimeoutRef = useRef<any>(null);
  const dragX = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Real native audio recorder via expo-audio
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  // Audio player for previewing before sending
  const previewPlayer = useAudioPlayer(
    previewData?.uri ? { uri: previewData.uri } : null
  );
  const previewStatus = useAudioPlayerStatus(previewPlayer);

  // 2 minute maximum recording limit
  const MAX_RECORDING_SECONDS = 120;

  useEffect(() => {
    durationRef.current = durationSeconds;
    if (durationSeconds >= MAX_RECORDING_SECONDS && isRecording) {
      stopRecordingAndPreparePreview();
    }
  }, [durationSeconds, isRecording]);

  useEffect(() => {
    onRecordingChange?.({
      isRecording,
      durationSeconds,
      isCancelled,
      isPreviewing: !!previewData,
    });
  }, [isRecording, durationSeconds, isCancelled, previewData, onRecordingChange]);

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
      setPreviewData(null);
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

  const stopRecordingAndPreparePreview = async () => {
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

      // Enter preview mode before sending
      setPreviewData({
        uri,
        durationSeconds: recordedSeconds,
      });
    } catch (err: any) {
      setErrorText(err?.message || 'Failed to process voice note');
      setTimeout(() => setErrorText(null), 3000);
    }
  };

  const togglePreviewPlay = async () => {
    if (!previewPlayer) return;
    try {
      if (previewStatus?.playing) {
        previewPlayer.pause();
      } else {
        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
        }).catch(() => {});
        previewPlayer.play();
      }
    } catch (err) {
      console.warn('Error toggling preview player:', err);
    }
  };

  const discardPreview = () => {
    try {
      if (previewStatus?.playing) {
        previewPlayer?.pause();
      }
    } catch {}
    setPreviewData(null);
    setDurationSeconds(0);
    durationRef.current = 0;
  };

  const confirmSendPreview = async () => {
    if (!previewData) return;
    try {
      if (previewStatus?.playing) {
        previewPlayer?.pause();
      }
    } catch {}

    const toSend = { ...previewData };
    setPreviewData(null);
    setDurationSeconds(0);
    durationRef.current = 0;

    try {
      await onSendVoiceNote(toSend);
    } catch (err: any) {
      setErrorText(err?.message || 'Failed to send voice note');
      setTimeout(() => setErrorText(null), 3000);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: () => {
        pressStartTimeRef.current = Date.now();
        holdTimeoutRef.current = setTimeout(() => {
          startRecording();
        }, 150);
      },

      onPanResponderMove: (_, gestureState) => {
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
        stopRecordingAndPreparePreview();
      },

      onPanResponderTerminate: () => {
        setIsCancelled(true);
        stopRecordingAndPreparePreview();
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

  // PREVIEW MODE: Review audio before sending
  if (previewData) {
    return (
      <View style={styles.previewRow}>
        {/* Discard / Cancel button */}
        <TouchableOpacity
          style={styles.previewDiscardBtn}
          onPress={discardPreview}
          activeOpacity={0.7}
          accessibilityLabel="Discard recording"
        >
          <Text style={styles.previewDiscardIcon}>🗑️</Text>
        </TouchableOpacity>

        {/* Play / Pause button */}
        <TouchableOpacity
          style={styles.previewPlayBtn}
          onPress={togglePreviewPlay}
          activeOpacity={0.8}
          accessibilityLabel={previewStatus?.playing ? 'Pause' : 'Play'}
        >
          <Text style={styles.previewPlayIcon}>
            {previewStatus?.playing ? '⏸' : '▶'}
          </Text>
        </TouchableOpacity>

        {/* Duration badge */}
        <View style={styles.previewDurationBadge}>
          <Text style={styles.previewDurationText}>
            {formatTimer(previewData.durationSeconds)}
          </Text>
        </View>

        {/* Confirm Send button */}
        <TouchableOpacity
          style={styles.previewSendBtn}
          onPress={confirmSendPreview}
          activeOpacity={0.8}
          accessibilityLabel="Send recording"
        >
          <Text style={styles.previewSendIcon}>↑</Text>
        </TouchableOpacity>
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
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
    ...theme.shadows.hardSm,
  },
  micButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  micIcon: {
    fontSize: 20,
  },
  uploadingContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    paddingHorizontal: 4,
  },
  previewDiscardBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewDiscardIcon: {
    fontSize: 16,
  },
  previewPlayBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.stickers.sunshine,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewPlayIcon: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  previewDurationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  previewDurationText: {
    fontFamily: theme.typography.families.bold,
    fontSize: 12,
    color: theme.colors.text,
  },
  previewSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.primary,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.hardSm,
  },
  previewSendIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  activeOverlay: {
    position: 'absolute',
    left: -200,
    right: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  recordingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.danger,
  },
  timerText: {
    fontFamily: theme.typography.families.bold,
    fontSize: 13,
    color: theme.colors.text,
  },
  cancelText: {
    fontFamily: theme.typography.families.body,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  cancelTextActive: {
    color: theme.colors.danger,
    fontWeight: 'bold',
  },
  hintTooltip: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  hintTooltipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: theme.typography.families.body,
  },
  errorBanner: {
    position: 'absolute',
    bottom: 52,
    backgroundColor: theme.colors.danger,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  errorBannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: theme.typography.families.bold,
  },
});
