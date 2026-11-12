-- ==============================================================================
-- TOGETHER APP: COMPLETE SAFE UNIFIED DATABASE SETUP
-- File: supabase/complete_database_setup.sql
--
-- This script is 100% idempotent and safe to run directly in the Supabase
-- SQL Editor. It creates or updates all tables, extensions, functions,
-- triggers, RLS security policies, storage buckets, Realtime publications,
-- and all 25 activity seeds in a single run.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. STORAGE BUCKET CONFIGURATION (Safe block)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'couples-media',
    'couples-media',
    false,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'audio/mp4', 'audio/m4a', 'audio/mpeg', 'audio/aac']
  )
  ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'audio/mp4', 'audio/m4a', 'audio/mpeg', 'audio/aac'];
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- ------------------------------------------------------------------------------
-- 2. CORE SCHEMAS & TABLES (With idempotent column patching)
-- ------------------------------------------------------------------------------

-- 2.1 Profiles (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  locale TEXT NOT NULL DEFAULT 'en',
  last_seen_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 2.2 Couples
CREATE TABLE IF NOT EXISTS public.couples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unlinked')),
  start_date DATE,
  home_photo_url TEXT,
  home_photo_updated_at TIMESTAMPTZ,
  home_photo_updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.couples ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unlinked'));
ALTER TABLE public.couples ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.couples ADD COLUMN IF NOT EXISTS home_photo_url TEXT;
ALTER TABLE public.couples ADD COLUMN IF NOT EXISTS home_photo_updated_at TIMESTAMPTZ;
ALTER TABLE public.couples ADD COLUMN IF NOT EXISTS home_photo_updated_by UUID REFERENCES public.profiles(id);

-- 2.3 Couple Members
CREATE TABLE IF NOT EXISTS public.couple_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'partner' CHECK (role IN ('creator', 'partner')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unlinked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_couple_members_active_user 
  ON public.couple_members(user_id) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_couple_members_couple_id 
  ON public.couple_members(couple_id);

CREATE INDEX IF NOT EXISTS idx_couple_members_lookup 
  ON public.couple_members(user_id, status, couple_id);

-- 2.4 Invitations
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

-- 2.5 Activities Catalogue
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  kind TEXT NOT NULL,
  category TEXT NOT NULL,
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

-- 2.6 Activity Sessions
CREATE TABLE IF NOT EXISTS public.activity_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'waiting', 'active', 'paused', 'completed', 'cancelled')),
  current_round INT NOT NULL DEFAULT 1,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.activity_sessions ADD COLUMN IF NOT EXISTS current_round INT NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_activity_sessions_couple_id ON public.activity_sessions(couple_id);
CREATE INDEX IF NOT EXISTS idx_activity_sessions_status ON public.activity_sessions(status);
CREATE INDEX IF NOT EXISTS idx_activity_sessions_home_lookup 
  ON public.activity_sessions(couple_id, status, created_at DESC);

