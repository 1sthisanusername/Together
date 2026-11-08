import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('GATE 5: Splash Screen & Clean Background Architecture', () => {
  it('app.json configures splash with plain background #F7F9F6 and app logo', () => {
    const appJsonPath = path.resolve(__dirname, '../app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

    expect(appJson.expo.splash).toBeDefined();
    expect(appJson.expo.splash.image).toBe('./assets/splash-icon.png');
    expect(appJson.expo.splash.backgroundColor).toBe('#FFF4E3');
    expect(appJson.expo.splash.resizeMode).toBe('contain');

    expect(appJson.expo.android.splash).toBeDefined();
    expect(appJson.expo.android.splash.image).toBe('./assets/splash-icon.png');
    expect(appJson.expo.android.splash.backgroundColor).toBe('#FFF4E3');
    expect(appJson.expo.android.splash.resizeMode).toBe('contain');
  });

  it('src/app/index.tsx renders plain background with app logo only without decorative circles or lines', () => {
    const indexPath = path.resolve(__dirname, '../src/app/index.tsx');
    const content = fs.readFileSync(indexPath, 'utf8');

    expect(content).toContain('theme.colors.background');
    expect(content).toContain('splash-icon.png');
    // Ensure no decorative circle wrappers or loop glyphs
    expect(content).not.toContain('borderRadius');
    expect(content).not.toContain('Animated');
    expect(content).not.toContain('∞');
  });

  it('src/shared/ui/LoadingState.tsx has no decorative animated loops, circles, or lines', () => {
    const loadingStatePath = path.resolve(__dirname, '../src/shared/ui/LoadingState.tsx');
    const content = fs.readFileSync(loadingStatePath, 'utf8');

    expect(content).not.toContain('∞');
    expect(content).not.toContain('Animated.loop');
    expect(content).not.toContain('emblemDot');
    expect(content).toContain('ActivityIndicator');
  });

  it('src/shared/ui/Logo.tsx renders the clean app logo without decorative background circles or dots', () => {
    const logoPath = path.resolve(__dirname, '../src/shared/ui/Logo.tsx');
    const content = fs.readFileSync(logoPath, 'utf8');

    expect(content).toContain('splash-icon.png');
    expect(content).not.toContain('emblemWrapper');
    expect(content).not.toContain('emblemDot');
    expect(content).not.toContain('borderRadius: dimensions.markSize / 2');
  });
});

