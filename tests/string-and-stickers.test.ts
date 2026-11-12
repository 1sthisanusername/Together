import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Mock dependencies
vi.mock('react-native', () => import('./mocks/react-native'));
vi.mock('expo-haptics', () => import('./mocks/expo-haptics'));
vi.mock('react-native-svg', () => import('./mocks/react-native-svg'));
vi.mock('@expo-google-fonts/bricolage-grotesque', () => import('./mocks/expo-google-fonts'));
vi.mock('@expo-google-fonts/figtree', () => import('./mocks/expo-google-fonts'));
vi.mock('@expo-google-fonts/caveat', () => import('./mocks/expo-google-fonts'));

import { theme, palette, scale, spacing, radii, motion, triggerHaptic } from '../src/shared/theme';

describe('LOVE, JOY & CONNECTION Design System & Motion Tokens', () => {
  it('implements Love, Joy & Connection palette with exact specified color tokens', () => {
    expect(theme.colors.background).toBe(palette.warmOffWhite);
    expect(theme.colors.background).toBe('#FFFDFB');

    expect(theme.colors.text).toBe(palette.cozyNight);
    expect(theme.colors.text).toBe('#3E2723');

    expect(theme.colors.textSecondary).toBe(palette.cozyNightMuted);
    expect(theme.colors.textSecondary).toBe('#7A625A');

    expect(theme.colors.border).toBe(palette.disabledBlush);
    expect(theme.colors.border).toBe('#FBE9E7');

    expect(theme.colors.primary).toBe(palette.amourRed);
    expect(theme.colors.primary).toBe('#E53935');
    expect(theme.colors.primaryPressed).toBe('#C62828');

    expect(theme.colors.secondary).toBe(palette.joyfulCoral);
    expect(theme.colors.secondary).toBe('#FF7043');

    expect(theme.colors.rose).toBe(palette.blushingRose);
    expect(theme.colors.rose).toBe('#F48FB1');

    expect(theme.colors.sunset).toBe(palette.warmSunset);
    expect(theme.colors.sunset).toBe('#FFB74D');

    expect(theme.colors.surfaceBlush).toBe('#FFF0ED');
  });

  it('implements the dark mode variant tokens', () => {
    expect(palette.paperDark).toBe('#1E1412');
    expect(palette.inkDark).toBe('#FFFDFB');
    expect(palette.amourRedDark).toBe('#EF5350');
    expect(palette.coralDark).toBe('#FF8A65');
    expect(palette.roseDark).toBe('#F8BBD0');
    expect(palette.sunsetDark).toBe('#FFCC80');
  });

  it('configures Google Fonts: Bricolage Grotesque, Figtree, Caveat', () => {
    expect(theme.typography.fontFamilies.display).toBe('BricolageGrotesque_700Bold');
    expect(theme.typography.fontFamilies.sans).toBe('Figtree_600SemiBold');
    expect(theme.typography.fontFamilies.sansRegular).toBe('Figtree_400Regular');
    expect(theme.typography.fontFamilies.handwritten).toBe('Caveat_700Bold');
    expect(theme.typography.fontFamilies.handwrittenRegular).toBe('Caveat_600SemiBold');
  });

  it('enforces subtle 1px borders and warm diffused Cozy Night shadows', () => {
    expect(theme.borders.subtle).toBe(1);
    expect(theme.shadows.card.shadowColor).toBe('#3E2723');
    expect(theme.shadows.card.shadowOpacity).toBe(0.07);
    expect(theme.shadows.card.shadowRadius).toBe(24);
    expect(theme.roundness.lg).toBe(20);
    expect(theme.roundness.full).toBe(9999);
  });

  it('motion tokens provide spring physics and sink-into-shadow press offset', async () => {
    expect(motion.pressOffset).toBe(3);
    expect(motion.spring.damping).toBe(18);
    expect(motion.spring.stiffness).toBe(300);

    expect(typeof triggerHaptic).toBe('function');
    await expect(triggerHaptic('light')).resolves.not.toThrow();
  });

  it('splash screen background matches warm off-white #FFFDFB in app.json', () => {
    const appJsonPath = path.resolve(__dirname, '../app.json');
    const content = fs.readFileSync(appJsonPath, 'utf8');
    const appJson = JSON.parse(content);

    expect(appJson.expo.splash.backgroundColor).toBe('#FFFDFB');
    if (appJson.expo.android?.splash) {
      expect(appJson.expo.android.splash.backgroundColor).toBe('#FFFDFB');
    }
    expect(appJson.expo.android.adaptiveIcon.backgroundColor).toBe('#FFFDFB');
  });

  it('shared components export clean String & Stickers primitives', () => {
    const uiIndexPath = path.resolve(__dirname, '../src/shared/ui/index.ts');
    const content = fs.readFileSync(uiIndexPath, 'utf8');

    expect(content).toContain("export * from './Button'");
    expect(content).toContain("export * from './Card'");
    expect(content).toContain("export * from './Input'");
    expect(content).toContain("export * from './Sheet'");
    expect(content).toContain("export * from './Avatar'");
    expect(content).toContain("export * from './EmptyState'");
    expect(content).toContain("export * from './TabIcons'");
  });

  it('home screen features the partner string between the two avatars', () => {
    const partnerStringPath = path.resolve(__dirname, '../src/features/home/components/PartnerString.tsx');
    const partnerStringContent = fs.readFileSync(partnerStringPath, 'utf8');

    expect(partnerStringContent).toContain('isOnline');
    expect(partnerStringContent).toContain('wiggleY');
    expect(partnerStringContent).toContain('connected! ⚡');
    expect(partnerStringContent).toContain('away 💤');
  });
});

