import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Mock dependencies
vi.mock('react-native', () => import('./mocks/react-native'));
vi.mock('react-native-url-polyfill/auto', () => ({}));

describe('Server-Authoritative Rounds', () => {
  const sqlPath = path.resolve(__dirname, '../supabase/server_rounds_and_push.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  it('migration contains current_round column on activity_sessions table', () => {
    expect(sql).toContain('ALTER TABLE public.activity_sessions');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS current_round INT NOT NULL DEFAULT 1');
  });

  it('migration contains advance_round RPC with concurrency protection and event insertion', () => {
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.advance_round');
    expect(sql).toContain('p_session_id UUID');
    expect(sql).toContain('p_expected_round INT');
    expect(sql).toContain('FOR UPDATE');
    expect(sql).toContain('IF v_session.current_round <> p_expected_round THEN');
    expect(sql).toContain('INSERT INTO public.session_events');
    expect(sql).toContain("'round_advanced'");
  });

  it('simulates two users in a game session: User A taps Next, both advance, double tap is rejected', () => {
    // Session state on database
    interface SessionState {
      id: string;
      couple_id: string;
      current_round: number;
      events: Array<{ type: string; payload: any; user_id: string }>;
    }

    const session: SessionState = {
      id: 'session-123',
      couple_id: 'couple-456',
      current_round: 1,
      events: [],
    };

    const userA = { id: 'user-a', name: 'Alice' };
    const userB = { id: 'user-b', name: 'Bob' };

    // Function simulating Postgres advance_round RPC
    function advanceRoundRPC(callerId: string, callerName: string, expectedRound: number) {
      // Row lock simulation & concurrency check
      if (session.current_round !== expectedRound) {
        return {
          session_id: session.id,
          current_round: session.current_round,
          advanced: false,
          message: 'Round was already advanced',
        };
      }

      const nextRound = session.current_round + 1;
      session.current_round = nextRound;
      session.events.push({
        type: 'round_advanced',
        user_id: callerId,
        payload: {
          from_round: expectedRound,
          to_round: nextRound,
          by_user_id: callerId,
          by_name: callerName,
        },
      });

      return {
        session_id: session.id,
        current_round: nextRound,
        advanced: true,
        by_name: callerName,
      };
    }

    // Both users start at round 1 derived from session.current_round
    let clientARound = session.current_round;
    let clientBRound = session.current_round;
    expect(clientARound).toBe(1);
    expect(clientBRound).toBe(1);

    // 1. User A taps Next (expectedRound: 1)
    const resultA = advanceRoundRPC(userA.id, userA.name, clientARound);
    expect(resultA.advanced).toBe(true);
    expect(resultA.current_round).toBe(2);
    expect(resultA.by_name).toBe('Alice');

    // 2. Both clients receive Realtime update and sync to session.current_round
    clientARound = session.current_round;
    clientBRound = session.current_round;
    expect(clientARound).toBe(2);
    expect(clientBRound).toBe(2);

    // Check banner event exists
    const latestEvent = session.events[session.events.length - 1];
    expect(latestEvent.type).toBe('round_advanced');
    const bannerText = `${latestEvent.payload.by_name} moved to round ${latestEvent.payload.to_round}`;
    expect(bannerText).toBe('Alice moved to round 2');

    // 3. User B simultaneously tapped Next with stale expected_round = 1 (double tap race)
    const resultBStale = advanceRoundRPC(userB.id, userB.name, 1);
    expect(resultBStale.advanced).toBe(false);
    expect(resultBStale.message).toBe('Round was already advanced');
    // Session round remains exactly 2 (did NOT skip to round 3)
    expect(session.current_round).toBe(2);
  });
});

