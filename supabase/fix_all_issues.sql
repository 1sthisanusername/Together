-- ==============================================================================
-- TOGETHER APP: COMPLETE FIX FOR ALL SUPABASE ISSUES
-- Run this entire script in the Supabase SQL Editor.
-- Fixes:
--   1. Foreign key constraint "couple_members_user_id_fkey" (missing profile)
--   2. Infinite recursion in "couple_members" RLS policies
--   3. Storage bucket "couples-media" and storage RLS
--   4. Realtime table publications
--   5. RPC execution permissions
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- STEP 1: BACKFILL & ENSURE ALL AUTH USERS HAVE A PROFILE IN public.profiles
-- This immediately resolves: "insert or update on table couple_members violates foreign key constraint"
-- ------------------------------------------------------------------------------
INSERT INTO public.profiles (id, email, display_name, timezone, locale)
SELECT 
  u.id,
  u.email,
  COALESCE(
    u.raw_user_meta_data->>'display_name',
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(COALESCE(u.email, 'User'), '@', 1)
  ),
  COALESCE(u.raw_user_meta_data->>'timezone', 'UTC'),
  COALESCE(u.raw_user_meta_data->>'locale', 'en')
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  display_name = CASE 
    WHEN public.profiles.display_name IS NULL OR public.profiles.display_name = '' 
    THEN EXCLUDED.display_name 
    ELSE public.profiles.display_name 
  END;

-- ------------------------------------------------------------------------------
-- STEP 2: BULLETPROOF TRIGGER FOR NEW & UPDATED AUTH USERS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, timezone, locale)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(COALESCE(NEW.email, 'User'), '@', 1)
    ),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC'),
    COALESCE(NEW.raw_user_meta_data->>'locale', 'en')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = CASE 
      WHEN public.profiles.display_name IS NULL OR public.profiles.display_name = '' 
      THEN EXCLUDED.display_name 
      ELSE public.profiles.display_name 
    END,
    updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- STEP 3: SECURITY DEFINER HELPER (Bypasses RLS to eliminate recursion)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- STEP 4: SELF-HEALING RPCS (create_couple_with_invite & accept_invitation)
