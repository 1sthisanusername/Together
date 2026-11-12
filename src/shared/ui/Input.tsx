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

      {/* Warm Input Wrapper */}
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

const INPUT_SHADOW = 3;

const styles = StyleSheet.create({
  container: {
    marginBottom: scale(16),
    width: '100%',
  },
  label: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(14),
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: scale(6),
    letterSpacing: -0.2,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    backgroundColor: theme.colors.surface, // #FFFFFF
    borderWidth: 1,
    borderColor: theme.colors.border, // #FBE9E7
    borderRadius: 16,
    paddingHorizontal: scale(16),
    minHeight: Math.max(48, scale(48)), // Minimum 48dp enforced
    fontSize: scale(15),
    fontFamily: theme.typography.fontFamilies.sans,
    color: theme.colors.text, // #3E2723
    ...theme.shadows.hardSm,
  },
  inputFocused: {
    borderColor: theme.colors.primary, // #E53935
    backgroundColor: theme.colors.background, // #FFFDFB
  },
  inputError: {
    borderColor: theme.colors.danger,
    backgroundColor: theme.colors.dangerLight,
  },
  errorText: {
    marginTop: scale(6),
    fontSize: scale(12),
    fontFamily: theme.typography.fontFamilies.sans,
    color: theme.colors.danger,
    fontWeight: '700',
  },
});
