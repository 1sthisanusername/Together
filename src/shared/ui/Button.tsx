import React, { useState } from 'react';
import {
  Text,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { theme, scale, triggerHaptic, motion } from '@/shared/theme';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'coral'
  | 'rose'
  | 'pool'
  | 'bubblegum'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'kintsugi';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  testID,
  accessibilityLabel,
}) => {
  const isInteractive = !loading && !disabled;
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnim = useSharedValue(1);

  const animatedSurfaceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const handlePressIn = () => {
    if (!isInteractive) return;
    setIsPressed(true);
    triggerHaptic('light');
    scaleAnim.value = withSpring(0.97, motion.spring);
  };

  const handlePressOut = () => {
    setIsPressed(false);
    scaleAnim.value = withSpring(1, motion.spring);
  };

  const handlePress = () => {
    if (!isInteractive) return;
    onPress();
  };

  // Map legacy variant names seamlessly
  let resolvedVariant = variant;
  if (variant === 'kintsugi' || variant === 'pool') resolvedVariant = 'secondary';
  if (variant === 'bubblegum') resolvedVariant = 'rose';

  const isPrimaryOrFilled =
    resolvedVariant === 'primary' ||
    resolvedVariant === 'secondary' ||
    resolvedVariant === 'coral' ||
    resolvedVariant === 'rose' ||
    resolvedVariant === 'danger';

  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!isInteractive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      style={[styles.outerContainer, disabled && styles.disabledContainer, style]}
    >
      <Animated.View
        style={[
          styles.surfaceBase,
          styles[resolvedVariant] || styles.primary,
          styles[size],
          resolvedVariant !== 'ghost' && !disabled && styles.elevated,
          isPressed && resolvedVariant === 'primary' && styles.primaryPressed,
          isPressed && resolvedVariant === 'outline' && styles.outlinePressed,
          animatedSurfaceStyle,
          disabled && styles.disabledSurface,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={isPrimaryOrFilled ? '#FFFFFF' : theme.colors.primary}
          />
        ) : (
          <Text
            style={[
              styles.textBase,
              styles[`text_${resolvedVariant}` as keyof typeof styles] || styles.text_primary,
              styles[`text_${size}`],
              disabled && styles.textDisabled,
              textStyle,
            ]}
            maxFontSizeMultiplier={1.35}
          >
            {title}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'relative',
  },
  disabledContainer: {
    opacity: 0.9,
  },
  elevated: {
    ...theme.shadows.hardSm,
  },

  // Pill Surface (borderRadius: 9999)
  surfaceBase: {
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'transparent',
  },

  // Sizes (Minimum 48dp touch target enforced)
  sm: {
    borderRadius: 9999,
    paddingVertical: scale(8),
    paddingHorizontal: scale(18),
    minHeight: Math.max(44, scale(42)),
  },
  md: {
    borderRadius: 9999,
    paddingVertical: scale(12),
    paddingHorizontal: scale(22),
    minHeight: scale(50),
  },
  lg: {
    borderRadius: 9999,
    paddingVertical: scale(15),
    paddingHorizontal: scale(28),
    minHeight: scale(54),
  },

  // Love, Joy & Connection Variants
  primary: {
    backgroundColor: theme.colors.primary, // #E53935
  },
  primaryPressed: {
    backgroundColor: theme.colors.primaryPressed, // #C62828
  },
  secondary: {
    backgroundColor: theme.colors.secondary, // #FF7043
  },
  coral: {
    backgroundColor: theme.colors.coral, // #FF7043
  },
  rose: {
    backgroundColor: theme.colors.rose, // #F48FB1
  },
  pool: {
    backgroundColor: theme.colors.secondary, // #FF7043
  },
  bubblegum: {
    backgroundColor: theme.colors.rose, // #F48FB1
  },
  kintsugi: {
    backgroundColor: theme.colors.secondary, // #FF7043
  },
  outline: {
    backgroundColor: theme.colors.background, // #FFFDFB
    borderWidth: 1,
    borderColor: theme.colors.border, // #FBE9E7
  },
  outlinePressed: {
    backgroundColor: theme.colors.surfaceBlush, // #FFF0ED
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  danger: {
    backgroundColor: theme.colors.danger, // #C62828
  },
  disabledSurface: {
    backgroundColor: theme.colors.surfaceDisabled, // #FBE9E7
    borderColor: theme.colors.border, // #FBE9E7
  },

  // Typography
  textBase: {
    fontFamily: theme.typography.fontFamilies.display,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  text_sm: {
    fontSize: scale(14),
  },
  text_md: {
    fontSize: scale(15),
  },
  text_lg: {
    fontSize: scale(16),
  },
  text_primary: {
    color: '#FFFFFF',
  },
  text_secondary: {
    color: '#FFFFFF',
  },
  text_coral: {
    color: '#FFFFFF',
  },
  text_rose: {
    color: '#FFFFFF',
  },
  text_pool: {
    color: '#FFFFFF',
  },
  text_bubblegum: {
    color: '#FFFFFF',
  },
  text_kintsugi: {
    color: '#FFFFFF',
  },
  text_outline: {
    color: theme.colors.text, // #3E2723
  },
  text_ghost: {
    color: theme.colors.primary, // #E53935
  },
  text_danger: {
    color: '#FFFFFF',
  },
  textDisabled: {
    color: theme.colors.textSecondary, // #7A625A
  },
});
