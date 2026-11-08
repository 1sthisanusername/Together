-- Migration: 20261107000000_init_auth_couple.sql
-- Description: Core schema for profiles, couples, couple_members, invitations, feature_flags, and entitlements

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  locale TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. COUPLES
CREATE TABLE IF NOT EXISTS public.couples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  start_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. COUPLE MEMBERS
CREATE TABLE IF NOT EXISTS public.couple_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'partner' CHECK (role IN ('creator', 'partner')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unlinked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure a user can only be in one active couple
CREATE UNIQUE INDEX IF NOT EXISTS idx_couple_members_active_user 
  ON public.couple_members(user_id) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_couple_members_couple_id 
  ON public.couple_members(couple_id);

-- Enforce exactly max 2 active members per couple via trigger
CREATE OR REPLACE FUNCTION public.check_couple_member_limit()
RETURNS TRIGGER AS $$
DECLARE
  active_count INT;
BEGIN
  IF NEW.status = 'active' THEN
    SELECT COUNT(*) INTO active_count
    FROM public.couple_members
    WHERE couple_id = NEW.couple_id
      AND status = 'active'
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    IF active_count >= 2 THEN
      RAISE EXCEPTION 'Couple % already has maximum allowed active members (2)', NEW.couple_id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_check_couple_member_limit ON public.couple_members;
CREATE TRIGGER tr_check_couple_member_limit BEFORE INSERT OR UPDATE ON public.couple_members
  FOR EACH ROW
  EXECUTE FUNCTION public.check_couple_member_limit();

-- 4. INVITATIONS
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '48 hours'),
  accepted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_invitations_code ON public.invitations(code);
CREATE INDEX IF NOT EXISTS idx_invitations_couple_id ON public.invitations(couple_id);

-- 5. FEATURE FLAGS & ENTITLEMENTS (Section 3.6 future-proofing)
CREATE TABLE IF NOT EXISTS public.feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  rollout_percent INT NOT NULL DEFAULT 0 CHECK (rollout_percent BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (couple_id, key)
);

-- Automatic updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS tr_couples_updated_at ON public.couples;
CREATE TRIGGER tr_couples_updated_at BEFORE UPDATE ON public.couples FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS tr_couple_members_updated_at ON public.couple_members;
CREATE TRIGGER tr_couple_members_updated_at BEFORE UPDATE ON public.couple_members FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS tr_invitations_updated_at ON public.invitations;
CREATE TRIGGER tr_invitations_updated_at BEFORE UPDATE ON public.invitations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS tr_feature_flags_updated_at ON public.feature_flags;
CREATE TRIGGER tr_feature_flags_updated_at BEFORE UPDATE ON public.feature_flags FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS tr_entitlements_updated_at ON public.entitlements;
CREATE TRIGGER tr_entitlements_updated_at BEFORE UPDATE ON public.entitlements FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. SECURITY DEFINER HELPER: get active couple_id for a user
CREATE OR REPLACE FUNCTION public.get_active_couple_id(p_user_id UUID DEFAULT auth.uid())
RETURNS UUID AS $$
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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 7. TRIGGER: automatically create profile on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, timezone, locale)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(COALESCE(NEW.email, 'User'), '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC'),
    COALESCE(NEW.raw_user_meta_data->>'locale', 'en')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = CASE WHEN public.profiles.display_name = '' THEN EXCLUDED.display_name ELSE public.profiles.display_name END,
    updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;

-- PROFILES Policies
-- Users can see their own profile or their partner's profile
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

-- COUPLES Policies
-- Accessible only if auth.uid() is an active member
DROP POLICY IF EXISTS "couples_select_active_member" ON public.couples;
CREATE POLICY "couples_select_active_member" ON public.couples
  FOR SELECT TO authenticated
  USING (
    id = public.get_active_couple_id(auth.uid())
  );

DROP POLICY IF EXISTS "couples_insert_authenticated" ON public.couples;
CREATE POLICY "couples_insert_authenticated" ON public.couples
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "couples_update_active_member" ON public.couples;
CREATE POLICY "couples_update_active_member" ON public.couples
  FOR UPDATE TO authenticated
  USING (
    id = public.get_active_couple_id(auth.uid())
  );

