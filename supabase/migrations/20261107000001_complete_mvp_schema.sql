-- Migration: 20261107000001_complete_mvp_schema.sql
-- Description: Activities, sessions, events, letters, messages, memories, media_files, bucket_items, important_dates, notifications, user_settings

-- 1. MEDIA FILES (Section 3.8)
CREATE TABLE IF NOT EXISTS public.media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bucket_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INT,
  duration_seconds INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_media_files_couple_id ON public.media_files(couple_id);

-- 2. ACTIVITIES CATALOGUE (Section 3.1 & 3.9)
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  kind TEXT NOT NULL, -- 'would_you_rather', 'who_knows_whom', 'guess_my_answer', 'drawing_guess', 'quiz', 'photo_mission', 'guided_date'
  category TEXT NOT NULL, -- 'play', 'dates', 'deep_talk', 'memories'
  mode TEXT NOT NULL DEFAULT 'live' CHECK (mode IN ('live', 'async', 'both')),
  duration_minutes INT NOT NULL DEFAULT 10,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INT NOT NULL DEFAULT 1,
  locale TEXT NOT NULL DEFAULT 'en',
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_activities_category ON public.activities(category);
CREATE INDEX IF NOT EXISTS idx_activities_kind ON public.activities(kind);

-- 3. ACTIVITY SESSIONS (Section 3.3)
CREATE TABLE IF NOT EXISTS public.activity_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'waiting', 'active', 'paused', 'completed', 'cancelled')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_activity_sessions_couple_id ON public.activity_sessions(couple_id);
CREATE INDEX IF NOT EXISTS idx_activity_sessions_status ON public.activity_sessions(status);

-- 4. SESSION EVENTS (Section 3.3 & 5 - Append-Only Event Log with Idempotency)
CREATE TABLE IF NOT EXISTS public.session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.activity_sessions(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'answer_submitted', 'reaction', 'stroke', 'step_completed', 'session_completed'
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_session_events_idempotency 
  ON public.session_events(session_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_session_events_session_id ON public.session_events(session_id);

-- 5. LETTERS ("Open When" letters - Section 4 & 5)
CREATE TABLE IF NOT EXISTS public.letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL, -- e.g. "Open when you miss me", "Open when you feel stressed"
  content TEXT NOT NULL,
  unlock_at TIMESTAMPTZ, -- Optional date-based lock, or opened on condition
  opened_at TIMESTAMPTZ,
  media_id UUID REFERENCES public.media_files(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_letters_couple_id ON public.letters(couple_id);

-- 6. MESSAGES (Voice & async text notes - Section 4)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT,
  media_id UUID REFERENCES public.media_files(id) ON DELETE SET NULL,
  played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_messages_couple_id ON public.messages(couple_id);

-- 7. MEMORIES (Photo journal & session highlights - Section 4)
CREATE TABLE IF NOT EXISTS public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.activity_sessions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  note TEXT,
  memory_date DATE NOT NULL DEFAULT CURRENT_DATE,
  media_id UUID REFERENCES public.media_files(id) ON DELETE SET NULL,
  favorite BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_memories_couple_id ON public.memories(couple_id);

-- 8. BUCKET LIST ITEMS (Section 4)
CREATE TABLE IF NOT EXISTS public.bucket_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'adventure', -- 'travel', 'food', 'milestone', 'cozy'
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES public.profiles(id),
  target_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_bucket_items_couple_id ON public.bucket_items(couple_id);

-- 9. IMPORTANT DATES (Anniversaries, next trip, milestones - Section 4)
CREATE TABLE IF NOT EXISTS public.important_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false, -- e.g. yearly anniversary
  category TEXT NOT NULL DEFAULT 'anniversary', -- 'anniversary', 'meeting', 'birthday', 'custom'
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_important_dates_couple_id ON public.important_dates(couple_id);

-- 10. NOTIFICATIONS OUTBOX & HISTORY (Section 3.7)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'partner_invited_activity', 'letter_available', 'new_memory', 'date_reminder'
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  deep_link TEXT,
  send_after TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_send_after ON public.notifications(send_after) WHERE sent_at IS NULL;

-- 11. USER SETTINGS (Section 4 & 11 - quiet hours, preferences)
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  notify_activities BOOLEAN NOT NULL DEFAULT true,
  notify_letters BOOLEAN NOT NULL DEFAULT true,
  notify_dates BOOLEAN NOT NULL DEFAULT true,
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00:00',
  quiet_hours_end TIME DEFAULT '08:00:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Triggers for updated_at
CREATE TRIGGER tr_media_files_updated_at BEFORE UPDATE ON public.media_files FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_activity_sessions_updated_at BEFORE UPDATE ON public.activity_sessions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_letters_updated_at BEFORE UPDATE ON public.letters FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_memories_updated_at BEFORE UPDATE ON public.memories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_bucket_items_updated_at BEFORE UPDATE ON public.bucket_items FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_important_dates_updated_at BEFORE UPDATE ON public.important_dates FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 12. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bucket_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.important_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- ACTIVITIES: readable by all authenticated users
CREATE POLICY "activities_select_all" ON public.activities
  FOR SELECT TO authenticated USING (true);

-- Couple-based RLS Helper Expression:
-- couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid() AND status = 'active')

-- MEDIA FILES
CREATE POLICY "media_files_couple_select" ON public.media_files
  FOR SELECT TO authenticated
  USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid() AND status = 'active'));

