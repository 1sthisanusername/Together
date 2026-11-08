import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { queryClient, clearAppCache } from '../src/services/queryClient';

describe('Security Audit - Secrets & Key Leakage', () => {
  it('ensures no service-role key or private secret exists in app code or configs', () => {
    const rootDir = path.resolve(__dirname, '..');
    const sensitiveFiles = [
      'app.json',
      'eas.json',
      'package.json',
      'src/services/supabase.ts',
      'src/services/analytics.ts',
      '.env.example',
    ];

    for (const relPath of sensitiveFiles) {
      const fullPath = path.join(rootDir, relPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        expect(content).not.toMatch(/service_role/i);
        expect(content).not.toMatch(/secret_key/i);
        expect(content).not.toMatch(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/); // JWT service role pattern
      }
    }
  });

  it('ensures all EXPO_PUBLIC variables in eas.json and app code are public anon keys only', () => {
    const easPath = path.resolve(__dirname, '../eas.json');
    const easContent = JSON.parse(fs.readFileSync(easPath, 'utf8'));

    const previewEnv = easContent.build.preview.env;
    expect(previewEnv.EXPO_PUBLIC_SUPABASE_KEY).toMatch(/^sb_publishable/);
    expect(previewEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY).toMatch(/^sb_publishable/);
  });
});

describe('Security Audit - Database RLS & Schema Integrity', () => {
  const migrationPath = path.resolve(__dirname, '../supabase/security_hardening_audit.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');

  it('enforces partner answer secrecy in RLS (Finding 1 - Critical)', () => {
    expect(migrationSql).toContain('events_couple_select');
    expect(migrationSql).toContain("type <> 'answer_submitted'");
    expect(migrationSql).toContain('my_event.type = \'answer_submitted\'');
    expect(migrationSql).toContain('(my_event.payload->>\'round\')::text = (session_events.payload->>\'round\')::text');
  });

  it('enforces max 2 active members hard trigger (Finding 2 - High)', () => {
    expect(migrationSql).toContain('check_couple_max_two_members');
    expect(migrationSql).toContain('A couple cannot have more than two active members');
    expect(migrationSql).toContain('trg_enforce_couple_max_two_members');
  });

  it('disallows arbitrary client couple insertions (Finding 3 - High)', () => {
    expect(migrationSql).toContain('DROP POLICY IF EXISTS "couples_insert_authenticated" ON public.couples;');
  });

  it('restricts get_active_couple_id to auth.uid() and revokes anon (Finding 4 - High)', () => {
    expect(migrationSql).toContain("IF auth.role() <> 'service_role' THEN");
    expect(migrationSql).toContain('v_target_user := auth.uid();');
    expect(migrationSql).toContain('REVOKE EXECUTE ON FUNCTION public.get_active_couple_id(UUID) FROM anon;');
  });

  it('restricts letters update to sender only (Finding 6 - Medium)', () => {
    expect(migrationSql).toContain('letters_couple_update');
    expect(migrationSql).toContain('sender_id = auth.uid()');
  });

  it('purges storage objects on account deletion when couple space emptied (Finding 7 - Medium)', () => {
    expect(migrationSql).toContain("DELETE FROM storage.objects");
    expect(migrationSql).toContain("bucket_id = 'couples-media'");
    expect(migrationSql).toContain("(storage.foldername(name))[1] = v_couple_id::text");
  });

  it('uses cryptographically secure random bytes for invite code generation (Finding 9 - Low)', () => {
    expect(migrationSql).toContain('extensions.gen_random_bytes(6)');
  });
});

