import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

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
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
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
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#4338CA',
    fontWeight: '700',
  },
  image: {
    backgroundColor: '#E2E8F0',
  },
});

