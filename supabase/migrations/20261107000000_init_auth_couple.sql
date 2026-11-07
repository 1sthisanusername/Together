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
CREATE TRIGGER tr_check_couple_member_limit
  BEFORE INSERT OR UPDATE ON public.couple_members
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

CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_couples_updated_at BEFORE UPDATE ON public.couples FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_couple_members_updated_at BEFORE UPDATE ON public.couple_members FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_invitations_updated_at BEFORE UPDATE ON public.invitations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_feature_flags_updated_at BEFORE UPDATE ON public.feature_flags FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_entitlements_updated_at BEFORE UPDATE ON public.entitlements FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. SECURITY DEFINER HELPER: get active couple_id for a user
CREATE OR REPLACE FUNCTION public.get_active_couple_id(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_couple_id UUID;
BEGIN
  SELECT couple_id INTO v_couple_id
  FROM public.couple_members
  WHERE user_id = p_user_id AND status = 'active'
  LIMIT 1;

  RETURN v_couple_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

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
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
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

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- COUPLES Policies
-- Accessible only if auth.uid() is an active member
CREATE POLICY "couples_select_active_member" ON public.couples
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT couple_id FROM public.couple_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "couples_insert_authenticated" ON public.couples
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "couples_update_active_member" ON public.couples
  FOR UPDATE TO authenticated
  USING (
    id IN (
      SELECT couple_id FROM public.couple_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- COUPLE MEMBERS Policies
CREATE POLICY "couple_members_select_active_member_or_self" ON public.couple_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    couple_id IN (
      SELECT couple_id FROM public.couple_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "couple_members_insert_self" ON public.couple_members
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "couple_members_update_self" ON public.couple_members
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- INVITATIONS Policies
CREATE POLICY "invitations_select_active_couple_member" ON public.invitations
  FOR SELECT TO authenticated
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "invitations_insert_active_couple_member" ON public.invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    inviter_id = auth.uid() AND
    couple_id IN (
      SELECT couple_id FROM public.couple_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "invitations_update_inviter" ON public.invitations
  FOR UPDATE TO authenticated
  USING (inviter_id = auth.uid())
  WITH CHECK (inviter_id = auth.uid());

-- FEATURE FLAGS & ENTITLEMENTS Policies
CREATE POLICY "feature_flags_select_all" ON public.feature_flags
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "entitlements_select_couple" ON public.entitlements
  FOR SELECT TO authenticated
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
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

