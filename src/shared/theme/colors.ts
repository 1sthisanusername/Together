/**
 * Warm Minimalist / Japandi Aesthetic Color Palette
 * Derived directly from architectural interior design spec:
 *
 * - #42362e: Deep warm espresso (primary text, bold headers, dark accents)
 * - #a8917f: Soft warm cedar (secondary text, elegant labels, icons, subheadings)
 * - #d2ccc4: Travertine sandstone (delicate borders, subtle dividers, outlines)
 * - #f7f9f6: Alabaster cream (serene background, soft canvas surfaces)
 * - #b69788: Dusky rosewood / clay blush (primary CTA, active pills, romantic accents, hearts)
 */

export const palette = {
  espresso: '#42362e',
  cedar: '#a8917f',
  sandstone: '#d2ccc4',
  cream: '#f7f9f6',
  clay: '#b69788',
} as const;

export const theme = {
  colors: {
    // Canvas & Surfaces
    background: '#f7f9f6', // Alabaster cream
    surface: '#ffffff', // Clean elevated white
    surfaceSubtle: '#f0ece6', // Soft warm sandstone tint
    surfaceHighlight: '#ece5de', // Slightly deeper warm neutral

    // Typography
    text: '#42362e', // Deep warm espresso
    textSecondary: '#a8917f', // Soft cedar
    textMuted: '#948375', // Muted warm taupe
    textInverse: '#ffffff', // On dark or primary buttons
    textClay: '#b69788',

    // Primary Brand / Romantic Accent
    primary: '#b69788', // Dusky rosewood clay
    primaryHover: '#a38475',
    primaryLight: '#f4ede8', // Soft blush wash for chips & active states
    primaryBorder: '#decac0',

    // Secondary & Structural Neutral
    secondary: '#a8917f',
    secondaryLight: '#ede5de',
    border: '#d2ccc4', // Sandstone
    borderLight: '#e8e3dc',
    borderStrong: '#a8917f',

    // Feedback & Special Accents (muted organic tones)
    heart: '#b69788',
    sun: '#c89255',
    moon: '#766782',
    success: '#6d8a70',
    successLight: '#edf3ed',
    warning: '#c89255',
    warningLight: '#fbf4ea',
    danger: '#ab5c56',
    dangerLight: '#fbf0ef',
  },
  typography: {
    fontFamilies: {
      sans: 'System',
    },
  },
  shadows: {
    subtle: {
      shadowColor: '#42362e',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    card: {
      shadowColor: '#42362e',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },
  },
  roundness: {
    sm: 8,
    md: 14,
    lg: 20,
    full: 9999,
  },
};
