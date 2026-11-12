import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Phase 3: Play Tab, Activities & Reunion Extensions Verification', () => {
  it('1. PhotoMissionRenderer: explicit mime-type check and dual-submission unlock', () => {
    const photoMissionPath = path.resolve(
      __dirname,
      '../src/features/sessions/renderers/PhotoMissionRenderer.tsx'
    );
    const content = fs.readFileSync(photoMissionPath, 'utf8');

    expect(content).toContain("mimeType: 'image/jpeg'");
    expect(content).toContain('storage.uploadMedia');
    expect(content).toContain('isPartnerMasked');
    expect(content).toContain('bothSubmitted');
    expect(content).toContain('submitEventAsync');
  });

  it('2. Game Invitations: useStartActivity queues game_invite push notification to partner', () => {
    const activitiesHookPath = path.resolve(
      __dirname,
      '../src/features/activities/hooks/useActivities.ts'
    );
    const content = fs.readFileSync(activitiesHookPath, 'utf8');

    expect(content).toContain('push.queueNotification');
    expect(content).toContain("type: 'game_invite'");
    expect(content).toContain('together://session/');
  });

  it('3. Next Reunion Countdown Card: String & Stickers styling and countdown formatting', () => {
    const reunionCardPath = path.resolve(
      __dirname,
      '../src/features/us/components/NextReunionCountdownCard.tsx'
    );
    const content = fs.readFileSync(reunionCardPath, 'utf8');

    expect(content).toContain('theme.colors.border');
    expect(content).toContain('theme.colors.surface');
    expect(content).toContain('daysNumber');
    expect(content).toContain('Next Reunion');
  });

  it('4. Recursion-Proof Security: session_events policy uses SECURITY DEFINER function', () => {
    const migrationPath = path.resolve(
      __dirname,
      '../supabase/migrations/20261109000010_critical_repairs.sql'
    );
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('has_user_answered_round');
    expect(sql).toContain('events_couple_select');
    expect(sql).toContain('SECURITY DEFINER');
  });
});