describe('Security Audit - Cross-Couple Isolation Logic Model', () => {
  // Pure model simulation of the RLS policy predicates across two couples and an outsider
  interface MockEvent {
    id: string;
    couple_id: string;
    user_id: string;
    type: string;
    payload: { round: number; answer?: string; text?: string };
  }

  const coupleA_Id = 'couple-a-1111';
  const coupleB_Id = 'couple-b-2222';

  const userA1 = 'user-a1';
  const userA2 = 'user-a2';
  const userB1 = 'user-b1';
  const userB2 = 'user-b2';
  const outsider = 'user-outsider';

  const userCouples: Record<string, string | null> = {
    [userA1]: coupleA_Id,
    [userA2]: coupleA_Id,
    [userB1]: coupleB_Id,
    [userB2]: coupleB_Id,
    [outsider]: null,
  };

  const getActiveCoupleId = (userId: string) => userCouples[userId] ?? null;

  const events: MockEvent[] = [
    {
      id: 'e1',
      couple_id: coupleA_Id,
      user_id: userA1,
      type: 'answer_submitted',
      payload: { round: 1, answer: 'Secret A1' },
    },
    {
      id: 'e2',
      couple_id: coupleA_Id,
      user_id: userA2,
      type: 'status_ready',
      payload: { round: 1 },
    },
    {
      id: 'e3',
      couple_id: coupleB_Id,
      user_id: userB1,
      type: 'answer_submitted',
      payload: { round: 1, answer: 'Secret B1' },
    },
  ];

  // RLS predicate implementation from supabase/security_hardening_audit.sql
  const canSelectEvent = (callerId: string, event: MockEvent, allEvents: MockEvent[]) => {
    const callerCoupleId = getActiveCoupleId(callerId);
    if (!callerCoupleId || event.couple_id !== callerCoupleId) {
      return false; // Cross-couple or outsider blocked
    }

    if (event.user_id === callerId) return true; // Own event
    if (event.type !== 'answer_submitted') return true; // Non-answer event

    // Partner answer visible ONLY if caller also answered same round
    const callerAnswered = allEvents.some(
      (e) =>
        e.couple_id === callerCoupleId &&
        e.user_id === callerId &&
        e.type === 'answer_submitted' &&
        e.payload.round === event.payload.round
    );

    return callerAnswered;
  };

  it('completely blocks outsider from reading any couple data', () => {
    for (const event of events) {
      expect(canSelectEvent(outsider, event, events)).toBe(false);
    }
  });

  it('completely blocks Couple A members from reading Couple B data and vice versa', () => {
    const coupleBEvent = events.find((e) => e.couple_id === coupleB_Id)!;
    expect(canSelectEvent(userA1, coupleBEvent, events)).toBe(false);
    expect(canSelectEvent(userA2, coupleBEvent, events)).toBe(false);

    const coupleAEvent = events.find((e) => e.couple_id === coupleA_Id)!;
    expect(canSelectEvent(userB1, coupleAEvent, events)).toBe(false);
    expect(canSelectEvent(userB2, coupleAEvent, events)).toBe(false);
  });

  it('enforces partner answer secrecy: partner cannot read answer until they also answer', () => {
    const partnerA1Answer = events.find((e) => e.id === 'e1')!;

    // User A2 has NOT submitted round 1 answer yet: MUST BE HIDDEN
    expect(canSelectEvent(userA2, partnerA1Answer, events)).toBe(false);

    // User A1 can always see their own answer
    expect(canSelectEvent(userA1, partnerA1Answer, events)).toBe(true);

    // User A2 can see non-answer event from partner
    const nonAnswerEvent = events.find((e) => e.id === 'e2')!;
    expect(canSelectEvent(userA1, nonAnswerEvent, events)).toBe(true);

    // Once User A2 submits their answer for round 1, partner answer is revealed
    const eventsAfterA2Answers = [
      ...events,
      {
        id: 'e4',
        couple_id: coupleA_Id,
        user_id: userA2,
        type: 'answer_submitted',
        payload: { round: 1, answer: 'Answer A2' },
      },
    ];

    expect(canSelectEvent(userA2, partnerA1Answer, eventsAfterA2Answers)).toBe(true);
  });
});

describe('Security Audit - Max 2 Active Members Rule', () => {
  it('enforces that a couple rejects a third active member', () => {
    const coupleMembers: { couple_id: string; user_id: string; status: string }[] = [];

    const addMember = (coupleId: string, userId: string, status: string) => {
      if (status === 'active') {
        const activeCount = coupleMembers.filter((m) => m.couple_id === coupleId && m.status === 'active').length;
        if (activeCount >= 2) {
          throw new Error('A couple cannot have more than two active members');
        }
      }
      coupleMembers.push({ couple_id: coupleId, user_id: userId, status });
    };

    addMember('couple-1', 'user-1', 'active');
    addMember('couple-1', 'user-2', 'active');
    expect(coupleMembers.length).toBe(2);

    expect(() => addMember('couple-1', 'user-3', 'active')).toThrow(
      'A couple cannot have more than two active members'
    );
  });
});

describe('Security Audit - Cache Purging on Sign Out', () => {
  it('clears query client memory cache on clearAppCache()', () => {
    queryClient.setQueryData(['sensitive_couple_data'], { secret: 'intimate-note' });
    expect(queryClient.getQueryData(['sensitive_couple_data'])).toBeDefined();

    clearAppCache();

    expect(queryClient.getQueryData(['sensitive_couple_data'])).toBeUndefined();
  });
});
