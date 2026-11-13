import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { theme } from '@/shared/theme';

export type WarmGradientStyle = 'hero' | 'primary' | 'blush' | 'rose' | 'kintsugi' | 'sunset';

export interface WarmGradientProps {
  style?: WarmGradientStyle;
  colors?: readonly [string, string];
  borderRadius?: number;
  containerStyle?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Cross-platform linear gradient container powered by react-native-svg.
 * Works natively on iOS, Android, Expo Go, and Web without extra native modules.
 * Supports predefined gradient styles from the theme system.
 */
export const WarmGradient: React.FC<WarmGradientProps> = ({
  style = 'hero',
  colors = theme.gradients[style],
  borderRadius = theme.roundness.lg,
  containerStyle,
  children,
}) => {
  return (
    <View style={[styles.container, { borderRadius }, containerStyle]}>
      <View style={[StyleSheet.absoluteFill, { borderRadius, overflow: 'hidden' }]} pointerEvents="none">
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <LinearGradient
              id="warmGrad"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <Stop offset="0%" stopColor={colors[0]} stopOpacity="1" />
              <Stop offset="100%" stopColor={colors[1]} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#warmGrad)" />
        </Svg>
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});

// Predefined gradient configurations for easy theming
export const gradientConfigs: Record<WarmGradientStyle, readonly [string, string]> = {
  hero: theme.gradients.hero,           // ['#E53935', '#FF7043'] - primary brand
  primary: theme.gradients.primary,     // ['#D32F2F', '#FF7043'] - refined primary
  blush: theme.gradients.blush,         // ['#FFF0ED', '#FFFDFB'] - warm transition
  rose: theme.gradients.rose,           // ['#F48FB1', '#FF7043'] - rose to coral
  kintsugi: theme.gradients.kintsugi,   // ['#FFB74D', '#FFF7EA'] - golden repair
  sunset: theme.gradients.sunset,       // ['#FFB74D', '#FF7043'] - warm milestone
};