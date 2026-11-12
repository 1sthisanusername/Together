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
  | 'stoneware'
  | 'trough'
  | 'kintsugi';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  testID?: string;
  hasShadow?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/**
 * Love, Joy & Connection Card Container:
 * 20px rounded corners, 1px solid #FBE9E7 border, warm #FFFFFF or #FFF0ED surface,
 * and warm diffused Cozy Night elevation shadow (0 8px 24px rgba(62, 39, 35, 0.07)).
 * Supports optional interactive press-scale spring physics when `onPress` is provided.
 */
export const Card: React.FC<CardProps> = ({
  children,
  variant = 'paper',
  style,
  containerStyle,
  testID,
  hasShadow = true,
  onPress,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const scaleAnim = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  // Normalize legacy variant aliases
  let resolvedVariant: keyof typeof styles = 'paper';
  if (variant === 'stoneware' || variant === 'paper') resolvedVariant = 'paper';
  else if (variant === 'trough' || variant === 'blush') resolvedVariant = 'blush';
  else if (variant === 'kintsugi' || variant === 'sunshine' || variant === 'sunset') resolvedVariant = 'sunset';
  else if (variant === 'bubblegum' || variant === 'rose') resolvedVariant = 'rose';
  else if (variant === 'pool' || variant === 'coral') resolvedVariant = 'coral';
  else if (variant === 'tomato') resolvedVariant = 'tomato';

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
        style={[styles.outerWrapper, hasShadow && styles.cardShadow, containerStyle]}
      >
        <Animated.View style={animatedStyle}>{cardSurface}</Animated.View>
      </Pressable>
    );
  }

  return (
    <View style={[styles.outerWrapper, hasShadow && styles.cardShadow, containerStyle]}>
      {cardSurface}
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    width: '100%',
    marginVertical: scale(7),
    borderRadius: 20,
  },
  cardShadow: {
    ...theme.shadows.card,
  },
  cardSurface: {
    borderRadius: 20,
    padding: scale(18),
    borderWidth: 1,
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
});
