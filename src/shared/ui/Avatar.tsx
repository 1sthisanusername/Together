import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { theme } from '@/shared/theme';

export interface AvatarProps {
  name: string;
  url?: string | null;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({ name, url, size = 48 }) => {
  const initials = (name || '?')
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0]?.toUpperCase())
  .join('');

  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 1.5,
            borderColor: theme.colors.borderLight,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials || '?'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: theme.colors.surfaceSubtle, // #f0ece6
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.border, // #d2ccc4
  },
  initials: {
    color: theme.colors.text, // #42362e
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  image: {
    backgroundColor: theme.colors.surfaceSubtle,
  },
});
