/**
 * Visual Direction: STRING & STICKERS (Playful)
 * Concept: "Connected by a playful red string, decorated with chunky stickers."
 * Paper textures, deep warm ink outlines, hard offset shadows, vibrant toybox accents.
 */

export const palette = {
  // Light Palette ("String & Stickers")
  paper: '#FFF4E3',       // Canvas: warm natural paper
  ink: '#2B2118',         // Ink: deep warm black outline & text (WCAG AAA 14.8:1)
  tomato: '#FF5A3C',      // Primary Accent: vibrant toybox tomato
  sunshine: '#FFC93C',    // Secondary Accent: warm sticker sunshine
  pool: '#2EC4B6',        // Interactive / Presence: bright pool teal
  bubblegum: '#FF8FB1',   // Romantic / Playful: sweet bubblegum pink
  white: '#FFFFFF',       // Sticker Surface: clean sticker paper
  cardCream: '#FFF9F0',   // Sub-surface: soft parchment
  inkMuted: '#7A6E63',    // Secondary text / muted ink
  inkFaint: '#A89F91',    // Disabled / faint ink
  danger: '#E03616',      // Alert red
  success: '#2EC4B6',     // Pool teal success
  warning: '#FFC93C',     // Sunshine warning

  // Dark Palette Variant (Dark Craft Paper)
  paperDark: '#1C1611',
  inkDark: '#FFF4E3',
  surfaceDark: '#271F19',
  surfaceSubtleDark: '#332921',
  borderDark: '#3D3126',
  tomatoDark: '#FF6E54',
  sunshineDark: '#FFD359',
  poolDark: '#40D9CB',
  bubblegumDark: '#FFA1BD',
  inkMutedDark: '#A89D91',
} as const;

export const theme = {
  colors: {
    // Canvas & Paper Surfaces
    background: palette.paper,
    surface: palette.white,
    surfaceSubtle: palette.cardCream,
    surfaceHighlight: '#FFEED2',

    // Typography (Chunky Ink)
    text: palette.ink,
    textSecondary: palette.inkMuted,
    textMuted: palette.inkFaint,
    textInverse: palette.paper,
    textTomato: palette.tomato,
    textSunshine: palette.sunshine,
    textPool: palette.pool,
    textBubblegum: palette.bubblegum,

    // Primary Brand Accent (Tomato)
    primary: palette.tomato,
    primaryHover: '#E84E32',
    primaryLight: '#FFEAE5',
    primaryBorder: palette.ink,

    // Secondary & Sticker Accents
    secondary: palette.sunshine,
    secondaryLight: '#FFF8E6',
    pool: palette.pool,
    poolLight: '#E6FAF8',
    bubblegum: palette.bubblegum,
    bubblegumLight: '#FFF0F5',
    kintsugi: palette.sunshine, // backward compatibility
    kintsugiLight: '#FFF8E6',   // backward compatibility

    // Chunky Outlines & Borders
    border: palette.ink,
    borderLight: '#DFC9AE',
    borderStrong: palette.ink,

    // Hard Offset Ink Shadows
    shadowInk: palette.ink,

    // Feedback Accents
    heart: palette.tomato,
    sun: palette.sunshine,
    moon: palette.pool,
    success: palette.pool,
    successLight: '#E6FAF8',
    warning: palette.sunshine,
    warningLight: '#FFF8E6',
    danger: palette.danger,
    dangerLight: '#FFEAE5',
  },

  darkColors: {
    background: palette.paperDark,
    surface: palette.surfaceDark,
    surfaceSubtle: palette.surfaceSubtleDark,
    surfaceHighlight: '#3D3126',
    text: palette.inkDark,
    textSecondary: palette.inkMutedDark,
    textMuted: '#6E645A',
    textInverse: palette.paperDark,
    primary: palette.tomatoDark,
    secondary: palette.sunshineDark,
    pool: palette.poolDark,
    bubblegum: palette.bubblegumDark,
    border: palette.borderDark,
    borderLight: '#4A3B2E',
    shadowInk: '#000000',
  },

  typography: {
    fontFamilies: {
      display: 'BricolageGrotesque_700Bold',
      sans: 'Figtree_600SemiBold',
      sansRegular: 'Figtree_400Regular',
      handwritten: 'Caveat_700Bold',
      handwrittenRegular: 'Caveat_600SemiBold',
    },
  },

  // Chunky 2px / 2.5px Ink Outlines
  borders: {
    chunky: 2,
    chunkyThick: 3,
  },

  // Hard Offset Ink Shadows (no blur)
  shadows: {
    hardSm: {
      shadowColor: palette.ink,
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 2,
    },
    hardMd: {
      shadowColor: palette.ink,
      shadowOffset: { width: 3, height: 3 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 3,
    },
    hardLg: {
      shadowColor: palette.ink,
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 4,
    },
  },

  roundness: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  radii: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
};
