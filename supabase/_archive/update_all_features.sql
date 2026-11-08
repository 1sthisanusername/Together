-- ==============================================================================
-- TOGETHER APP: COMPREHENSIVE ALL-IN-ONE UPDATE SCRIPT
-- File: supabase/update_all_features.sql
-- 
-- Run this single script in the Supabase SQL Editor to apply all recent
-- schema additions, server-authoritative round mechanics, atomic unlink RPC,
-- push notifications outbox, performance indexes, and messages space updates.
--
-- Safe & idempotent: can be run repeatedly without error.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. SCHEMA COLUMN ADDITIONS
-- ------------------------------------------------------------------------------

-- Profiles: Ensure timezone exists
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC';

-- Couples: Status column for atomic unlinking
ALTER TABLE public.couples 
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'couples_status_check'
  ) THEN
    ALTER TABLE public.couples 
      ADD CONSTRAINT couples_status_check CHECK (status IN ('active', 'unlinked'));
  END IF;
END $$;

-- Activity Sessions: Server-authoritative rounds
ALTER TABLE public.activity_sessions 
  ADD COLUMN IF NOT EXISTS current_round INT NOT NULL DEFAULT 1;

-- Messages: Soft delete & idempotency keys
ALTER TABLE public.messages 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- ------------------------------------------------------------------------------
-- 3. NEW TABLES (Push Tokens & Notifications Outbox)
-- ------------------------------------------------------------------------------

-- Push Tokens table
CREATE TABLE IF NOT EXISTS public.push_tokens (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'android' | 'ios' | 'web'
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_id, token)
);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Notifications table (if not already existing)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  deep_link TEXT,
  send_after TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 4. PERFORMANCE & UNIQUENESS INDEXES
-- ------------------------------------------------------------------------------

-- Messages idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_idempotency 
  ON public.messages(couple_id, idempotency_key) 
  WHERE idempotency_key IS NOT NULL;

-- Messages lookup by couple & creation date
CREATE INDEX IF NOT EXISTS idx_messages_couple_lookup
  ON public.messages(couple_id, created_at ASC)
  WHERE deleted_at IS NULL;

-- Startup & Home screen performance indexes
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

CREATE INDEX IF NOT EXISTS idx_notifications_unsent 
  ON public.notifications(sent_at, send_after)
  WHERE sent_at IS NULL;

-- ------------------------------------------------------------------------------
-- 5. RPC FUNCTIONS
-- ------------------------------------------------------------------------------

-- Function 1: advance_round(p_session_id, p_expected_round)
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


