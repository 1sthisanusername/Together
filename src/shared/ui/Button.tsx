import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '@/shared/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
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
}) => {
  const isInteractive = !loading && !disabled;

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={!isInteractive}
      activeOpacity={0.85}
      style={[
        styles.base,
        styles[variant],
        styles[size],
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : theme.colors.primary}
        />
      ) : (
        <Text
          style={[
            styles.textBase,
            styles[`${variant}Text` as keyof typeof styles],
            styles[`${size}Text` as keyof typeof styles],
            disabled && styles.disabledText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  sm: {
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  md: {
    paddingVertical: 14,
    paddingHorizontal: 22,
  },
  lg: {
    paddingVertical: 17,
    paddingHorizontal: 28,
  },
  primary: {
    backgroundColor: theme.colors.primary, // #b69788
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  secondary: {
    backgroundColor: theme.colors.surfaceSubtle, // #f0ece6
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: theme.colors.danger,
  },
  disabled: {
    backgroundColor: theme.colors.borderLight,
    borderColor: theme.colors.border,
    opacity: 0.6,
  },
  textBase: {
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  smText: {
    fontSize: 13,
  },
  mdText: {
    fontSize: 15,
  },
  lgText: {
    fontSize: 16,
  },
  primaryText: {
    color: theme.colors.textInverse, // #ffffff
  },
  secondaryText: {
    color: theme.colors.text, // #42362e
  },
  outlineText: {
    color: theme.colors.primary, // #b69788
  },
  ghostText: {
    color: theme.colors.textSecondary, // #a8917f
  },
  dangerText: {
    color: theme.colors.textInverse,
  },
  disabledText: {
    color: theme.colors.textMuted,
  },
});

