-- Migration: Mask photo_mission events until both partners have submitted
-- Enforces server-level masking for photo_submitted events in get_session_events_masked

CREATE OR REPLACE FUNCTION public.get_session_events_masked(p_session_id UUID)
RETURNS TABLE (
  id UUID,
  session_id UUID,
  couple_id UUID,
  user_id UUID,
  type TEXT,
  payload JSONB,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ,
  is_revealed BOOLEAN
) AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_couple_id UUID;
  v_partner_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Verify session belongs to user's active couple
  SELECT s.couple_id INTO v_couple_id
  FROM public.activity_sessions s
  JOIN public.couple_members cm ON cm.couple_id = s.couple_id
  WHERE s.id = p_session_id AND cm.user_id = v_user_id AND cm.status = 'active';

  IF v_couple_id IS NULL THEN
    RAISE EXCEPTION 'Session not found or inaccessible' USING ERRCODE = 'no_data_found';
  END IF;

  -- Find partner user_id
  SELECT cm.user_id INTO v_partner_id
  FROM public.couple_members cm
  WHERE cm.couple_id = v_couple_id AND cm.user_id <> v_user_id AND cm.status = 'active';

  -- Return events, masking partner's answer/photo if caller has not yet submitted
  RETURN QUERY
  WITH user_answers AS (
    SELECT (e.payload->>'round')::text AS round_num
    FROM public.session_events e
    WHERE e.session_id = p_session_id
      AND e.user_id = v_user_id
      AND e.type = 'answer_submitted'
  ),
  partner_answers AS (
    SELECT (e.payload->>'round')::text AS round_num
    FROM public.session_events e
    WHERE e.session_id = p_session_id
      AND e.user_id = v_partner_id
      AND e.type = 'answer_submitted'
  ),
  user_photos AS (
    SELECT 1 FROM public.session_events e
    WHERE e.session_id = p_session_id
      AND e.user_id = v_user_id
      AND e.type = 'photo_submitted'
  ),
  partner_photos AS (
    SELECT 1 FROM public.session_events e
    WHERE e.session_id = p_session_id
      AND e.user_id = v_partner_id
      AND e.type = 'photo_submitted'
  )
  SELECT 
    e.id,
    e.session_id,
    e.couple_id,
    e.user_id,
    e.type,
    CASE 
      -- When partner answered quiz/game but caller has NOT yet answered this round, mask answer content
      WHEN e.type = 'answer_submitted' 
       AND e.user_id <> v_user_id 
       AND NOT EXISTS (SELECT 1 FROM user_answers ua WHERE ua.round_num = (e.payload->>'round')::text)
      THEN jsonb_build_object(
        'round', e.payload->'round',
        'masked', true,
        'submitted_at', e.created_at
      )
      -- When partner submitted photo but caller has NOT yet submitted their photo, mask photo content
      WHEN e.type = 'photo_submitted'
       AND e.user_id <> v_user_id
       AND NOT EXISTS (SELECT 1 FROM user_photos)
      THEN jsonb_build_object(
        'masked', true,
        'submitted_at', e.created_at
      )
      ELSE e.payload
    END AS payload,
    e.idempotency_key,
    e.created_at,
    CASE
      WHEN e.type = 'answer_submitted'
      THEN EXISTS (SELECT 1 FROM user_answers ua WHERE ua.round_num = (e.payload->>'round')::text)
           AND EXISTS (SELECT 1 FROM partner_answers pa WHERE pa.round_num = (e.payload->>'round')::text)
      WHEN e.type = 'photo_submitted'
      THEN EXISTS (SELECT 1 FROM user_photos)
           AND EXISTS (SELECT 1 FROM partner_photos)
      ELSE true
    END AS is_revealed
  FROM public.session_events e
  WHERE e.session_id = p_session_id
  ORDER BY e.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

