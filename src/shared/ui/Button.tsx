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

/**
 * Polished Button Component:
 * - Minimum 48dp touch target enforced across all sizes
 * - Soft spring press feedback with haptic response
 * - Clear pressed/hover visual states
 * - Accessible disabled and loading states
 * - Consistent pill-shaped design with rounded corners
 */
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
    scaleAnim.value = withSpring(0.96, motion.spring);
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
          // Add elevated shadow for non-outline variants when interactive
          isInteractive && resolvedVariant !== 'outline' && styles.elevated,
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
            selectable={false}
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
    opacity: 0.7,
  },
  elevated: {
    ...theme.shadows.card,
  },

  // Pill Surface (borderRadius: 9999) with subtle border
  surfaceBase: {
    borderRadius: theme.roundness.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: theme.borders.subtle,
    borderColor: 'transparent',
  },

  // Sizes - all enforce minimum 48dp touch target (width + height)
  sm: {
    minWidth: scale(48),
    minHeight: Math.max(48, scale(42)),
    borderRadius: theme.roundness.md,
    paddingVertical: scale(8),
    paddingHorizontal: scale(16),
  },
  md: {
    width: '100%',
    height: scale(56),
    borderRadius: theme.roundness.md,
    paddingVertical: scale(12),
    paddingHorizontal: scale(24),
  },
  lg: {
    width: '100%',
    height: scale(64),
    borderRadius: theme.roundness.lg,
    paddingVertical: scale(15),
    paddingHorizontal: scale(28),
  },

  // Love, Joy & Connection Variants with improved contrast
  primary: {
    backgroundColor: theme.colors.primary, // #D32F2F
    borderColor: theme.colors.primary,
  },
  primaryPressed: {
    backgroundColor: theme.colors.primaryPressed, // #B71C1C
  },
  secondary: {
    backgroundColor: theme.colors.secondary, // #FF7043
    borderColor: theme.colors.secondaryLight,
  },
  coral: {
    backgroundColor: theme.colors.coral, // #FF7043
    borderColor: theme.colors.poolLight,
  },
  rose: {
    backgroundColor: theme.colors.rose, // #F48FB1
    borderColor: theme.colors.rose,
  },
  pool: {
    backgroundColor: theme.colors.pool, // #FF7043
    borderColor: theme.colors.poolLight,
  },
  bubblegum: {
    backgroundColor: theme.colors.bubblegum, // #F48FB1
    borderColor: theme.colors.bubblegum,
  },
  kintsugi: {
    backgroundColor: theme.colors.kintsugi, // #FFB74D
    borderColor: theme.colors.kintsugiLight,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: theme.borders.subtle,
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
    borderColor: theme.colors.danger,
  },

  disabledSurface: {
    backgroundColor: theme.colors.surfaceDisabled, // #FBE9E7
    borderColor: theme.colors.border, // #FBE9E7
  },

  // Typography - improved hierarchy and legibility
  textBase: {
    fontFamily: theme.typography.fontFamilies.display,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.1,
    lineHeight: scale(20),
  },
  text_sm: {
    fontSize: scale(13),
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
    color: '#2C1C1D', // Dark text on light coral for contrast
  },
  text_pool: {
    color: '#2C1C1D', // Dark text on pool for contrast
  },
  text_bubblegum: {
    color: '#2C1C1D', // Dark text on bubblegum for contrast
  },
  text_kintsugi: {
    color: '#2C1C1D', // Dark text on kintsugi for contrast
  },
  text_outline: {
    color: theme.colors.text, // #3E2723
  },
  text_ghost: {
    color: theme.colors.primary, // #D32F2F
  },
  text_danger: {
    color: '#FFFFFF',
  },
  textDisabled: {
    color: theme.colors.textSecondary, // #7A625A
  },
});