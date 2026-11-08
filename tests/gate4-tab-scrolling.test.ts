import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

vi.mock('react-native', () => import('./mocks/react-native'));
vi.mock('react-native-url-polyfill/auto', () => ({}));
vi.mock('@/services', () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) }),
    rpc: () => Promise.resolve({ data: [], error: null }),
  },
  analytics: {
    track: () => {},
    identify: () => {},
    reset: () => {},
  },
}));

describe('GATE 4: Tab Scrolling & Edge Dragging Verification', () => {
  const tabs = ['home.tsx', 'play.tsx', 'dates.tsx', 'memories.tsx', 'us.tsx'];

  it('Us screen uses ONE vertical ScrollView and does not wrap in KeyboardScreen', () => {
    const usFile = fs.readFileSync(
      path.resolve(__dirname, '../src/app/(tabs)/us.tsx'),
      'utf-8'
    );
    expect(usFile).not.toContain('<KeyboardScreen');
    expect(usFile).toContain('<ScrollView');
    expect(usFile).toContain('keyboardShouldPersistTaps="handled"');
  });

  it('Every tab screen dynamically calculates bottom padding from tabBarHeight + insets.bottom', () => {
    for (const tab of tabs) {
      const content = fs.readFileSync(
        path.resolve(__dirname, `../src/app/(tabs)/${tab}`),
        'utf-8'
      );
      expect(content).toContain('useBottomTabBarHeight');
      expect(content).toContain('useSafeAreaInsets');
      expect(content).toContain('tabBarHeight + insets.bottom');
      expect(content).toContain('paddingBottom: bottomPadding');
    }
  });

  it('Every tab screen enables keyboardShouldPersistTaps="handled" for touch reliability', () => {
    for (const tab of tabs) {
      const content = fs.readFileSync(
        path.resolve(__dirname, `../src/app/(tabs)/${tab}`),
        'utf-8'
      );
      expect(content).toContain('keyboardShouldPersistTaps="handled"');
    }
  });

  it('Child cards on Us page do not contain nested vertical ScrollViews', () => {
    const cards = [
      '../src/features/us/components/CoupleProfileCard.tsx',
      '../src/features/us/components/BucketListCard.tsx',
      '../src/features/us/components/ImportantDatesList.tsx',
      '../src/features/us/components/NextReunionCountdownCard.tsx',
    ];

    for (const cardPath of cards) {
      const content = fs.readFileSync(path.resolve(__dirname, cardPath), 'utf-8');
      expect(content).not.toContain('<ScrollView');
      expect(content).not.toContain('<FlatList');
    }
  });
});

