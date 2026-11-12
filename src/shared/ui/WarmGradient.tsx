import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { theme } from '@/shared/theme';

export interface WarmGradientProps {
  colors?: readonly [string, string];
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Cross-platform linear gradient container powered by react-native-svg.
 * Works natively on iOS, Android, Expo Go, and Web without extra native modules.
 */
export const WarmGradient: React.FC<WarmGradientProps> = ({
  colors = theme.gradients.hero,
  borderRadius = 20,
  style,
  children,
}) => {
  return (
    <View style={[styles.container, { borderRadius }, style]}>
      <View style={[StyleSheet.absoluteFill, { borderRadius, overflow: 'hidden' }]} pointerEvents="none">
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="warmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
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
