import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import { theme, scale } from '@/shared/theme';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryTitle?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  retryTitle = 'Try again',
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Button
          title={retryTitle}
          onPress={onRetry}
          variant="outline"
          size="md"
          style={styles.retryButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: scale(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: scale(18),
    fontWeight: '700',
    color: theme.colors.danger,
    marginBottom: scale(8),
    textAlign: 'center',
  },
  message: {
    fontSize: scale(14),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: scale(20),
    marginBottom: scale(16),
  },
  retryButton: {
    marginTop: scale(8),
  },
});
