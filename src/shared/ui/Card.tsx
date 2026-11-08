import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { theme, scale } from '@/shared/theme';

export type CardVariant = 'paper' | 'sunshine' | 'tomato' | 'pool' | 'bubblegum' | 'stoneware' | 'trough' | 'kintsugi';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  testID?: string;
  hasShadow?: boolean;
}

/**
 * String & Stickers Sticker Card:
 * Chunky 2px Ink outlines with hard offset ink shadows (no blur).
 */
export const Card: React.FC<CardProps> = ({
  children,
  variant = 'paper',
  style,
  containerStyle,
  testID,
  hasShadow = true,
}) => {
  // Normalize backward compatible variants
  let resolvedVariant = variant;
  if (variant === 'stoneware') resolvedVariant = 'paper';
  if (variant === 'kintsugi') resolvedVariant = 'sunshine';

  return (
    <View style={[styles.outerWrapper, containerStyle]}>
      {/* 1. Hard Offset Ink Shadow Underlay */}
      {hasShadow && <View style={styles.shadowBlock} />}

      {/* 2. Sticker Surface */}
      <View
        testID={testID}
        style={[styles.cardSurface, styles[resolvedVariant] || styles.paper, style]}
      >
        {children}
      </View>
    </View>
  );
};

const SHADOW_OFFSET = 4;

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'relative',
    marginVertical: scale(6),
    marginRight: SHADOW_OFFSET,
    marginBottom: SHADOW_OFFSET,
  },
  shadowBlock: {
    position: 'absolute',
    top: SHADOW_OFFSET,
    left: SHADOW_OFFSET,
    right: -SHADOW_OFFSET,
    bottom: -SHADOW_OFFSET,
    backgroundColor: theme.colors.shadowInk,
    borderRadius: theme.roundness.lg,
  },
  cardSurface: {
    borderRadius: theme.roundness.lg,
    padding: scale(16),
    borderWidth: theme.borders.chunky,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },

  // Color Variants
  paper: {
    backgroundColor: theme.colors.surface, // Clean Sticker White
  },
  sunshine: {
    backgroundColor: theme.colors.secondary, // Sunshine #FFC93C
  },
  tomato: {
    backgroundColor: theme.colors.primary, // Tomato #FF5A3C
  },
  pool: {
    backgroundColor: theme.colors.pool, // Pool Teal #2EC4B6
  },
  bubblegum: {
    backgroundColor: theme.colors.bubblegum, // Bubblegum #FF8FB1
  },
  trough: {
    backgroundColor: theme.colors.surfaceSubtle, // Soft Cream Paper
  },
  stoneware: {
    backgroundColor: theme.colors.surface,
  },
  kintsugi: {
    backgroundColor: theme.colors.secondary,
  },
});
