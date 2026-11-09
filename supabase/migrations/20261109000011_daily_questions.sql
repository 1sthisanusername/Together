-- ==============================================================================
-- MIGRATION: 20261109000011_daily_questions.sql
-- Features:
-- 1. Daily question answers table with strict dual-answer privacy RLS
-- 2. SECURITY DEFINER function to verify both partners answered without recursion
-- 3. Streak calculation function for daily questions
-- ==============================================================================

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

ALTER TABLE public.daily_question_answers ENABLE ROW LEVEL SECURITY;

-- Function: Checks whether both partners in the couple have answered for that date
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

-- SELECT policy: Caller can ALWAYS see their own answer, but CANNOT see partner's answer
-- until BOTH partners have answered for that calendar date!
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

-- INSERT policy: Active couple member can only insert their own answer
DROP POLICY IF EXISTS "daily_answers_insert" ON public.daily_question_answers;
CREATE POLICY "daily_answers_insert" ON public.daily_question_answers
  FOR INSERT TO authenticated
  WITH CHECK (
    couple_id = public.get_active_couple_id(auth.uid()) AND
    user_id = auth.uid()
  );

-- Function: Calculate consecutive days streak of daily questions answered
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
      -- If today is not yet answered by both, check if yesterday was answered to continue streak
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