-- COUPLE MEMBERS Policies
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

-- INVITATIONS Policies
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

DROP POLICY IF EXISTS "invitations_update_inviter" ON public.invitations;
CREATE POLICY "invitations_update_inviter" ON public.invitations
  FOR UPDATE TO authenticated
  USING (inviter_id = auth.uid())
  WITH CHECK (inviter_id = auth.uid());

-- FEATURE FLAGS & ENTITLEMENTS Policies
DROP POLICY IF EXISTS "feature_flags_select_all" ON public.feature_flags;
CREATE POLICY "feature_flags_select_all" ON public.feature_flags
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "entitlements_select_couple" ON public.entitlements;
CREATE POLICY "entitlements_select_couple" ON public.entitlements
  FOR SELECT TO authenticated
  USING (
    couple_id = public.get_active_couple_id(auth.uid())
  );

-- 9. TRANSACTIONAL RPCS (Create couple + invite, Accept invite)
-- Generate unguessable 6-character code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- RPC: create_couple_with_invite
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

  -- Verify user is not already in an active couple
  SELECT couple_id INTO v_existing_couple_id
  FROM public.couple_members
  WHERE user_id = v_user_id AND status = 'active';

  IF v_existing_couple_id IS NOT NULL THEN
    RAISE EXCEPTION 'User is already an active member of a couple'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Ensure caller profile exists in public.profiles (self-healing for foreign key constraint)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: accept_invitation
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

  -- Ensure partner profile exists in public.profiles (self-healing for foreign key constraint)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: unlink_couple
CREATE OR REPLACE FUNCTION public.unlink_couple()
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_couple_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT couple_id INTO v_couple_id
  FROM public.couple_members
  WHERE user_id = v_user_id AND status = 'active';

  IF v_couple_id IS NULL THEN
    RAISE EXCEPTION 'No active couple found for user'
      USING ERRCODE = 'no_data_found';
  END IF;

  -- Mark all active members of this couple as unlinked
  UPDATE public.couple_members
  SET status = 'unlinked',
      updated_at = timezone('utc'::text, now())
  WHERE couple_id = v_couple_id AND status = 'active';

  -- Revoke any pending invitations
  UPDATE public.invitations
  SET status = 'revoked',
      updated_at = timezone('utc'::text, now())
  WHERE couple_id = v_couple_id AND status = 'pending';

  RETURN jsonb_build_object(
    'couple_id', v_couple_id,
    'status', 'unlinked'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
DROP TRIGGER IF EXISTS tr_media_files_updated_at ON public.media_files;
CREATE TRIGGER tr_media_files_updated_at BEFORE UPDATE ON public.media_files FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS tr_activities_updated_at ON public.activities;
CREATE TRIGGER tr_activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS tr_activity_sessions_updated_at ON public.activity_sessions;
CREATE TRIGGER tr_activity_sessions_updated_at BEFORE UPDATE ON public.activity_sessions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS tr_letters_updated_at ON public.letters;
CREATE TRIGGER tr_letters_updated_at BEFORE UPDATE ON public.letters FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS tr_memories_updated_at ON public.memories;
CREATE TRIGGER tr_memories_updated_at BEFORE UPDATE ON public.memories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS tr_bucket_items_updated_at ON public.bucket_items;
CREATE TRIGGER tr_bucket_items_updated_at BEFORE UPDATE ON public.bucket_items FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS tr_important_dates_updated_at ON public.important_dates;
CREATE TRIGGER tr_important_dates_updated_at BEFORE UPDATE ON public.important_dates FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS tr_user_settings_updated_at ON public.user_settings;
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
DROP POLICY IF EXISTS "activities_select_all" ON public.activities;
CREATE POLICY "activities_select_all" ON public.activities
  FOR SELECT TO authenticated USING (true);

-- Couple-based RLS Helper Expression:
-- couple_id = public.get_active_couple_id(auth.uid())

-- MEDIA FILES
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

-- ACTIVITY SESSIONS
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

-- SESSION EVENTS
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

-- LETTERS
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

-- MESSAGES
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

-- MEMORIES
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

-- BUCKET ITEMS
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

-- IMPORTANT DATES
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

-- NOTIFICATIONS
DROP POLICY IF EXISTS "notifications_recipient_select" ON public.notifications;
CREATE POLICY "notifications_recipient_select" ON public.notifications
  FOR SELECT TO authenticated
  USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "notifications_couple_insert" ON public.notifications;
CREATE POLICY "notifications_couple_insert" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    couple_id = public.get_active_couple_id(auth.uid())
  );

