-- Migration: 20261108000007_storage_allowed_mimes.sql
-- Description: Update couples-media storage bucket with all required allowed MIME types, private access, and couple-only RLS policies.

-- 1. Ensure bucket exists and has correct allowed mime types
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

-- 2. Strict Couple-Only Storage Policies
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

