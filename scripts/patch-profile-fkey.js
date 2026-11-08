const fs = require('fs');
const path = require('path');

// 1. Patch src/features/auth/hooks/useAuth.ts
const authHookPath = path.join(__dirname, '..', 'src', 'features', 'auth', 'hooks', 'useAuth.ts');
let authHook = fs.readFileSync(authHookPath, 'utf8');

const oldFetchProfile = `  fetchProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Error fetching profile:', error.message);
        return null;
      }
      set({ profile: data });
      return data;
    } catch (err) {
      console.warn('Unexpected error fetching profile:', err);
      return null;
    }
  },`;

const newFetchProfile = `  fetchProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        set({ profile: data });
        return data;
      }

      // Self-heal: If profile row is missing, auto-create it from the authenticated session user
      const currentUser = get().user;
      const displayName =
        currentUser?.user_metadata?.display_name ||
        currentUser?.user_metadata?.full_name ||
        currentUser?.user_metadata?.name ||
        currentUser?.email?.split('@')[0] ||
        'User';

      const { data: createdProfile, error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: currentUser?.email,
          display_name: displayName,
          timezone: 'UTC',
          locale: 'en',
        })
        .select()
        .maybeSingle();

      if (createdProfile) {
        set({ profile: createdProfile });
        return createdProfile;
      }

      if (upsertError) {
        console.warn('Error self-healing profile:', upsertError.message);
      }
      return null;
    } catch (err) {
      console.warn('Unexpected error fetching profile:', err);
      return null;
    }
  },`;

if (authHook.includes('fetchProfile: async (userId: string) => {')) {
  authHook = authHook.replace(oldFetchProfile, newFetchProfile);
  fs.writeFileSync(authHookPath, authHook, 'utf8');
  console.log('✓ Updated useAuth.ts fetchProfile with self-healing profile creation');
}

// 2. Patch supabase/full_schema_and_seed.sql
const fullSchemaPath = path.join(__dirname, '..', 'supabase', 'full_schema_and_seed.sql');
let fullSchema = fs.readFileSync(fullSchemaPath, 'utf8');

// Replace handle_new_user
const oldHandleNewUser = `CREATE OR REPLACE FUNCTION public.handle_new_user()
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
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`;

const newHandleNewUser = `CREATE OR REPLACE FUNCTION public.handle_new_user()
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

-- Backfill existing auth users who might be missing a profile
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
  END;`;

// Replace create_couple_with_invite
const oldCreateCouple = `  -- 1. Create couple
  INSERT INTO public.couples (name)
  VALUES (p_couple_name)
  RETURNING id INTO v_couple_id;

  -- 2. Add creator as first active member with role 'creator'
  INSERT INTO public.couple_members (couple_id, user_id, role, status)
  VALUES (v_couple_id, v_user_id, 'creator', 'active');`;

const newCreateCouple = `  -- Ensure caller profile exists in public.profiles (self-healing for foreign key constraint)
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
  VALUES (v_couple_id, v_user_id, 'creator', 'active');`;

// Replace accept_invitation
const oldAcceptInvite = `  -- Add partner
  INSERT INTO public.couple_members (couple_id, user_id, role, status)
  VALUES (v_invitation.couple_id, v_user_id, 'partner', 'active');`;

const newAcceptInvite = `  -- Ensure partner profile exists in public.profiles (self-healing for foreign key constraint)
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
  VALUES (v_invitation.couple_id, v_user_id, 'partner', 'active');`;

fullSchema = fullSchema.replace(/\r\n/g, '\n');
fullSchema = fullSchema.replace(oldHandleNewUser.replace(/\r\n/g, '\n'), newHandleNewUser);
fullSchema = fullSchema.replace(oldCreateCouple.replace(/\r\n/g, '\n'), newCreateCouple);
fullSchema = fullSchema.replace(oldAcceptInvite.replace(/\r\n/g, '\n'), newAcceptInvite);
fs.writeFileSync(fullSchemaPath, fullSchema, 'utf8');
console.log('✓ Updated full_schema_and_seed.sql with profile backfill and self-healing couple RPCs');

