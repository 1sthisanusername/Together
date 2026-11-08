-- ==============================================================================
-- SECURITY HARDENING MIGRATION
-- Audit Fixes for Together Long-Distance Couples Application
-- File: supabase/security_hardening_audit.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- FIX 1 (CRITICAL): Enforce partner answer secrecy directly in Postgres RLS
-- Partner's answer cannot be read until both partners have answered (enforced in DB)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "events_couple_select" ON public.session_events;
CREATE POLICY "events_couple_select" ON public.session_events
  FOR SELECT TO authenticated
  USING (
    couple_id = public.get_active_couple_id(auth.uid()) AND (
      -- 1. Caller can always read their own events
      user_id = auth.uid()
      OR
      -- 2. Non-answer events (status, readiness, reactions) are readable by partner
      type <> 'answer_submitted'
      OR
      -- 3. Partner's answer is strictly hidden until caller has submitted an answer for that round
      EXISTS (
        SELECT 1 FROM public.session_events my_event
        WHERE my_event.session_id = session_events.session_id
          AND my_event.user_id = auth.uid()
          AND my_event.type = 'answer_submitted'
          AND (my_event.payload->>'round')::text = (session_events.payload->>'round')::text
      )
    )
  );

-- ------------------------------------------------------------------------------
-- FIX 2 (HIGH): Max 2 active members hard enforcement trigger on couple_members
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_couple_max_two_members()
RETURNS TRIGGER AS $$
DECLARE
  v_current_count INT;
BEGIN
  IF NEW.status = 'active' THEN
    SELECT COUNT(*) INTO v_current_count
    FROM public.couple_members
    WHERE couple_id = NEW.couple_id
      AND status = 'active'
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    IF v_current_count >= 2 THEN
      RAISE EXCEPTION 'A couple cannot have more than two active members'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_enforce_couple_max_two_members ON public.couple_members;
CREATE TRIGGER trg_enforce_couple_max_two_members
  BEFORE INSERT OR UPDATE ON public.couple_members
  FOR EACH ROW
  EXECUTE FUNCTION public.check_couple_max_two_members();

-- ------------------------------------------------------------------------------
-- FIX 3 (HIGH): Remove couples_insert_authenticated (eliminate WITH CHECK true)
-- Couples must only be created through create_couple_with_invite() RPC
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "couples_insert_authenticated" ON public.couples;

-- ------------------------------------------------------------------------------
-- FIX 4 (HIGH): Harden get_active_couple_id
-- Restrict caller to auth.uid() unless service_role, revoke execution from anon
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_active_couple_id(p_user_id UUID DEFAULT auth.uid())
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_user UUID;
  v_couple_id UUID;
BEGIN
  -- If caller is not service_role, they can only query their own couple_id
  IF auth.role() <> 'service_role' THEN
    v_target_user := auth.uid();
  ELSE
    v_target_user := COALESCE(p_user_id, auth.uid());
  END IF;

  IF v_target_user IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT couple_id INTO v_couple_id
  FROM public.couple_members
  WHERE user_id = v_target_user AND status = 'active'
  LIMIT 1;

  RETURN v_couple_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_active_couple_id(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_active_couple_id(UUID) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- FIX 6 (MEDIUM): Restrict letters_couple_update
-- Only sender can update letter content/drafts. Recipients open via open_letter()
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "letters_couple_update" ON public.letters;
CREATE POLICY "letters_couple_update" ON public.letters
  FOR UPDATE TO authenticated
  USING (
    sender_id = auth.uid() AND
    couple_id = public.get_active_couple_id(auth.uid())
  )
  WITH CHECK (
    sender_id = auth.uid() AND
    couple_id = public.get_active_couple_id(auth.uid())
  );

-- ------------------------------------------------------------------------------
-- FIX 7 (MEDIUM): Clean up storage objects when last account deletes couple
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_couple_id UUID;
  v_remaining_members INT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- 1. Find active couple
  SELECT couple_id INTO v_couple_id
  FROM public.couple_members
  WHERE user_id = v_user_id AND status = 'active';

  -- 2. Delete user's notifications and settings
  DELETE FROM public.notifications WHERE recipient_id = v_user_id;
  DELETE FROM public.user_settings WHERE user_id = v_user_id;

  -- 3. If in a couple, check if partner remains
  IF v_couple_id IS NOT NULL THEN
    DELETE FROM public.couple_members WHERE user_id = v_user_id AND couple_id = v_couple_id;

    SELECT COUNT(*) INTO v_remaining_members
    FROM public.couple_members
    WHERE couple_id = v_couple_id AND status = 'active';

    -- If no active members remain, purge couple and all its storage media
    IF v_remaining_members = 0 THEN
      -- Delete storage objects for this couple
      DELETE FROM storage.objects 
      WHERE bucket_id = 'couples-media' 
        AND (storage.foldername(name))[1] = v_couple_id::text;

      DELETE FROM public.couples WHERE id = v_couple_id;
    END IF;
  END IF;

  -- 4. Delete user profile
  DELETE FROM public.profiles WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'user_id', v_user_id,
    'status', 'deleted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- FIX 9 (LOW): Cryptographically secure invite code generation
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  bytes BYTEA;
  i INT;
  val INT;
BEGIN
  -- 6 cryptographically random bytes using pgcrypto gen_random_bytes
  bytes := extensions.gen_random_bytes(6);
  FOR i IN 0..5 LOOP
    val := get_byte(bytes, i);
    result := result || substr(chars, (val % length(chars)) + 1, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
