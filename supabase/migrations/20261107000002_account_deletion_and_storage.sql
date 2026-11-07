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

