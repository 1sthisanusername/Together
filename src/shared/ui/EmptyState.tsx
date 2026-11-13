import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import { theme, scale } from '@/shared/theme';

export interface EmptyStateProps {
  title: string;
  description?: string;
  actionTitle?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionTitle,
  onAction,
  icon,
}) => {
  return (
    <View style={styles.container}>
      {icon && (
        <View style={styles.iconWrapper}>
          <View style={styles.iconContainer}>{icon}</View>
        </View>
      )}
      <Text style={styles.title} maxFontSizeMultiplier={1.35}>
        {title}
      </Text>
      {description && (
        <Text style={styles.description} maxFontSizeMultiplier={1.35}>
          {description}
        </Text>
      )}
      {actionTitle && onAction && (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="primary"
          size="md"
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(28),
  },
  iconWrapper: {
    marginBottom: scale(18),
  },
  iconContainer: {
    width: scale(72),
    height: scale(72),
    borderRadius: theme.roundness.full,
    backgroundColor: theme.colors.surfaceBlush,
    borderWidth: theme.borders.subtle,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.soft,
  },
  title: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(20),
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: scale(8),
    letterSpacing: -0.3,
  },
  description: {
    fontFamily: theme.typography.fontFamilies.sansRegular,
    fontSize: scale(14),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: scale(20),
    marginBottom: scale(20),
    maxWidth: scale(280),
  },
  button: {
    minWidth: scale(160),
  },
});
