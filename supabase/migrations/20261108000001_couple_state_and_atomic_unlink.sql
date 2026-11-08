-- ==============================================================================
-- COUPLE STATE ROUTING & ATOMIC UNLINK RPC
-- Migration: 20261108000001_couple_state_and_atomic_unlink.sql
-- ==============================================================================

-- 1. Ensure couples table has status column
ALTER TABLE public.couples 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unlinked'));

-- 2. Atomic unlink_couple RPC
-- Runs in one single transaction:
-- - Ends membership for all active members (sets status = 'unlinked')
-- - Sets couple status to 'unlinked'
-- - Revokes pending invitations
-- - Blocks access to all shared content immediately via RLS (which checks status = 'active')
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

  -- 1. Locate caller active couple membership
  SELECT couple_id INTO v_couple_id
  FROM public.couple_members
  WHERE user_id = v_user_id AND status = 'active'
  FOR UPDATE;

  IF v_couple_id IS NULL THEN
    RAISE EXCEPTION 'No active couple found for user'
      USING ERRCODE = 'no_data_found';
  END IF;

  -- 2. Locate partner user_id if present
  SELECT user_id INTO v_partner_id
  FROM public.couple_members
  WHERE couple_id = v_couple_id AND user_id <> v_user_id AND status = 'active'
  LIMIT 1;

  -- 3. Set couple status to 'unlinked'
  UPDATE public.couples
  SET status = 'unlinked',
      updated_at = timezone('utc'::text, now())
  WHERE id = v_couple_id;

  -- 4. Mark all active members of this couple as unlinked (instant RLS cutoff)
  UPDATE public.couple_members
  SET status = 'unlinked',
      updated_at = timezone('utc'::text, now())
  WHERE couple_id = v_couple_id AND status = 'active';

  -- 5. Revoke any pending invitations
  UPDATE public.invitations
  SET status = 'revoked',
      updated_at = timezone('utc'::text, now())
  WHERE couple_id = v_couple_id AND status = 'pending';

  -- 6. Insert audit notification for partner if they were linked
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

