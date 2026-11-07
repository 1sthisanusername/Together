-- pgTAP Database Policy and Function Tests
-- Run with: supabase test db

BEGIN;
SELECT plan(8);

-- 1. Test tables exist
SELECT has_table('public', 'profiles', 'public.profiles table should exist');
SELECT has_table('public', 'couples', 'public.couples table should exist');
SELECT has_table('public', 'couple_members', 'public.couple_members table should exist');
SELECT has_table('public', 'invitations', 'public.invitations table should exist');

-- 2. Test RLS is enabled on all tables
SELECT row_eq(
  $$ SELECT relrowsecurity FROM pg_class WHERE relname = 'couples' $$,
  ROW(true),
  'RLS must be enabled on couples table'
);

SELECT row_eq(
  $$ SELECT relrowsecurity FROM pg_class WHERE relname = 'couple_members' $$,
  ROW(true),
  'RLS must be enabled on couple_members table'
);

-- 3. Test 2-member limit trigger: inserting a third member must fail
PREPARE insert_third_member AS
INSERT INTO public.couple_members (couple_id, user_id, role, status)
VALUES ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'partner', 'active');

DO $$
BEGIN
  -- Setup dummy couple and 2 active members
  INSERT INTO public.couples (id, name) VALUES ('11111111-1111-1111-1111-111111111111', 'Test Couple');
  INSERT INTO public.profiles (id, display_name) VALUES 
    ('11111111-1111-1111-1111-111111111111', 'User 1'),
    ('22222222-2222-2222-2222-222222222222', 'User 2'),
    ('33333333-3333-3333-3333-333333333333', 'User 3');

  INSERT INTO public.couple_members (couple_id, user_id, role, status) VALUES 
    ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'creator', 'active'),
    ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'partner', 'active');
END $$;

SELECT throws_ok(
  'insert_third_member',
  'check_violation',
  NULL,
  'Cannot add a 3rd active member to a couple'
);

-- 4. Test RLS Isolation: user in couple A cannot select couple B
-- Set current auth.uid() to User 1
SELECT set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
SELECT set_config('role', 'authenticated', true);

-- Create second couple for user 4
DO $$
BEGIN
  INSERT INTO public.couples (id, name) VALUES ('22222222-2222-2222-2222-222222222222', 'Other Couple');
  INSERT INTO public.profiles (id, display_name) VALUES ('44444444-4444-4444-4444-444444444444', 'User 4');
  INSERT INTO public.couple_members (couple_id, user_id, role, status) VALUES 
    ('22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'creator', 'active');
END $$;

SELECT results_eq(
  $$ SELECT id FROM public.couples WHERE id = '22222222-2222-2222-2222-222222222222' $$,
  $$ SELECT NULL::uuid WHERE false $$,
  'User 1 cannot read couple data of User 4 (RLS)'
);

SELECT * FROM finish();
ROLLBACK;

