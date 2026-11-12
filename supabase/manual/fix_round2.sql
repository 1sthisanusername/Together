-- ==============================================================================
-- FIX ROUND 2: Comprehensive Database Repair Script (Idempotent)
-- File: supabase/manual/fix_round2.sql
--
-- Fixes:
-- 1. Eliminates infinite recursion in session_events RLS policies via SECURITY DEFINER helpers
-- 2. Enforces mutual concealment for both 'answer_submitted' and 'photo_submitted'
-- 3. Guards and configures the supabase_realtime publication with all core tables + REPLICA IDENTITY FULL
-- 4. Creates atomic delete_memory(p_memory_id) RPC for clean database & storage object deletion
-- 5. Implements expire_stale_sessions() with safe pg_cron scheduling every 5 minutes
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SECURITY DEFINER HELPER FUNCTIONS (search_path = public, STABLE)
-- ------------------------------------------------------------------------------

-- Helper A: Check if a user is an active member of a couple
CREATE OR REPLACE FUNCTION public.is_couple_member(
  p_couple_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.couple_members
    WHERE couple_id = p_couple_id
      AND user_id = p_user_id
      AND status = 'active'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_couple_member(UUID, UUID) TO authenticated, service_role;

-- Helper B: Resolve the couple_id for a given activity session safely
CREATE OR REPLACE FUNCTION public.session_couple_id(p_session_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT couple_id FROM public.activity_sessions WHERE id = p_session_id LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.session_couple_id(UUID) TO authenticated, service_role;

-- Helper C: Check if both partners in the session have submitted their answer/photo for a given round
-- Operates under SECURITY DEFINER so that internal queries to session_events never trigger RLS recursion.
CREATE OR REPLACE FUNCTION public.both_answered(
  p_session_id UUID,
  p_round TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_couple_id UUID;
  v_partner_a UUID;
  v_partner_b UUID;
  v_a_has_submitted BOOLEAN := FALSE;
  v_b_has_submitted BOOLEAN := FALSE;
BEGIN
  -- Resolve session couple
  SELECT couple_id INTO v_couple_id
  FROM public.activity_sessions
  WHERE id = p_session_id;

  IF v_couple_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Caller must be an active member of this session's couple
  IF NOT public.is_couple_member(v_couple_id, auth.uid()) THEN
    RETURN FALSE;
  END IF;

  -- Identify both active partners
  SELECT
    min(user_id)::uuid,
    max(user_id)::uuid
  INTO v_partner_a, v_partner_b
  FROM public.couple_members
  WHERE couple_id = v_couple_id AND status = 'active';

  -- If couple does not have two active partners, mutual reveal condition is not satisfied
  IF v_partner_a IS NULL OR v_partner_b IS NULL OR v_partner_a = v_partner_b THEN
    RETURN FALSE;
  END IF;

  -- Check if partner A submitted
  SELECT EXISTS (
    SELECT 1 FROM public.session_events
    WHERE session_id = p_session_id
      AND user_id = v_partner_a
      AND type IN ('answer_submitted', 'photo_submitted')
      AND (
        p_round IS NULL
        OR p_round = ''
        OR (payload->>'round')::text = p_round
      )
  ) INTO v_a_has_submitted;

  -- Check if partner B submitted
  SELECT EXISTS (
    SELECT 1 FROM public.session_events
    WHERE session_id = p_session_id
      AND user_id = v_partner_b
      AND type IN ('answer_submitted', 'photo_submitted')
      AND (
        p_round IS NULL
        OR p_round = ''
        OR (payload->>'round')::text = p_round
      )
  ) INTO v_b_has_submitted;

  RETURN (v_a_has_submitted AND v_b_has_submitted);
END;
$$;

GRANT EXECUTE ON FUNCTION public.both_answered(UUID, TEXT) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 2. REWRITE session_events RLS POLICIES (Zero direct selects on session_events)
-- ------------------------------------------------------------------------------

ALTER TABLE public.session_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_couple_select" ON public.session_events;
DROP POLICY IF EXISTS "events_couple_insert" ON public.session_events;
DROP POLICY IF EXISTS "session_events_select" ON public.session_events;
DROP POLICY IF EXISTS "session_events_insert" ON public.session_events;

-- SELECT Policy Rules:
-- 1. Caller must belong to the couple owning the session
-- 2. Caller's own events are ALWAYS visible
-- 3. Non-answer / non-photo events (e.g. stroke, round_advanced, reaction, status) are ALWAYS visible to the couple
-- 4. Partner's answer/photo events are visible ONLY when both partners have answered that round
CREATE POLICY "events_couple_select" ON public.session_events
  FOR SELECT TO authenticated
  USING (
    public.is_couple_member(couple_id, auth.uid())
    AND (
      user_id = auth.uid()
      OR
      type NOT IN ('answer_submitted', 'photo_submitted')
      OR
      public.both_answered(session_id, (payload->>'round')::text)
    )
  );

-- INSERT Policy Rules:
-- 1. Inserting user must be auth.uid()
-- 2. Caller must be an active member of couple_id
-- 3. session_id must belong to couple_id
CREATE POLICY "events_couple_insert" ON public.session_events
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_couple_member(couple_id, auth.uid())
    AND couple_id = public.session_couple_id(session_id)
  );

-- ------------------------------------------------------------------------------
-- 3. REALTIME PUBLICATION & REPLICA IDENTITY
-- ------------------------------------------------------------------------------

-- Ensure replica identity full on relevant tables for accurate realtime updates and deletions
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.session_events REPLICA IDENTITY FULL;
ALTER TABLE public.activity_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.memories REPLICA IDENTITY FULL;
ALTER TABLE public.letters REPLICA IDENTITY FULL;
ALTER TABLE public.daily_question_answers REPLICA IDENTITY FULL;
ALTER TABLE public.couples REPLICA IDENTITY FULL;
ALTER TABLE public.couple_members REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Guarded addition of tables to supabase_realtime publication
DO $$
DECLARE
  v_table text;
  v_tables text[] := ARRAY[
    'messages',
    'session_events',
    'activity_sessions',
    'memories',
    'letters',
    'daily_question_answers',
    'couples',
    'couple_members',
    'notifications'
  ];
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH v_table IN ARRAY v_tables LOOP
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = v_table
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', v_table);
      END IF;
    END LOOP;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 4. ATOMIC MEMORY DELETION RPC: delete_memory(p_memory_id)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.delete_memory(p_memory_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_memory RECORD;
  v_media RECORD;
  v_media_paths TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- 1. Verify memory exists
  SELECT * INTO v_memory
  FROM public.memories
  WHERE id = p_memory_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Memory not found');
  END IF;

  -- 2. Membership check: caller must belong to the couple owning the memory
  IF NOT public.is_couple_member(v_memory.couple_id, auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized access to couple memory');
  END IF;

  -- 3. Ownership rule: only the uploader / creator can delete the memory
  IF v_memory.created_by <> auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only the uploader can delete this memory');
  END IF;

  -- 4. Collect and delete storage objects from storage.objects
  FOR v_media IN
    SELECT bucket_path FROM public.media_files WHERE memory_id = p_memory_id
  LOOP
    v_media_paths := array_append(v_media_paths, v_media.bucket_path);
    DELETE FROM storage.objects
    WHERE bucket_id = 'couples-media'
      AND name = v_media.bucket_path;
  END LOOP;

  -- 5. Delete associated media_files metadata rows
  DELETE FROM public.media_files WHERE memory_id = p_memory_id;

  -- 6. Permanently delete memory row
  DELETE FROM public.memories WHERE id = p_memory_id;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_id', p_memory_id,
    'file_paths', v_media_paths
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_memory(UUID) TO authenticated, service_role;

-- Also maintain backward-compatible alias for any existing caller
CREATE OR REPLACE FUNCTION public.delete_memory_permanently(p_memory_id UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.delete_memory(p_memory_id);
$$;

GRANT EXECUTE ON FUNCTION public.delete_memory_permanently(UUID) TO authenticated, service_role;

-- Ensure an explicit DELETE policy exists on memories as well
DROP POLICY IF EXISTS "memories_couple_delete" ON public.memories;
CREATE POLICY "memories_couple_delete" ON public.memories
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    AND public.is_couple_member(couple_id, auth.uid())
  );

-- ------------------------------------------------------------------------------
-- 5. EXPIRE STALE SESSIONS FUNCTION & CRON SCHEDULER
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.expire_stale_sessions()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expired_count INT := 0;
BEGIN
  -- Mark sessions as 'cancelled' if:
  -- 1. Status is 'waiting' or 'in_progress' or 'active'
  -- 2. No session event has occurred in the last 15 minutes
  -- 3. AND the session was created over 15 minutes ago
  WITH candidate_sessions AS (
    SELECT s.id
    FROM public.activity_sessions s
    WHERE s.status IN ('waiting', 'in_progress', 'active')
      AND s.created_at < (now() - interval '15 minutes')
      AND NOT EXISTS (
        SELECT 1 FROM public.session_events e
        WHERE e.session_id = s.id
          AND e.created_at >= (now() - interval '15 minutes')
      )
  ),
  updated AS (
    UPDATE public.activity_sessions
    SET
      status = 'cancelled',
      ended_at = now()
    WHERE id IN (SELECT id FROM candidate_sessions)
    RETURNING id
  )
  SELECT count(*) INTO v_expired_count FROM updated;

  RETURN v_expired_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_stale_sessions() TO authenticated, service_role;

-- Safe pg_cron schedule every 5 minutes (guarded if pg_cron is not enabled)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      -- Unschedule previous job if present
      PERFORM cron.unschedule('expire-stale-activity-sessions');
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;

    BEGIN
      PERFORM cron.schedule(
        'expire-stale-activity-sessions',
        '*/5 * * * *', -- Run every 5 minutes
        'SELECT public.expire_stale_sessions();'
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
END $$;

