-- ==============================================================================
-- FIX: INFINITE RECURSION IN POLICY FOR RELATION "couple_members"
-- Run this script in the Supabase SQL Editor.
-- ==============================================================================

-- 1. Ensure get_active_couple_id is a SECURITY DEFINER function with safe search_path.
-- Because it runs as SECURITY DEFINER, it bypasses RLS on couple_members internally,
-- completely preventing infinite recursion.
CREATE OR REPLACE FUNCTION public.get_active_couple_id(p_user_id UUID DEFAULT auth.uid())
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_couple_id UUID;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT couple_id INTO v_couple_id
  FROM public.couple_members
  WHERE user_id = p_user_id AND status = 'active'
  LIMIT 1;

  RETURN v_couple_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_active_couple_id(UUID) TO authenticated, service_role, anon;

-- 2. Fix couple_members SELECT policy (The Root Cause)
-- Previously, the subquery queried couple_members directly, triggering its own RLS policy recursively.
DROP POLICY IF EXISTS "couple_members_select_active_member_or_self" ON public.couple_members;

CREATE POLICY "couple_members_select_active_member_or_self" ON public.couple_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    couple_id = public.get_active_couple_id(auth.uid())
  );

-- 3. Fix profiles SELECT policy
DROP POLICY IF EXISTS "profiles_select_own_or_partner" ON public.profiles;

CREATE POLICY "profiles_select_own_or_partner" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid() OR
    id IN (
      SELECT cm.user_id
      FROM public.couple_members cm
      WHERE cm.couple_id = public.get_active_couple_id(auth.uid())
        AND cm.status = 'active'
    )
  );

-- 4. Fix couples Policies
DROP POLICY IF EXISTS "couples_select_active_member" ON public.couples;
CREATE POLICY "couples_select_active_member" ON public.couples
  FOR SELECT TO authenticated
  USING (
    id = public.get_active_couple_id(auth.uid())
  );

DROP POLICY IF EXISTS "couples_update_active_member" ON public.couples;
CREATE POLICY "couples_update_active_member" ON public.couples
  FOR UPDATE TO authenticated
  USING (
    id = public.get_active_couple_id(auth.uid())
  );

-- 5. Fix invitations Policies
DROP POLICY IF EXISTS "invitations_select_active_couple_member" ON public.invitations;
CREATE POLICY "invitations_select_active_couple_member" ON public.invitations
  FOR SELECT TO authenticated
  USING (
    couple_id = public.get_active_couple_id(auth.uid())
  );

DROP POLICY IF EXISTS "invitations_insert_active_couple_member" ON public.invitations;
CREATE POLICY "invitations_insert_active_couple_member" ON public.invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    inviter_id = auth.uid() AND
    couple_id = public.get_active_couple_id(auth.uid())
  );

-- 6. Fix entitlements Policy
DROP POLICY IF EXISTS "entitlements_select_couple" ON public.entitlements;
CREATE POLICY "entitlements_select_couple" ON public.entitlements
  FOR SELECT TO authenticated
  USING (
    couple_id = public.get_active_couple_id(auth.uid())
  );

-- 7. Fix feature tables policies (sessions, media, letters, memories, bucket, dates, etc.)
-- Using get_active_couple_id(auth.uid()) makes these faster and 100% immune to recursion.

-- Media Files
DROP POLICY IF EXISTS "media_files_couple_select" ON public.media_files;
CREATE POLICY "media_files_couple_select" ON public.media_files
  FOR SELECT TO authenticated
  USING (couple_id = public.get_active_couple_id(auth.uid()));

DROP POLICY IF EXISTS "media_files_couple_insert" ON public.media_files;
CREATE POLICY "media_files_couple_insert" ON public.media_files
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid() AND
    couple_id = public.get_active_couple_id(auth.uid())
  );

-- Activity Sessions
DROP POLICY IF EXISTS "sessions_couple_select" ON public.activity_sessions;
CREATE POLICY "sessions_couple_select" ON public.activity_sessions
  FOR SELECT TO authenticated
  USING (couple_id = public.get_active_couple_id(auth.uid()));

DROP POLICY IF EXISTS "sessions_couple_insert" ON public.activity_sessions;
CREATE POLICY "sessions_couple_insert" ON public.activity_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    couple_id = public.get_active_couple_id(auth.uid())
  );

DROP POLICY IF EXISTS "sessions_couple_update" ON public.activity_sessions;
CREATE POLICY "sessions_couple_update" ON public.activity_sessions
  FOR UPDATE TO authenticated
  USING (couple_id = public.get_active_couple_id(auth.uid()));

-- Session Events
DROP POLICY IF EXISTS "events_couple_select" ON public.session_events;
CREATE POLICY "events_couple_select" ON public.session_events
  FOR SELECT TO authenticated
  USING (couple_id = public.get_active_couple_id(auth.uid()));

DROP POLICY IF EXISTS "events_couple_insert" ON public.session_events;
CREATE POLICY "events_couple_insert" ON public.session_events
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    couple_id = public.get_active_couple_id(auth.uid())
  );

-- Letters
DROP POLICY IF EXISTS "letters_couple_select" ON public.letters;
CREATE POLICY "letters_couple_select" ON public.letters
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL AND
    couple_id = public.get_active_couple_id(auth.uid())
  );

