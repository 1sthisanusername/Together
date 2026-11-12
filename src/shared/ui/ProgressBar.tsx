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
 * Animated Round / Step Progress Bar:
 * Warm pale blush track (#FFF0ED) with Amour Red (#E53935) pill progress fill.
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
    gap: scale(10),
    marginBottom: scale(14),
  },
  track: {
    flex: 1,
    height: scale(8),
    borderRadius: theme.roundness.full,
    backgroundColor: theme.colors.surfaceBlush,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: theme.roundness.full,
    backgroundColor: theme.colors.primary,
  },
  counterText: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(12),
    fontWeight: '700',
    color: theme.colors.textSecondary,
    minWidth: scale(28),
    textAlign: 'right',
  },
});

