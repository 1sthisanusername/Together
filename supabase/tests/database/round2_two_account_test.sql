-- ==============================================================================
-- TWO-ACCOUNT SQL VERIFICATION TEST (Proves No Recursion + Partner Secrecy)
-- File: supabase/tests/database/round2_two_account_test.sql
-- Run in Supabase SQL Editor. Executes inside a transaction that automatically rolls back.
-- NOTICE: Never run this against your hosted database unless it rolls back.
-- ==============================================================================

BEGIN;

DO $$
DECLARE
  v_user_a UUID := '11111111-1111-1111-1111-111111111111';
  v_user_b UUID := '22222222-2222-2222-2222-222222222222';
  v_user_c UUID := '33333333-3333-3333-3333-333333333333'; -- outsider
  v_couple_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_activity_id TEXT := 'would-you-rather-cozy-morning';
  v_session_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  v_count INT;
BEGIN
  -- 1. Setup mock profiles
  INSERT INTO public.profiles (id, display_name, email)
  VALUES 
    (v_user_a, 'Partner A', 'partner_a@test.com'),
    (v_user_b, 'Partner B', 'partner_b@test.com'),
    (v_user_c, 'Outsider C', 'outsider_c@test.com')
  ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name;

  -- 2. Setup mock couple and memberships
  INSERT INTO public.couples (id, couple_name, status)
  VALUES (v_couple_id, 'Test Couple AB', 'active')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.couple_members (couple_id, user_id, role, status)
  VALUES 
    (v_couple_id, v_user_a, 'creator', 'active'),
    (v_couple_id, v_user_b, 'partner', 'active')
  ON CONFLICT (couple_id, user_id) DO UPDATE SET status = 'active';

  -- 3. Ensure test activity exists
  INSERT INTO public.activities (id, title, description, kind, category, mode, duration_minutes, icon, config)
  VALUES (v_activity_id, 'WYR Test', 'Test activity', 'would_you_rather', 'play', 'live', 5, 'heart', '{"questions":[]}'::jsonb)
  ON CONFLICT (id) DO NOTHING;

  -- 4. Setup mock session
  INSERT INTO public.activity_sessions (id, couple_id, activity_id, created_by, status, current_round)
  VALUES (v_session_id, v_couple_id, v_activity_id, v_user_a, 'active', 1)
  ON CONFLICT (id) DO NOTHING;

  -- ----------------------------------------------------------------------------
  -- TEST STEP A: Partner A inserts an answer for Round 1
  -- ----------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', v_user_a::text, true);
  PERFORM set_config('role', 'authenticated', true);

  -- Insert Partner A's event
  INSERT INTO public.session_events (session_id, couple_id, user_id, type, payload, idempotency_key)
  VALUES (
    v_session_id,
    v_couple_id,
    v_user_a,
    'answer_submitted',
    jsonb_build_object('round', '1', 'choice', 'Coffee in Bed'),
    'idem_test_a_round_1'
  );

  -- Verify Partner A CAN read their own answer without any recursion error
  SELECT count(*) INTO v_count
  FROM public.session_events
  WHERE session_id = v_session_id;

  IF v_count <> 1 THEN
    RAISE EXCEPTION 'TEST FAILED: Partner A should see their 1 event, saw %', v_count;
  END IF;

  -- ----------------------------------------------------------------------------
  -- TEST STEP B: Partner B queries BEFORE submitting their answer
  -- Partner A's answer MUST be hidden (0 events visible to B)
  -- ----------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', v_user_b::text, true);

  SELECT count(*) INTO v_count
  FROM public.session_events
  WHERE session_id = v_session_id;

  IF v_count <> 0 THEN
    RAISE EXCEPTION 'TEST FAILED: Partner B should NOT see Partner A answer yet, saw %', v_count;
  END IF;

  -- ----------------------------------------------------------------------------
  -- TEST STEP C: Outsider C queries
  -- Outsider MUST see 0 events
  -- ----------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', v_user_c::text, true);

  SELECT count(*) INTO v_count
  FROM public.session_events
  WHERE session_id = v_session_id;

  IF v_count <> 0 THEN
    RAISE EXCEPTION 'TEST FAILED: Outsider C saw % events, should see 0', v_count;
  END IF;

  -- ----------------------------------------------------------------------------
  -- TEST STEP D: Partner B inserts their answer for Round 1
  -- ----------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', v_user_b::text, true);

  INSERT INTO public.session_events (session_id, couple_id, user_id, type, payload, idempotency_key)
  VALUES (
    v_session_id,
    v_couple_id,
    v_user_b,
    'answer_submitted',
    jsonb_build_object('round', '1', 'choice', 'Breakfast in Diner'),
    'idem_test_b_round_1'
  );

  -- Now both have answered! Partner B MUST see BOTH events (2 events)
  SELECT count(*) INTO v_count
  FROM public.session_events
  WHERE session_id = v_session_id;

  IF v_count <> 2 THEN
    RAISE EXCEPTION 'TEST FAILED: Partner B should now see both 2 events, saw %', v_count;
  END IF;

  -- ----------------------------------------------------------------------------
  -- TEST STEP E: Switch back to Partner A
  -- Partner A MUST also see both 2 events without recursion
  -- ----------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', v_user_a::text, true);

  SELECT count(*) INTO v_count
  FROM public.session_events
  WHERE session_id = v_session_id;

  IF v_count <> 2 THEN
    RAISE EXCEPTION 'TEST FAILED: Partner A should see both 2 events, saw %', v_count;
  END IF;

  -- ----------------------------------------------------------------------------
  -- TEST STEP F: Outsider C still sees 0 events
  -- ----------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', v_user_c::text, true);

  SELECT count(*) INTO v_count
  FROM public.session_events
  WHERE session_id = v_session_id;

  IF v_count <> 0 THEN
    RAISE EXCEPTION 'TEST FAILED: Outsider C should still see 0 events, saw %', v_count;
  END IF;

  RAISE NOTICE 'SUCCESS: All RLS security assertions passed without recursion error!';
END $$;

ROLLBACK; -- Safe rollback cleans up all test records

