import React from 'react';
import {
  Text,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  Pressable,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { theme, scale, triggerHaptic, motion } from '@/shared/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'pool' | 'bubblegum' | 'outline' | 'ghost' | 'danger' | 'kintsugi';
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
  const pressedOffset = useSharedValue(0);

  const animatedSurfaceStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: pressedOffset.value },
        { translateY: pressedOffset.value },
      ],
    };
  });

  const handlePressIn = () => {
    if (!isInteractive) return;
    triggerHaptic('light');
    pressedOffset.value = withSpring(motion.pressOffset, motion.spring);
  };

  const handlePressOut = () => {
    pressedOffset.value = withSpring(0, motion.spring);
  };

  const handlePress = () => {
    if (!isInteractive) return;
    onPress();
  };

  // Map legacy variant names
  const resolvedVariant = variant === 'kintsugi' ? 'secondary' : variant;

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
      {/* 1. Solid Ink Hard Shadow Underlay */}
      {resolvedVariant !== 'ghost' && !disabled && (
        <View style={[styles.shadowBlock, styles[`shadow_${size}`]]} />
      )}

      {/* 2. Interactive Surface with Chunky Ink Outline */}
      <Animated.View
        style={[
          styles.surfaceBase,
          styles[resolvedVariant],
          styles[size],
          animatedSurfaceStyle,
          disabled && styles.disabledSurface,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={resolvedVariant === 'primary' || resolvedVariant === 'danger' ? '#FFFFFF' : theme.colors.text}
          />
        ) : (
          <Text
            style={[
              styles.textBase,
              styles[`text_${resolvedVariant}`],
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
    marginRight: motion.pressOffset,
    marginBottom: motion.pressOffset,
  },
  disabledContainer: {
    opacity: 0.6,
  },
  // Hard offset ink shadow block (No blur!)
  shadowBlock: {
    position: 'absolute',
    top: motion.pressOffset,
    left: motion.pressOffset,
    right: -motion.pressOffset,
    bottom: -motion.pressOffset,
    backgroundColor: theme.colors.shadowInk,
    borderRadius: theme.roundness.md,
    zIndex: 0,
  },
  shadow_sm: {
    borderRadius: theme.roundness.sm,
  },
  shadow_md: {
    borderRadius: theme.roundness.md,
  },
  shadow_lg: {
    borderRadius: theme.roundness.lg,
  },

  // Surface
  surfaceBase: {
    position: 'relative',
    zIndex: 1,
    borderRadius: theme.roundness.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: theme.borders.chunky,
    borderColor: theme.colors.border,
  },

  // Sizes (Minimum 48dp touch target enforced)
  sm: {
    borderRadius: theme.roundness.sm,
    paddingVertical: scale(8),
    paddingHorizontal: scale(14),
    minHeight: Math.max(48, scale(44)),
  },
  md: {
    borderRadius: theme.roundness.md,
    paddingVertical: scale(12),
    paddingHorizontal: scale(20),
    minHeight: scale(50),
  },
  lg: {
    borderRadius: theme.roundness.lg,
    paddingVertical: scale(15),
    paddingHorizontal: scale(26),
    minHeight: scale(56),
  },

  // Variants (String & Stickers Toybox Palette)
  primary: {
    backgroundColor: theme.colors.primary, // Tomato #FF5A3C
  },
  secondary: {
    backgroundColor: theme.colors.secondary, // Sunshine #FFC93C
  },
  pool: {
    backgroundColor: theme.colors.pool, // Pool #2EC4B6
  },
  bubblegum: {
    backgroundColor: theme.colors.bubblegum, // Bubblegum #FF8FB1
  },
  outline: {
    backgroundColor: theme.colors.surface, // Paper White #FFFFFF
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  danger: {
    backgroundColor: theme.colors.danger, // Alert Red #E03616
  },
  disabledSurface: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderColor: theme.colors.borderLight,
  },

  // Typography
  textBase: {
    fontFamily: theme.typography.fontFamilies.display,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.2,
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
    color: theme.colors.text,
  },
  text_pool: {
    color: theme.colors.text,
  },
  text_bubblegum: {
    color: theme.colors.text,
  },
  text_outline: {
    color: theme.colors.text,
  },
  text_ghost: {
    color: theme.colors.primary,
  },
  text_danger: {
    color: '#FFFFFF',
  },
  textDisabled: {
    color: theme.colors.textMuted,
  },
});
