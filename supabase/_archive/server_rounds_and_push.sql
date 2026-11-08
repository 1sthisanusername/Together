-- ==============================================================================
-- SERVER-AUTHORITATIVE ROUNDS & PUSH NOTIFICATIONS INFRASTRUCTURE
-- File: supabase/server_rounds_and_push.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SERVER-AUTHORITATIVE ROUNDS (activity_sessions.current_round)
-- ------------------------------------------------------------------------------
ALTER TABLE public.activity_sessions 
ADD COLUMN IF NOT EXISTS current_round INT NOT NULL DEFAULT 1;

-- ------------------------------------------------------------------------------
-- 2. advance_round(session_id, expected_round) RPC
-- Strictly checks couple membership, concurrency protection against double taps,
-- advances current_round, and inserts session_event {type: 'round_advanced'}.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.advance_round(
  p_session_id UUID,
  p_expected_round INT
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session RECORD;
  v_new_round INT;
  v_caller_name TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- 1. Check couple membership and lock session row
  SELECT s.* INTO v_session
  FROM public.activity_sessions s
  JOIN public.couple_members cm ON cm.couple_id = s.couple_id
  WHERE s.id = p_session_id AND cm.user_id = v_user_id AND cm.status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found or inaccessible' USING ERRCODE = 'no_data_found';
  END IF;

  -- 2. Concurrency safeguard: Only advance if current_round matches expected_round
  IF v_session.current_round <> p_expected_round THEN
    RETURN jsonb_build_object(
      'session_id', p_session_id,
      'current_round', v_session.current_round,
      'advanced', false,
      'message', 'Round was already advanced'
    );
  END IF;

  v_new_round := v_session.current_round + 1;

  -- 3. Fetch caller display name for banner
  SELECT COALESCE(display_name, 'Partner') INTO v_caller_name
  FROM public.profiles
  WHERE id = v_user_id;

  -- 4. Advance round on activity_sessions
  UPDATE public.activity_sessions
  SET current_round = v_new_round,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_session_id;

  -- 5. Insert server event for real-time notification
  INSERT INTO public.session_events (
    session_id,
    couple_id,
    user_id,
    type,
    payload,
    idempotency_key
  ) VALUES (
    p_session_id,
    v_session.couple_id,
    v_user_id,
    'round_advanced',
    jsonb_build_object(
      'from_round', v_session.current_round,
      'to_round', v_new_round,
      'by_user_id', v_user_id,
      'by_name', v_caller_name
    ),
    'round_adv_' || p_session_id::text || '_' || v_new_round::text
  );

  RETURN jsonb_build_object(
    'session_id', p_session_id,
    'current_round', v_new_round,
    'advanced', true,
    'by_name', v_caller_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.advance_round(UUID, INT) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 3. PUSH TOKENS TABLE (Expo Push Token Registration)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.push_tokens (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'android' | 'ios' | 'web'
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_id, token)
);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_tokens_user_select" ON public.push_tokens;
CREATE POLICY "push_tokens_user_select" ON public.push_tokens
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "push_tokens_user_insert" ON public.push_tokens;
CREATE POLICY "push_tokens_user_insert" ON public.push_tokens
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "push_tokens_user_update" ON public.push_tokens;
CREATE POLICY "push_tokens_user_update" ON public.push_tokens
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "push_tokens_user_delete" ON public.push_tokens;
CREATE POLICY "push_tokens_user_delete" ON public.push_tokens
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 4. NOTIFICATION TRIGGERS (Letters, Messages, Invites, Photo Missions)
-- ------------------------------------------------------------------------------

-- Trigger on Letters
CREATE OR REPLACE FUNCTION public.trg_notify_new_letter()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_name TEXT;
BEGIN
  SELECT COALESCE(display_name, 'Your Partner') INTO v_sender_name
  FROM public.profiles WHERE id = NEW.sender_id;

  INSERT INTO public.notifications (
    recipient_id,
    couple_id,
    type,
    payload,
    deep_link,
    send_after
  ) VALUES (
    NEW.recipient_id,
    NEW.couple_id,
    'letter',
    jsonb_build_object(
      'title', '💌 Letter from ' || v_sender_name,
      'body', NEW.title,
      'letter_id', NEW.id
    ),
    '/(tabs)/dates',
    COALESCE(NEW.unlock_at, timezone('utc'::text, now()))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_letters_insert_notify ON public.letters;
CREATE TRIGGER trg_letters_insert_notify
  AFTER INSERT ON public.letters
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_new_letter();

-- Trigger on Messages
CREATE OR REPLACE FUNCTION public.trg_notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_name TEXT;
BEGIN
  SELECT COALESCE(display_name, 'Your Partner') INTO v_sender_name
  FROM public.profiles WHERE id = NEW.sender_id;

  INSERT INTO public.notifications (
    recipient_id,
    couple_id,
    type,
    payload,
    deep_link,
    send_after
  ) VALUES (
    NEW.recipient_id,
    NEW.couple_id,
    'message',
    jsonb_build_object(
      'title', '💬 Message from ' || v_sender_name,
      'body', COALESCE(NEW.content, 'Sent you a voice note'),
      'message_id', NEW.id
    ),
    '/(tabs)/us',
    timezone('utc'::text, now())
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_messages_insert_notify ON public.messages;
CREATE TRIGGER trg_messages_insert_notify
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_new_message();

-- Trigger on Activity Sessions (Invites & Photo Missions)
CREATE OR REPLACE FUNCTION public.trg_notify_new_session()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_name TEXT;
  v_partner_id UUID;
  v_activity_title TEXT;
  v_activity_kind TEXT;
  v_notif_type TEXT;
  v_notif_title TEXT;
BEGIN
  -- Identify partner in active couple
  SELECT user_id INTO v_partner_id
  FROM public.couple_members
  WHERE couple_id = NEW.couple_id AND user_id <> NEW.created_by AND status = 'active'
  LIMIT 1;

  IF v_partner_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(display_name, 'Your Partner') INTO v_sender_name
  FROM public.profiles WHERE id = NEW.created_by;

  SELECT title, kind INTO v_activity_title, v_activity_kind
  FROM public.activities WHERE id = NEW.activity_id;

  IF v_activity_kind = 'photo_mission' THEN
    v_notif_type := 'photo_mission';
    v_notif_title := '📸 ' || v_sender_name || ' sent a Photo Mission!';
  ELSE
    v_notif_type := 'activity_invite';
    v_notif_title := '🎮 ' || v_sender_name || ' invited you to play!';
  END IF;

  INSERT INTO public.notifications (
    recipient_id,
    couple_id,
    type,
    payload,
    deep_link,
    send_after
  ) VALUES (
    v_partner_id,
    NEW.couple_id,
    v_notif_type,
    jsonb_build_object(
      'title', v_notif_title,
      'body', COALESCE(v_activity_title, 'Tap to open together'),
      'session_id', NEW.id,
      'activity_kind', v_activity_kind
    ),
    '/session/' || NEW.id::text,
    timezone('utc'::text, now())
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sessions_insert_notify ON public.activity_sessions;
CREATE TRIGGER trg_sessions_insert_notify
  AFTER INSERT ON public.activity_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_new_session();

-- ------------------------------------------------------------------------------
-- 5. PERFORMANCE INDEXES FOR APP STARTUP & HOME QUERIES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_activity_sessions_home_lookup 
  ON public.activity_sessions(couple_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_important_dates_home_lookup 
  ON public.important_dates(couple_id, event_date ASC);

CREATE INDEX IF NOT EXISTS idx_session_events_home_session 
  ON public.session_events(session_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_couple_members_lookup 
  ON public.couple_members(user_id, status, couple_id);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user 
  ON public.push_tokens(user_id);