-- 2.7 Session Events
CREATE TABLE IF NOT EXISTS public.session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.activity_sessions(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_session_events_idempotency 
  ON public.session_events(session_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_session_events_session_id ON public.session_events(session_id);
CREATE INDEX IF NOT EXISTS idx_session_events_home_session 
  ON public.session_events(session_id, created_at ASC);

-- 2.8 Memories
CREATE TABLE IF NOT EXISTS public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.activity_sessions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  note TEXT,
  memory_date DATE NOT NULL DEFAULT CURRENT_DATE,
  media_id UUID,
  media_ids UUID[] NOT NULL DEFAULT '{}',
  favorite BOOLEAN NOT NULL DEFAULT false,
  is_vault BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.memories ADD COLUMN IF NOT EXISTS media_ids UUID[] NOT NULL DEFAULT '{}';
ALTER TABLE public.memories ADD COLUMN IF NOT EXISTS is_vault BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_memories_couple_id ON public.memories(couple_id);

-- 2.9 Media Files
CREATE TABLE IF NOT EXISTS public.media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  memory_id UUID REFERENCES public.memories(id) ON DELETE CASCADE,
  bucket_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INT,
  duration_seconds INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS memory_id UUID REFERENCES public.memories(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_media_files_couple_id ON public.media_files(couple_id);
CREATE INDEX IF NOT EXISTS idx_media_files_memory_id ON public.media_files(memory_id);

-- Safe foreign key link from memories to media_files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_memories_media_id' AND table_name = 'memories'
  ) THEN
    ALTER TABLE public.memories ADD CONSTRAINT fk_memories_media_id FOREIGN KEY (media_id) REFERENCES public.media_files(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 2.10 Open When Letters
CREATE TABLE IF NOT EXISTS public.letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  theme TEXT NOT NULL DEFAULT 'classic',
  stationery_theme TEXT DEFAULT 'parchment_cream',
  seal_sticker TEXT DEFAULT '❤️',
  is_vault BOOLEAN DEFAULT false,
  unlock_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  media_id UUID REFERENCES public.media_files(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.letters ADD COLUMN IF NOT EXISTS stationery_theme TEXT DEFAULT 'parchment_cream';
ALTER TABLE public.letters ADD COLUMN IF NOT EXISTS seal_sticker TEXT DEFAULT '❤️';
ALTER TABLE public.letters ADD COLUMN IF NOT EXISTS is_vault BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_letters_couple_id ON public.letters(couple_id);

-- 2.11 Messages & Voice Notes
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT,
  media_type TEXT CHECK (media_type IN ('photo', 'audio')),
  media_id UUID REFERENCES public.media_files(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  played_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('photo', 'audio'));
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE INDEX IF NOT EXISTS idx_messages_couple_id ON public.messages(couple_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_idempotency 
  ON public.messages(couple_id, idempotency_key) 
  WHERE idempotency_key IS NOT NULL;

-- 2.12 Bucket List Items
CREATE TABLE IF NOT EXISTS public.bucket_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'adventure',
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES public.profiles(id),
  target_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_bucket_items_couple_id ON public.bucket_items(couple_id);

-- 2.13 Important Dates & Milestones
CREATE TABLE IF NOT EXISTS public.important_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  category TEXT NOT NULL DEFAULT 'anniversary',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_important_dates_couple_id ON public.important_dates(couple_id);
CREATE INDEX IF NOT EXISTS idx_important_dates_home_lookup 
  ON public.important_dates(couple_id, event_date ASC);

-- 2.14 In-App Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  deep_link TEXT,
  send_after TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read 
  ON public.notifications(recipient_id, read_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_send_after ON public.notifications(send_after) WHERE sent_at IS NULL;

-- 2.15 User Settings
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

-- 2.16 Push Tokens
CREATE TABLE IF NOT EXISTS public.push_tokens (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON public.push_tokens(user_id);

-- 2.17 Feature Flags & Entitlements
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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.18 Daily Question Answers (Mutual reveal via RLS)
CREATE TABLE IF NOT EXISTS public.daily_question_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_date DATE NOT NULL,
  question_text TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  UNIQUE(couple_id, user_id, question_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_answers_couple_date
  ON public.daily_question_answers(couple_id, question_date);

-- 2.19 Vault Items (Private couple vault)
CREATE TABLE IF NOT EXISTS public.vault_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  media_id UUID REFERENCES public.media_files(id) ON DELETE SET NULL,
  category TEXT DEFAULT 'photo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_vault_items_couple_id ON public.vault_items(couple_id);

-- ------------------------------------------------------------------------------
-- 3. HELPER FUNCTIONS & TRIGGERS
-- ------------------------------------------------------------------------------

-- 3.1 Updated At Timestamp Trigger
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

DROP TRIGGER IF EXISTS tr_activities_updated_at ON public.activities;
CREATE TRIGGER tr_activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_activity_sessions_updated_at ON public.activity_sessions;
CREATE TRIGGER tr_activity_sessions_updated_at BEFORE UPDATE ON public.activity_sessions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_memories_updated_at ON public.memories;
CREATE TRIGGER tr_memories_updated_at BEFORE UPDATE ON public.memories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_media_files_updated_at ON public.media_files;
CREATE TRIGGER tr_media_files_updated_at BEFORE UPDATE ON public.media_files FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_letters_updated_at ON public.letters;
CREATE TRIGGER tr_letters_updated_at BEFORE UPDATE ON public.letters FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_bucket_items_updated_at ON public.bucket_items;
CREATE TRIGGER tr_bucket_items_updated_at BEFORE UPDATE ON public.bucket_items FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_important_dates_updated_at ON public.important_dates;
CREATE TRIGGER tr_important_dates_updated_at BEFORE UPDATE ON public.important_dates FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER tr_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_push_tokens_updated_at ON public.push_tokens;
CREATE TRIGGER tr_push_tokens_updated_at BEFORE UPDATE ON public.push_tokens FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_vault_items_updated_at ON public.vault_items;
CREATE TRIGGER tr_vault_items_updated_at BEFORE UPDATE ON public.vault_items FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3.2 Safe Active Couple ID Lookup (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_active_couple_id(p_user_id UUID DEFAULT auth.uid())
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_user UUID;
  v_couple_id UUID;
BEGIN
  IF auth.role() <> 'service_role' THEN
    v_target_user := auth.uid();
  ELSE
    v_target_user := COALESCE(p_user_id, auth.uid());
  END IF;

  IF v_target_user IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT couple_id INTO v_couple_id
  FROM public.couple_members
  WHERE user_id = v_target_user AND status = 'active'
  LIMIT 1;

  RETURN v_couple_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_active_couple_id(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_active_couple_id(UUID) TO authenticated, service_role;

-- 3.3 Automatically Create Profile on Auth Signup
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3.4 Hard Enforcement: Maximum 2 Active Members per Couple
CREATE OR REPLACE FUNCTION public.check_couple_max_two_members()
RETURNS TRIGGER AS $$
DECLARE
  v_current_count INT;
BEGIN
  IF NEW.status = 'active' THEN
    SELECT COUNT(*) INTO v_current_count
    FROM public.couple_members
    WHERE couple_id = NEW.couple_id
      AND status = 'active'
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    IF v_current_count >= 2 THEN
      RAISE EXCEPTION 'A couple cannot have more than two active members'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_enforce_couple_max_two_members ON public.couple_members;
CREATE TRIGGER trg_enforce_couple_max_two_members
  BEFORE INSERT OR UPDATE ON public.couple_members
  FOR EACH ROW
  EXECUTE FUNCTION public.check_couple_max_two_members();

-- 3.5 Cryptographically Secure 6-Character Invite Code Generator
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  bytes BYTEA;
  i INT;
  val INT;
BEGIN
  BEGIN
    bytes := extensions.gen_random_bytes(6);
  EXCEPTION WHEN OTHERS THEN
    bytes := gen_random_bytes(6);
  END;

  FOR i IN 0..5 LOOP
    val := get_byte(bytes, i);
    result := result || substr(chars, (val % length(chars)) + 1, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- ------------------------------------------------------------------------------
-- 4. APPLICATION RPC FUNCTIONS
-- ------------------------------------------------------------------------------

-- 4.1 Create Couple with Invite Code
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

  SELECT couple_id INTO v_existing_couple_id
  FROM public.couple_members
  WHERE user_id = v_user_id AND status = 'active';

  IF v_existing_couple_id IS NOT NULL THEN
    RAISE EXCEPTION 'User is already an active member of a couple'
      USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO public.couples (name, status)
  VALUES (p_couple_name, 'active')
  RETURNING id INTO v_couple_id;

  INSERT INTO public.couple_members (couple_id, user_id, role, status)
  VALUES (v_couple_id, v_user_id, 'creator', 'active');

  LOOP
    v_invite_code := public.generate_invite_code();
    SELECT EXISTS(SELECT 1 FROM public.invitations WHERE code = v_invite_code AND status = 'pending')
    INTO v_code_exists;
    EXIT WHEN NOT v_code_exists;
  END LOOP;

  v_expires_at := timezone('utc'::text, now()) + interval '48 hours';

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

GRANT EXECUTE ON FUNCTION public.create_couple_with_invite(TEXT) TO authenticated, service_role;

-- 4.2 Accept Invitation
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

  SELECT couple_id INTO v_existing_couple_id
  FROM public.couple_members
  WHERE user_id = v_user_id AND status = 'active';

  IF v_existing_couple_id IS NOT NULL THEN
    RAISE EXCEPTION 'User is already an active member of a couple'
      USING ERRCODE = 'check_violation';
  END IF;

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

  SELECT COUNT(*) INTO v_active_count
  FROM public.couple_members
  WHERE couple_id = v_invitation.couple_id AND status = 'active';

  IF v_active_count >= 2 THEN
    RAISE EXCEPTION 'This couple already has the maximum of 2 partners'
      USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO public.couple_members (couple_id, user_id, role, status)
  VALUES (v_invitation.couple_id, v_user_id, 'partner', 'active');

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

GRANT EXECUTE ON FUNCTION public.accept_invitation(TEXT) TO authenticated, service_role;

-- 4.3 Atomic Unlink Couple Space
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

  SELECT couple_id INTO v_couple_id
  FROM public.couple_members
  WHERE user_id = v_user_id AND status = 'active'
  FOR UPDATE;

  IF v_couple_id IS NULL THEN
    RAISE EXCEPTION 'No active couple found for user'
      USING ERRCODE = 'no_data_found';
  END IF;

  SELECT user_id INTO v_partner_id
  FROM public.couple_members
  WHERE couple_id = v_couple_id AND user_id <> v_user_id AND status = 'active'
  LIMIT 1;

  UPDATE public.couples
  SET status = 'unlinked',
      updated_at = timezone('utc'::text, now())
  WHERE id = v_couple_id;

  UPDATE public.couple_members
  SET status = 'unlinked',
      updated_at = timezone('utc'::text, now())
  WHERE couple_id = v_couple_id AND status = 'active';

  UPDATE public.invitations
  SET status = 'revoked',
      updated_at = timezone('utc'::text, now())
  WHERE couple_id = v_couple_id AND status = 'pending';

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

-- 4.4 Delete User Account (Complete Purge & Storage Cleanup)
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

  SELECT couple_id INTO v_couple_id
  FROM public.couple_members
  WHERE user_id = v_user_id AND status = 'active';

  DELETE FROM public.notifications WHERE recipient_id = v_user_id;
  DELETE FROM public.user_settings WHERE user_id = v_user_id;
  DELETE FROM public.push_tokens WHERE user_id = v_user_id;

  IF v_couple_id IS NOT NULL THEN
    DELETE FROM public.couple_members WHERE user_id = v_user_id AND couple_id = v_couple_id;

    SELECT COUNT(*) INTO v_remaining_members
    FROM public.couple_members
    WHERE couple_id = v_couple_id AND status = 'active';

    IF v_remaining_members = 0 THEN
      DELETE FROM storage.objects 
      WHERE bucket_id = 'couples-media' 
        AND (storage.foldername(name))[1] = v_couple_id::text;

      DELETE FROM public.couples WHERE id = v_couple_id;
    END IF;
  END IF;

  DELETE FROM public.profiles WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'user_id', v_user_id,
    'status', 'deleted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated, service_role;

-- 4.5 Delete Message
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

  SELECT * INTO v_msg
  FROM public.messages
  WHERE id = p_message_id AND sender_id = v_user_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found or unauthorized' USING ERRCODE = 'no_data_found';
  END IF;

  UPDATE public.messages
  SET deleted_at = timezone('utc'::text, now())
  WHERE id = p_message_id;

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

-- 4.6 Open Letter (Server-Clock Verified Unlock)
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

  IF NOT EXISTS (
    SELECT 1 FROM public.couple_members
    WHERE couple_id = v_letter.couple_id AND user_id = v_user_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF v_letter.unlock_at IS NOT NULL AND v_letter.unlock_at > timezone('utc'::text, now()) THEN
    RAISE EXCEPTION 'Letter is locked until %', v_letter.unlock_at
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_letter.opened_at IS NULL AND v_user_id = v_letter.recipient_id THEN
    UPDATE public.letters
    SET opened_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_letter_id;
  END IF;

  RETURN jsonb_build_object(
    'letter_id', p_letter_id,
    'opened_at', timezone('utc'::text, now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.open_letter(UUID) TO authenticated, service_role;

-- 4.7 Server-Authoritative Advance Round
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

  SELECT s.* INTO v_session
  FROM public.activity_sessions s
  JOIN public.couple_members cm ON cm.couple_id = s.couple_id
  WHERE s.id = p_session_id AND cm.user_id = v_user_id AND cm.status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found or inaccessible' USING ERRCODE = 'no_data_found';
  END IF;

  IF v_session.current_round <> p_expected_round THEN
    RETURN jsonb_build_object(
      'session_id', p_session_id,
      'current_round', v_session.current_round,
      'advanced', false,
      'message', 'Round was already advanced'
    );
  END IF;

  v_new_round := v_session.current_round + 1;

  SELECT COALESCE(display_name, 'Partner') INTO v_caller_name
  FROM public.profiles
  WHERE id = v_user_id;

  UPDATE public.activity_sessions
  SET current_round = v_new_round,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_session_id;

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

-- 4.8 Get Masked Session Events (Photo & Answer Secrecy)
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

  SELECT s.couple_id INTO v_couple_id
  FROM public.activity_sessions s
  JOIN public.couple_members cm ON cm.couple_id = s.couple_id
  WHERE s.id = p_session_id AND cm.user_id = v_user_id AND cm.status = 'active';

  IF v_couple_id IS NULL THEN
    RAISE EXCEPTION 'Session not found or inaccessible' USING ERRCODE = 'no_data_found';
  END IF;

  SELECT cm.user_id INTO v_partner_id
  FROM public.couple_members cm
  WHERE cm.couple_id = v_couple_id AND cm.user_id <> v_user_id AND cm.status = 'active';

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
      WHEN e.type = 'answer_submitted' 
       AND e.user_id <> v_user_id 
       AND NOT EXISTS (SELECT 1 FROM user_answers ua WHERE ua.round_num = (e.payload->>'round')::text)
      THEN jsonb_build_object(
        'round', e.payload->'round',
        'masked', true,
        'submitted_at', e.created_at
      )
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

GRANT EXECUTE ON FUNCTION public.get_session_events_masked(UUID) TO authenticated, service_role;

-- 4.9 Check Anniversaries & Milestone Alerts
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
  v_user_tz TEXT;
  v_send_time TIMESTAMPTZ;
  v_notif_count INT := 0;
BEGIN
  FOR v_couple IN
    SELECT c.id, c.start_date
    FROM public.couples c
    WHERE c.status = 'active' AND c.start_date IS NOT NULL
  LOOP
    v_days_together := CURRENT_DATE - v_couple.start_date;

    IF v_days_together <= 0 THEN
      CONTINUE;
    END IF;

    v_is_anniversary := (
      EXTRACT(MONTH FROM v_couple.start_date) = EXTRACT(MONTH FROM CURRENT_DATE) AND
      EXTRACT(DAY FROM v_couple.start_date) = EXTRACT(DAY FROM CURRENT_DATE)
    );
    v_years := EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM v_couple.start_date);

    v_is_milestone := v_days_together IN (100, 200, 365, 500, 1000, 1500, 2000, 2500, 3000, 5000);

    IF v_is_anniversary AND v_years > 0 THEN
      v_title := 'Happy Anniversary';
      v_body := 'Celebrating ' || v_years || ' wonderful ' || 
                CASE WHEN v_years = 1 THEN 'year' ELSE 'years' END || 
                ' together today. Thank you for every shared moment.';
    ELSIF v_is_milestone THEN
      v_title := 'Milestone Day';
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

-- 4.10 Non-Recursive Session Answer Helper (Fixes session_events RLS recursion)
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

GRANT EXECUTE ON FUNCTION public.has_user_answered_round(UUID, UUID, TEXT) TO authenticated, service_role;

-- 4.11 Permanent Memory Deletion RPC
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
  SELECT * INTO v_memory
  FROM public.memories
  WHERE id = p_memory_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Memory not found');
  END IF;

  IF v_memory.created_by <> auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only the creator can delete this memory');
  END IF;

  SELECT array_agg(bucket_path) INTO v_media_paths
  FROM public.media_files
  WHERE memory_id = p_memory_id;

  DELETE FROM public.media_files WHERE memory_id = p_memory_id;
  DELETE FROM public.memories WHERE id = p_memory_id;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_id', p_memory_id,
    'file_paths', COALESCE(v_media_paths, ARRAY[]::TEXT[])
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_memory_permanently(UUID) TO authenticated, service_role;

-- 4.12 Presence Heartbeat RPC
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

GRANT EXECUTE ON FUNCTION public.heartbeat_presence() TO authenticated, service_role;

-- 4.13 Daily Question Mutual Reveal Helper (Non-recursive SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_both_answered_daily_question(
  p_couple_id UUID,
  p_date DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT count(DISTINCT user_id)
    FROM public.daily_question_answers
    WHERE couple_id = p_couple_id
      AND question_date = p_date
  ) >= 2;
END;
$$;

GRANT EXECUTE ON FUNCTION public.has_both_answered_daily_question(UUID, DATE) TO authenticated, service_role;

-- 4.14 Daily Question Streak Calculator
CREATE OR REPLACE FUNCTION public.get_daily_question_streak(p_couple_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_streak INT := 0;
  v_curr_date DATE := CURRENT_DATE;
  v_has_answers BOOLEAN;
BEGIN
  LOOP
    SELECT count(DISTINCT user_id) >= 2 INTO v_has_answers
    FROM public.daily_question_answers
    WHERE couple_id = p_couple_id
      AND question_date = v_curr_date;

    IF v_has_answers THEN
      v_streak := v_streak + 1;
      v_curr_date := v_curr_date - INTERVAL '1 day';
    ELSE
      IF v_curr_date = CURRENT_DATE THEN
        v_curr_date := v_curr_date - INTERVAL '1 day';
      ELSE
        EXIT;
      END IF;
    END IF;
  END LOOP;

  RETURN v_streak;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_daily_question_streak(UUID) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 5. AUTOMATED NOTIFICATION INBOX TRIGGERS
-- ------------------------------------------------------------------------------

-- Clean up any legacy duplicate notification triggers from older migrations
DROP TRIGGER IF EXISTS trg_messages_insert_notify ON public.messages;
DROP TRIGGER IF EXISTS trg_letters_insert_notify ON public.letters;
DROP TRIGGER IF EXISTS trg_sessions_insert_notify ON public.activity_sessions;

-- 5.1 Trigger: Notification on New Message (Resolves media mime_type safely)
CREATE OR REPLACE FUNCTION public.fn_messages_insert_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_name TEXT;
  v_mime_type TEXT;
  v_type TEXT;
  v_title TEXT;
  v_body TEXT;
BEGIN
  SELECT display_name INTO v_sender_name FROM public.profiles WHERE id = NEW.sender_id;
  v_sender_name := COALESCE(v_sender_name, 'Partner');

  IF NEW.media_id IS NOT NULL THEN
    SELECT mime_type INTO v_mime_type FROM public.media_files WHERE id = NEW.media_id;
  END IF;

  IF NEW.media_type = 'audio' OR v_mime_type LIKE 'audio/%' THEN
    v_type := 'voice_note';
    v_title := v_sender_name || ' sent a voice note';
    v_body := 'Voice note received';
  ELSIF NEW.media_type = 'photo' OR v_mime_type LIKE 'image/%' THEN
    v_type := 'photo_message';
    v_title := v_sender_name || ' shared a photo';
    v_body := COALESCE(LEFT(NEW.content, 80), 'Photo received');
  ELSE
    v_type := 'message';
    v_title := v_sender_name || ' sent a message';
    v_body := COALESCE(LEFT(NEW.content, 80), 'New message');
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_messages_insert_notification ON public.messages;
CREATE TRIGGER trg_messages_insert_notification
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_messages_insert_notification();

-- 5.2 Trigger: Notification on New Letter
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
        'body', NEW.title,
        'senderName', v_sender_name,
        'letterId', NEW.id
      ),
      '/(tabs)/dates',
      COALESCE(NEW.unlock_at, now())
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_letters_insert_notification ON public.letters;
CREATE TRIGGER trg_letters_insert_notification
  AFTER INSERT ON public.letters
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_letters_insert_notification();

-- 5.3 Trigger: Notification on New Memory
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
        'body', NEW.title,
        'creatorName', v_creator_name,
        'memoryId', NEW.id
      ),
      '/(tabs)/memories',
      now()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_memories_insert_notification ON public.memories;
CREATE TRIGGER trg_memories_insert_notification
  AFTER INSERT ON public.memories
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_memories_insert_notification();

-- 5.4 Trigger: Notification on New Session / Invite
CREATE OR REPLACE FUNCTION public.fn_sessions_insert_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_recipient_id UUID;
  v_creator_name TEXT;
  v_activity_title TEXT;
  v_activity_kind TEXT;
  v_notif_type TEXT;
  v_notif_title TEXT;
BEGIN
  SELECT user_id INTO v_recipient_id
  FROM public.couple_members
  WHERE couple_id = NEW.couple_id AND user_id != NEW.created_by AND status = 'active'
  LIMIT 1;

  IF v_recipient_id IS NOT NULL THEN
    SELECT display_name INTO v_creator_name FROM public.profiles WHERE id = NEW.created_by;
    v_creator_name := COALESCE(v_creator_name, 'Partner');

    SELECT title, kind INTO v_activity_title, v_activity_kind FROM public.activities WHERE id = NEW.activity_id;
    v_activity_title := COALESCE(v_activity_title, 'an activity');

    IF v_activity_kind = 'photo_mission' THEN
      v_notif_type := 'photo_mission';
      v_notif_title := v_creator_name || ' sent a Photo Mission!';
    ELSE
      v_notif_type := 'game_invite';
      v_notif_title := v_creator_name || ' invited you to play';
    END IF;

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
      v_notif_type,
      jsonb_build_object(
        'title', v_notif_title,
        'body', v_activity_title,
        'creatorName', v_creator_name,
        'sessionId', NEW.id
      ),
      '/session/' || NEW.id,
      now()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_sessions_insert_notification ON public.activity_sessions;
CREATE TRIGGER trg_sessions_insert_notification
  AFTER INSERT ON public.activity_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_sessions_insert_notification();

-- 5.5 Trigger: Notification on Anniversary Start Date Update
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
          'body', v_updater_name || ' updated your special anniversary date',
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

-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bucket_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.important_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_question_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_items ENABLE ROW LEVEL SECURITY;

-- 6.1 Profiles Policies
DROP POLICY IF EXISTS "profiles_select_own_or_partner" ON public.profiles;
CREATE POLICY "profiles_select_own_or_partner" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid() OR
    id IN (
      SELECT cm2.user_id
      FROM public.couple_members cm1
      JOIN public.couple_members cm2 ON cm1.couple_id = cm2.couple_id
      WHERE cm1.user_id = auth.uid()
        AND cm1.status = 'active'
        AND cm2.status = 'active'
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

-- 6.2 Couples Policies (strictly active members; creation only via RPC)
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

-- 6.3 Couple Members Policies
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

-- 6.4 Invitations Policies
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

-- 6.5 Activities Policies (public read for authenticated users)
DROP POLICY IF EXISTS "activities_select_all" ON public.activities;
CREATE POLICY "activities_select_all" ON public.activities
  FOR SELECT TO authenticated
  USING (true);

-- 6.6 Activity Sessions Policies
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

-- 6.7 Session Events Policies (Partner answer secrecy enforced in DB without recursion)
DROP POLICY IF EXISTS "events_couple_select" ON public.session_events;
CREATE POLICY "events_couple_select" ON public.session_events
  FOR SELECT TO authenticated
  USING (
    couple_id = public.get_active_couple_id(auth.uid()) AND (
      user_id = auth.uid()
      OR
      type <> 'answer_submitted'
      OR
      public.has_user_answered_round(session_id, auth.uid(), (payload->>'round')::text)
    )
  );

DROP POLICY IF EXISTS "events_couple_insert" ON public.session_events;
CREATE POLICY "events_couple_insert" ON public.session_events
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    couple_id = public.get_active_couple_id(auth.uid())
  );

-- 6.8 Memories Policies
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

DROP POLICY IF EXISTS "memories_owner_delete" ON public.memories;
CREATE POLICY "memories_owner_delete" ON public.memories
  FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- 6.9 Media Files Policies
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

-- 6.10 Letters Policies
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
  USING (
    sender_id = auth.uid() AND
    couple_id = public.get_active_couple_id(auth.uid())
  )
  WITH CHECK (
    sender_id = auth.uid() AND
    couple_id = public.get_active_couple_id(auth.uid())
  );

-- 6.11 Messages Policies
DROP POLICY IF EXISTS "messages_couple_select" ON public.messages;
CREATE POLICY "messages_couple_select" ON public.messages
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL AND
    couple_id = public.get_active_couple_id(auth.uid())
  );

DROP POLICY IF EXISTS "messages_couple_insert" ON public.messages;
CREATE POLICY "messages_couple_insert" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    couple_id = public.get_active_couple_id(auth.uid())
  );

DROP POLICY IF EXISTS "messages_update" ON public.messages;
CREATE POLICY "messages_update" ON public.messages
  FOR UPDATE TO authenticated
  USING (
    couple_id = public.get_active_couple_id(auth.uid())
  )
  WITH CHECK (
    couple_id = public.get_active_couple_id(auth.uid())
  );

-- 6.12 Bucket Items Policies
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

-- 6.13 Important Dates Policies
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

-- 6.14 Notifications Policies (Recipient Only)
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
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- 6.15 User Settings Policies
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

-- 6.16 Push Tokens Policies
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

-- 6.17 Feature Flags & Entitlements Policies
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

-- 6.18 Storage Objects Policies (Strict Couple-Only Folder Isolation)
DO $$
BEGIN
  DROP POLICY IF EXISTS "couples_media_select" ON storage.objects;
  CREATE POLICY "couples_media_select" ON storage.objects
    FOR SELECT TO authenticated
    USING (
      bucket_id = 'couples-media' AND
      (storage.foldername(name))[1] IN (
        SELECT couple_id::text FROM public.couple_members 
        WHERE user_id = auth.uid() AND status = 'active'
      )
    );

  DROP POLICY IF EXISTS "couples_media_insert" ON storage.objects;
  CREATE POLICY "couples_media_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'couples-media' AND
      (storage.foldername(name))[1] IN (
        SELECT couple_id::text FROM public.couple_members 
        WHERE user_id = auth.uid() AND status = 'active'
      )
    );

  DROP POLICY IF EXISTS "couples_media_delete" ON storage.objects;
  CREATE POLICY "couples_media_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (
      bucket_id = 'couples-media' AND
      (storage.foldername(name))[1] IN (
        SELECT couple_id::text FROM public.couple_members 
        WHERE user_id = auth.uid() AND status = 'active'
      )
    );
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- 6.19 Daily Question Answers Policies (Mutual reveal enforced in DB)
DROP POLICY IF EXISTS "daily_answers_select" ON public.daily_question_answers;
CREATE POLICY "daily_answers_select" ON public.daily_question_answers
  FOR SELECT TO authenticated
  USING (
    couple_id = public.get_active_couple_id(auth.uid()) AND (
      user_id = auth.uid()
      OR
      public.has_both_answered_daily_question(couple_id, question_date)
    )
  );

DROP POLICY IF EXISTS "daily_answers_insert" ON public.daily_question_answers;
CREATE POLICY "daily_answers_insert" ON public.daily_question_answers
  FOR INSERT TO authenticated
  WITH CHECK (
    couple_id = public.get_active_couple_id(auth.uid()) AND
    user_id = auth.uid()
  );

-- 6.20 Vault Items Policies
DROP POLICY IF EXISTS "vault_items_couple_select" ON public.vault_items;
CREATE POLICY "vault_items_couple_select" ON public.vault_items
  FOR SELECT TO authenticated
  USING (couple_id = public.get_active_couple_id(auth.uid()));

DROP POLICY IF EXISTS "vault_items_couple_insert" ON public.vault_items;
CREATE POLICY "vault_items_couple_insert" ON public.vault_items
  FOR INSERT TO authenticated
  WITH CHECK (
    couple_id = public.get_active_couple_id(auth.uid()) AND
    created_by = auth.uid()
  );

DROP POLICY IF EXISTS "vault_items_couple_delete" ON public.vault_items;
CREATE POLICY "vault_items_couple_delete" ON public.vault_items
  FOR DELETE TO authenticated
  USING (
    couple_id = public.get_active_couple_id(auth.uid()) AND
    created_by = auth.uid()
  );

-- ------------------------------------------------------------------------------
-- 7. REALTIME REPLICATION CONFIGURATION (Safe block)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  ALTER TABLE public.notifications REPLICA IDENTITY FULL;
  ALTER TABLE public.session_events REPLICA IDENTITY FULL;
  ALTER TABLE public.activity_sessions REPLICA IDENTITY FULL;
  ALTER TABLE public.messages REPLICA IDENTITY FULL;
  ALTER TABLE public.daily_question_answers REPLICA IDENTITY FULL;

  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'session_events') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.session_events;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'activity_sessions') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_sessions;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'couples') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.couples;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'daily_question_answers') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_question_answers;
    END IF;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- ------------------------------------------------------------------------------
-- 8. SEEDED ACTIVITIES CATALOGUE (25 Activities across 7 categories)
-- ------------------------------------------------------------------------------
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
    {"id": "step1", "title": "Date Preparation", "duration_minutes": 5, "prompt": "Set your table, dim the lights, light a candle if you have one, and grab your favorite meal and drink.", "description": "Set your table, dim the lights, light a candle if you have one, and grab your favorite meal and drink.", "checklist": ["Table set and cleared", "Candle or warm light on", "Favorite meal & drink ready"]},
    {"id": "step2", "title": "The Toast", "duration_minutes": 5, "prompt": "Raise your glasses together. Share one thing about your partner that you felt deeply grateful for this past week.", "description": "Raise your glasses together. Share one thing about your partner that you felt deeply grateful for this past week.", "checklist": ["Glasses raised together", "Gratitude shared"]},
    {"id": "step3", "title": "Main Course & Deep Conversation", "duration_minutes": 25, "prompt": "Enjoy your dinner together while answering these prompts: What made you smile today? What is something new you learned about yourself recently?", "description": "Enjoy your dinner together while answering these prompts: What made you smile today? What is something new you learned about yourself recently?"},
    {"id": "step4", "title": "Dessert & Sweet Wishes", "duration_minutes": 10, "prompt": "Enjoy a sweet treat or warm tea. Share one dream date you cannot wait to take your partner on when you next reunite.", "description": "Enjoy a sweet treat or warm tea. Share one dream date you cannot wait to take your partner on when you next reunite."}
  ]
}'::jsonb),

('guided-date-movie-night', 'Synchronized Movie Night', 'Set up, grab your popcorn, countdown together, and dive into your chosen film.', 'guided_date', 'dates', 'live', 60, 'tv', '{
  "steps": [
    {"id": "step1", "title": "Snack & Drink Prep", "duration_minutes": 5, "prompt": "Get your popcorn, snacks, drinks, and cozy blankets ready.", "description": "Get your popcorn, snacks, drinks, and cozy blankets ready.", "checklist": ["Popcorn & snacks ready", "Cozy blankets & cushions", "Movie paused at 00:00 on screen"]},
    {"id": "step2", "title": "Sync & 3-2-1 Play!", "duration_minutes": 3, "prompt": "Cue up your selected movie on both screens. Use our synced countdown timer to press Play at the exact same second!", "description": "Cue up your selected movie on both screens. Use our synced countdown timer to press Play at the exact same second!"},
    {"id": "step3", "title": "Movie In Progress", "duration_minutes": 50, "prompt": "Enjoy the show! Send quick live emoji reactions to each other right from the screen.", "description": "Enjoy the show! Send quick live emoji reactions to each other right from the screen."},
    {"id": "step4", "title": "Post-Credits Review", "duration_minutes": 10, "prompt": "Rate the movie out of 10. Discuss your favorite scene and the craziest plot twist.", "description": "Rate the movie out of 10. Discuss your favorite scene and the craziest plot twist."}
  ]
}'::jsonb),

('guided-date-cooking-together', 'Cooking Together Across the Miles', 'Cook the same recipe or style of food simultaneously, sharing aromas, tasting spoons, and laughter.', 'guided_date', 'dates', 'live', 45, 'coffee', '{
  "steps": [
    {"id": "step1", "title": "Kitchen Setup & Ingredient Check", "duration_minutes": 5, "prompt": "Wash your hands, clear the counter, prop your phone up safely, and lay out your ingredients.", "description": "Wash your hands, clear the counter, prop your phone up safely, and lay out your ingredients.", "checklist": ["Phone propped up safely", "Ingredients & spices on counter", "Cooking playlist playing", "Apron / comfy clothes on"]},
    {"id": "step2", "title": "Prep & Chop Together", "duration_minutes": 15, "prompt": "Chop, slice, and measure your ingredients. Compare your knife skills and share what smells amazing!", "description": "Chop, slice, and measure your ingredients. Compare your knife skills and share what smells amazing!"},
    {"id": "step3", "title": "Sizzle & Simmer", "duration_minutes": 15, "prompt": "Stove on! Sizzle your ingredients, stir the pot, and taste test. Describe the flavors to each other.", "description": "Stove on! Sizzle your ingredients, stir the pot, and taste test. Describe the flavors to each other."},
    {"id": "step4", "title": "Plate & Presentation Contest", "duration_minutes": 10, "prompt": "Plate your dishes like a 5-star restaurant! Hold up your plates to the camera and judge each other''s food art.", "description": "Plate your dishes like a 5-star restaurant! Hold up your plates to the camera and judge each other''s food art.", "checklist": ["Plated like 5-star restaurant", "Photo snapped of dishes", "First bite tasted together"]}
  ]
}'::jsonb),

('guided-date-music-date', 'Music Date: Melody & Memory Swap', 'Exchange songs that define your journey, listen simultaneously, and share the untold stories behind each track.', 'guided_date', 'dates', 'live', 30, 'music', '{
  "steps": [
    {"id": "step1", "title": "Setting the Soundstage", "duration_minutes": 5, "prompt": "Grab your best headphones or speaker, get comfortable, and queue up your favorite music apps.", "description": "Grab your best headphones or speaker, get comfortable, and queue up your favorite music apps.", "checklist": ["Headphones or speaker connected", "Favorite beverage in hand", "Music app opened"]},
    {"id": "step2", "title": "The Song That Reminds Me of You", "duration_minutes": 10, "prompt": "Partner A plays a song that reminds them of Partner B. Listen together, then explain why this song captures them.", "description": "Partner A plays a song that reminds them of Partner B. Listen together, then explain why this song captures them."},
    {"id": "step3", "title": "Our Shared Nostalgia Anthem", "duration_minutes": 10, "prompt": "Partner B plays a track from a shared memory or trip. Relive the exact day and feeling when you both heard it.", "description": "Partner B plays a track from a shared memory or trip. Relive the exact day and feeling when you both heard it."},
    {"id": "step4", "title": "Future Roadtrip / Slow Dance Track", "duration_minutes": 5, "prompt": "Pick one song for our future road trip or dream slow dance. Close your eyes and imagine the moment together.", "description": "Pick one song for our future road trip or dream slow dance. Close your eyes and imagine the moment together."}
  ]
}'::jsonb),

('guided-date-question-date', 'Deep Question Date: Heart to Heart', 'A quiet sanctuary of meaningful questions to discover new depths in each other without distraction.', 'guided_date', 'dates', 'live', 35, 'message-circle', '{
  "steps": [
    {"id": "step1", "title": "Unwind & Settle In", "duration_minutes": 5, "prompt": "Turn off distractions, put notifications on silent, and take a deep breath together.", "description": "Turn off distractions, put notifications on silent, and take a deep breath together.", "checklist": ["Distractions silenced", "Comfortable quiet space", "Open mind & warm heart"]},
    {"id": "step2", "title": "The Moment I Realized", "duration_minutes": 10, "prompt": "What was the exact moment you realized you had feelings for me? What was going through your mind?", "description": "What was the exact moment you realized you had feelings for me? What was going through your mind?"},
    {"id": "step3", "title": "Silent Strength & Support", "duration_minutes": 10, "prompt": "What is something you are silently carrying or hoping for right now that I can support you in?", "description": "What is something you are silently carrying or hoping for right now that I can support you in?"},
    {"id": "step4", "title": "Our Next Chapter", "duration_minutes": 10, "prompt": "When you imagine us 5 years from now on a typical Sunday morning, what does it look and feel like?", "description": "When you imagine us 5 years from now on a typical Sunday morning, what does it look and feel like."}
  ]
}'::jsonb),

('guided-date-dream-vacation', 'Dream Vacation Blueprint', 'Co-create your next reunion getaway: choose the destination, dream stay, secret cafes, and bucket-list adventures.', 'guided_date', 'dates', 'live', 40, 'compass', '{
  "steps": [
    {"id": "step1", "title": "Destination Draft", "duration_minutes": 5, "prompt": "Pick a destination vibe: tropical beach, cozy mountain cabin, or historic walking city? Agree on one place for tonight!", "description": "Pick a destination vibe: tropical beach, cozy mountain cabin, or historic walking city? Agree on one place for tonight!", "checklist": ["Destination vibe agreed upon", "Shared excitement ready", "Map opened"]},
    {"id": "step2", "title": "Our Dream Stay", "duration_minutes": 10, "prompt": "What kind of stay are we booking? A treehouse with a hot tub? An oceanfront villa? A cozy loft? Browse and describe it.", "description": "What kind of stay are we booking? A treehouse with a hot tub? An oceanfront villa? A cozy loft? Browse and describe it."},
    {"id": "step3", "title": "The Foodie & Cafe Itinerary", "duration_minutes": 15, "prompt": "Plan day one''s meals: What are we having for breakfast in bed, street food lunch, and a sunset dinner?", "description": "Plan day one''s meals: What are we having for breakfast in bed, street food lunch, and a sunset dinner?"},
    {"id": "step4", "title": "The One Unmissable Adventure", "duration_minutes": 10, "prompt": "Pick one unforgettable adventure to experience there: snorkeling, night market tour, stargazing hike, or wine tasting.", "description": "Pick one unforgettable adventure to experience there: snorkeling, night market tour, stargazing hike, or wine tasting."}
  ]
}'::jsonb),

('guided-date-random-date-idea', 'Random Date Surprise Roulette', 'Fast, spontaneous, and unpredictable mini-games and challenges to keep your spark energetic and playful.', 'guided_date', 'dates', 'live', 25, 'sparkles', '{
  "steps": [
    {"id": "step1", "title": "Coin Toss for the Vibe", "duration_minutes": 5, "prompt": "Flip a coin: Heads means Partner A picks the music and vibe, Tails means Partner B picks!", "description": "Flip a coin: Heads means Partner A picks the music and vibe, Tails means Partner B picks!", "checklist": ["Coin or random generator ready", "Vibe master chosen"]},
    {"id": "step2", "title": "3-Minute Blind Portrait", "duration_minutes": 5, "prompt": "Grab a pen and paper. You have 3 minutes to draw your partner from memory. No looking at paper while drawing!", "description": "Grab a pen and paper. You have 3 minutes to draw your partner from memory. No looking at paper while drawing!"},
    {"id": "step3", "title": "Room Treasure Show & Tell", "duration_minutes": 10, "prompt": "Find the weirdest, oldest, or most sentimental item in your room right now. Present it to your partner like an auctioneer!", "description": "Find the weirdest, oldest, or most sentimental item in your room right now. Present it to your partner like an auctioneer!"},
    {"id": "step4", "title": "60-Second Compliment Blitz", "duration_minutes": 5, "prompt": "Take turns showering each other with rapid-fire genuine compliments for 60 seconds each without stopping!", "description": "Take turns showering each other with rapid-fire genuine compliments for 60 seconds each without stopping!"}
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

-- ==============================================================================
-- END OF COMPLETE UNIFIED DATABASE SETUP
-- ==============================================================================