DROP POLICY IF EXISTS "notifications_recipient_update" ON public.notifications;
CREATE POLICY "notifications_recipient_update" ON public.notifications
  FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid());

-- USER SETTINGS
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

-- Migration: 20261107000002_account_deletion_and_storage.sql
-- Description: Complete account deletion flow and private storage configuration

-- 1. ACCOUNT DELETION (Section 11)
-- Permanently deletes all personal data, memberships, and content for the calling user
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

  -- 2. Delete user's notifications, settings, and media files records
  DELETE FROM public.notifications WHERE recipient_id = v_user_id;
  DELETE FROM public.user_settings WHERE user_id = v_user_id;

  -- 3. If in a couple, check if partner remains
  IF v_couple_id IS NOT NULL THEN
    -- Mark this user's membership as unlinked/deleted
    DELETE FROM public.couple_members WHERE user_id = v_user_id AND couple_id = v_couple_id;

    -- Count remaining active members in that couple
    SELECT COUNT(*) INTO v_remaining_members
    FROM public.couple_members
    WHERE couple_id = v_couple_id AND status = 'active';

    -- If no active members remain, purge the entire couple space
    IF v_remaining_members = 0 THEN
      DELETE FROM public.couples WHERE id = v_couple_id;
    END IF;
  END IF;

  -- 4. Delete user profile (cascades or cleans up auth linkages)
  DELETE FROM public.profiles WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'user_id', v_user_id,
    'status', 'account_deleted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. STORAGE CONFIGURATION (couples-media bucket)
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

-- 3. REALTIME PUBLICATIONS (for live sync of sessions, partner linking, letters)
DO $
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.couple_members;
EXCEPTION WHEN OTHERS THEN NULL;
END $;

DO $
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.session_events;
EXCEPTION WHEN OTHERS THEN NULL;
END $;

DO $
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_sessions;
EXCEPTION WHEN OTHERS THEN NULL;
END $;

DO $
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.letters;
EXCEPTION WHEN OTHERS THEN NULL;
END $;

DO $
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.memories;
EXCEPTION WHEN OTHERS THEN NULL;
END $;

DO $
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN OTHERS THEN NULL;
END $;

