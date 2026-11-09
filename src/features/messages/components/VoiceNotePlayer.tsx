import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { storage } from '@/services/storage';
import { theme } from '@/shared/theme';

export interface VoiceNotePlayerProps {
  mediaSignedUrl?: string | null;
  bucketPath?: string | null;
  mediaId?: string | null;
  durationSeconds?: number | null;
  playedAt?: string | null;
  isMyMessage: boolean;
  onPlayed?: () => void;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({
  mediaSignedUrl,
  bucketPath,
  mediaId,
  durationSeconds = 15,
  playedAt,
  isMyMessage,
  onPlayed,
}) => {
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.5 | 2>(1);
  const [activeUrl, setActiveUrl] = useState<string | null>(mediaSignedUrl || null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isResolvingUrl, setIsResolvingUrl] = useState(false);

  // Sync activeUrl if parent provides a fresh signed URL
  useEffect(() => {
    if (mediaSignedUrl && mediaSignedUrl !== activeUrl) {
      setActiveUrl(mediaSignedUrl);
      setPlaybackError(null);
    }
  }, [mediaSignedUrl]);

  // Initialize native audio player via expo-audio safely
  const player = useAudioPlayer(activeUrl ? { uri: activeUrl } : null);
  const status = useAudioPlayerStatus(player);

  const totalDuration = Math.max(1, durationSeconds || Math.round(status?.duration || 15));
  const isPlaying = status?.playing ?? false;
  const progressSeconds = status?.currentTime ?? 0;

  // Resolve signed URL on demand if null or expired
  const refreshSignedUrl = useCallback(async (): Promise<string | null> => {
    try {
      setIsResolvingUrl(true);
      if (bucketPath) {
        const freshUrl = await storage.getSignedUrl(bucketPath, 3600);
        if (freshUrl) {
          setActiveUrl(freshUrl);
          setPlaybackError(null);
          return freshUrl;
        }
      }
      return null;
    } catch (err) {
      console.warn('[VoiceNotePlayer] Error resolving signed URL:', err);
      return null;
    } finally {
      setIsResolvingUrl(false);
    }
  }, [bucketPath]);

  const togglePlay = async () => {
    try {
      setPlaybackError(null);

      // 1. Ensure audio mode is set for playback
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
      }).catch((err) => {
        console.warn('[VoiceNotePlayer] Audio mode warning:', err);
      });

      // 2. If no activeUrl yet, attempt to resolve from storage
      let urlToPlay = activeUrl;
      if (!urlToPlay && (bucketPath || mediaId)) {
        urlToPlay = await refreshSignedUrl();
      }

      if (!urlToPlay) {
        setPlaybackError("Can't play this voice note");
        return;
      }

      if (!player) {
        setPlaybackError("Can't play this voice note");
        return;
      }

      if (!isPlaying) {
        if (!playedAt && !isMyMessage && onPlayed) {
          try {
            onPlayed();
          } catch {}
        }

        try {
          player.playbackRate = playbackSpeed;
        } catch {}

        try {
          await player.play();
        } catch (playErr) {
          // Attempt refreshing signed URL once in case the current token expired
          const fresh = await refreshSignedUrl();
          if (!fresh) {
            setPlaybackError("Can't play this voice note");
          }
        }
      } else {
        try {
          player.pause();
        } catch {}
      }
    } catch (err: any) {
      console.warn('[VoiceNotePlayer] Playback toggle error:', err);
      setPlaybackError("Can't play this voice note");
    }
  };

  const cycleSpeed = () => {
    try {
      const nextSpeed: 1 | 1.5 | 2 = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
      setPlaybackSpeed(nextSpeed);
      if (player) {
        player.playbackRate = nextSpeed;
      }
    } catch (err) {
      console.warn('[VoiceNotePlayer] Speed toggle error:', err);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const [trackWidth, setTrackWidth] = useState(0);

  const handleTrackPress = (e: any) => {
    if (!player || totalDuration <= 0 || trackWidth <= 0) return;
    try {
      const locationX = e.nativeEvent.locationX;
      const fraction = Math.max(0, Math.min(1, locationX / trackWidth));
      const targetSecs = fraction * totalDuration;
      if (typeof player.seekTo === 'function') {
        player.seekTo(targetSecs);
      }
    } catch (err) {
      console.warn('[VoiceNotePlayer] Seek error:', err);
    }
  };

  const progressPercent = Math.min(100, Math.max(0, (progressSeconds / totalDuration) * 100));

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={[styles.playBtn, playbackError ? styles.playBtnError : null]}
          onPress={togglePlay}
          activeOpacity={0.8}
          disabled={isResolvingUrl}
        >
          {isResolvingUrl ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.playIcon}>{playbackError ? '⚠️' : isPlaying ? '⏸' : '▶'}</Text>
          )}
        </TouchableOpacity>

        {/* Waveform / Progress bar with touch seeking */}
        <View style={styles.waveformContainer}>
          <TouchableOpacity
            style={styles.track}
            activeOpacity={0.9}
            onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
            onPress={handleTrackPress}
          >
            <View
              style={[
                styles.progressFill,
                { width: `${progressPercent}%` },
                playbackError ? styles.progressFillError : null,
              ]}
            />
          </TouchableOpacity>
          <View style={styles.timeRow}>
            <Text style={[styles.timeText, playbackError ? styles.timeTextError : null]}>
              {playbackError ? "Can't play voice note" : formatTime(progressSeconds)}
            </Text>
            <Text style={styles.timeText}>{formatTime(totalDuration)}</Text>
          </View>
        </View>

        {/* Speed toggle */}
        <TouchableOpacity style={styles.speedBtn} onPress={cycleSpeed} activeOpacity={0.8}>
          <Text style={styles.speedText}>{playbackSpeed}x</Text>
        </TouchableOpacity>
      </View>

      {/* Played mark */}
      {!isMyMessage && !playbackError && (
        <View style={styles.statusRow}>
          <View style={[styles.dot, playedAt ? styles.dotPlayed : styles.dotUnplayed]} />
          <Text style={styles.statusLabel}>{playedAt ? 'Played' : 'New Voice Note'}</Text>
        </View>
      )}

      {playbackError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠️ Can't play this voice note</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    minWidth: 210,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnError: {
    backgroundColor: '#E53E3E',
  },
  playIcon: {
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 2,
  },
  waveformContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  track: {
    height: 6,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  progressFillError: {
    backgroundColor: '#E53E3E',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  timeTextError: {
    color: '#E53E3E',
  },
  speedBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotPlayed: {
    backgroundColor: theme.colors.border,
  },
  dotUnplayed: {
    backgroundColor: theme.colors.primary,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  errorBanner: {
    marginTop: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: '#FFF0F0',
    borderRadius: theme.radii.sm,
    alignSelf: 'flex-start',
  },
  errorBannerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E53E3E',
  },
});
