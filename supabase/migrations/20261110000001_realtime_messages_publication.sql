-- Migration: Add messages to supabase_realtime publication
-- Ensures postgres_changes fires real-time WebSocket events for incoming messages

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

-- Set replica identity to full so DELETE and UPDATE events contain complete row data
ALTER TABLE public.messages REPLICA IDENTITY FULL;

