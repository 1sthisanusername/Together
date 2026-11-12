-- ==============================================================================
-- MIGRATION: 20261111000015_fix_daily_question_answers.sql
--
-- Fixes two live-database errors:
--   1. "Could not find the 'question_text' column ... in the schema cache"
--      => column may be missing; add it, then notify PostgREST to reload.
--   2. "null value in column 'answer_text' ... violates not-null constraint"
--      => older DB had answer_text NOT NULL; drop that constraint.
--   3. Missing UPDATE policy so upsert re-submissions work.
--   4. Add question_id column for future answer-to-question linking.
-- ==============================================================================

-- 1. Ensure question_text column exists with a safe default
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'daily_question_answers'
      AND column_name  = 'question_text'
  ) THEN
    ALTER TABLE public.daily_question_answers
      ADD COLUMN question_text TEXT NOT NULL DEFAULT '';
  ELSE
    -- Column exists: make sure it has a default so old rows stay valid
    ALTER TABLE public.daily_question_answers
      ALTER COLUMN question_text SET DEFAULT '';
    ALTER TABLE public.daily_question_answers
      ALTER COLUMN question_text SET NOT NULL;
  END IF;
END $$;

-- 2. Ensure answer column exists (the column the app actually writes to)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'daily_question_answers'
      AND column_name  = 'answer'
  ) THEN
    ALTER TABLE public.daily_question_answers
      ADD COLUMN answer TEXT NOT NULL DEFAULT '';
  ELSE
    ALTER TABLE public.daily_question_answers
      ALTER COLUMN answer SET DEFAULT '';
    ALTER TABLE public.daily_question_answers
      ALTER COLUMN answer SET NOT NULL;
  END IF;
END $$;

-- 3. If the old answer_text column still exists, drop its NOT NULL constraint
--    (we keep the column to avoid breaking any existing rows; just make it nullable)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'daily_question_answers'
      AND column_name  = 'answer_text'
  ) THEN
    ALTER TABLE public.daily_question_answers
      ALTER COLUMN answer_text DROP NOT NULL;

    -- Back-fill answer_text from answer so old rows stay consistent
    UPDATE public.daily_question_answers
    SET answer_text = answer
    WHERE answer_text IS NULL AND answer IS NOT NULL;
  END IF;
END $$;

-- 4. Add question_id column for linking saved answers to the question bank
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'daily_question_answers'
      AND column_name  = 'question_id'
  ) THEN
    ALTER TABLE public.daily_question_answers
      ADD COLUMN question_id VARCHAR(16);
  END IF;
END $$;

-- 5. Ensure UPDATE policy exists so upsert (re-submission) works
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

-- 6. Force PostgREST to reload its schema cache immediately
--    (eliminates "could not find column in schema cache" without a manual restart)
NOTIFY pgrst, 'reload schema';

