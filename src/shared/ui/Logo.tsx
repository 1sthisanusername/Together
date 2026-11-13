import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { theme, scale, motion } from '@/shared/theme';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  animated?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true, animated = true }) => {
  const dimensions = {
    sm: { imageSize: scale(36), textSize: scale(16) },
    md: { imageSize: scale(56), textSize: scale(22) },
    lg: { imageSize: scale(76), textSize: scale(28) },
    xl: { imageSize: scale(96), textSize: scale(36) },
  }[size];

  const logoScale = useSharedValue(animated ? 0.9 : 1);
  const logoOpacity = useSharedValue(animated ? 0 : 1);

  useEffect(() => {
    if (animated) {
      logoScale.value = withSpring(1, motion.bouncy);
      logoOpacity.value = withSpring(1, motion.spring);
    }
  }, [animated]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const content = (
    <>
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
    </>
  );

  if (animated) {
    return <Animated.View style={[styles.container, animStyle]}>{content}</Animated.View>;
  }

  return <View style={styles.container}>{content}</View>;
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
    fontFamily: theme.typography.fontFamilies.display,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  subText: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(12),
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
    marginTop: scale(2),
    textTransform: 'lowercase',
  },
});
