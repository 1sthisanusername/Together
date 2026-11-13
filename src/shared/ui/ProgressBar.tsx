import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { theme, scale, motion } from '@/shared/theme';

export interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Enhanced Round Progress Bar:
 * - Warm blush track (#FFF0ED) with softened Amour Red fill
 * - Smooth spring-animated fill progression
 * - Ratio-based counter text with accessibility support
 * - Consistent roundness using theme.roundness.full
 * - Improved color contrast and visual polish
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  label,
  style,
}) => {
  const safeTotal = Math.max(1, total);
  const clampedCurrent = Math.min(safeTotal, Math.max(0, current));
  const ratio = clampedCurrent / safeTotal;

  const progress = useSharedValue(ratio);

  useEffect(() => {
    progress.value = withSpring(ratio, motion.spring);
  }, [ratio, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.round(progress.value * 100)}%`,
  }));

  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: safeTotal, now: clampedCurrent }}
      accessibilityLabel={label || `Step ${clampedCurrent} of ${safeTotal}`}
    >
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
      <Text style={styles.counterText}>
        {clampedCurrent}/{safeTotal}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    marginBottom: scale(16),
  },
  track: {
    flex: 1,
    height: scale(10),
    borderRadius: theme.roundness.full,
    backgroundColor: theme.colors.surfaceBlush, // #FFF0ED warm blush
    borderWidth: theme.borders.subtle,
    borderColor: theme.colors.border, // #FBE9E7 subtle accent border
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: theme.roundness.full,
    backgroundColor: theme.colors.kintsugi, // #FFB74D warm kintsugi gold
  },
  counterText: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(13),
    fontWeight: '700',
    color: theme.colors.textSecondary, // #7A625A muted purple-gray
    minWidth: scale(30),
    textAlign: 'right',
  },
});