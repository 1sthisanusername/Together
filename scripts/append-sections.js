const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '..', 'supabase', 'full_schema_and_seed.sql');
let sql = fs.readFileSync(srcPath, 'utf8');

const target = '-- Seed: 25 Activities across all MVP categories and kinds (Section 6)';

const addition = `-- 2. STORAGE CONFIGURATION (couples-media bucket)
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

-- 4. FUNCTION PERMISSIONS & GRANTS
GRANT EXECUTE ON FUNCTION public.get_active_couple_id(UUID) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.create_couple_with_invite(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.accept_invitation(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.unlink_couple() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_session_events_masked(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.open_letter(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated, service_role;

`;

if (!sql.includes('-- 2. STORAGE CONFIGURATION')) {
  sql = sql.replace(target, addition + target);
  fs.writeFileSync(srcPath, sql, 'utf8');
  console.log('Successfully appended storage, realtime, and grants!');
} else {
  console.log('Already appended!');
}
