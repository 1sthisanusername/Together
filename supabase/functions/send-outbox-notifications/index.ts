// Supabase Edge Function: send-outbox-notifications
// Follows Section 3.7 & 11: Delivers queued notifications via Expo Push API
// Respects quiet hours, recipient timezone, and user category preferences.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

interface NotificationRow {
  id: string;
  recipient_id: string;
  couple_id: string;
  type: string;
  payload: Record<string, unknown>;
  deep_link: string | null;
  send_after: string;
  sent_at: string | null;
}

interface ExpoPushMessage {
  to: string;
  sound: 'default' | null;
  title: string;
  body: string;
  data: Record<string, unknown>;
  channelId?: string;
}

Deno.serve(async (req) => {
  try {
    // 1. Authorization check: Service role key or internal cron bearer
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const cronSecret = Deno.env.get('CRON_SECRET') ?? '';

    const expectedBearer = `Bearer ${supabaseServiceKey}`;
    const expectedCron = cronSecret ? `Bearer ${cronSecret}` : '';

    if (!authHeader || (authHeader !== expectedBearer && (!expectedCron || authHeader !== expectedCron))) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Service configuration unavailable' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const nowUtc = new Date().toISOString();

    // Check if triggered for a specific record (Database Webhook / trigger payload)
    let bodyJson: any = null;
    try {
      bodyJson = await req.json();
    } catch {
      // Empty body or cron trigger
    }

    let notificationsToProcess: NotificationRow[] = [];

    if (bodyJson?.record?.id) {
      // Single row trigger from notifications table insert
      const { data: singleRow } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', bodyJson.record.id)
        .is('sent_at', null)
        .maybeSingle();

      if (singleRow) {
        notificationsToProcess = [singleRow as NotificationRow];
      }
    } else {
      // Batch fetch pending outbox notifications
      const { data: pendingNotifications, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .lte('send_after', nowUtc)
        .is('sent_at', null)
        .limit(50);

      if (fetchError) {
        console.error('[send-outbox-notifications] Fetch error:', fetchError.message);
        return new Response(JSON.stringify({ error: 'Unable to process notifications' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      notificationsToProcess = (pendingNotifications || []) as NotificationRow[];
    }

    if (notificationsToProcess.length === 0) {
      return new Response(JSON.stringify({ delivered: 0, message: 'No pending notifications' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let deliveredCount = 0;
    const expoMessages: ExpoPushMessage[] = [];
    const notificationIdsToMarkSent: string[] = [];

    for (const notif of notificationsToProcess) {
      // 2. Fetch recipient profile (timezone) and settings (quiet hours, categories)
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

      // Check quiet hours (default: 22:00 to 08:00)
      if (recipientSettings?.quiet_hours_enabled) {
        const startHour = parseInt((recipientSettings.quiet_hours_start || '22:00:00').split(':')[0], 10);
        const endHour = parseInt((recipientSettings.quiet_hours_end || '08:00:00').split(':')[0], 10);

        const isInQuietHours =
          startHour > endHour
            ? currentHour >= startHour || currentHour < endHour
            : currentHour >= startHour && currentHour < endHour;

        if (isInQuietHours) {
          // Delay delivery until quiet hours end
          console.log(`[send-outbox-notifications] Delaying notification ${notif.id}: recipient in quiet hours`);
          continue;
        }
      }

      // Check per-category notification toggles
      if (recipientSettings) {
        if (!recipientSettings.notifications_enabled) continue;
        if (notif.type.includes('activity') && !recipientSettings.notify_activities) continue;
        if (notif.type.includes('letter') && !recipientSettings.notify_letters) continue;
        if (notif.type.includes('date') && !recipientSettings.notify_dates) continue;
      }

      // 3. Fetch active push tokens for recipient
      const { data: pushTokens } = await supabase
        .from('push_tokens')
        .select('token, platform')
        .eq('user_id', notif.recipient_id);

      const title = (notif.payload as any)?.title || 'Together';
      const body = (notif.payload as any)?.body || 'You have a new update from your partner';

      if (pushTokens && pushTokens.length > 0) {
        for (const tokenRow of pushTokens) {
          expoMessages.push({
            to: tokenRow.token,
            sound: 'default',
            title,
            body,
            channelId: 'default',
            data: {
              deepLink: notif.deep_link,
              notificationId: notif.id,
              type: notif.type,
              ...(notif.payload || {}),
            },
          });
        }
      }

      notificationIdsToMarkSent.push(notif.id);
    }

    // 4. Dispatch batches to Expo Push API
    if (expoMessages.length > 0) {
      try {
        const expoRes = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(expoMessages),
        });

        const expoData = await expoRes.json();
        console.log('[send-outbox-notifications] Expo Push response:', expoData);
      } catch (expoErr) {
        console.error('[send-outbox-notifications] Expo dispatch error:', expoErr);
      }
    }

    // 5. Mark processed notifications as sent
    if (notificationIdsToMarkSent.length > 0) {
      await supabase
        .from('notifications')
        .update({ sent_at: new Date().toISOString() })
        .in('id', notificationIdsToMarkSent);

      deliveredCount = notificationIdsToMarkSent.length;
    }

    return new Response(JSON.stringify({ delivered: deliveredCount, pushed: expoMessages.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    console.error('[send-outbox-notifications] Internal error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
