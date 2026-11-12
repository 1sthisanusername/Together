/**
 * Visual Direction: LOVE, JOY & CONNECTION
 * Warm, intimate, and playful aesthetic with Amour Red, Joyful Coral,
 * Blushing Rose, Warm Sunset, and Cozy Night ink anchors.
 */

export const palette = {
  // Core Brand & Accent Tokens
  amourRed: '#E53935',         // Primary Brand / CTA
  amourRedPressed: '#C62828',  // Pressed / Active CTA state
  joyfulCoral: '#FF7043',      // Secondary Accent
  blushingRose: '#F48FB1',     // Soft Accent / Highlights
  warmSunset: '#FFB74D',       // Alerts / Milestones / Badges

  // Typography & Anchors
  cozyNight: '#3E2723',        // Primary Typography & Dark Anchor
  cozyNightMuted: '#7A625A',   // Muted / Secondary Text, timestamps, helpers
  cozyNightInactive: 'rgba(62, 39, 35, 0.5)', // Inactive tab icons & labels

  // Surfaces & Canvas
  warmOffWhite: '#FFFDFB',     // Primary App Background
  softBlush: '#FFF0ED',        // Card & Container Surface
  disabledBlush: '#FBE9E7',    // Disabled State Surface & 1px subtle border
  white: '#FFFFFF',            // Pure surface card contrast

  // Semantic aliases
  danger: '#C62828',
  success: '#FF7043',
  online: '#2EC4B6',

  // Dark Mode Variant (Warm Cocoa Night)
  paperDark: '#1E1412',
  inkDark: '#FFFDFB',
  surfaceDark: '#2A1D1A',
  surfaceSubtleDark: '#362622',
  borderDark: '#47332E',
  amourRedDark: '#EF5350',
  coralDark: '#FF8A65',
  roseDark: '#F8BBD0',
  sunsetDark: '#FFCC80',
  inkMutedDark: '#BCAAA4',
} as const;

