-- ==============================================================================
-- MIGRATION: 20261111000016_clean_daily_question_answers_policies.sql
--
-- Re-runnable migration for public.daily_question_answers:
-- 1. Drops EVERY existing policy on public.daily_question_answers dynamically via pg_policies.
-- 2. Ensures RLS is enabled.
-- 3. Ensures unique constraint/index on (couple_id, user_id, question_date).
-- 4. Creates STABLE SECURITY DEFINER helper functions for recursion-free checks.
-- 5. Recreates strict policies:
--    - SELECT: User can always view their own answers; can view partner's answer for that day
--              ONLY if the user already has submitted their own answer for that date.
--    - INSERT: Only user_id = auth.uid(), active couple member only, max 1 answer per day.
--    - UPDATE: Only user's own row, and ONLY while partner has NOT yet answered for that day.
--    - DELETE: No client policy.
-- ==============================================================================

-- 1. Drop EVERY existing policy on public.daily_question_answers dynamically
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'daily_question_answers'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.daily_question_answers;', pol.policyname);
  END LOOP;
END $$;

-- 2. Ensure RLS is enabled
ALTER TABLE public.daily_question_answers ENABLE ROW LEVEL SECURITY;

-- 3. Ensure active couple helper exists (STABLE, SECURITY DEFINER, search_path = public)
CREATE OR REPLACE FUNCTION public.is_active_couple_member(
  p_couple_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.couple_members
    WHERE couple_id = p_couple_id
      AND user_id = p_user_id
      AND status = 'active'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_active_couple_member(UUID, UUID) TO authenticated, service_role;

-- 4. STABLE, SECURITY DEFINER helper to check if caller has answered for a date (prevents recursion)
CREATE OR REPLACE FUNCTION public.user_has_answered_daily_question(
  p_couple_id UUID,
  p_date DATE,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.daily_question_answers
    WHERE couple_id = p_couple_id
      AND user_id = p_user_id
      AND question_date = p_date
  );
$$;

GRANT EXECUTE ON FUNCTION public.user_has_answered_daily_question(UUID, DATE, UUID) TO authenticated, service_role;

-- 5. STABLE, SECURITY DEFINER helper to check if partner has answered for a date (for UPDATE guard)
CREATE OR REPLACE FUNCTION public.partner_has_answered_daily_question(
  p_couple_id UUID,
  p_date DATE,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_partner_id UUID;
BEGIN
  -- Retrieve the active partner in the couple
  SELECT user_id INTO v_partner_id
  FROM public.couple_members
  WHERE couple_id = p_couple_id
    AND user_id <> p_user_id
    AND status = 'active'
  LIMIT 1;

  IF v_partner_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.daily_question_answers
    WHERE couple_id = p_couple_id
      AND user_id = v_partner_id
      AND question_date = p_date
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.partner_has_answered_daily_question(UUID, DATE, UUID) TO authenticated, service_role;

-- 6. Ensure unique constraint/index for 1 row per user per couple per day (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.daily_question_answers'::regclass
      AND contype = 'u'
      AND conname = 'uq_daily_answers_couple_user_date'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'daily_question_answers'
      AND indexname = 'uq_daily_answers_couple_user_date'
  ) THEN
    -- If default table constraint already covers (couple_id, user_id, question_date), do not duplicate
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
      WHERE c.conrelid = 'public.daily_question_answers'::regclass
        AND c.contype = 'u'
      GROUP BY c.oid
      HAVING count(*) = 3
    ) THEN
      ALTER TABLE public.daily_question_answers
        ADD CONSTRAINT uq_daily_answers_couple_user_date UNIQUE (couple_id, user_id, question_date);
    END IF;
  END IF;
END $$;

-- 7. RECREATE POLICIES:

-- SELECT: Caller always sees their own rows. Caller sees partner's row for that day
-- ONLY if caller already has their own row for that same day.
CREATE POLICY "daily_answers_select_strict" ON public.daily_question_answers
  FOR SELECT TO authenticated
  USING (
    public.is_active_couple_member(couple_id, auth.uid())
    AND (
      user_id = auth.uid()
      OR
      public.user_has_answered_daily_question(couple_id, question_date, auth.uid())
    )
  );

-- INSERT: Only with user_id = auth.uid(), only into user's own active couple
CREATE POLICY "daily_answers_insert_strict" ON public.daily_question_answers
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_active_couple_member(couple_id, auth.uid())
  );

-- UPDATE: Only user's own row, and only while the partner has NOT yet answered that day
CREATE POLICY "daily_answers_update_strict" ON public.daily_question_answers
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    AND public.is_active_couple_member(couple_id, auth.uid())
    AND NOT public.partner_has_answered_daily_question(couple_id, question_date, auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_active_couple_member(couple_id, auth.uid())
    AND NOT public.partner_has_answered_daily_question(couple_id, question_date, auth.uid())
  );

-- Notice: NO DELETE policy for authenticated clients.

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';

