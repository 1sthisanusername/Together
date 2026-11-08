-- Migration: 20261108000009_notifications_inbox_and_realtime.sql
-- Description: In-app notification inbox, realtime broadcast, and automated triggers across all core types

-- 1. Index optimization for unread notifications count and fast chronological listing
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read 
  ON public.notifications(recipient_id, read_at, created_at DESC);

-- 2. Ensure REPLICA IDENTITY FULL for complete payload streaming on Realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- 3. Safely add public.notifications to supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
  WHEN undefined_object THEN
    NULL;
END $$;

-- 4. Verify and harden RLS policies on public.notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Select: Each user reads only their own notifications
  DROP POLICY IF EXISTS "notifications_recipient_select" ON public.notifications;
  CREATE POLICY "notifications_recipient_select" ON public.notifications
    FOR SELECT TO authenticated
    USING (recipient_id = auth.uid());

  -- Insert: Active couple members can insert notifications for their couple/partner
  DROP POLICY IF EXISTS "notifications_couple_insert" ON public.notifications;
  CREATE POLICY "notifications_couple_insert" ON public.notifications
    FOR INSERT TO authenticated
    WITH CHECK (
      couple_id IN (
        SELECT couple_id FROM public.couple_members 
        WHERE user_id = auth.uid() AND status = 'active'
      )
    );

  -- Update: Only the recipient can mark their notifications as read
  DROP POLICY IF EXISTS "notifications_recipient_update" ON public.notifications;
  CREATE POLICY "notifications_recipient_update" ON public.notifications
    FOR UPDATE TO authenticated
    USING (recipient_id = auth.uid())
    WITH CHECK (recipient_id = auth.uid());
END $$;

-- 5. Trigger: Automated notification creation on messages (text, voice notes, photos)
CREATE OR REPLACE FUNCTION public.fn_messages_insert_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_name TEXT;
  v_type TEXT;
  v_title TEXT;
  v_body TEXT;
BEGIN
  SELECT display_name INTO v_sender_name FROM public.profiles WHERE id = NEW.sender_id;
  v_sender_name := COALESCE(v_sender_name, 'Partner');

  IF NEW.media_type = 'audio' THEN
    v_type := 'voice_note';
    v_title := v_sender_name || ' sent a voice note';
    v_body := '🎙️ Voice note received';
  ELSIF NEW.media_type = 'photo' THEN
    v_type := 'photo_message';
    v_title := v_sender_name || ' shared a photo';
    v_body := '📸 Photo received';
  ELSE
    v_type := 'message';
    v_title := v_sender_name || ' sent a message';
    v_body := LEFT(NEW.content, 80);
  END IF;

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
    v_type,
    jsonb_build_object(
      'title', v_title,
      'body', v_body,
      'senderName', v_sender_name,
      'messageId', NEW.id
    ),
    '/chat',
    now()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_messages_insert_notification ON public.messages;
CREATE TRIGGER trg_messages_insert_notification
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_messages_insert_notification();

-- 6. Trigger: Automated notification creation on letters
CREATE OR REPLACE FUNCTION public.fn_letters_insert_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_recipient_id UUID;
  v_sender_name TEXT;
BEGIN
  SELECT user_id INTO v_recipient_id
  FROM public.couple_members
  WHERE couple_id = NEW.couple_id AND user_id != NEW.sender_id AND status = 'active'
  LIMIT 1;

  IF v_recipient_id IS NOT NULL THEN
    SELECT display_name INTO v_sender_name FROM public.profiles WHERE id = NEW.sender_id;
    v_sender_name := COALESCE(v_sender_name, 'Partner');

    INSERT INTO public.notifications (
      recipient_id,
      couple_id,
      type,
      payload,
      deep_link,
      send_after
    ) VALUES (
      v_recipient_id,
      NEW.couple_id,
      'letter',
      jsonb_build_object(
        'title', v_sender_name || ' wrote you a letter',
        'body', '💌 ' || NEW.title,
        'senderName', v_sender_name,
        'letterId', NEW.id
      ),
      '/(tabs)/dates',
      COALESCE(NEW.unlock_at, now())
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_letters_insert_notification ON public.letters;
CREATE TRIGGER trg_letters_insert_notification
  AFTER INSERT ON public.letters
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_letters_insert_notification();

-- 7. Trigger: Automated notification creation on memories
CREATE OR REPLACE FUNCTION public.fn_memories_insert_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_recipient_id UUID;
  v_creator_name TEXT;
BEGIN
  SELECT user_id INTO v_recipient_id
  FROM public.couple_members
  WHERE couple_id = NEW.couple_id AND user_id != NEW.created_by AND status = 'active'
  LIMIT 1;

  IF v_recipient_id IS NOT NULL THEN
    SELECT display_name INTO v_creator_name FROM public.profiles WHERE id = NEW.created_by;
    v_creator_name := COALESCE(v_creator_name, 'Partner');

    INSERT INTO public.notifications (
      recipient_id,
      couple_id,
      type,
      payload,
      deep_link,
      send_after
    ) VALUES (
      v_recipient_id,
      NEW.couple_id,
      'memory',
      jsonb_build_object(
        'title', 'New memory in your album',
        'body', '🖼️ ' || NEW.title,
        'creatorName', v_creator_name,
        'memoryId', NEW.id
      ),
      '/(tabs)/memories',
      now()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_memories_insert_notification ON public.memories;
CREATE TRIGGER trg_memories_insert_notification
  AFTER INSERT ON public.memories
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_memories_insert_notification();

-- 8. Trigger: Automated notification creation on game sessions
CREATE OR REPLACE FUNCTION public.fn_sessions_insert_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_recipient_id UUID;
  v_creator_name TEXT;
  v_activity_title TEXT;
BEGIN
  SELECT user_id INTO v_recipient_id
  FROM public.couple_members
  WHERE couple_id = NEW.couple_id AND user_id != NEW.created_by AND status = 'active'
  LIMIT 1;

  IF v_recipient_id IS NOT NULL THEN
    SELECT display_name INTO v_creator_name FROM public.profiles WHERE id = NEW.created_by;
    v_creator_name := COALESCE(v_creator_name, 'Partner');

    SELECT title INTO v_activity_title FROM public.activities WHERE id = NEW.activity_id;
    v_activity_title := COALESCE(v_activity_title, 'an activity');

    INSERT INTO public.notifications (
      recipient_id,
      couple_id,
      type,
      payload,
      deep_link,
      send_after
    ) VALUES (
      v_recipient_id,
      NEW.couple_id,
      'game_invite',
      jsonb_build_object(
        'title', v_creator_name || ' invited you to play',
        'body', '🎮 ' || v_activity_title,
        'creatorName', v_creator_name,
        'sessionId', NEW.id
      ),
      '/session/' || NEW.id,
      now()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sessions_insert_notification ON public.sessions;
CREATE TRIGGER trg_sessions_insert_notification
  AFTER INSERT ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_sessions_insert_notification();
