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

import { activityRegistry, getActivityRenderer } from '../src/features/activities/registry';

describe('Activity Registry & Configuration Schemas', () => {
  it('has all 7 MVP activity kinds registered', () => {
    const kinds = [
      'would_you_rather',
      'who_knows_whom',
      'guess_my_answer',
      'drawing_guess',
      'quiz',
      'photo_mission',
      'guided_date',
    ];

    for (const kind of kinds) {
      expect(activityRegistry[kind]).toBeDefined();
      expect(activityRegistry[kind].Component).toBeDefined();
      expect(activityRegistry[kind].configSchema).toBeDefined();
    }
  });

  it('validates would_you_rather config correctly', () => {
    const validConfig = {
      rounds: [
        {
          id: 1,
          question: 'Option A or B?',
          optionA: 'Stay home',
          optionB: 'Go out',
        },
      ],
    };

    const schema = activityRegistry.would_you_rather.configSchema;
    expect(() => schema.parse(validConfig)).not.toThrow();
  });

  it('validates guided_date steps config correctly', () => {
    const validDateConfig = {
      steps: [
        {
          id: 'step1',
          title: 'Preparation',
          duration_minutes: 5,
          description: 'Dim the lights and set your table.',
        },
      ],
    };

    const schema = activityRegistry.guided_date.configSchema;
    expect(() => schema.parse(validDateConfig)).not.toThrow();
  });

  it('falls back gracefully for unknown activity kinds', () => {
    const renderer = getActivityRenderer('unknown_future_game');
    expect(renderer).toBeDefined();
    expect(renderer.Component).toBeDefined();
  });
});

describe('MVP Database Schema & Migration Integrity', () => {
  const migrationPath = path.resolve(
    __dirname,
    '../supabase/migrations/20261107000001_complete_mvp_schema.sql'
  );
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  it('defines all required MVP tables', () => {
    const tables = [
      'media_files',
      'activities',
      'activity_sessions',
      'session_events',
      'letters',
      'messages',
      'memories',
      'bucket_items',
      'important_dates',
      'notifications',
      'user_settings',
    ];

    for (const table of tables) {
      expect(sql).toContain(`CREATE TABLE IF NOT EXISTS public.${table}`);
    }
  });

  it('enables Row Level Security on all tables', () => {
    const tables = [
      'media_files',
      'activities',
      'activity_sessions',
      'session_events',
      'letters',
      'messages',
      'memories',
      'bucket_items',
      'important_dates',
      'notifications',
      'user_settings',
    ];

    for (const table of tables) {
      expect(sql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
    }
  });

  it('contains idempotency unique constraint on session_events', () => {
    expect(sql).toContain('idx_session_events_idempotency');
    expect(sql).toContain('public.session_events(session_id, idempotency_key)');
  });

  it('implements server-enforced blind answer reveal (get_session_events_masked)', () => {
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.get_session_events_masked');
    expect(sql).toContain('jsonb_build_object');
    expect(sql).toContain("'masked', true");
  });

  it('implements server-side letter unlock validation (open_letter)', () => {
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.open_letter');
    expect(sql).toContain('Letter is locked until');
  });
});

describe('Seed Activities Integrity', () => {
  const seedPath = path.resolve(__dirname, '../supabase/seed/activities.sql');
  const seedSql = fs.readFileSync(seedPath, 'utf-8');

  it('contains seeded activities across all categories', () => {
    expect(seedSql).toContain('wyr-cozy-vs-wild');
    expect(seedSql).toContain('who-knows-daily-habits');
    expect(seedSql).toContain('guess-my-favorite-things');
    expect(seedSql).toContain('drawing-classic-love');
    expect(seedSql).toContain('quiz-love-languages');
    expect(seedSql).toContain('guided-date-candlelit-dinner');
    expect(seedSql).toContain('photo-mission-daily-view');
  });
});
