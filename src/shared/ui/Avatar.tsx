import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { theme, scale } from '@/shared/theme';

export interface AvatarProps {
  name: string;
  url?: string | null;
  size?: number;
  showPresence?: boolean;
  isOnline?: boolean;
  stickerColor?: 'sunshine' | 'pool' | 'bubblegum' | 'tomato';
}

/**
 * String & Stickers Sticker Avatar:
 * Chunky 2.5px ink outline with hard offset ink shadow and vibrant sticker background.
 */
export const Avatar: React.FC<AvatarProps> = ({
  name,
  url,
  size = 52,
  showPresence = false,
  isOnline = false,
  stickerColor = 'sunshine',
}) => {
  const scaledSize = scale(size);
  const initials = (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const bgColors: Record<string, string> = {
    sunshine: theme.colors.sunset,    // Warm Sunset #FFB74D
    pool: theme.colors.coral,         // Joyful Coral #FF7043
    bubblegum: theme.colors.rose,     // Blushing Rose #F48FB1
    tomato: theme.colors.primary,     // Amour Red #E53935
  };

  const backgroundColor = bgColors[stickerColor] || theme.colors.sunset;

  return (
    <View style={[styles.wrapper, { width: scaledSize, height: scaledSize }]}>
      {/* Avatar Surface */}
      {url ? (
        <Image
          source={{ uri: url }}
          style={[
            styles.image,
            {
              width: scaledSize,
              height: scaledSize,
              borderRadius: scaledSize / 2,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: scaledSize,
              height: scaledSize,
              borderRadius: scaledSize / 2,
              backgroundColor,
            },
          ]}
        >
          <Text
            style={[styles.initials, { fontSize: scaledSize * 0.38 }]}
            maxFontSizeMultiplier={1.2}
          >
            {initials || '?'}
          </Text>
        </View>
      )}

      {/* 3. Playful Presence Dot */}
      {showPresence && (
        <View
          style={[
            styles.presenceDot,
            isOnline ? styles.presenceOnline : styles.presenceOffline,
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  image: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: theme.colors.surfaceBlush,
    ...theme.shadows.hardSm,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: theme.roundness.full,
    ...theme.shadows.soft,
  },
  initials: {
    fontFamily: theme.typography.fontFamilies.display,
    color: theme.colors.textInverse, // #FFFDFB for contrast on colored backgrounds
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  presenceDot: {
    position: 'absolute',
    zIndex: 2,
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  presenceOnline: {
    backgroundColor: theme.colors.online,
  },
  presenceOffline: {
    backgroundColor: theme.colors.textMuted,
  },
});
