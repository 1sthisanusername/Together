-- ==============================================================================
-- MIGRATION: 20261109000010_critical_repairs.sql
-- Fixes:
-- 1. Recursion in session_events RLS policy via SECURITY DEFINER function
-- 2. Permanent memory deletion RPC with ownership check and atomic cascade
-- 3. Presence heartbeat support on profiles
-- ==============================================================================

-- 1. FIX: Infinite recursion in session_events policy
-- By encapsulating the round answer lookup in a SECURITY DEFINER function with SET search_path,
-- Postgres evaluates the check without re-triggering the SELECT policy on session_events.
CREATE OR REPLACE FUNCTION public.has_user_answered_round(
  p_session_id UUID,
  p_user_id UUID,
  p_round TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.session_events
    WHERE session_id = p_session_id
      AND user_id = p_user_id
      AND type = 'answer_submitted'
      AND (payload->>'round')::text = p_round
  );
END;
$$;

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
      -- 3. Partner's answer is only readable after caller has submitted an answer for that round
      public.has_user_answered_round(session_id, auth.uid(), (payload->>'round')::text)
    )
  );

-- 2. Permanent memory deletion RPC
-- Enforces that only the creator can permanently delete the memory and associated media records.
CREATE OR REPLACE FUNCTION public.delete_memory_permanently(p_memory_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_memory RECORD;
  v_media_paths TEXT[];
BEGIN
  -- Check memory exists and user is owner
  SELECT * INTO v_memory
  FROM public.memories
  WHERE id = p_memory_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Memory not found');
  END IF;

  IF v_memory.created_by <> auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only the creator can delete this memory');
  END IF;

  -- Collect storage paths to return to caller for storage cleanup
  SELECT array_agg(bucket_path) INTO v_media_paths
  FROM public.media_files
  WHERE memory_id = p_memory_id;

  -- Delete media_files rows
  DELETE FROM public.media_files WHERE memory_id = p_memory_id;

  -- Permanently delete memory record
  DELETE FROM public.memories WHERE id = p_memory_id;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_id', p_memory_id,
    'file_paths', coalesce(v_media_paths, ARRAY[]::TEXT[])
  );
END;
$$;

-- 3. Last seen timestamp on profiles for presence tracking
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- Heartbeat function to update last_seen_at
CREATE OR REPLACE FUNCTION public.heartbeat_presence()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET last_seen_at = timezone('utc'::text, now())
  WHERE id = auth.uid();
END;
$$;
