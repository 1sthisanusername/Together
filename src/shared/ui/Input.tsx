import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { theme, scale } from '@/shared/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Enhanced Input Component:
 * - Warm blush border focus state
 * - Placeholder text with improved readability
 * - Error state with clear visual feedback
 * - Consistent padding and touch target sizing
 * - Accessible focus/blur state management
 */
export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label} maxFontSizeMultiplier={1.35}>
          {label}
        </Text>
      )}

      {/* Warm Input Wrapper with subtle focus border */}
      <View style={styles.inputWrapper}>
        <TextInput
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.input,
            isFocused && styles.inputFocused,
            error ? styles.inputError : null,
            style,
          ]}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          maxFontSizeMultiplier={1.35}
          {...props}
        />
      </View>

      {error ? (
        <Text style={styles.errorText} maxFontSizeMultiplier={1.35}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: scale(20),
    width: '100%',
  },
  label: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(14),
    fontWeight: '800',
    color: theme.colors.text, // #3E2723
    marginBottom: scale(8),
    letterSpacing: -0.2,
  },
  inputWrapper: {
    position: 'relative',
    borderWidth: theme.borders.subtle,
    borderColor: theme.colors.border, // #FBE9E7
    borderRadius: theme.roundness.lg,
    overflow: 'hidden',
  },
  input: {
    backgroundColor: theme.colors.surface, // #FFFFFF
    borderWidth: 0,
    borderRadius: theme.roundness.lg,
    paddingHorizontal: scale(16),
    paddingVertical: scale(14),
    fontSize: scale(15),
    fontFamily: theme.typography.fontFamilies.sans,
    color: theme.colors.text, // #3E2723
    // No shadow by default - border provides definition
    // Focus state adds the primary border color
  },
  inputFocused: {
    borderColor: theme.colors.primary, // #D32F2F (Amour Red)
    backgroundColor: theme.colors.background, // #FFFDFB
    // Shadow removed - border color provides focus indicator
  },
  inputError: {
    borderColor: theme.colors.danger, // #C62828
    backgroundColor: theme.colors.dangerLight, // #FDEDEC
  },
  errorText: {
    marginTop: scale(6),
    fontSize: scale(12),
    fontFamily: theme.typography.fontFamilies.sans,
    color: theme.colors.danger, // #C62828
    fontWeight: '700',
  },
});