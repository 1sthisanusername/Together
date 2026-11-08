-- Migration: 20261108000006_memories_and_storage_policies.sql
-- Description: Configure couples-media storage bucket, strict couple isolation policies, and support multiple photos per memory.

-- 1. Ensure columns exist on memories and media_files
ALTER TABLE public.memories
  ADD COLUMN IF NOT EXISTS media_ids UUID[] NOT NULL DEFAULT '{}';

ALTER TABLE public.media_files
  ADD COLUMN IF NOT EXISTS memory_id UUID REFERENCES public.memories(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_media_files_memory_id ON public.media_files(memory_id);

-- 2. Configure private couples-media bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'couples-media',
  'couples-media',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'audio/m4a', 'audio/mp4', 'audio/mpeg', 'audio/aac', 'audio/wav']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760;

-- 3. Strict RLS on storage.objects for couples-media bucket
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

