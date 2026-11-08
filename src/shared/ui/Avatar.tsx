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
    sunshine: theme.colors.secondary, // Sunshine #FFC93C
    pool: theme.colors.pool,          // Pool #2EC4B6
    bubblegum: theme.colors.bubblegum,// Bubblegum #FF8FB1
    tomato: theme.colors.primary,     // Tomato #FF5A3C
  };

  const backgroundColor = bgColors[stickerColor] || theme.colors.secondary;
  const shadowOffset = 3;

  return (
    <View style={[styles.wrapper, { width: scaledSize + shadowOffset, height: scaledSize + shadowOffset }]}>
      {/* 1. Hard Offset Ink Shadow */}
      <View
        style={[
          styles.shadowUnderlay,
          {
            width: scaledSize,
            height: scaledSize,
            borderRadius: scaledSize / 2,
            top: shadowOffset,
            left: shadowOffset,
          },
        ]}
      />

      {/* 2. Avatar Sticker Surface */}
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
  shadowUnderlay: {
    position: 'absolute',
    backgroundColor: theme.colors.shadowInk,
  },
  image: {
    borderWidth: 2.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: theme.colors.border,
  },
  initials: {
    fontFamily: theme.typography.fontFamilies.display,
    color: theme.colors.text,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  presenceDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  presenceOnline: {
    backgroundColor: theme.colors.pool, // Pool Teal #2EC4B6
  },
  presenceOffline: {
    backgroundColor: theme.colors.textMuted,
  },
});