-- These guarantee the profile exists before inserting into couple_members!
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_couple_with_invite(p_couple_name TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_existing_couple_id UUID;
  v_couple_id UUID;
  v_invite_code TEXT;
  v_invitation_id UUID;
  v_expires_at TIMESTAMPTZ;
  v_code_exists BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Self-heal: Ensure caller's profile exists in public.profiles
  INSERT INTO public.profiles (id, email, display_name, timezone, locale)
  SELECT 
    v_user_id,
    u.email,
    COALESCE(
      u.raw_user_meta_data->>'display_name',
      u.raw_user_meta_data->>'full_name',
      u.raw_user_meta_data->>'name',
      split_part(COALESCE(u.email, 'User'), '@', 1)
    ),
    COALESCE(u.raw_user_meta_data->>'timezone', 'UTC'),
    COALESCE(u.raw_user_meta_data->>'locale', 'en')
  FROM auth.users u
  WHERE u.id = v_user_id
  ON CONFLICT (id) DO NOTHING;

  -- Verify user is not already in an active couple
  SELECT couple_id INTO v_existing_couple_id
  FROM public.couple_members
  WHERE user_id = v_user_id AND status = 'active';

  IF v_existing_couple_id IS NOT NULL THEN
    RAISE EXCEPTION 'User is already an active member of a couple'
      USING ERRCODE = 'check_violation';
  END IF;

  -- 1. Create couple
  INSERT INTO public.couples (name)
  VALUES (p_couple_name)
  RETURNING id INTO v_couple_id;

  -- 2. Add creator as first active member with role 'creator'
  INSERT INTO public.couple_members (couple_id, user_id, role, status)
  VALUES (v_couple_id, v_user_id, 'creator', 'active');

  -- 3. Generate unique invite code
  LOOP
    v_invite_code := public.generate_invite_code();
    SELECT EXISTS(SELECT 1 FROM public.invitations WHERE code = v_invite_code AND status = 'pending')
    INTO v_code_exists;
    EXIT WHEN NOT v_code_exists;
  END LOOP;

  v_expires_at := timezone('utc'::text, now()) + interval '48 hours';

  -- 4. Create invitation
  INSERT INTO public.invitations (couple_id, inviter_id, code, status, expires_at)
  VALUES (v_couple_id, v_user_id, v_invite_code, 'pending', v_expires_at)
  RETURNING id INTO v_invitation_id;

  RETURN jsonb_build_object(
    'couple_id', v_couple_id,
    'couple_name', p_couple_name,
    'invitation_id', v_invitation_id,
    'invite_code', v_invite_code,
    'expires_at', v_expires_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.accept_invitation(p_invite_code TEXT)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_existing_couple_id UUID;
  v_invitation RECORD;
  v_active_count INT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Self-heal: Ensure partner profile exists in public.profiles
  INSERT INTO public.profiles (id, email, display_name, timezone, locale)
  SELECT 
    v_user_id,
    u.email,
    COALESCE(
      u.raw_user_meta_data->>'display_name',
      u.raw_user_meta_data->>'full_name',
      u.raw_user_meta_data->>'name',
      split_part(COALESCE(u.email, 'User'), '@', 1)
    ),
    COALESCE(u.raw_user_meta_data->>'timezone', 'UTC'),
    COALESCE(u.raw_user_meta_data->>'locale', 'en')
  FROM auth.users u
  WHERE u.id = v_user_id
  ON CONFLICT (id) DO NOTHING;

  -- Verify user is not already in an active couple
  SELECT couple_id INTO v_existing_couple_id
  FROM public.couple_members
  WHERE user_id = v_user_id AND status = 'active';

  IF v_existing_couple_id IS NOT NULL THEN
    RAISE EXCEPTION 'User is already an active member of a couple'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Lock and fetch invitation
  SELECT * INTO v_invitation
  FROM public.invitations
  WHERE UPPER(code) = UPPER(TRIM(p_invite_code))
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation code not found'
      USING ERRCODE = 'no_data_found';
  END IF;

  IF v_invitation.status <> 'pending' THEN
    RAISE EXCEPTION 'Invitation is no longer active (status: %)', v_invitation.status
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_invitation.expires_at <= timezone('utc'::text, now()) THEN
    UPDATE public.invitations SET status = 'expired', updated_at = timezone('utc'::text, now())
    WHERE id = v_invitation.id;
    RAISE EXCEPTION 'Invitation code has expired'
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_invitation.inviter_id = v_user_id THEN
    RAISE EXCEPTION 'Cannot accept your own invitation'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Check couple active members count
  SELECT COUNT(*) INTO v_active_count
  FROM public.couple_members
  WHERE couple_id = v_invitation.couple_id AND status = 'active';

  IF v_active_count >= 2 THEN
    RAISE EXCEPTION 'This couple already has the maximum of 2 partners'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Add partner
  INSERT INTO public.couple_members (couple_id, user_id, role, status)
  VALUES (v_invitation.couple_id, v_user_id, 'partner', 'active');

  -- Mark invitation as accepted
  UPDATE public.invitations
  SET status = 'accepted',
      accepted_by = v_user_id,
      updated_at = timezone('utc'::text, now())
  WHERE id = v_invitation.id;

  RETURN jsonb_build_object(
    'couple_id', v_invitation.couple_id,
    'status', 'linked'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- STEP 5: ROW LEVEL SECURITY POLICIES (Guarded with DROP IF EXISTS)
-- ------------------------------------------------------------------------------
-- Couple Members
DROP POLICY IF EXISTS "couple_members_select_active_member_or_self" ON public.couple_members;
CREATE POLICY "couple_members_select_active_member_or_self" ON public.couple_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    couple_id = public.get_active_couple_id(auth.uid())
  );

DROP POLICY IF EXISTS "couple_members_insert_self" ON public.couple_members;
CREATE POLICY "couple_members_insert_self" ON public.couple_members
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "couple_members_update_self" ON public.couple_members;
CREATE POLICY "couple_members_update_self" ON public.couple_members
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Profiles
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

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Couples
DROP POLICY IF EXISTS "couples_select_active_member" ON public.couples;
CREATE POLICY "couples_select_active_member" ON public.couples
  FOR SELECT TO authenticated
  USING (id = public.get_active_couple_id(auth.uid()));

DROP POLICY IF EXISTS "couples_insert_authenticated" ON public.couples;
CREATE POLICY "couples_insert_authenticated" ON public.couples
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "couples_update_active_member" ON public.couples;
CREATE POLICY "couples_update_active_member" ON public.couples
  FOR UPDATE TO authenticated
  USING (id = public.get_active_couple_id(auth.uid()));

-- Invitations
DROP POLICY IF EXISTS "invitations_select_active_couple_member" ON public.invitations;
CREATE POLICY "invitations_select_active_couple_member" ON public.invitations
  FOR SELECT TO authenticated
  USING (couple_id = public.get_active_couple_id(auth.uid()));

DROP POLICY IF EXISTS "invitations_insert_active_couple_member" ON public.invitations;
CREATE POLICY "invitations_insert_active_couple_member" ON public.invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    inviter_id = auth.uid() AND
    couple_id = public.get_active_couple_id(auth.uid())
  );

DROP POLICY IF EXISTS "invitations_update_inviter" ON public.invitations;
CREATE POLICY "invitations_update_inviter" ON public.invitations
  FOR UPDATE TO authenticated
  USING (inviter_id = auth.uid())
  WITH CHECK (inviter_id = auth.uid());

-- Feature Flags & Entitlements
DROP POLICY IF EXISTS "feature_flags_select_all" ON public.feature_flags;
CREATE POLICY "feature_flags_select_all" ON public.feature_flags
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "entitlements_select_couple" ON public.entitlements;
CREATE POLICY "entitlements_select_couple" ON public.entitlements
  FOR SELECT TO authenticated
  USING (couple_id = public.get_active_couple_id(auth.uid()));

-- Feature Tables
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

DROP POLICY IF EXISTS "media_files_owner_delete" ON public.media_files;
CREATE POLICY "media_files_owner_delete" ON public.media_files
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

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

DROP POLICY IF EXISTS "notifications_recipient_select" ON public.notifications;
CREATE POLICY "notifications_recipient_select" ON public.notifications
  FOR SELECT TO authenticated
  USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "notifications_couple_insert" ON public.notifications;
CREATE POLICY "notifications_couple_insert" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (couple_id = public.get_active_couple_id(auth.uid()));

DROP POLICY IF EXISTS "notifications_recipient_update" ON public.notifications;
CREATE POLICY "notifications_recipient_update" ON public.notifications
  FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "user_settings_select_own" ON public.user_settings;
CREATE POLICY "user_settings_select_own" ON public.user_settings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_settings_insert_own" ON public.user_settings;
CREATE POLICY "user_settings_insert_own" ON public.user_settings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_settings_update_own" ON public.user_settings;
CREATE POLICY "user_settings_update_own" ON public.user_settings
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ------------------------------------------------------------------------------
-- STEP 6: STORAGE CONFIGURATION (couples-media bucket)
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- STEP 7: REALTIME PUBLICATIONS
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- STEP 8: FUNCTION PERMISSIONS & GRANTS
-- ------------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.get_active_couple_id(UUID) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.create_couple_with_invite(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.accept_invitation(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.unlink_couple() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_session_events_masked(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.open_letter(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated, service_role;

