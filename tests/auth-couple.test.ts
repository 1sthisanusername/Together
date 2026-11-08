import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Mock dependencies
vi.mock('react-native', () => import('./mocks/react-native'));
vi.mock('react-native-url-polyfill/auto', () => ({}));
vi.mock('expo-secure-store', () => import('./mocks/expo-secure-store'));
vi.mock('@react-native-google-signin/google-signin', () => import('./mocks/google-signin'));

import { acceptInviteSchema, createCoupleSchema } from '../src/features/couple/schemas';
import { useAuthStore } from '../src/features/auth/hooks/useAuth';
import { supabase } from '../src/services/supabase';

describe('Google-Only Auth Architecture', () => {
  it('useAuthStore has signInWithGoogle and signOut', () => {
    const state = useAuthStore.getState();
    expect(typeof state.signInWithGoogle).toBe('function');
    expect(typeof state.signOut).toBe('function');
  });

  it('signInWithGoogle signs in and sets authenticated session', async () => {
    vi.spyOn(supabase.auth, 'signInWithIdToken').mockResolvedValueOnce({
      data: {
        session: { access_token: 'fake-jwt', user: { id: 'u1', email: 'test@gmail.com' } } as any,
        user: { id: 'u1', email: 'test@gmail.com' } as any,
      },
      error: null,
    });
    vi.spyOn(useAuthStore.getState(), 'fetchProfile').mockResolvedValue(null);

    const { signInWithGoogle } = useAuthStore.getState();
    const result = await signInWithGoogle();

    expect(result.error).toBeNull();
    const state = useAuthStore.getState();
    expect(state.session).toBeDefined();
    expect(state.user).toBeDefined();
  });

  it('signOut clears local session, user, and profile', async () => {
    const { signOut } = useAuthStore.getState();
    await signOut();

    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.user).toBeNull();
    expect(state.profile).toBeNull();
  });
});

describe('Couple & Invitation Validation Schemas', () => {
  it('enforces exact 6-character uppercase invite code', () => {
    const parsed = acceptInviteSchema.parse({ inviteCode: '  ab12cd  ' });
    expect(parsed.inviteCode).toBe('AB12CD');
  });

  it('rejects invite codes shorter or longer than 6 characters', () => {
    expect(() => acceptInviteSchema.parse({ inviteCode: 'ABC' })).toThrow(/6 characters/);
    expect(() => acceptInviteSchema.parse({ inviteCode: 'ABCDEFG' })).toThrow(/6 characters/);
  });

  it('validates create couple schema', () => {
    const parsed = createCoupleSchema.parse({ coupleName: 'Us' });
    expect(parsed.coupleName).toBe('Us');
  });
});

describe('Database Migration & RLS Policy Integrity', () => {
  const migrationPath = path.resolve(__dirname, '../supabase/migrations/20261107000000_init_auth_couple.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

  it('contains profiles, couples, couple_members, invitations tables', () => {
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS public.profiles');
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS public.couples');
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS public.couple_members');
    expect(migrationSql).toContain('CREATE TABLE IF NOT EXISTS public.invitations');
  });

  it('enables Row Level Security on all private tables', () => {
    expect(migrationSql).toContain('ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY');
    expect(migrationSql).toContain('ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY');
    expect(migrationSql).toContain('ALTER TABLE public.couple_members ENABLE ROW LEVEL SECURITY');
    expect(migrationSql).toContain('ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY');
  });

  it('contains the trigger preventing a 3rd active member', () => {
    expect(migrationSql).toContain('check_couple_member_limit');
    expect(migrationSql).toContain('active_count >= 2');
    expect(migrationSql).toContain('already has maximum allowed active members');
  });

  it('contains transactional RPC for atomic couple creation and invite code generation', () => {
    expect(migrationSql).toContain('CREATE OR REPLACE FUNCTION public.create_couple_with_invite');
    expect(migrationSql).toContain('public.generate_invite_code');
  });

  it('contains transactional RPC for atomic invite acceptance with validations', () => {
    expect(migrationSql).toContain('CREATE OR REPLACE FUNCTION public.accept_invitation');
    expect(migrationSql).toContain('Cannot accept your own invitation');
    expect(migrationSql).toContain('v_active_count >= 2');
  });

  it('contains unlink_couple RPC for clean partner separation', () => {
    expect(migrationSql).toContain('CREATE OR REPLACE FUNCTION public.unlink_couple');
  });
});