DROP POLICY IF EXISTS "letters_couple_insert" ON public.letters;
CREATE POLICY "letters_couple_insert" ON public.letters
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    couple_id = public.get_active_couple_id(auth.uid())
  );

DROP POLICY IF EXISTS "letters_couple_update" ON public.letters;
CREATE POLICY "letters_couple_update" ON public.letters
  FOR UPDATE TO authenticated
  USING (couple_id = public.get_active_couple_id(auth.uid()));

-- Messages
DROP POLICY IF EXISTS "messages_couple_select" ON public.messages;
CREATE POLICY "messages_couple_select" ON public.messages
  FOR SELECT TO authenticated
  USING (couple_id = public.get_active_couple_id(auth.uid()));

DROP POLICY IF EXISTS "messages_couple_insert" ON public.messages;
CREATE POLICY "messages_couple_insert" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    couple_id = public.get_active_couple_id(auth.uid())
  );

-- Memories
DROP POLICY IF EXISTS "memories_couple_select" ON public.memories;
CREATE POLICY "memories_couple_select" ON public.memories
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL AND
    couple_id = public.get_active_couple_id(auth.uid())
  );

DROP POLICY IF EXISTS "memories_couple_insert" ON public.memories;
CREATE POLICY "memories_couple_insert" ON public.memories
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    couple_id = public.get_active_couple_id(auth.uid())
  );

DROP POLICY IF EXISTS "memories_couple_update" ON public.memories;
CREATE POLICY "memories_couple_update" ON public.memories
  FOR UPDATE TO authenticated
  USING (couple_id = public.get_active_couple_id(auth.uid()));

-- Bucket Items
DROP POLICY IF EXISTS "bucket_items_couple_select" ON public.bucket_items;
CREATE POLICY "bucket_items_couple_select" ON public.bucket_items
  FOR SELECT TO authenticated
  USING (couple_id = public.get_active_couple_id(auth.uid()));

DROP POLICY IF EXISTS "bucket_items_couple_insert" ON public.bucket_items;
CREATE POLICY "bucket_items_couple_insert" ON public.bucket_items
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    couple_id = public.get_active_couple_id(auth.uid())
  );

DROP POLICY IF EXISTS "bucket_items_couple_update" ON public.bucket_items;
CREATE POLICY "bucket_items_couple_update" ON public.bucket_items
  FOR UPDATE TO authenticated
  USING (couple_id = public.get_active_couple_id(auth.uid()));

DROP POLICY IF EXISTS "bucket_items_couple_delete" ON public.bucket_items;
CREATE POLICY "bucket_items_couple_delete" ON public.bucket_items
  FOR DELETE TO authenticated
  USING (couple_id = public.get_active_couple_id(auth.uid()));

-- Important Dates
DROP POLICY IF EXISTS "important_dates_couple_select" ON public.important_dates;
CREATE POLICY "important_dates_couple_select" ON public.important_dates
  FOR SELECT TO authenticated
  USING (couple_id = public.get_active_couple_id(auth.uid()));

DROP POLICY IF EXISTS "important_dates_couple_insert" ON public.important_dates;
CREATE POLICY "important_dates_couple_insert" ON public.important_dates
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    couple_id = public.get_active_couple_id(auth.uid())
  );

DROP POLICY IF EXISTS "important_dates_couple_update" ON public.important_dates;
CREATE POLICY "important_dates_couple_update" ON public.important_dates
  FOR UPDATE TO authenticated
  USING (couple_id = public.get_active_couple_id(auth.uid()));

DROP POLICY IF EXISTS "important_dates_couple_delete" ON public.important_dates;
CREATE POLICY "important_dates_couple_delete" ON public.important_dates
  FOR DELETE TO authenticated
  USING (couple_id = public.get_active_couple_id(auth.uid()));

-- Notifications (Couple Insert)
DROP POLICY IF EXISTS "notifications_couple_insert" ON public.notifications;
CREATE POLICY "notifications_couple_insert" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    couple_id = public.get_active_couple_id(auth.uid())
  );


-- 8. STORAGE CONFIGURATION (couples-media bucket)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'couples-media',
  'couples-media',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'audio/m4a', 'audio/mp4', 'audio/mpeg', 'audio/aac', 'audio/wav']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "couples_media_select" ON storage.objects;
CREATE POLICY "couples_media_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'couples-media' AND
    (storage.foldername(name))[1] = (public.get_active_couple_id(auth.uid()))::text
  );

DROP POLICY IF EXISTS "couples_media_insert" ON storage.objects;
CREATE POLICY "couples_media_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'couples-media' AND
    (storage.foldername(name))[1] = (public.get_active_couple_id(auth.uid()))::text
  );

DROP POLICY IF EXISTS "couples_media_delete" ON storage.objects;
CREATE POLICY "couples_media_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'couples-media' AND
    (storage.foldername(name))[1] = (public.get_active_couple_id(auth.uid()))::text
  );

-- 9. REALTIME PUBLICATIONS (for live sync of sessions, partner linking, letters)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.couple_members;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.session_events;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_sessions;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.letters;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.memories;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 10. FUNCTION PERMISSIONS & GRANTS
GRANT EXECUTE ON FUNCTION public.get_active_couple_id(UUID) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.create_couple_with_invite(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.accept_invitation(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.unlink_couple() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_session_events_masked(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.open_letter(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated, service_role;
