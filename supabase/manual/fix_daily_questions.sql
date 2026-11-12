-- ==============================================================================
-- FIX DAILY QUESTION ANSWERS SCHEMA: Full Alignment Script
-- File: supabase/manual/fix_daily_questions.sql
--
-- Root Cause for:
-- "null value in column 'answer_text' of relation 'daily_question_answers' violates not-null constraint"
--
-- The table in your database previously had 'answer_text' with NOT NULL constraint.
-- Meanwhile, the app inserts { answer, question_text, ... }.
--
-- Solution:
-- 1. Make 'answer_text' nullable or default to 'answer', OR drop the old NOT NULL constraint on answer_text.
-- 2. Ensure both 'answer' and 'answer_text' exist and stay synchronized with a trigger so whichever column is queried/inserted works seamlessly!
-- 3. Ensure 'question_text' exists.
-- ==============================================================================

-- 1. Ensure table exists
CREATE TABLE IF NOT EXISTS public.daily_question_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_date DATE NOT NULL,
  question_text TEXT NOT NULL DEFAULT '',
  answer TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  UNIQUE(couple_id, user_id, question_date)
);

-- 2. Drop the NOT NULL constraint on 'answer_text' if it exists in the table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'daily_question_answers' 
      AND column_name = 'answer_text'
  ) THEN
    ALTER TABLE public.daily_question_answers ALTER COLUMN answer_text DROP NOT NULL;
  END IF;
END $$;

-- 3. Ensure 'question_text' exists and is not null with default
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'daily_question_answers' 
      AND column_name = 'question_text'
  ) THEN
    ALTER TABLE public.daily_question_answers ADD COLUMN question_text TEXT NOT NULL DEFAULT '';
  ELSE
    ALTER TABLE public.daily_question_answers ALTER COLUMN question_text SET DEFAULT '';
  END IF;
END $$;

-- 4. Ensure 'answer' column exists and is not null with default
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'daily_question_answers' 
      AND column_name = 'answer'
  ) THEN
    ALTER TABLE public.daily_question_answers ADD COLUMN answer TEXT NOT NULL DEFAULT '';
  ELSE
    ALTER TABLE public.daily_question_answers ALTER COLUMN answer SET DEFAULT '';
  END IF;
END $$;

-- 5. Add trigger to sync answer <-> answer_text automatically so neither is ever null!
CREATE OR REPLACE FUNCTION public.sync_daily_question_answers_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If answer is provided, sync to answer_text if answer_text column exists
  IF NEW.answer IS NOT NULL AND NEW.answer <> '' THEN
    BEGIN
      NEW.answer_text := NEW.answer;
    EXCEPTION WHEN OTHERS THEN
      -- answer_text column does not exist, ignore
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_daily_question_answers ON public.daily_question_answers;
CREATE TRIGGER trg_sync_daily_question_answers
  BEFORE INSERT OR UPDATE ON public.daily_question_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_daily_question_answers_columns();

-- 6. Ensure indices
CREATE INDEX IF NOT EXISTS idx_daily_answers_couple_date
  ON public.daily_question_answers(couple_id, question_date);

-- 7. Enable RLS
ALTER TABLE public.daily_question_answers ENABLE ROW LEVEL SECURITY;

-- 8. Mutual reveal security definer function
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

GRANT EXECUTE ON FUNCTION public.has_both_answered_daily_question(UUID, DATE) TO authenticated, service_role;

-- 9. Refresh RLS Policies
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

DROP POLICY IF EXISTS "daily_answers_insert" ON public.daily_question_answers;
CREATE POLICY "daily_answers_insert" ON public.daily_question_answers
  FOR INSERT TO authenticated
  WITH CHECK (
    couple_id = public.get_active_couple_id(auth.uid()) AND
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "daily_answers_update" ON public.daily_question_answers;
CREATE POLICY "daily_answers_update" ON public.daily_question_answers
  FOR UPDATE TO authenticated
  USING (
    couple_id = public.get_active_couple_id(auth.uid()) AND
    user_id = auth.uid()
  )
  WITH CHECK (
    couple_id = public.get_active_couple_id(auth.uid()) AND
    user_id = auth.uid()
  );

-- 10. Realtime publication
ALTER TABLE public.daily_question_answers REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'daily_question_answers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_question_answers;
  END IF;
END $$;

-- 11. Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
