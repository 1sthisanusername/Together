-- ==============================================================================
-- READ-ONLY POLICY INSPECTION SCRIPT: public.daily_question_answers
-- File: supabase/manual/check_daily_question_policies.sql
--
-- Run this in Supabase SQL Editor to list all existing policies on
-- the table daily_question_answers, their permissive/restrictive status,
-- commands, and full USING / WITH CHECK clauses.
-- ==============================================================================

SELECT
  policyname,
  cmd AS command,
  permissive,
  roles,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'daily_question_answers'
ORDER BY cmd, policyname;

