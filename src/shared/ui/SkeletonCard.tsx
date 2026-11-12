import React, { useEffect } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { theme, scale } from '@/shared/theme';

export interface SkeletonCardProps {
  lines?: number;
  hasHeader?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Warm Blush Skeleton Loader Card:
 * Provides calm, layout-stable loading feedback matching 20px Love, Joy & Connection cards.
 */
export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  lines = 2,
  hasHeader = true,
  style,
}) => {
  const pulse = useSharedValue(0.45);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 750 }),
        withTiming(0.45, { duration: 750 })
      ),
      -1,
      false
    );
    return () => cancelAnimation(pulse);
  }, [pulse]);

  const animatedPulse = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <View style={[styles.card, style]} accessibilityLabel="Loading content">
      {hasHeader && (
        <View style={styles.headerRow}>
          <Animated.View style={[styles.circle, animatedPulse]} />
          <Animated.View style={[styles.pill, animatedPulse]} />
        </View>
      )}
      <Animated.View style={[styles.titleBar, animatedPulse]} />
      {Array.from({ length: lines }).map((_, idx) => (
        <Animated.View
          key={idx}
          style={[
            styles.lineBar,
            idx === lines - 1 && styles.lineBarShort,
            animatedPulse,
          ]}
        />
      ))}
    </View>
  );
};

export interface SkeletonListProps {
  count?: number;
  lines?: number;
  hasHeader?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  count = 3,
  lines = 2,
  hasHeader = true,
  style,
}) => (
  <View style={[styles.listContainer, style]}>
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonCard key={index} lines={lines} hasHeader={hasHeader} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  listContainer: {
    width: '100%',
    paddingHorizontal: scale(16),
    paddingTop: scale(12),
    gap: scale(12),
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: scale(18),
    ...theme.shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scale(14),
  },
  circle: {
    width: scale(36),
    height: scale(36),
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceBlush,
  },
  pill: {
    width: scale(72),
    height: scale(22),
    borderRadius: theme.roundness.full,
    backgroundColor: theme.colors.surfaceBlush,
  },
  titleBar: {
    width: '68%',
    height: scale(18),
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceDisabled,
    marginBottom: scale(10),
  },
  lineBar: {
    width: '100%',
    height: scale(12),
    borderRadius: 6,
    backgroundColor: theme.colors.surfaceBlush,
    marginBottom: scale(8),
  },
  lineBarShort: {
    width: '54%',
    marginBottom: 0,
  },
});

