-- ==============================================================================
-- CHECK ROUND 2: Read-Only Verification Script
-- File: supabase/manual/check_round2.sql
-- Run this in Supabase SQL Editor and copy/paste output to verify all fixes.
-- ==============================================================================

-- 1. Check policies on public.session_events
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'session_events'
ORDER BY policyname;

-- 2. Check publication tables in supabase_realtime
SELECT 
  pubname,
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- 3. Check replica identity of core tables
SELECT 
  relname AS table_name,
  CASE relreplident
    WHEN 'd' THEN 'default (primary key)'
    WHEN 'n' THEN 'nothing'
    WHEN 'f' THEN 'full'
    WHEN 'i' THEN 'index'
  END AS replica_identity
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
  AND relname IN (
    'messages',
    'session_events',
    'activity_sessions',
    'memories',
    'letters',
    'daily_question_answers',
    'couples',
    'couple_members',
    'notifications'
  )
ORDER BY relname;

-- 4. Check new helper functions and security settings
SELECT 
  routine_name,
  routine_type,
  security_type,
  data_type AS return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'is_couple_member',
    'session_couple_id',
    'both_answered',
    'delete_memory',
    'delete_memory_permanently',
    'expire_stale_sessions'
  )
ORDER BY routine_name;

-- 5. Check pg_cron extension & scheduled jobs
SELECT 
  e.extname,
  e.extversion
FROM pg_extension e
WHERE e.extname = 'pg_cron';

SELECT 
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job
WHERE jobname = 'expire-stale-activity-sessions';

