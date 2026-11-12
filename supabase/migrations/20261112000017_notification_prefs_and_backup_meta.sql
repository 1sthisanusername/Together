-- Migration: Add granular notification category preferences and backup metadata to user_settings
-- Idempotent: safe to re-run

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS notify_messages BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_daily_question BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_photos BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_games BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS backup_account_email TEXT,
  ADD COLUMN IF NOT EXISTS last_backup_at TIMESTAMPTZ;

-- Ensure RLS policy allows users to insert/update their own user_settings row
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_settings' AND policyname = 'Users can manage own settings'
  ) THEN
    CREATE POLICY "Users can manage own settings"
      ON public.user_settings
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
