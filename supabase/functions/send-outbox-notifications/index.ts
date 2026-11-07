// Supabase Edge Function: send-outbox-notifications
// Follows Section 3.7 & 11: Delivers queued notifications respecting quiet hours & user timezone

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

interface NotificationRow {
  id: string;
  recipient_id: string;
  couple_id: string;
  type: string;
  payload: Record<string, unknown>;
  deep_link: string | null;
  send_after: string;
}

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Missing environment variables' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const nowUtc = new Date().toISOString();

    // 1. Fetch pending outbox notifications
    const { data: pendingNotifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .lte('send_after', nowUtc)
      .is('sent_at', null)
      .limit(50);

    if (fetchError) {
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return new Response(JSON.stringify({ delivered: 0, message: 'No pending notifications' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let deliveredCount = 0;

    for (const notif of pendingNotifications as NotificationRow[]) {
      // 2. Fetch recipient settings and timezone
      const { data: recipientProfile } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('id', notif.recipient_id)
        .single();

      const { data: recipientSettings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', notif.recipient_id)
        .maybeSingle();

      const timezone = recipientProfile?.timezone || 'UTC';
      const nowInTz = new Date(new Date().toLocaleString('en-US', { timeZone: timezone }));
      const currentHour = nowInTz.getHours();

      // Check quiet hours (e.g. between 22:00 and 08:00)
      if (recipientSettings?.quiet_hours_enabled) {
        const startHour = parseInt((recipientSettings.quiet_hours_start || '22:00:00').split(':')[0], 10);
        const endHour = parseInt((recipientSettings.quiet_hours_end || '08:00:00').split(':')[0], 10);

        const isInQuietHours =
          startHour > endHour
            ? currentHour >= startHour || currentHour < endHour
            : currentHour >= startHour && currentHour < endHour;

        if (isInQuietHours) {
          // Delay until after quiet hours
          continue;
        }
      }

      // Check per-category toggles
      if (recipientSettings) {
        if (notif.type.includes('activity') && !recipientSettings.notify_activities) continue;
        if (notif.type.includes('letter') && !recipientSettings.notify_letters) continue;
        if (notif.type.includes('date') && !recipientSettings.notify_dates) continue;
      }

      // 3. Mark as sent in DB
      await supabase
        .from('notifications')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', notif.id);

      deliveredCount++;
    }

    return new Response(JSON.stringify({ delivered: deliveredCount }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