CREATE POLICY "media_files_couple_insert" ON public.media_files
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid() AND
    couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "media_files_owner_delete" ON public.media_files
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- ACTIVITY SESSIONS
CREATE POLICY "sessions_couple_select" ON public.activity_sessions
  FOR SELECT TO authenticated
  USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid() AND status = 'active'));

CREATE POLICY "sessions_couple_insert" ON public.activity_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "sessions_couple_update" ON public.activity_sessions
  FOR UPDATE TO authenticated
  USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid() AND status = 'active'));

-- SESSION EVENTS
CREATE POLICY "events_couple_select" ON public.session_events
  FOR SELECT TO authenticated
  USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid() AND status = 'active'));

CREATE POLICY "events_couple_insert" ON public.session_events
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid() AND status = 'active')
  );

-- LETTERS
CREATE POLICY "letters_couple_select" ON public.letters
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL AND
    couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "letters_couple_insert" ON public.letters
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "letters_couple_update" ON public.letters
  FOR UPDATE TO authenticated
  USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid() AND status = 'active'));

-- MESSAGES
CREATE POLICY "messages_couple_select" ON public.messages
  FOR SELECT TO authenticated
  USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid() AND status = 'active'));

CREATE POLICY "messages_couple_insert" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid() AND status = 'active')
  );

-- MEMORIES
CREATE POLICY "memories_couple_select" ON public.memories
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL AND
    couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "memories_couple_insert" ON public.memories
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "memories_couple_update" ON public.memories
  FOR UPDATE TO authenticated
  USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid() AND status = 'active'));

-- BUCKET ITEMS
CREATE POLICY "bucket_items_couple_select" ON public.bucket_items
  FOR SELECT TO authenticated
  USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid() AND status = 'active'));

CREATE POLICY "bucket_items_couple_insert" ON public.bucket_items
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "bucket_items_couple_update" ON public.bucket_items
  FOR UPDATE TO authenticated
  USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid() AND status = 'active'));

CREATE POLICY "bucket_items_couple_delete" ON public.bucket_items
  FOR DELETE TO authenticated
  USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid() AND status = 'active'));

-- IMPORTANT DATES
CREATE POLICY "important_dates_couple_select" ON public.important_dates
  FOR SELECT TO authenticated
  USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid() AND status = 'active'));

CREATE POLICY "important_dates_couple_insert" ON public.important_dates
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "important_dates_couple_update" ON public.important_dates
  FOR UPDATE TO authenticated
  USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid() AND status = 'active'));

CREATE POLICY "important_dates_couple_delete" ON public.important_dates
  FOR DELETE TO authenticated
  USING (couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid() AND status = 'active'));

-- NOTIFICATIONS
CREATE POLICY "notifications_recipient_select" ON public.notifications
  FOR SELECT TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "notifications_couple_insert" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    couple_id IN (SELECT couple_id FROM public.couple_members WHERE user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "notifications_recipient_update" ON public.notifications
  FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid());

-- USER SETTINGS
CREATE POLICY "user_settings_select_own" ON public.user_settings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_settings_insert_own" ON public.user_settings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_settings_update_own" ON public.user_settings
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- 13. SERVER-ENFORCED BLIND ANSWER REVEAL (Section 5)
-- Partner B cannot read Partner A's answer until BOTH partners have answered for a question/round.
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

  -- Return events, masking partner's answer if caller has not yet submitted their own answer for that round
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
  )
  SELECT 
    e.id,
    e.session_id,
    e.couple_id,
    e.user_id,
    e.type,
    CASE 
      -- When partner answered but caller has NOT yet answered this round, mask answer content
      WHEN e.type = 'answer_submitted' 
       AND e.user_id <> v_user_id 
       AND NOT EXISTS (SELECT 1 FROM user_answers ua WHERE ua.round_num = (e.payload->>'round')::text)
      THEN jsonb_build_object(
        'round', e.payload->'round',
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
      ELSE true
    END AS is_revealed
  FROM public.session_events e
  WHERE e.session_id = p_session_id
  ORDER BY e.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. SERVER-SIDE LETTER UNLOCK VALIDATION (Section 5)
CREATE OR REPLACE FUNCTION public.open_letter(p_letter_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_letter RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO v_letter
  FROM public.letters
  WHERE id = p_letter_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Letter not found' USING ERRCODE = 'no_data_found';
  END IF;

  -- Ensure user is recipient or sender in active couple
  IF NOT EXISTS (
    SELECT 1 FROM public.couple_members
    WHERE couple_id = v_letter.couple_id AND user_id = v_user_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Check unlock_at constraint using server clock (UTC)
  IF v_letter.unlock_at IS NOT NULL AND v_letter.unlock_at > timezone('utc'::text, now()) THEN
    RAISE EXCEPTION 'Letter is locked until %', v_letter.unlock_at
      USING ERRCODE = 'check_violation';
  END IF;

  -- Update opened_at if not already opened
  IF v_letter.opened_at IS NULL AND v_user_id = v_letter.recipient_id THEN
    UPDATE public.letters
    SET opened_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_letter_id;
  END IF;

  RETURN jsonb_build_object(
    'letter_id', v_letter.id,
    'status', 'opened',
    'opened_at', COALESCE(v_letter.opened_at, timezone('utc'::text, now()))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

