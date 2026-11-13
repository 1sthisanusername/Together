import React from 'react';
import { View, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { theme, scale, triggerHaptic, motion } from '@/shared/theme';

export type CardVariant =
  | 'paper'
  | 'blush'
  | 'sunset'
  | 'rose'
  | 'coral'
  | 'sunshine'
  | 'tomato'
  | 'pool'
  | 'bubblegum'
  | 'kintsugi'
  | 'elevated'
  | 'stoneware' // legacy alias for 'paper'
  | 'trough' // legacy alias for 'blush';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  testID?: string;
  hasShadow?: 'soft' | 'card' | 'elevated' | 'modal' | 'hardSm' | 'hardMd' | 'hardLg' | 'none';
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/**
 * Love, Joy & Connection Card Container:
 * Rounded corners with variant-based surfaces, borders, and shadows.
 * Supports optional interactive press-scale spring physics when `onPress` is provided.
 * Shadow variant can be controlled via `hasShadow` prop for precise elevation control.
 */
export const Card: React.FC<CardProps> = ({
  children,
  variant = 'paper',
  style,
  containerStyle,
  testID,
  hasShadow = 'card',
  onPress,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const scaleAnim = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  // Normalize legacy variant aliases to current types
  // stoneware and trough are legacy aliases mapped to current variants
  let resolvedVariant: keyof typeof styles = 'paper';
  if (variant === 'stoneware' || variant === 'paper') resolvedVariant = 'paper';
  else if (variant === 'trough' || variant === 'blush') resolvedVariant = 'blush';
  else if (variant === 'kintsugi' || variant === 'sunshine' || variant === 'sunset') resolvedVariant = 'sunset';
  else if (variant === 'bubblegum' || variant === 'rose') resolvedVariant = 'rose';
  else if (variant === 'pool' || variant === 'coral') resolvedVariant = 'coral';
  else if (variant === 'tomato') resolvedVariant = 'tomato';
  else if (variant === 'elevated') resolvedVariant = 'elevated';
  else resolvedVariant = 'paper';

  // Resolve shadow style based on hasShadow prop
  const shadowStyle = hasShadow !== 'none'
    ? theme.shadows[hasShadow as keyof typeof theme.shadows]
    : { shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 };

  const cardSurface = (
    <View
      testID={onPress ? undefined : testID}
      style={[styles.cardSurface, styles[resolvedVariant], style]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        testID={testID}
        onPress={() => {
          if (disabled) return;
          triggerHaptic('light');
          onPress();
        }}
        onPressIn={() => {
          if (!disabled) {
            scaleAnim.value = withSpring(0.985, motion.spring);
          }
        }}
        onPressOut={() => {
          scaleAnim.value = withSpring(1, motion.spring);
        }}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
        style={[styles.outerWrapper, shadowStyle, containerStyle]}
      >
        <Animated.View style={animatedStyle}>{cardSurface}</Animated.View>
      </Pressable>
    );
  }

  return (
    <View style={[styles.outerWrapper, shadowStyle, containerStyle]}>
      {cardSurface}
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    width: '100%',
    marginVertical: scale(7),
    borderRadius: theme.roundness.lg,
  },
  cardShadow: {
    ...theme.shadows.card,
  },
  cardSurface: {
    borderRadius: theme.roundness.lg,
    padding: scale(18),
    borderWidth: theme.borders.subtle,
    borderColor: theme.colors.border, // #FBE9E7
    overflow: 'hidden',
  },

  // Surface Color Variants
  paper: {
    backgroundColor: theme.colors.surface, // #FFFFFF with 1px #FBE9E7 border
  },
  blush: {
    backgroundColor: theme.colors.surfaceBlush, // #FFF0ED
  },
  sunset: {
    backgroundColor: theme.colors.sunset, // #FFB74D
  },
  tomato: {
    backgroundColor: theme.colors.primary, // #E53935
  },
  coral: {
    backgroundColor: theme.colors.coral, // #FF7043
  },
  rose: {
    backgroundColor: theme.colors.rose, // #F48FB1
  },
  elevated: {
    backgroundColor: theme.colors.surface, // #FFFFFF
    borderWidth: theme.borders.chunky,
    borderColor: theme.colors.primaryBorder,
  },
});