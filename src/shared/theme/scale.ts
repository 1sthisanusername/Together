import { Dimensions } from 'react-native';

const getScreenWidth = (): number => {
  try {
    return typeof Dimensions?.get === 'function' ? Dimensions.get('window')?.width || 375 : 375;
  } catch {
    return 375;
  }
};

const SCREEN_WIDTH = getScreenWidth();

/**
 * Clamped scale function:
 * Restricts responsive scaling between 360dp (compact phones) and 430dp (flagship phones).
 * Prevents elements from shrinking to unreadable sizes or expanding excessively on tablets.
 */
export const scale = (size: number): number => {
  const clampedWidth = Math.min(Math.max(SCREEN_WIDTH, 360), 430);
  return Math.round((clampedWidth / 375) * size);
};

export const spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(16),
  lg: scale(24),
  xl: scale(32),
  xxl: scale(40),
} as const;

export const radii = {
  sm: scale(8),
  md: scale(14),
  lg: scale(18),
  xl: scale(22),
  pill: 9999,
} as const;

/**
 * Guarantees minimum 48dp x 48dp touch target on any interactive element.
 */
export const MIN_TOUCH_TARGET = 48;

export const hitSlop = {
  small: { top: 10, bottom: 10, left: 10, right: 10 },
  medium: { top: 14, bottom: 14, left: 14, right: 14 },
  large: { top: 20, bottom: 20, left: 20, right: 20 },
} as const;
