-- ==============================================================================
-- TWO-ACCOUNT SQL VERIFICATION TEST FOR DAILY QUESTION ANSWERS
-- File: supabase/tests/database/daily_question_two_account_test.sql
--
-- Proves:
--   1. Partner B cannot read Partner A's answer before submitting their own answer.
--   2. Partner A can update their answer before Partner B submits.
--   3. After Partner B answers, both partners see both answers.
--   4. Partner A cannot update their answer after Partner B has answered.
--   5. Outsider C cannot read any answers.
--   6. User cannot insert for another user or for an unauthorized couple.
--
-- Run in Supabase SQL Editor. Wrapped in BEGIN ... ROLLBACK so it leaves no rows behind.
-- ==============================================================================

BEGIN;

DO $$
DECLARE
  v_user_a UUID := '11111111-1111-1111-1111-111111111111';
  v_user_b UUID := '22222222-2222-2222-2222-222222222222';
  v_user_c UUID := '33333333-3333-3333-3333-333333333333'; -- outsider
  v_couple_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_other_couple UUID := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  v_test_date DATE := CURRENT_DATE;
  v_count INT;
  v_err_caught BOOLEAN;
BEGIN
  -- 0. Ensure profiles, couples, and couple_members for testing
  INSERT INTO public.profiles (id, display_name, email)
  VALUES 
    (v_user_a, 'Partner A', 'partner_a@test.com'),
    (v_user_b, 'Partner B', 'partner_b@test.com'),
    (v_user_c, 'Outsider C', 'outsider_c@test.com')
  ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name;

  INSERT INTO public.couples (id, couple_name, status)
  VALUES 
    (v_couple_id, 'Test Couple AB', 'active'),
    (v_other_couple, 'Test Other Couple', 'active')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.couple_members (couple_id, user_id, role, status)
  VALUES 
    (v_couple_id, v_user_a, 'creator', 'active'),
    (v_couple_id, v_user_b, 'partner', 'active')
  ON CONFLICT (couple_id, user_id) DO UPDATE SET status = 'active';

  -- Clean any preexisting test row for today
  DELETE FROM public.daily_question_answers
  WHERE couple_id = v_couple_id AND question_date = v_test_date;

  -- ----------------------------------------------------------------------------
  -- TEST 1: Partner A inserts their answer
  -- ----------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', v_user_a::text, true);
  PERFORM set_config('role', 'authenticated', true);

  INSERT INTO public.daily_question_answers (couple_id, user_id, question_date, question_text, answer)
  VALUES (v_couple_id, v_user_a, v_test_date, 'Where would we go?', 'Paris');

  -- Partner A reads: should see exactly 1 answer (their own)
  SELECT count(*) INTO v_count
  FROM public.daily_question_answers
  WHERE couple_id = v_couple_id AND question_date = v_test_date;

  IF v_count <> 1 THEN
    RAISE EXCEPTION 'TEST 1 FAILED: Partner A should see 1 row, got %', v_count;
  END IF;

  -- ----------------------------------------------------------------------------
  -- TEST 2: Partner A can edit their answer BEFORE Partner B answers
  -- ----------------------------------------------------------------------------
  UPDATE public.daily_question_answers
  SET answer = 'Rome'
  WHERE couple_id = v_couple_id AND question_date = v_test_date AND user_id = v_user_a;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count <> 1 THEN
    RAISE EXCEPTION 'TEST 2 FAILED: Partner A should be able to update before B answers, updated % rows', v_count;
  END IF;

  -- ----------------------------------------------------------------------------
  -- TEST 3: Partner B queries BEFORE answering -> MUST SEE 0 ROWS (Partner A's answer hidden)
  -- ----------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', v_user_b::text, true);

  SELECT count(*) INTO v_count
  FROM public.daily_question_answers
  WHERE couple_id = v_couple_id AND question_date = v_test_date;

  IF v_count <> 0 THEN
    RAISE EXCEPTION 'TEST 3 FAILED: Partner B saw % rows before answering! Partner secrecy violated.', v_count;
  END IF;

  -- ----------------------------------------------------------------------------
  -- TEST 4: Outsider C queries -> MUST SEE 0 ROWS
  -- ----------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', v_user_c::text, true);

  SELECT count(*) INTO v_count
  FROM public.daily_question_answers
  WHERE couple_id = v_couple_id AND question_date = v_test_date;

  IF v_count <> 0 THEN
    RAISE EXCEPTION 'TEST 4 FAILED: Outsider C saw % rows, should see 0', v_count;
  END IF;

  -- ----------------------------------------------------------------------------
  -- TEST 5: Malicious inserts: User A cannot insert for User B or another couple
  -- ----------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', v_user_a::text, true);
  
  v_err_caught := FALSE;
  BEGIN
    INSERT INTO public.daily_question_answers (couple_id, user_id, question_date, question_text, answer)
    VALUES (v_couple_id, v_user_b, v_test_date + INTERVAL '1 day', 'Q', 'Spoofed');
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := TRUE;
  END;
  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'TEST 5A FAILED: User A was able to insert an answer with user_id = User B';
  END IF;

  v_err_caught := FALSE;
  BEGIN
    INSERT INTO public.daily_question_answers (couple_id, user_id, question_date, question_text, answer)
    VALUES (v_other_couple, v_user_a, v_test_date + INTERVAL '1 day', 'Q', 'Unauthorized couple');
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := TRUE;
  END;
  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'TEST 5B FAILED: User A was able to insert for an unauthorized couple';
  END IF;

  -- ----------------------------------------------------------------------------
  -- TEST 6: Partner B answers -> NOW BOTH SEE BOTH
  -- ----------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', v_user_b::text, true);

  INSERT INTO public.daily_question_answers (couple_id, user_id, question_date, question_text, answer)
  VALUES (v_couple_id, v_user_b, v_test_date, 'Where would we go?', 'Tokyo');

  -- Partner B reads: should now see BOTH (2 rows)
  SELECT count(*) INTO v_count
  FROM public.daily_question_answers
  WHERE couple_id = v_couple_id AND question_date = v_test_date;

  IF v_count <> 2 THEN
    RAISE EXCEPTION 'TEST 6A FAILED: Partner B should see 2 rows now, saw %', v_count;
  END IF;

  -- Switch back to Partner A: should also see BOTH (2 rows)
  PERFORM set_config('request.jwt.claim.sub', v_user_a::text, true);

  SELECT count(*) INTO v_count
  FROM public.daily_question_answers
  WHERE couple_id = v_couple_id AND question_date = v_test_date;

  IF v_count <> 2 THEN
    RAISE EXCEPTION 'TEST 6B FAILED: Partner A should see 2 rows now, saw %', v_count;
  END IF;

  -- ----------------------------------------------------------------------------
  -- TEST 7: Partner A CANNOT edit answer AFTER Partner B has answered
  -- ----------------------------------------------------------------------------
  UPDATE public.daily_question_answers
  SET answer = 'Tokyo Too'
  WHERE couple_id = v_couple_id AND question_date = v_test_date AND user_id = v_user_a;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'TEST 7 FAILED: Partner A should NOT be able to update answer after Partner B answered, updated % rows', v_count;
  END IF;

  -- ----------------------------------------------------------------------------
  -- TEST 8: Outsider C still sees 0 rows
  -- ----------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', v_user_c::text, true);

  SELECT count(*) INTO v_count
  FROM public.daily_question_answers
  WHERE couple_id = v_couple_id AND question_date = v_test_date;

  IF v_count <> 0 THEN
    RAISE EXCEPTION 'TEST 8 FAILED: Outsider C saw % rows, should see 0', v_count;
  END IF;

  RAISE NOTICE 'SUCCESS: All 8 daily question answer privacy and security assertions passed!';
END $$;

ROLLBACK; -- Leaves no rows behind