export const theme = {
  colors: {
    // Canvas & Paper Surfaces
    background: palette.warmOffWhite,       // #FFFDFB
    surface: palette.white,                 // #FFFFFF (with 1px solid #FBE9E7 border)
    surfaceBlush: palette.softBlush,        // #FFF0ED
    surfaceSubtle: palette.softBlush,       // #FFF0ED
    surfaceDisabled: palette.disabledBlush, // #FBE9E7
    surfaceHighlight: palette.disabledBlush,// #FBE9E7

    // Typography (Cozy Night)
    text: palette.cozyNight,                // #3E2723
    textSecondary: palette.cozyNightMuted,  // #7A625A
    textMuted: palette.cozyNightMuted,      // #7A625A
    textInactive: palette.cozyNightInactive,// rgba(62, 39, 35, 0.5)
    textInverse: palette.warmOffWhite,      // #FFFDFB
    textAmour: palette.amourRed,            // #E53935
    textCoral: palette.joyfulCoral,         // #FF7043

    // Primary Brand Accent (Amour Red)
    primary: palette.amourRed,              // #E53935
    primaryPressed: palette.amourRedPressed,// #C62828
    primaryHover: palette.amourRedPressed,  // #C62828
    primaryLight: palette.softBlush,        // #FFF0ED
    primaryBorder: palette.disabledBlush,   // #FBE9E7

    // Secondary & Accent Highlights
    secondary: palette.joyfulCoral,         // #FF7043
    secondaryLight: palette.softBlush,      // #FFF0ED
    coral: palette.joyfulCoral,             // #FF7043
    rose: palette.blushingRose,             // #F48FB1
    bubblegum: palette.blushingRose,        // #F48FB1
    bubblegumLight: palette.softBlush,      // #FFF0ED
    sunset: palette.warmSunset,             // #FFB74D
    pool: palette.joyfulCoral,              // #FF7043 (migrated warm coral accent)
    poolLight: palette.softBlush,           // #FFF0ED
    kintsugi: palette.warmSunset,           // #FFB74D
    kintsugiLight: '#FFF7EA',

    // Borders (Subtle 1px Warm Blush)
    border: palette.disabledBlush,          // #FBE9E7
    borderLight: palette.disabledBlush,     // #FBE9E7
    borderStrong: palette.cozyNight,        // #3E2723

    // Warm Diffused Shadow Anchor
    shadowInk: palette.cozyNight,           // #3E2723

    // Feedback Accents
    heart: palette.amourRed,                // #E53935
    sun: palette.warmSunset,                // #FFB74D
    moon: palette.blushingRose,             // #F48FB1
    online: palette.online,
    success: palette.joyfulCoral,
    successLight: palette.softBlush,
    warning: palette.warmSunset,            // #FFB74D
    warningLight: '#FFF8EC',
    danger: palette.amourRedPressed,        // #C62828
    dangerLight: palette.disabledBlush,     // #FBE9E7

    // Badge & Sticker Highlights
    stickers: {
      sunshine: palette.warmSunset,         // #FFB74D
      sunset: palette.warmSunset,           // #FFB74D
      coral: palette.joyfulCoral,           // #FF7043
      pool: palette.softBlush,              // #FFF0ED
      bubblegum: palette.blushingRose,      // #F48FB1
      rose: palette.blushingRose,           // #F48FB1
      blush: palette.softBlush,             // #FFF0ED
      matcha: palette.softBlush,
    },
  },

  darkColors: {
    background: palette.paperDark,
    surface: palette.surfaceDark,
    surfaceSubtle: palette.surfaceSubtleDark,
    surfaceHighlight: palette.borderDark,
    text: palette.inkDark,
    textSecondary: palette.inkMutedDark,
    textMuted: palette.inkMutedDark,
    textInverse: palette.paperDark,
    primary: palette.amourRedDark,
    secondary: palette.coralDark,
    pool: palette.coralDark,
    bubblegum: palette.roseDark,
    border: palette.borderDark,
    borderLight: palette.borderDark,
    shadowInk: '#000000',
  },

  gradients: {
    primary: ['#E53935', '#FF7043'] as readonly [string, string],
    hero: ['#E53935', '#FF7043'] as readonly [string, string],
    blush: ['#FFF0ED', '#FFFDFB'] as readonly [string, string],
    rose: ['#F48FB1', '#FF7043'] as readonly [string, string],
  },

  typography: {
    fontFamilies: {
      display: 'BricolageGrotesque_700Bold',
      sans: 'Figtree_600SemiBold',
      sansRegular: 'Figtree_400Regular',
      handwritten: 'Caveat_700Bold',
      handwrittenRegular: 'Caveat_600SemiBold',
    },
    families: {
      display: 'BricolageGrotesque_700Bold',
      bold: 'BricolageGrotesque_700Bold',
      body: 'Figtree_400Regular',
      sans: 'Figtree_600SemiBold',
      handwritten: 'Caveat_700Bold',
    },
  },

  // Subtle 1px Warm Borders
  borders: {
    subtle: 1,
    chunky: 1,
    chunkyThick: 1.5,
  },

  // Warm, Diffused Elevation Shadows: 0 8px 24px rgba(62, 39, 35, 0.07)
  shadows: {
    soft: {
      shadowColor: palette.cozyNight,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.07,
      shadowRadius: 24,
      elevation: 4,
    },
    card: {
      shadowColor: palette.cozyNight,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.07,
      shadowRadius: 24,
      elevation: 4,
    },
    hardSm: {
      shadowColor: palette.cozyNight,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.07,
      shadowRadius: 12,
      elevation: 2,
    },
    hardMd: {
      shadowColor: palette.cozyNight,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.07,
      shadowRadius: 18,
      elevation: 3,
    },
    hardLg: {
      shadowColor: palette.cozyNight,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.07,
      shadowRadius: 24,
      elevation: 4,
    },
  },

  roundness: {
    sm: 10,
    md: 16,
    lg: 20,
    xl: 24,
    full: 9999,
  },

  radii: {
    sm: 10,
    md: 16,
    lg: 20,
    xl: 24,
    full: 9999,
  },
};
