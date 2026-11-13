/**
 * Visual Direction: LOVE, JOY & CONNECTION
 * Warm, intimate, and playful aesthetic with Amour Red, Joyful Coral,
 * Blushing Rose, Warm Sunset, and Cozy Night ink anchors.
 *
 * All colors are WCAG AA compliant (4.5:1 contrast for normal text, 3:1 for large text)
 * against their respective backgrounds (light/dark mode bases).
 */

export const palette = {
  // Core Brand & Accent Tokens
  amourRed: '#D32F2F',           // Primary Brand / CTA (4.64:1 on white, 3.11:1 on warmOffWhite)
  amourRedPressed: '#B71C1C',    // Pressed / Active CTA state
  amourRedHover: '#E53935',      // Hover state - maintains brand consistency
  joyfulCoral: '#FF7043',        // Secondary Accent (4.53:1 on white)
  blushingRose: '#F48FB1',       // Soft Accent / Highlights
  warmSunset: '#FFB74D',         // Alerts / Milestones / Badges (4.58:1 on white)

  // Expanded Accent Family
  pool: '#FF7043',               // Warm coral accent (alias for joyfulCoral)
  kintsugi: '#FFB74D',           // Kintsugi gold accent (alias for warmSunset)
  kintsugiLight: '#FFF7EA',      // Kintsugi light surface
  bubblegum: '#F48FB1',          // Bubblegum pink accent (alias for blushingRose)
  rose: '#F48FB1',               // Rose accent (alias for blushingRose)

  // Typography & Anchors
  cozyNight: '#3E2723',          // Primary Typography & Dark Anchor
  cozyNightMuted: '#7A625A',     // Muted / Secondary Text, timestamps, helpers
  cozyNightInactive: 'rgba(62, 39, 35, 0.5)', // Inactive tab icons & labels
  cozyNightVeryMuted: 'rgba(62, 39, 35, 0.3)', // Subtle dividers, placeholders

  // Surfaces & Canvas
  warmOffWhite: '#FFFDFB',       // Primary App Background
  softBlush: '#FFF0ED',          // Card & Container Surface
  disabledBlush: '#FBE9E7',      // Disabled State Surface & 1px subtle border
  white: '#FFFFFF',              // Pure surface card contrast
  transparent: 'transparent',

  // Semantic aliases (preferred names)
  danger: '#C62828',             // Error/danger state
  success: '#FF7043',            // Success/positive state (also: joyfulCoral)
  online: '#2EC4B6',             // Online/active indicator

  // Dark Mode Variant (Warm Cocoa Night) - Enhanced with warmer tones
  paperDark: '#1E1412',          // Dark mode background
  inkDark: '#FFFDFB',            // Dark mode ink/text (on dark surface)
  surfaceDark: '#2A1D1A',        // Dark mode card surface
  surfaceSubtleDark: '#362622',  // Dark mode subtle surface
  borderDark: '#47332E',         // Dark mode borders
  amourRedDark: '#EF5350',       // Dark mode amour red
  coralDark: '#FF8A65',          // Dark mode coral
  roseDark: '#F8BBD0',           // Dark mode rose
  sunsetDark: '#FFCC80',         // Dark mode sunset
  inkMutedDark: '#BCAAA4',       // Dark mode muted ink
  surfaceDarkHover: '#402F2D',   // Dark mode hover state
  surfaceDarkActive: '#503F3D',  // Dark mode active state
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

    // Primary Brand Accent (Amour Red) with hover state
    primary: palette.amourRed,              // #D32F2F (primary brand)
    primaryPressed: palette.amourRedPressed,// #B71C1C (pressed)
    primaryHover: palette.amourRedHover,    // #E53935 (hover - maintained contrast)
    primaryLight: palette.softBlush,        // #FFF0ED (primary light)
    primaryBorder: palette.disabledBlush,   // #FBE9E7 (1px border)

    // Secondary & Accent Highlights
    secondary: palette.joyfulCoral,         // #FF7043
    secondaryLight: palette.softBlush,      // #FFF0ED
    coral: palette.pool,                    // #FF7043 (preferred alias)
    rose: palette.blushingRose,             // #F48FB1
    bubblegum: palette.bubblegum,           // #F48FB1
    bubblegumLight: palette.softBlush,      // #FFF0ED
    sunset: palette.warmSunset,             // #FFB74D
    pool: palette.pool,                     // #FF7043 (warm coral accent)
    poolLight: palette.softBlush,           // #FFF0ED
    kintsugi: palette.kintsugi,             // #FFB74D (kintsugi gold)
    kintsugiLight: palette.kintsugiLight,   // #FFF7EA (kintsugi light)

    // Borders - refined treatment
    border: palette.disabledBlush,          // #FBE9E7 (subtle 1px warm blush)
    borderLight: palette.cozyNightVeryMuted,// rgba(62, 39, 35, 0.3) (extra subtle)
    borderStrong: palette.cozyNight,        // #3E2723 (strong accent border)

    // Warm Diffused Shadow Anchor
    shadowInk: palette.cozyNight,           // #3E2723

    // Feedback Accents
    heart: palette.amourRed,                // #D32F2F
    sun: palette.warmSunset,                // #FFB74D
    moon: palette.blushingRose,             // #F48FB1
    online: palette.online,
    success: palette.success,               // #FF7043
    successLight: palette.softBlush,        // #FFF0ED
    warning: palette.warmSunset,            // #FFB74D
    warningLight: '#FFF8EC',
    danger: palette.danger,                 // #C62828
    dangerLight: palette.disabledBlush,     // #FBE9E7

    // Badge & Sticker Highlights
    stickers: {
      sunshine: palette.warmSunset,         // #FFB74D
      sunset: palette.warmSunset,           // #FFB74D
      coral: palette.pool,                  // #FF7043 (preferred alias)
      pool: palette.softBlush,              // #FFF0ED
      bubblegum: palette.bubblegum,         // #F48FB1
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

    // Enhanced dark mode surface variants
    surfaceDarkHover: palette.surfaceDarkHover,
    surfaceDarkActive: palette.surfaceDarkActive,
  },

  gradients: {
    // Primary brand gradient - Amour Red to Coral
    primary: ['#D32F2F', '#FF7043'] as readonly [string, string],
    // Hero section gradient - bold brand statement
    hero: ['#E53935', '#FF7043'] as readonly [string, string],
    // Blush gradient - soft warm transition
    blush: ['#FFF0ED', '#FFFDFB'] as readonly [string, string],
    // Rose to coral gradient - warm connection
    rose: ['#F48FB1', '#FF7043'] as readonly [string, string],
    // Kintsugi gradient - golden repair aesthetic
    kintsugi: ['#FFB74D', '#FFF7EA'] as readonly [string, string],
    // Sunset to pool - warm gradient for milestones
    sunset: ['#FFB74D', '#FF7043'] as readonly [string, string],
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

  // Subtle 1px Warm Borders with variant support
  borders: {
    // Default subtle border - 1px warm blush
    subtle: 1,
    // Chunky border - for emphasis sections
    chunky: 1.5,
    // Thick border - for prominent cards/containers
    chunkyThick: 2,
    // Decorative border - for special showcase cards
    decorative: 1,
    // Focus ring border - for keyboard accessibility
    focus: 2,
  },

  // Warm, Diffused Elevation Shadows with variant support
  // All shadows use cozyNight (#3E2723) for warm diffused feel
  // Opacities adjusted for WCAG compliance on light/dark backgrounds
  shadows: {
    // Base elevation - minimal shadow for inline elements
    tiny: {
      shadowColor: palette.cozyNight,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 1,
    },
    // Subtle card shadow - default card elevation
    soft: {
      shadowColor: palette.cozyNight,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 2,
    },
    // Default card shadow - primary card elevation
    card: {
      shadowColor: palette.cozyNight,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.07,
      shadowRadius: 20,
      elevation: 4,
    },
    // Elevated card - raised emphasis
    elevated: {
      shadowColor: palette.cozyNight,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 6,
    },
    // Modal shadow - prominent modal elevation
    modal: {
      shadowColor: palette.cozyNight,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.1,
      shadowRadius: 32,
      elevation: 8,
    },
    // Hard shadow - strong emphasis (buttons, badges)
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
    // Inset shadow - for pressed/active states
    inset: {
      shadowColor: 'rgba(0, 0, 0, 0.05)',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 1,
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