-- 4. FUNCTION PERMISSIONS & GRANTS
GRANT EXECUTE ON FUNCTION public.get_active_couple_id(UUID) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.create_couple_with_invite(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.accept_invitation(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.unlink_couple() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_session_events_masked(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.open_letter(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated, service_role;

-- Seed: 25 Activities across all MVP categories and kinds (Section 6)

INSERT INTO public.activities (slug, title, description, kind, category, mode, duration_minutes, icon, config) VALUES
-- Would You Rather (Play)
('wyr-cozy-vs-wild', 'Cozy Night vs Wild Adventure', 'Discover each other''s spontaneous and comfort preferences with playful dilemmas.', 'would_you_rather', 'play', 'both', 10, 'sparkles', '{
  "rounds": [
    {"id": 1, "question": "Would you rather have a candlelit dinner at home or sneak into a fancy rooftop lounge?", "optionA": "Candlelit dinner at home", "optionB": "Sneak into a rooftop lounge"},
    {"id": 2, "question": "Would you rather wake up to homemade breakfast in bed or stay up until 4 AM talking under the stars?", "optionA": "Breakfast in bed", "optionB": "Late night stargazing"},
    {"id": 3, "question": "Would you rather take a sudden road trip with no destination or spend a weekend at a quiet cabin?", "optionA": "Spontaneous road trip", "optionB": "Quiet cabin retreat"},
    {"id": 4, "question": "Would you rather never have to cook again or never have to do dishes again?", "optionA": "Never cook", "optionB": "Never do dishes"},
    {"id": 5, "question": "Would you rather rewatch our favorite comfort show or start an exciting mystery together?", "optionA": "Comfort show rewatch", "optionB": "New mystery series"}
  ]
}'::jsonb),

('wyr-travel-dreams', 'Dream Vacations & Escapes', 'Explore your future travel bucket list and travel style choices.', 'would_you_rather', 'play', 'both', 10, 'airplane', '{
  "rounds": [
    {"id": 1, "question": "Would you rather backpack across Europe on a budget or stay in an overwater bungalow in the Maldives for 3 days?", "optionA": "Europe backpacking", "optionB": "Maldives bungalow"},
    {"id": 2, "question": "Would you rather get lost in a vibrant night market in Tokyo or hike the Swiss Alps?", "optionA": "Tokyo night markets", "optionB": "Swiss Alps hiking"},
    {"id": 3, "question": "Would you rather travel back in time to our first meeting or 20 years into our future?", "optionA": "Our first meeting", "optionB": "20 years into the future"},
    {"id": 4, "question": "Would you rather always have the window seat or always get free first-class upgrades for only one of us?", "optionA": "Guaranteed window seat", "optionB": "One first-class upgrade"},
    {"id": 5, "question": "Would you rather rent a vintage camper van or a beachfront glass villa?", "optionA": "Vintage camper van", "optionB": "Beachfront villa"}
  ]
}'::jsonb),

('wyr-quirky-habits', 'Quirks & Superpowers', 'Lighthearted questions about bizarre scenarios and habits.', 'would_you_rather', 'play', 'both', 8, 'smile', '{
  "rounds": [
    {"id": 1, "question": "Would you rather have a personal chef or a personal masseuse?", "optionA": "Personal chef", "optionB": "Personal masseuse"},
    {"id": 2, "question": "Would you rather be able to read my mind for 1 hour or have me read yours for 1 day?", "optionA": "Read my mind (1 hr)", "optionB": "Read yours (1 day)"},
    {"id": 3, "question": "Would you rather always have cold hands or always have warm feet?", "optionA": "Cold hands", "optionB": "Warm feet"},
    {"id": 4, "question": "Would you rather communicate only through emojis for 24 hours or in rhymes?", "optionA": "Emojis only", "optionB": "Rhymes only"}
  ]
}'::jsonb),

-- Who Knows Whom Better (Play)
('who-knows-daily-habits', 'Who Knows Whom Better: Daily Habits', 'Test how well you really observe each other''s everyday routines and secrets.', 'who_knows_whom', 'play', 'both', 12, 'heart', '{
  "rounds": [
    {"id": 1, "target": "partner_a", "prompt": "What is my absolute go-to comfort meal when I am stressed?", "type": "free_text"},
    {"id": 2, "target": "partner_b", "prompt": "What is the very first thing I do after turning off my morning alarm?", "type": "free_text"},
    {"id": 3, "target": "partner_a", "prompt": "What is my biggest pet peeve when traveling or running errands?", "type": "free_text"},
    {"id": 4, "target": "partner_b", "prompt": "Which song or artist instantly puts me in a great mood?", "type": "free_text"},
    {"id": 5, "target": "both", "prompt": "Who is usually the first person to apologize after a disagreement?", "type": "choice", "options": ["Partner A", "Partner B", "Equal"]}
  ]
}'::jsonb),

('who-knows-childhood-memories', 'Childhood & Growing Up', 'Discover sweet stories and see how much of your early years your partner remembers.', 'who_knows_whom', 'play', 'both', 12, 'book', '{
  "rounds": [
    {"id": 1, "target": "partner_a", "prompt": "What did I want to be when I grew up as a kid?", "type": "free_text"},
    {"id": 2, "target": "partner_b", "prompt": "What was the name of my first pet or favorite childhood toy?", "type": "free_text"},
    {"id": 3, "target": "partner_a", "prompt": "Was I an introverted or extroverted child?", "type": "choice", "options": ["Introverted", "Extroverted", "A bit of both"]},
    {"id": 4, "target": "partner_b", "prompt": "What was my least favorite school subject?", "type": "free_text"}
  ]
}'::jsonb),

-- Guess My Answer (Play)
('guess-my-favorite-things', 'Guess My Absolute Favorites', 'Can you guess what your partner would pick from these categories?', 'guess_my_answer', 'play', 'both', 10, 'help-circle', '{
  "rounds": [
    {"id": 1, "question": "If I could only eat one cuisine for the rest of my life, which would I pick?", "options": ["Italian", "Mexican", "Japanese / Sushi", "Indian", "Thai", "Burgers & BBQ"]},
    {"id": 2, "question": "What is my ideal Sunday morning vibe?", "options": ["Sleeping in till noon", "Coffee & a quiet book", "Brisk morning run/gym", "Brunch with good music", "Binging a series in bed"]},
    {"id": 3, "question": "What movie genre would I pick for movie night?", "options": ["Romantic Comedy", "Psychological Thriller", "Sci-Fi / Fantasy", "Action / Adventure", "True Crime Documentary"]},
    {"id": 4, "question": "If I won $10,000 today, what would I spend the majority of it on?", "options": ["Flights to see you", "Savings / Investing", "Dream shopping spree", "A luxury gadget/upgrade", "Fancy restaurant celebration"]}
  ]
}'::jsonb),

('guess-my-secret-wishes', 'Secret Wishes & Desires', 'Guess what your partner is longing for right now.', 'guess_my_answer', 'play', 'both', 10, 'sparkles', '{
  "rounds": [
    {"id": 1, "question": "What is the #1 thing I miss most about having you right next to me right now?", "options": ["Your hugs and warmth", "Cooking together in the kitchen", "Laughing at silly jokes in person", "Falling asleep next to you", "Exploring places hand-in-hand"]},
    {"id": 2, "question": "Where is the first place we should go the day we reunite?", "options": ["Straight home for cuddles", "Our favorite restaurant", "A walk in the park", "A weekend getaway road trip"]},
    {"id": 3, "question": "What is a new hobby I would love to try together with you?", "options": ["Pottery / Painting", "Cooking class", "Scuba diving / Snorkeling", "Rock climbing", "Dance lessons"]}
  ]
}'::jsonb),

-- Drawing & Guessing (Play)
('drawing-classic-love', 'Doodle & Guess: Love Edition', 'Draw a prompt and let your partner guess what you sketched!', 'drawing_guess', 'play', 'live', 15, 'edit-3', '{
  "rounds": [
    {"id": 1, "drawer": "partner_a", "prompt": "Airplane flying across the globe"},
    {"id": 2, "drawer": "partner_b", "prompt": "Two coffee cups touching"},
    {"id": 3, "drawer": "partner_a", "prompt": "Heart-shaped pizza"},
    {"id": 4, "drawer": "partner_b", "prompt": "Couple watching sunset on a beach"}
  ]
}'::jsonb),

('drawing-silly-animals', 'Doodle & Guess: Silly Animals', 'Fast-paced, funny animal sketching challenge.', 'drawing_guess', 'play', 'live', 12, 'edit-2', '{
  "rounds": [
    {"id": 1, "drawer": "partner_a", "prompt": "Penguin wearing sunglasses"},
    {"id": 2, "drawer": "partner_b", "prompt": "Cat eating spaghetti"},
    {"id": 3, "drawer": "partner_a", "prompt": "Giraffe doing yoga"},
    {"id": 4, "drawer": "partner_b", "prompt": "Panda riding a bicycle"}
  ]
}'::jsonb),

-- Quizzes (Play & Deep Talk)
('quiz-love-languages', 'The 5 Love Languages Quiz', 'Understand each other''s primary and secondary ways of giving and receiving love.', 'quiz', 'deep_talk', 'both', 15, 'heart', '{
  "rounds": [
    {"id": 1, "question": "Which of these makes you feel most cherished?", "options": ["Hearing sincere verbal compliments and ''I love you''", "Receiving a thoughtful surprise gift", "Spending uninterrupted focused time together", "Having your partner help lighten your daily load", "Physical touch like a warm long hug"]},
    {"id": 2, "question": "When we are apart long-distance, what matters most to your heart?", "options": ["Surprise handwritten letters or voice notes", "Consistent scheduled quality call dates", "Cheering each other up through tough tasks", "Small care packages in the mail", "Reminding each other of our future together"]},
    {"id": 3, "question": "How do you most naturally show love when you care deeply?", "options": ["Words of encouragement", "Giving gifts & surprises", "Planning special experiences", "Doing thoughtful acts of service", "Affection and closeness"]}
  ]
}'::jsonb),

('quiz-our-relationship-milestones', 'Our Relationship Milestones Trivia', 'How accurately do you remember the exact moments of our journey?', 'quiz', 'play', 'both', 10, 'clock', '{
  "rounds": [
    {"id": 1, "question": "What month and day was our very first official date or conversation?", "type": "free_text"},
    {"id": 2, "question": "Who said ''I love you'' first, or was it simultaneous?", "type": "choice", "options": ["Partner A", "Partner B", "Both together"]},
    {"id": 3, "question": "What is our all-time favorite inside joke or nickname?", "type": "free_text"},
    {"id": 4, "question": "What was the very first meal or treat we ever shared together?", "type": "free_text"}
  ]
}'::jsonb),

-- Photo Missions (Async Challenges)
('photo-mission-daily-view', 'Daily View Mission', 'Snap a photo of the view from your window or current workspace right now.', 'photo_mission', 'play', 'async', 5, 'camera', '{
  "prompt": "Take a photo of whatever is in front of your eyes right this second—no cleaning up or staging allowed!",
  "instructions": "Upload a candid shot showing what your day looks like right now.",
  "rewardMessage": "You brought your partner right into your room today!"
}'::jsonb),

('photo-mission-something-that-reminds-me', 'Something That Reminds Me of You', 'Find an object around you that instantly makes you think of your partner.', 'photo_mission', 'play', 'async', 8, 'camera', '{
  "prompt": "Find something in your room or around your city that whispers their name.",
  "instructions": "Take a photo and add a sweet note explaining why it reminds you of them.",
  "rewardMessage": "Shared a piece of your heart across the distance."
}'::jsonb),

('photo-mission-cozy-mug', 'Morning Drink & Cozy Moment', 'Snap your morning coffee, tea, or water mug.', 'photo_mission', 'play', 'async', 5, 'coffee', '{
  "prompt": "Show your morning brew and where you are sipping it from.",
  "instructions": "Snap your mug and send your morning love.",
  "rewardMessage": "Cheers to another day closer to each other."
}'::jsonb),

-- Guided Virtual Dates (Dates Tab)
('guided-date-candlelit-dinner', 'Virtual Candlelight Dinner', 'Turn an ordinary dinner into an intimate, romantic virtual date with timed courses and talk cards.', 'guided_date', 'dates', 'live', 45, 'moon', '{
  "steps": [
    {"id": "step1", "title": "Date Preparation", "duration_minutes": 5, "description": "Set your table, dim the lights, light a candle if you have one, and grab your favorite meal and drink."},
    {"id": "step2", "title": "The Toast", "duration_minutes": 5, "description": "Raise your glasses together. Share one thing about your partner that you felt deeply grateful for this past week."},
    {"id": "step3", "title": "Main Course & Deep Conversation", "duration_minutes": 25, "description": "Enjoy your dinner together while answering these prompts: What made you smile today? What is something new you learned about yourself recently?"},
    {"id": "step4", "title": "Dessert & Sweet Wishes", "duration_minutes": 10, "description": "Enjoy a sweet treat or warm tea. Share one dream date you cannot wait to take your partner on when you next reunite."}
  ]
}'::jsonb),

('guided-date-movie-night', 'Synchronized Movie Night', 'Set up, grab your popcorn, countdown together, and dive into your chosen film.', 'guided_date', 'dates', 'live', 60, 'tv', '{
  "steps": [
    {"id": "step1", "title": "Snack & Drink Prep", "duration_minutes": 5, "description": "Get your popcorn, snacks, drinks, and cozy blankets ready."},
    {"id": "step2", "title": "Sync & 3-2-1 Play!", "duration_minutes": 3, "description": "Cue up your selected movie on both screens. Use our synced countdown timer to press Play at the exact same second!"},
    {"id": "step3", "title": "Movie In Progress", "duration_minutes": 50, "description": "Enjoy the show! Send quick live emoji reactions to each other right from the screen."},
    {"id": "step4", "title": "Post-Credits Review", "duration_minutes": 10, "description": "Rate the movie out of 10. Discuss your favorite scene and the craziest plot twist."}
  ]
}'::jsonb),

('guided-date-stargazing', 'Late Night Stargazing & Whispers', 'Step outside or look through your window into the night sky together.', 'guided_date', 'dates', 'live', 30, 'star', '{
  "steps": [
    {"id": "step1", "title": "Look Up Together", "duration_minutes": 5, "description": "Find a window or step onto your balcony/yard. Look at the moon and stars knowing your partner is under that same sky."},
    {"id": "step2", "title": "Share a Wish", "duration_minutes": 10, "description": "If you could whisper one wish to a shooting star right now, what would it be?"},
    {"id": "step3", "title": "Future Home Blueprint", "duration_minutes": 15, "description": "Imagine our dream home together: what does the kitchen look like? Is there a porch or a big window?"}
  ]
}'::jsonb),

('guided-date-book-club', 'Two-Person Cozy Book Club', 'Read a chapter of a shared book or poem out loud to each other.', 'guided_date', 'dates', 'live', 35, 'book-open', '{
  "steps": [
    {"id": "step1", "title": "Settle In With Warm Tea", "duration_minutes": 5, "description": "Grab a hot drink, cozy cushions, and open your shared chapter."},
    {"id": "step2", "title": "Taking Turns Reading", "duration_minutes": 20, "description": "Partner A reads page 1, Partner B reads page 2. Listen to the soothing sound of your partner''s voice."},
    {"id": "step3", "title": "Thoughts & Reactions", "duration_minutes": 10, "description": "Discuss your favorite line and what the story made you feel."}
  ]
}'::jsonb),

-- Deep Talk & Conversation Cards
('deep-talk-vulnerability', 'Deep Talk: Heart to Heart', 'Meaningful, gentle questions to understand each other on a deeper layer.', 'quiz', 'deep_talk', 'both', 20, 'message-circle', '{
  "rounds": [
    {"id": 1, "question": "What is a fear you carry that you rarely speak out loud?", "type": "free_text"},
    {"id": 2, "question": "When do you feel most safe, seen, and accepted by me?", "type": "free_text"},
    {"id": 3, "question": "What is one dream you hope we accomplish together in the next 3 years?", "type": "free_text"},
    {"id": 4, "question": "How can I better support you when you are having an emotionally draining day?", "type": "free_text"}
  ]
}'::jsonb),

('deep-talk-future-dreams', 'Building Our Future Vision', 'Align on your long-term hopes, careers, values, and shared life.', 'quiz', 'deep_talk', 'both', 20, 'compass', '{
  "rounds": [
    {"id": 1, "question": "Where in the world would you love for us to build our home base?", "type": "free_text"},
    {"id": 2, "question": "What tradition from our families do you want to keep, and what new one should we create?", "type": "free_text"},
    {"id": 3, "question": "What does a truly peaceful, successful weekend look like to you in 5 years?", "type": "free_text"}
  ]
}'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  config = EXCLUDED.config,
  duration_minutes = EXCLUDED.duration_minutes,
  category = EXCLUDED.category,
  mode = EXCLUDED.mode;

