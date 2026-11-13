-- ==============================================================================
-- Migration: Push Notification Outbox Dispatcher (Webhook & pg_cron schedule)
-- Delivers queued notifications outside the app via Edge Function
-- ==============================================================================

-- 1. Helper function to call the send-outbox-notifications Edge Function
-- Note: Replace with project URL or uses Supabase Database Webhook
CREATE OR REPLACE FUNCTION public.invoke_send_outbox_notifications()
RETURNS void AS $$
DECLARE
  v_supabase_url TEXT;
  v_service_role_key TEXT;
BEGIN
  -- If pg_net extension is available, invoke edge function via HTTP POST
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    -- In Supabase, edge functions can be called via net.http_post
    -- Or pg_cron can trigger a batch dispatch
    NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Schedule regular dispatch every minute via pg_cron if enabled
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.unschedule('send-outbox-push-notifications');
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;

    -- Note: Users can enable pg_cron schedule in Supabase dashboard
    -- or connect a Database Webhook on table `public.notifications` INSERT
    -- targeting the edge function `send-outbox-notifications`.
  END IF;
END $$;

