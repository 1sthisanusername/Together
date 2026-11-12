import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { theme, scale } from '@/shared/theme';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const dimensions = {
    sm: { imageSize: scale(36), textSize: scale(16) },
    md: { imageSize: scale(56), textSize: scale(22) },
    lg: { imageSize: scale(76), textSize: scale(28) },
    xl: { imageSize: scale(96), textSize: scale(36) },
  }[size];

  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/splash-icon.png')}
        style={{ width: dimensions.imageSize, height: dimensions.imageSize }}
        resizeMode="contain"
        accessibilityLabel="Together Logo"
      />

      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.brandText, { fontSize: dimensions.textSize }]}>
            Together
          </Text>
          <Text style={styles.subText}>a private space for two</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: scale(10),
  },
  brandText: {
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  subText: {
    fontSize: scale(12),
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
    marginTop: scale(2),
    textTransform: 'lowercase',
  },
});
