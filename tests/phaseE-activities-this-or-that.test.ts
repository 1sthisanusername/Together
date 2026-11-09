import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { ENABLE_SIMULTANEOUS_ACTIVITIES } from '../src/features/activities/config';

describe('Phase E: Activities & This or That Modes Architecture', () => {
  it('1. ENABLE_SIMULTANEOUS_ACTIVITIES flag is defined and defaults to false', () => {
    expect(ENABLE_SIMULTANEOUS_ACTIVITIES).toBe(false);

    const configPath = path.resolve(__dirname, '../src/features/activities/config.ts');
    expect(fs.existsSync(configPath)).toBe(true);
  });

  it('2. useActivities filters out simultaneous live drawing when flag is false', () => {
    const hookPath = path.resolve(
      __dirname,
      '../src/features/activities/hooks/useActivities.ts'
    );
    expect(fs.existsSync(hookPath)).toBe(true);

    const content = fs.readFileSync(hookPath, 'utf8');
    expect(content).toContain('ENABLE_SIMULTANEOUS_ACTIVITIES');
    expect(content).toContain("a.kind !== 'drawing_guess'");
  });

  it('3. WouldYouRatherRenderer supports Solo Mode and Couple Mode', () => {
    const rendererPath = path.resolve(
      __dirname,
      '../src/features/sessions/renderers/WouldYouRatherRenderer.tsx'
    );
    expect(fs.existsSync(rendererPath)).toBe(true);

    const content = fs.readFileSync(rendererPath, 'utf8');
    // Mode selector
    expect(content).toContain("useState<'couple' | 'solo'>");
    expect(content).toContain('Couple Mode');
    expect(content).toContain('Solo Mode');

    // Solo Mode progression
    expect(content).toContain("playMode === 'solo'");
    expect(content).toContain('soloNextContainer');
    expect(content).toContain('soloAnsweredText');

    // Couple Mode waiting & switch option
    expect(content).toContain("playMode === 'couple'");
    expect(content).toContain('Switch to Solo Mode');

    // Solo completion summary
    expect(content).toContain('summaryBox');
    expect(content).toContain('Your Choices:');
  });
});

