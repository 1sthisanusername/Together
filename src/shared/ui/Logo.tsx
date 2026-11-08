import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { theme } from '@/shared/theme';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const dimensions = {
    sm: { imageSize: 36, textSize: 16 },
    md: { imageSize: 56, textSize: 22 },
    lg: { imageSize: 76, textSize: 28 },
    xl: { imageSize: 96, textSize: 36 },
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
    marginTop: 10,
  },
  brandText: {
    fontWeight: '800',
    color: theme.colors.text, // #42362E deep espresso
    letterSpacing: -0.5,
  },
  subText: {
    fontSize: 12,
    color: theme.colors.textSecondary, // #A8917F soft cedar
    letterSpacing: 0.8,
    marginTop: 2,
    textTransform: 'lowercase',
  },
});
