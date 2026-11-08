import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '@/shared/theme';

export interface VoiceNotePlayerProps {
  mediaSignedUrl?: string | null;
  durationSeconds?: number | null;
  playedAt?: string | null;
  isMyMessage: boolean;
  onPlayed?: () => void;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({
  mediaSignedUrl,
  durationSeconds = 15,
  playedAt,
  isMyMessage,
  onPlayed,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.5 | 2>(1);
  const [progressSeconds, setProgressSeconds] = useState(0);

  const totalDuration = Math.max(1, durationSeconds || 15);

  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgressSeconds((prev) => {
          const next = prev + 0.25 * playbackSpeed;
          if (next >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 250);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, totalDuration]);

  const togglePlay = () => {
    if (!isPlaying && !playedAt && !isMyMessage && onPlayed) {
      onPlayed();
    }
    setIsPlaying(!isPlaying);
  };

  const cycleSpeed = () => {
    setPlaybackSpeed((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1));
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = Math.min(100, Math.max(0, (progressSeconds / totalDuration) * 100));

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.playBtn} onPress={togglePlay} activeOpacity={0.8}>
          <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        {/* Waveform / Progress bar */}
        <View style={styles.waveformContainer}>
          <View style={styles.track}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(progressSeconds)}</Text>
            <Text style={styles.timeText}>{formatTime(totalDuration)}</Text>
          </View>
        </View>

        {/* Speed toggle */}
        <TouchableOpacity style={styles.speedBtn} onPress={cycleSpeed} activeOpacity={0.8}>
          <Text style={styles.speedText}>{playbackSpeed}x</Text>
        </TouchableOpacity>
      </View>

      {/* Played mark (Section 4: only "played" status on voice notes) */}
      {!isMyMessage && (
        <View style={styles.statusRow}>
          <View style={[styles.dot, playedAt ? styles.dotPlayed : styles.dotUnplayed]} />
          <Text style={styles.statusLabel}>{playedAt ? 'Played' : 'New Voice Note'}</Text>
        </View>
      )}
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
});