-- Function 2: unlink_couple()
CREATE OR REPLACE FUNCTION public.unlink_couple()
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_couple_id UUID;
  v_partner_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- 1. Locate caller active couple membership
  SELECT couple_id INTO v_couple_id
  FROM public.couple_members
  WHERE user_id = v_user_id AND status = 'active'
  FOR UPDATE;

  IF v_couple_id IS NULL THEN
    RAISE EXCEPTION 'No active couple found for user'
      USING ERRCODE = 'no_data_found';
  END IF;

  -- 2. Locate partner user_id if present
  SELECT user_id INTO v_partner_id
  FROM public.couple_members
  WHERE couple_id = v_couple_id AND user_id <> v_user_id AND status = 'active'
  LIMIT 1;

  -- 3. Set couple status to 'unlinked'
  UPDATE public.couples
  SET status = 'unlinked',
      updated_at = timezone('utc'::text, now())
  WHERE id = v_couple_id;

  -- 4. Mark all active members of this couple as unlinked (instant RLS cutoff)
  UPDATE public.couple_members
  SET status = 'unlinked',
      updated_at = timezone('utc'::text, now())
  WHERE couple_id = v_couple_id AND status = 'active';

  -- 5. Revoke any pending invitations
  UPDATE public.invitations
  SET status = 'revoked',
      updated_at = timezone('utc'::text, now())
  WHERE couple_id = v_couple_id AND status = 'pending';

  -- 6. Insert notification for partner if they were linked
  IF v_partner_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      recipient_id,
      couple_id,
      type,
      payload,
      deep_link,
      send_after
    ) VALUES (
      v_partner_id,
      v_couple_id,
      'couple_unlinked',
      jsonb_build_object(
        'title', 'Space unlinked',
        'body', 'Your partner unlinked the couple space',
        'unlinked_by', v_user_id
      ),
      '/(auth)/pair',
      timezone('utc'::text, now())
    );
  END IF;

  RETURN jsonb_build_object(
    'couple_id', v_couple_id,
    'status', 'unlinked',
    'partner_id', v_partner_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.unlink_couple() TO authenticated, service_role;


-- Function 3: delete_message(p_message_id)
CREATE OR REPLACE FUNCTION public.delete_message(p_message_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_msg RECORD;
  v_media RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Verify message belongs to caller and is not already deleted
  SELECT * INTO v_msg
  FROM public.messages
  WHERE id = p_message_id AND sender_id = v_user_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found or unauthorized' USING ERRCODE = 'no_data_found';
  END IF;

  -- Soft delete message
  UPDATE public.messages
  SET deleted_at = timezone('utc'::text, now())
  WHERE id = p_message_id;

  -- If media attached, find bucket path for cleanup
  IF v_msg.media_id IS NOT NULL THEN
    SELECT bucket_path INTO v_media
    FROM public.media_files
    WHERE id = v_msg.media_id;
  END IF;

  RETURN jsonb_build_object(
    'message_id', p_message_id,
    'deleted', true,
    'media_bucket_path', v_media.bucket_path
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.delete_message(UUID) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 6. NOTIFICATION OUTBOX TRIGGERS
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
    '/chat',
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
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- Push Tokens Policies
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

-- Notifications Policies
DROP POLICY IF EXISTS "notifications_recipient_select" ON public.notifications;
CREATE POLICY "notifications_recipient_select" ON public.notifications
  FOR SELECT TO authenticated
  USING (recipient_id = auth.uid());

-- Messages Policies (excluding soft-deleted rows, allowing sender delete & recipient played_at update)
DROP POLICY IF EXISTS "messages_couple_select" ON public.messages;
CREATE POLICY "messages_couple_select" ON public.messages
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL AND
    couple_id IN (
      SELECT couple_id FROM public.couple_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "messages_couple_insert" ON public.messages;
CREATE POLICY "messages_couple_insert" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    couple_id IN (
      SELECT couple_id FROM public.couple_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "messages_update" ON public.messages;
CREATE POLICY "messages_update" ON public.messages
  FOR UPDATE TO authenticated
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  )
  WITH CHECK (
    couple_id IN (
      SELECT couple_id FROM public.couple_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ------------------------------------------------------------------------------
-- 8. STORAGE BUCKET & RLS POLICIES (couples-media)
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'couples-media',
  'couples-media',
  false,
  10485760, -- 10 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'audio/m4a', 'audio/mp4', 'audio/mpeg', 'audio/aac']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760;

DROP POLICY IF EXISTS "couples_media_select" ON storage.objects;
CREATE POLICY "couples_media_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'couples-media' AND
    (storage.foldername(name))[1]::uuid IN (
      SELECT couple_id FROM public.couple_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "couples_media_insert" ON storage.objects;
CREATE POLICY "couples_media_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'couples-media' AND
    (storage.foldername(name))[1]::uuid IN (
      SELECT couple_id FROM public.couple_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "couples_media_delete" ON storage.objects;
CREATE POLICY "couples_media_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'couples-media' AND
    (storage.foldername(name))[1]::uuid IN (
      SELECT couple_id FROM public.couple_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ------------------------------------------------------------------------------
-- 9. SUPABASE REALTIME REPLICATION PUBLICATION
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  -- Add tables to supabase_realtime publication if not already included
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.couple_members;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_sessions;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.session_events;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ------------------------------------------------------------------------------
-- 10. ANNIVERSARY & MILESTONE ALERTS AND START DATE NOTIFICATIONS
-- ------------------------------------------------------------------------------
ALTER TABLE public.couples 
ADD COLUMN IF NOT EXISTS start_date DATE;

CREATE OR REPLACE FUNCTION public.trg_notify_start_date_changed()
RETURNS TRIGGER AS $$
DECLARE
  v_updater_id UUID := auth.uid();
  v_updater_name TEXT;
  v_partner_id UUID;
BEGIN
  IF (OLD.start_date IS DISTINCT FROM NEW.start_date) AND v_updater_id IS NOT NULL THEN
    SELECT user_id INTO v_partner_id
    FROM public.couple_members
    WHERE couple_id = NEW.id AND user_id <> v_updater_id AND status = 'active'
    LIMIT 1;

    IF v_partner_id IS NOT NULL THEN
      SELECT COALESCE(display_name, 'Your partner') INTO v_updater_name
      FROM public.profiles WHERE id = v_updater_id;

      INSERT INTO public.notifications (
        recipient_id,
        couple_id,
        type,
        payload,
        deep_link,
        send_after
      ) VALUES (
        v_partner_id,
        NEW.id,
        'anniversary_date_updated',
        jsonb_build_object(
          'title', 'Anniversary Date Updated',
          'body', v_updater_name || ' updated your special anniversary date 💕',
          'start_date', NEW.start_date
        ),
        '/(tabs)/us',
        timezone('utc'::text, now())
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_couples_start_date_notify ON public.couples;
CREATE TRIGGER trg_couples_start_date_notify
  AFTER UPDATE OF start_date ON public.couples
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_start_date_changed();

CREATE OR REPLACE FUNCTION public.check_anniversaries_and_milestones()
RETURNS INT AS $$
DECLARE
  v_couple RECORD;
  v_member RECORD;
  v_days_together INT;
  v_is_anniversary BOOLEAN;
  v_is_milestone BOOLEAN;
  v_years INT;
  v_title TEXT;
  v_body TEXT;
  v_send_time TIMESTAMPTZ;
  v_notif_count INT := 0;
BEGIN
  FOR v_couple IN
    SELECT c.id, c.start_date
    FROM public.couples c
    WHERE c.status = 'active' AND c.start_date IS NOT NULL
  LOOP
    v_days_together := CURRENT_DATE - v_couple.start_date;
    IF v_days_together <= 0 THEN CONTINUE; END IF;

    v_is_anniversary := (
      EXTRACT(MONTH FROM v_couple.start_date) = EXTRACT(MONTH FROM CURRENT_DATE) AND
      EXTRACT(DAY FROM v_couple.start_date) = EXTRACT(DAY FROM CURRENT_DATE)
    );
    v_years := EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM v_couple.start_date);
    v_is_milestone := v_days_together IN (100, 200, 365, 500, 1000, 1500, 2000, 2500, 3000, 5000);

    IF v_is_anniversary AND v_years > 0 THEN
      v_title := 'Happy Anniversary 💕';
      v_body := 'Celebrating ' || v_years || ' wonderful ' || 
                CASE WHEN v_years = 1 THEN 'year' ELSE 'years' END || 
                ' together today. Thank you for every shared moment.';
    ELSIF v_is_milestone THEN
      v_title := 'Milestone Day ✨';
      v_body := 'Today marks ' || v_days_together || ' days together side by side. Here is to all the days ahead.';
    ELSE
      CONTINUE;
    END IF;

    FOR v_member IN
      SELECT cm.user_id, COALESCE(p.timezone, 'UTC') AS tz
      FROM public.couple_members cm
      JOIN public.profiles p ON p.id = cm.user_id
      WHERE cm.couple_id = v_couple.id AND cm.status = 'active'
    LOOP
      BEGIN
        v_send_time := (CURRENT_DATE::text || ' 09:00:00')::timestamp AT TIME ZONE v_member.tz;
      EXCEPTION WHEN OTHERS THEN
        v_send_time := timezone('utc'::text, now());
      END;

      IF v_send_time < timezone('utc'::text, now()) THEN
        v_send_time := timezone('utc'::text, now());
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM public.notifications
        WHERE recipient_id = v_member.user_id
          AND couple_id = v_couple.id
          AND type IN ('anniversary_alert', 'milestone_alert')
          AND created_at >= CURRENT_DATE
      ) THEN
        INSERT INTO public.notifications (
          recipient_id,
          couple_id,
          type,
          payload,
          deep_link,
          send_after
        ) VALUES (
          v_member.user_id,
          v_couple.id,
          CASE WHEN v_is_anniversary THEN 'anniversary_alert' ELSE 'milestone_alert' END,
          jsonb_build_object(
            'title', v_title,
            'body', v_body,
            'days_together', v_days_together,
            'anniversary_year', v_years
          ),
          '/(tabs)/us',
          v_send_time
        );
        v_notif_count := v_notif_count + 1;
      END IF;
    END LOOP;
  END LOOP;

  RETURN v_notif_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.check_anniversaries_and_milestones() TO authenticated, service_role;


