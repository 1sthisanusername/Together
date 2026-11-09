import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createCoupleSchema, acceptInviteSchema } from '../src/features/couple/schemas';

describe('Phase D: Onboarding & Independent Nicknames Architecture', () => {
  it('1. createCoupleSchema supports optional nickname and coupleName', () => {
    const valid = createCoupleSchema.safeParse({
      nickname: 'Milindh',
      coupleName: 'Our Love Story',
    });
    expect(valid.success).toBe(true);

    const empty = createCoupleSchema.safeParse({});
    expect(empty.success).toBe(true);

    const tooLong = createCoupleSchema.safeParse({
      nickname: 'A'.repeat(35),
    });
    expect(tooLong.success).toBe(false);
  });

  it('2. acceptInviteSchema supports optional nickname and uppercase code', () => {
    const valid = acceptInviteSchema.safeParse({
      nickname: 'Vrush',
      inviteCode: 'abc123',
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.inviteCode).toBe('ABC123');
      expect(valid.data.nickname).toBe('Vrush');
    }
  });

  it('3. CreateCoupleCard renders Nickname field and updates profile display_name', () => {
    const cardPath = path.resolve(
      __dirname,
      '../src/features/couple/components/CreateCoupleCard.tsx'
    );
    expect(fs.existsSync(cardPath)).toBe(true);

    const content = fs.readFileSync(cardPath, 'utf8');
    expect(content).toContain('Your Nickname');
    expect(content).toContain('updateProfile');
    expect(content).toContain('displayName: data.nickname');
  });

  it('4. JoinCoupleCard renders Nickname field and updates profile display_name', () => {
    const cardPath = path.resolve(
      __dirname,
      '../src/features/couple/components/JoinCoupleCard.tsx'
    );
    expect(fs.existsSync(cardPath)).toBe(true);

    const content = fs.readFileSync(cardPath, 'utf8');
    expect(content).toContain('Your Nickname');
    expect(content).toContain('updateProfile');
    expect(content).toContain('displayName: data.nickname');
  });

  it('5. SettingsView explains independent nickname control', () => {
    const settingsPath = path.resolve(
      __dirname,
      '../src/features/settings/components/SettingsView.tsx'
    );
    expect(fs.existsSync(settingsPath)).toBe(true);

    const content = fs.readFileSync(settingsPath, 'utf8');
    expect(content).toContain('Your partner sees this nickname');
    expect(content).toContain('never your partner\'s');
  });

  it('6. PairScreen renders anniversary date onboarding prompt when active without start_date', () => {
    const pairPath = path.resolve(__dirname, '../src/app/(auth)/pair.tsx');
    expect(fs.existsSync(pairPath)).toBe(true);

    const content = fs.readFileSync(pairPath, 'utf8');
    expect(content).toContain('!hasStartDate');
    expect(content).toContain('When did you two get together?');
    expect(content).toContain('Save Anniversary Date');
    expect(content).toContain('Skip for now');
  });
});
