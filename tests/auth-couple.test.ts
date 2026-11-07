import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { signUpSchema, loginSchema, resetPasswordSchema } from '../src/features/auth/schemas';
import { acceptInviteSchema, createCoupleSchema } from '../src/features/couple/schemas';

describe('Auth Validation Schemas', () => {
  it('validates a correct sign up payload', () => {
    const valid = {
      email: 'alex@example.com',
      password: 'password123',
      displayName: 'Alex',
    };
    const parsed = signUpSchema.parse(valid);
    expect(parsed.email).toBe('alex@example.com');
    expect(parsed.displayName).toBe('Alex');
  });

  it('rejects short passwords (< 8 chars)', () => {
    const invalid = {
      email: 'alex@example.com',
      password: 'short',
      displayName: 'Alex',
    };
    expect(() => signUpSchema.parse(invalid)).toThrow(/at least 8 characters/);
  });

  it('rejects invalid emails', () => {
    const invalid = {
      email: 'not-an-email',
      password: 'password123',
      displayName: 'Alex',
    };
    expect(() => signUpSchema.parse(invalid)).toThrow(/valid email/);
  });

  it('validates login input', () => {
    expect(() => loginSchema.parse({ email: 'valid@example.com', password: 'secret' })).not.toThrow();
    expect(() => loginSchema.parse({ email: 'invalid', password: 'secret' })).toThrow();
  });

  it('validates reset password input', () => {
    expect(() => resetPasswordSchema.parse({ email: 'valid@example.com' })).not.toThrow();
    expect(() => resetPasswordSchema.parse({ email: '' })).toThrow();
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
