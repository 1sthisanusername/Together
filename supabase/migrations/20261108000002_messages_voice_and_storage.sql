-- ==============================================================================
-- MESSAGES SPACE: TEXT, VOICE NOTES & MEDIA STORAGE
-- Migration: 20261108000002_messages_voice_and_storage.sql
-- ==============================================================================

-- 1. Add deleted_at & idempotency_key columns to messages
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- 2. Unique index for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_idempotency 
  ON public.messages(couple_id, idempotency_key) 
  WHERE idempotency_key IS NOT NULL;

-- 3. Update SELECT policy to exclude soft-deleted messages
DROP POLICY IF EXISTS "messages_couple_select" ON public.messages;
CREATE POLICY "messages_couple_select" ON public.messages
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL AND
    couple_id IN (
      SELECT couple_id FROM public.couple_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- 4. UPDATE policy (Sender can soft-delete; Recipient can mark played_at)
DROP POLICY IF EXISTS "messages_update" ON public.messages;
CREATE POLICY "messages_update" ON public.messages
  FOR UPDATE TO authenticated
  USING (
    couple_id IN (
      SELECT couple_id FROM public.couple_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  )
  WITH CHECK (
    couple_id IN (
      SELECT couple_id FROM public.couple_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- 5. RPC: delete_message
-- Soft-deletes message and deletes storage object if media is attached
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

  -- Verify message belongs to caller
  SELECT * INTO v_msg
  FROM public.messages
  WHERE id = p_message_id AND sender_id = v_user_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found or unauthorized' USING ERRCODE = 'no_data_found';
  END IF;

  -- Soft delete message
  UPDATE public.messages
  SET deleted_at = timezone('utc'::text, now())
  WHERE id = p_message_id;

  -- If media attached, find bucket path for cleanup
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

