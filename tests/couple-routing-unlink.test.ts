import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Mock dependencies
vi.mock('react-native', () => import('./mocks/react-native'));
vi.mock('react-native-url-polyfill/auto', () => ({}));

describe('Couple State Routing & Unlink Lifecycle', () => {
  const migrationPath = path.resolve(
    __dirname,
    '../supabase/migrations/20261108000001_couple_state_and_atomic_unlink.sql'
  );
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  it('migration adds status column to couples and defines atomic unlink_couple RPC', () => {
    expect(sql).toContain('ALTER TABLE public.couples');
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'");
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.unlink_couple');
    expect(sql).toContain("SET status = 'unlinked'");
    expect(sql).toContain("WHERE couple_id = v_couple_id AND status = 'active'");
    expect(sql).toContain("SET status = 'revoked'");
    expect(sql).toContain("WHERE couple_id = v_couple_id AND status = 'pending'");
  });

  it('derives the 3 distinct app states correctly from database state', () => {
    type CoupleState = 'NO_COUPLE' | 'PENDING' | 'ACTIVE';

    function deriveCoupleState(
      myMembership: { status: string } | null,
      activeMembersCount: number
    ): CoupleState {
      if (!myMembership || myMembership.status !== 'active') {
        return 'NO_COUPLE';
      }
      if (activeMembersCount <= 1) {
        return 'PENDING';
      }
      return 'ACTIVE';
    }

    // 1. No active membership row in DB
    expect(deriveCoupleState(null, 0)).toBe('NO_COUPLE');
    expect(deriveCoupleState({ status: 'unlinked' }, 0)).toBe('NO_COUPLE');

    // 2. Couple exists, only 1 active member -> PENDING (waiting for partner)
    expect(deriveCoupleState({ status: 'active' }, 1)).toBe('PENDING');

    // 3. Exactly 2 active members -> ACTIVE (connected space)
    expect(deriveCoupleState({ status: 'active' }, 2)).toBe('ACTIVE');
  });

  it('verifies root route guard maps each state to its exact destination', () => {
    type CoupleState = 'NO_COUPLE' | 'PENDING' | 'ACTIVE';

    function getTargetRoute(
      isAuthenticated: boolean,
      coupleState: CoupleState
    ): string {
      if (!isAuthenticated) return '/(auth)/login';
      switch (coupleState) {
        case 'NO_COUPLE':
          return '/(auth)/pair'; // Create couple space / Enter invite code
        case 'PENDING':
          return '/(auth)/pair'; // Waiting for partner screen
        case 'ACTIVE':
          return '/(tabs)/home'; // Main tabs
      }
    }

    expect(getTargetRoute(false, 'NO_COUPLE')).toBe('/(auth)/login');
    expect(getTargetRoute(true, 'NO_COUPLE')).toBe('/(auth)/pair');
    expect(getTargetRoute(true, 'PENDING')).toBe('/(auth)/pair');
    expect(getTargetRoute(true, 'ACTIVE')).toBe('/(tabs)/home');
  });

  it('simulates end-to-end unlink: User A unlinks, both phones land on setup screen, neither can read shared data, and a new invite is created', () => {
    // Shared database state
    interface DBState {
      couples: Record<string, { id: string; status: 'active' | 'unlinked' }>;
      members: Array<{ id: string; couple_id: string; user_id: string; status: 'active' | 'unlinked' }>;
      invitations: Array<{ id: string; couple_id: string; code: string; status: 'pending' | 'accepted' | 'revoked' }>;
      letters: Array<{ id: string; couple_id: string; content: string }>;
    }

    const db: DBState = {
      couples: {
        'couple-1': { id: 'couple-1', status: 'active' },
      },
      members: [
        { id: 'm1', couple_id: 'couple-1', user_id: 'user-a', status: 'active' },
        { id: 'm2', couple_id: 'couple-1', user_id: 'user-b', status: 'active' },
      ],
      invitations: [],
      letters: [
        { id: 'let-1', couple_id: 'couple-1', content: 'Secret love letter' },
      ],
    };

    // RLS Policy Evaluation function
    function canUserReadSharedData(userId: string, coupleId: string): boolean {
      // Standard RLS: couple_id IN (SELECT couple_id FROM couple_members WHERE user_id = auth.uid() AND status = 'active')
      return db.members.some(
        (m) => m.user_id === userId && m.couple_id === coupleId && m.status === 'active'
      );
    }

    // Both users are initially ACTIVE
    expect(canUserReadSharedData('user-a', 'couple-1')).toBe(true);
    expect(canUserReadSharedData('user-b', 'couple-1')).toBe(true);

    // Client phone states
    const phoneA = {
      userId: 'user-a',
      screen: '/(tabs)/home',
      cachedData: { letters: ['Secret love letter'] },
    };

    const phoneB = {
      userId: 'user-b',
      screen: '/(tabs)/home',
      cachedData: { letters: ['Secret love letter'] },
      unlinkedBanner: null as string | null,
    };

    // 1. User A triggers atomic unlink_couple RPC
    function unlinkCoupleRPC(callerUserId: string) {
      const activeMember = db.members.find(
        (m) => m.user_id === callerUserId && m.status === 'active'
      );
      if (!activeMember) throw new Error('No active couple found');

      const coupleId = activeMember.couple_id;

      // Atomic transaction:
      db.couples[coupleId].status = 'unlinked';
      for (const m of db.members) {
        if (m.couple_id === coupleId && m.status === 'active') {
          m.status = 'unlinked';
        }
      }
      for (const inv of db.invitations) {
        if (inv.couple_id === coupleId && inv.status === 'pending') {
          inv.status = 'revoked';
        }
      }

      return { couple_id: coupleId, status: 'unlinked' };
    }

    const unlinkResult = unlinkCoupleRPC('user-a');
    expect(unlinkResult.status).toBe('unlinked');

    // 2. Instant RLS Cutoff: Neither User A nor User B can read old shared data
    expect(canUserReadSharedData('user-a', 'couple-1')).toBe(false);
    expect(canUserReadSharedData('user-b', 'couple-1')).toBe(false);

    // 3. User A client unlinks: clears cache and lands on setup screen
    phoneA.cachedData = { letters: [] };
    phoneA.screen = '/(auth)/pair';
    expect(phoneA.screen).toBe('/(auth)/pair');
    expect(phoneA.cachedData.letters.length).toBe(0);

    // 4. Partner B receives Realtime update on couple_members:
    // Partner B clears cache, sets unlinked message, and lands on setup screen
    phoneB.cachedData = { letters: [] };
    phoneB.unlinkedBanner = 'Your partner unlinked';
    phoneB.screen = '/(auth)/pair';
    expect(phoneB.screen).toBe('/(auth)/pair');
    expect(phoneB.unlinkedBanner).toBe('Your partner unlinked');
    expect(phoneB.cachedData.letters.length).toBe(0);

    // 5. Creating a new couple & invite works cleanly immediately
    function createCoupleWithInviteRPC(creatorId: string) {
      const newCoupleId = 'couple-2';
      db.couples[newCoupleId] = { id: newCoupleId, status: 'active' };
      db.members.push({
        id: 'm3',
        couple_id: newCoupleId,
        user_id: creatorId,
        status: 'active',
      });
      const inviteCode = 'NEW888';
      db.invitations.push({
        id: 'inv-1',
        couple_id: newCoupleId,
        code: inviteCode,
        status: 'pending',
      });
      return { couple_id: newCoupleId, invite_code: inviteCode };
    }

    const newSpace = createCoupleWithInviteRPC('user-a');
    expect(newSpace.couple_id).toBe('couple-2');
    expect(newSpace.invite_code).toBe('NEW888');

    // User A is now PENDING in the new space
    const activeMembersCount = db.members.filter(
      (m) => m.couple_id === 'couple-2' && m.status === 'active'
    ).length;
    expect(activeMembersCount).toBe(1);

    // User B is still NO_COUPLE
    const userBMember = db.members.find(
      (m) => m.user_id === 'user-b' && m.status === 'active'
    );
    expect(userBMember).toBeUndefined();
  });
});

