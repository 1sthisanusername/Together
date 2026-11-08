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

describe('STRING & STICKERS Design System & Motion Tokens', () => {
  it('implements String & Stickers palette with exact specified color tokens', () => {
    // Paper #FFF4E3, Ink #2B2118, Tomato #FF5A3C, Sunshine #FFC93C, Pool #2EC4B6, Bubblegum #FF8FB1
    expect(theme.colors.background).toBe(palette.paper);
    expect(theme.colors.background).toBe('#FFF4E3');

    expect(theme.colors.text).toBe(palette.ink);
    expect(theme.colors.text).toBe('#2B2118');

    expect(theme.colors.border).toBe(palette.ink);
    expect(theme.colors.border).toBe('#2B2118');

    expect(theme.colors.primary).toBe(palette.tomato);
    expect(theme.colors.primary).toBe('#FF5A3C');

    expect(theme.colors.secondary).toBe(palette.sunshine);
    expect(theme.colors.secondary).toBe('#FFC93C');

    expect(theme.colors.pool).toBe(palette.pool);
    expect(theme.colors.pool).toBe('#2EC4B6');

    expect(theme.colors.bubblegum).toBe(palette.bubblegum);
    expect(theme.colors.bubblegum).toBe('#FF8FB1');
  });

  it('implements the dark mode variant tokens', () => {
    expect(palette.paperDark).toBe('#1C1611');
    expect(palette.inkDark).toBe('#FFF4E3');
    expect(palette.tomatoDark).toBe('#FF6E54');
    expect(palette.sunshineDark).toBe('#FFD359');
    expect(palette.poolDark).toBe('#40D9CB');
    expect(palette.bubblegumDark).toBe('#FFA1BD');
  });

  it('configures Google Fonts: Bricolage Grotesque, Figtree, Caveat', () => {
    expect(theme.typography.fontFamilies.display).toBe('BricolageGrotesque_700Bold');
    expect(theme.typography.fontFamilies.sans).toBe('Figtree_600SemiBold');
    expect(theme.typography.fontFamilies.sansRegular).toBe('Figtree_400Regular');
    expect(theme.typography.fontFamilies.handwritten).toBe('Caveat_700Bold');
    expect(theme.typography.fontFamilies.handwrittenRegular).toBe('Caveat_600SemiBold');
  });

  it('enforces chunky outlines and hard offset ink shadows (no blur/soft shadows)', () => {
    expect(theme.borders.chunky).toBe(2);
    expect(theme.shadows.hardSm.shadowColor).toBe('#2B2118');
    expect(theme.shadows.hardSm.shadowRadius).toBe(0); // 0 blur!
    expect(theme.shadows.hardMd.shadowRadius).toBe(0);
    expect(theme.shadows.hardLg.shadowRadius).toBe(0);
  });

  it('motion tokens provide spring physics and sink-into-shadow press offset', async () => {
    expect(motion.pressOffset).toBe(3);
    expect(motion.spring.damping).toBe(18);
    expect(motion.spring.stiffness).toBe(300);

    expect(typeof triggerHaptic).toBe('function');
    await expect(triggerHaptic('light')).resolves.not.toThrow();
  });

  it('splash screen background matches Paper color #FFF4E3 in app.json', () => {
    const appJsonPath = path.resolve(__dirname, '../app.json');
    const content = fs.readFileSync(appJsonPath, 'utf8');
    const appJson = JSON.parse(content);

    expect(appJson.expo.splash.backgroundColor).toBe('#FFF4E3');
    expect(appJson.expo.android.splash.backgroundColor).toBe('#FFF4E3');
    expect(appJson.expo.android.adaptiveIcon.backgroundColor).toBe('#FFF4E3');
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

