import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '@/shared/theme';

export interface LoadingStateProps {
  message?: string;
  size?: number;
  color?: string;
}

/**
 * Minimalist, unadorned loading state on a plain background.
 * Free of decorative circles, lines, or looping animations.
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  size = 32,
  color = theme.colors.primary,
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size > 36 ? 'large' : 'small'} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: theme.colors.background,
  },
});
