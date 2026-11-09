import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Phase B: Horizontal Swipe Navigation', () => {
  it('SwipeTabWrapper defines 5 tab routes sequence', () => {
    const wrapperPath = path.resolve(__dirname, '../src/shared/ui/SwipeTabWrapper.tsx');
    const content = fs.readFileSync(wrapperPath, 'utf8');

    expect(content).toContain('/(tabs)/home');
    expect(content).toContain('/(tabs)/play');
    expect(content).toContain('/(tabs)/camera');
    expect(content).toContain('/(tabs)/memories');
    expect(content).toContain('/(tabs)/us');
  });

  it('SwipeTabWrapper is integrated into all 5 tab screens', () => {
    const tabs = ['home', 'play', 'camera', 'memories', 'us'];
    for (const tab of tabs) {
      const tabPath = path.resolve(__dirname, `../src/app/(tabs)/${tab}.tsx`);
      const content = fs.readFileSync(tabPath, 'utf8');
      expect(content).toContain('SwipeTabWrapper');
      expect(content).toContain(`currentTab="${tab}"`);
    }
  });

  it('Swipe gestures filter out vertical scrolling', () => {
    const wrapperPath = path.resolve(__dirname, '../src/shared/ui/SwipeTabWrapper.tsx');
    const content = fs.readFileSync(wrapperPath, 'utf8');

    expect(content).toContain('onMoveShouldSetPanResponder');
    expect(content).toContain('Math.abs(gestureState.dx) > Math.abs(gestureState.dy)');
  });
});

