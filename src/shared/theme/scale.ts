import { useState, useEffect, useMemo } from 'react';
import { Dimensions } from 'react-native';

const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

const getWindowDims = (): { width: number; height: number } => {
  try {
    const win = typeof Dimensions?.get === 'function' ? Dimensions.get('window') : null;
    return {
      width: win?.width || BASE_WIDTH,
      height: win?.height || BASE_HEIGHT,
    };
  } catch {
    return { width: BASE_WIDTH, height: BASE_HEIGHT };
  }
};

const INITIAL_DIMS = getWindowDims();

/**
 * Width-based clamped scale function (340dp compact phones up to 440dp flagship phones).
 */
export const scaleForWidth = (size: number, width: number): number => {
  const clampedWidth = Math.min(Math.max(width, 340), 440);
  return Math.round((clampedWidth / BASE_WIDTH) * size);
};

/**
 * Height-based clamped scale function for tall 20:9 vs compact 16:9 screens.
 */
export const scaleForHeight = (size: number, height: number): number => {
  const clampedHeight = Math.min(Math.max(height, 640), 920);
  return Math.round((clampedHeight / BASE_HEIGHT) * size);
};

export const scale = (size: number): number => scaleForWidth(size, INITIAL_DIMS.width);

export const verticalScale = (size: number): number => scaleForHeight(size, INITIAL_DIMS.height);

export const moderateScale = (size: number, factor = 0.45): number =>
  Math.round(size + (scale(size) - size) * factor);

/**
 * Viewport-percentage helpers: return exact percentage of current window width/height.
 */
export const wp = (percent: number): number =>
  Math.round((INITIAL_DIMS.width * percent) / 100);

export const hp = (percent: number): number =>
  Math.round((INITIAL_DIMS.height * percent) / 100);

export interface ResponsiveLayout {
  width: number;
  height: number;
  aspectRatio: number;
  isCompact: boolean;
  isTall: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  columns: 1 | 2;
  horizontalGutter: number;
  contentMaxWidth: number;
  wideMaxWidth: number;
  sectionGap: number;
  mediaAspectRatio: number;
  polaroidWidth: number;
  s: (size: number) => number;
  vs: (size: number) => number;
  ms: (size: number, factor?: number) => number;
  wp: (percent: number) => number;
  hp: (percent: number) => number;
}

/**
 * Reactive layout hook that adapts spacing, ratios, grid columns, and container
 * max-widths dynamically when window dimensions change (phone sizes, foldables,
 * rotation, tablets, desktop browser resize).
 */
export function useResponsiveLayout(): ResponsiveLayout {
  const [dims, setDims] = useState(getWindowDims);

  useEffect(() => {
    const subscription = Dimensions?.addEventListener?.(
      'change',
      ({ window }: { window: { width: number; height: number } }) => {
        if (window?.width && window?.height) {
          setDims({ width: window.width, height: window.height });
        }
      }
    );
    return () => {
      subscription?.remove?.();
    };
  }, []);

  return useMemo(() => {
    const { width, height } = dims;
    const aspectRatio = width > 0 ? height / width : 2.16;
    const isCompact = width < 365 || height < 680;
    const isTall = aspectRatio >= 2.05;
    const isTablet = width >= 600;
    const isDesktop = width >= 960;
    const columns: 1 | 2 = width >= 700 ? 2 : 1;

    const horizontalGutter = Math.round(Math.min(Math.max(width * 0.045, 14), 28));
    const contentMaxWidth = Math.round(Math.min(width * 0.94, isTablet ? 560 : 540));
    const wideMaxWidth = Math.round(Math.min(width * 0.95, isDesktop ? 920 : 760));
    const sectionGap = Math.round(height * 0.014);
    const mediaAspectRatio = height < 700 ? 16 / 8.5 : 16 / 9;
    const polaroidWidth = Math.round(Math.min(Math.max(width * 0.29, 102), 140));

    const s = (size: number) => scaleForWidth(size, width);
    const vs = (size: number) => scaleForHeight(size, height);
    const ms = (size: number, factor = 0.45) =>
      Math.round(size + (s(size) - size) * factor);
    const dynamicWp = (percent: number) => Math.round((width * percent) / 100);
    const dynamicHp = (percent: number) => Math.round((height * percent) / 100);

    return {
      width,
      height,
      aspectRatio,
      isCompact,
      isTall,
      isTablet,
      isDesktop,
      columns,
      horizontalGutter,
      contentMaxWidth,
      wideMaxWidth,
      sectionGap,
      mediaAspectRatio,
      polaroidWidth,
      s,
      vs,
      ms,
      wp: dynamicWp,
      hp: dynamicHp,
    };
  }, [dims]);
}

export const spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(16),
  lg: scale(24),
  xl: scale(32),
  xxl: scale(40),
} as const;

export const radii = {
  sm: scale(10),
  md: scale(16),
  lg: 20,
  xl: scale(24),
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
