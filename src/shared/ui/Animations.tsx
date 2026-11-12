import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  cancelAnimation,
} from 'react-native-reanimated';
import { motion } from '@/shared/theme';

// ──────────────────────────────────────────
// FadeInView — slide-up + fade entrance
// Uses Animated.View so transforms run on native driver (60fps)
// ──────────────────────────────────────────

export interface FadeInViewProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
  style?: StyleProp<ViewStyle>;
}

export const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  delay = 0,
  duration = 450,
  yOffset = 16,
  style,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(yOffset);

  useEffect(() => {
    // Cubic ease-out curve for natural-feeling entrances
    const easeCubicOut = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    opacity.value = withDelay(delay, withTiming(1, { duration, easing: easeCubicOut }));
    translateY.value = withDelay(delay, withTiming(0, { duration, easing: easeCubicOut }));
  }, [delay, duration]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[{ marginBottom: 16 }, animStyle, style]}>
      {children}
    </Animated.View>
  );
};

// ──────────────────────────────────────────
// StaggeredList — cascading staggered entrance
// ──────────────────────────────────────────

export interface StaggeredListProps {
  children: React.ReactNode | React.ReactNode[];
  baseDelay?: number;
  staggerGap?: number;
  yOffset?: number;
  style?: StyleProp<ViewStyle>;
}

export const StaggeredList: React.FC<StaggeredListProps> = ({
  children,
  baseDelay = 60,
  staggerGap = 50,
  yOffset = 12,
  style,
}) => {
  const childArray = React.Children.toArray(children);

  return (
    <View style={style}>
      {childArray.map((child, index) => (
        <FadeInView key={index} delay={baseDelay + index * staggerGap} yOffset={yOffset}>
          {child}
        </FadeInView>
      ))}
    </View>
  );
};

// ──────────────────────────────────────────
// HeartBeat — subtle pulse for "live" indicators
// ──────────────────────────────────────────

export interface HeartBeatProps {
  active: boolean;
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export const HeartBeat: React.FC<HeartBeatProps> = ({
  active,
  color = '#E53935',
  size = 8,
  style,
}) => {
  const beat = useSharedValue(1);

  useEffect(() => {
    if (active) {
      beat.value = withRepeat(
        withSequence(
          withTiming(1.4, { duration: 400 }),
          withTiming(1, { duration: 400 })
        ),
        -1
      );
    } else {
      beat.value = withSpring(1, motion.spring);
    }
  }, [active]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: beat.value }],
  }));

  return (
    <Animated.View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        animStyle,
        style,
      ]}
    />
  );
};

// ──────────────────────────────────────────
// ShimmerSkeleton — premium shimmer loading bar
// White streak sweeps across a colored pill/rect
// ──────────────────────────────────────────

export interface ShimmerSkeletonProps {
  width?: number | string;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const ShimmerSkeleton: React.FC<ShimmerSkeletonProps> = ({
  width = '100%',
  height,
  borderRadius = 12,
  style,
}) => {
  const translateX = useSharedValue(-60);

  useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withTiming(240, { duration: 1200 }),
        withTiming(-60, { duration: 0 })
      ),
      -1,
      false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[{ width, height, borderRadius, backgroundColor: '#FBE9E7' }, style]} pointerEvents="none">
      {/* Base background */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FBE9E7' }]} />
      {/* Sweeping shine overlay - uses Animated.View for native driver */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: -60,
            right: 60,
            backgroundColor: 'rgba(255,255,255,0.55)',
          },
          animStyle,
        ]}
        pointerEvents="none"
      />
    </Animated.View>
  );
};

// ──────────────────────────────────────────
// NumberTicker — spring-interpolated counter
// Bridges shared value → JS state for text rendering
// ──────────────────────────────────────────

export interface NumberTickerProps {
  value: number;
  duration?: number;
  textStyle?: StyleProp<any>;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  rounded?: boolean;
}

export const NumberTicker: React.FC<NumberTickerProps> = ({
  value,
  duration = 800,
  textStyle,
  prefix = '',
  suffix = '',
  decimals = 0,
  rounded = false,
}) => {
  const animValue = useSharedValue(value);
  const [displayValue, setDisplayValue] = React.useState(value);

  useEffect(() => {
    animValue.value = withSpring(value, { damping: 18, stiffness: 300, mass: 0.7 });
  }, [value]);

  // Poll shared value every frame to update JS text node
  useEffect(() => {
    const id = setInterval(() => {
      setDisplayValue(
        rounded ? Math.round(animValue.value) : parseFloat(animValue.value.toFixed(decimals))
      );
    }, 16); // ~60 fps
    return () => clearInterval(id);
  }, [animValue, decimals, rounded]);

  return (
    <Text style={textStyle} selectable={false}>
      {prefix}{displayValue}{suffix}
    </Text>
  );
};

// ──────────────────────────────────────────
// TabIndicator — sliding pill under segmented tabs
// Springs into position when activeIndex changes
// ──────────────────────────────────────────

export interface TabIndicatorProps {
  activeIndex: number;
  totalTabs: number;
  containerWidth: number;
  tabGutter?: number;
  style?: StyleProp<ViewStyle>;
  indicatorColor?: string;
  height?: number;
}

export const TabIndicator: React.FC<TabIndicatorProps> = ({
  activeIndex,
  totalTabs,
  containerWidth,
  tabGutter = 0,
  style,
  indicatorColor = '#E53935',
  height = 4,
}) => {
  const translateX = useSharedValue(0);

  useEffect(() => {
    const tabWidth = containerWidth / totalTabs;
    translateX.value = withSpring(activeIndex * tabWidth, { damping: 18, stiffness: 300, mass: 0.7 });
  }, [activeIndex, totalTabs, containerWidth]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const tabWidth = containerWidth / totalTabs;
  const dotSize = tabWidth - tabGutter * 2;

  return (
    <Animated.View style={[{ height, position: 'relative' }, style]} pointerEvents="none">
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            height,
            width: Math.max(dotSize, height),
            borderRadius: height / 2,
            backgroundColor: indicatorColor,
          },
          animStyle,
        ]}
      />
    </Animated.View>
  );
};

// Export low-level helpers for direct composition
export { withRepeat, withSequence, withTiming, withSpring, withDelay, cancelAnimation };
