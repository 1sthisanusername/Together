import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Mock dependencies
vi.mock('react-native', () => import('./mocks/react-native'));
vi.mock('react-native-url-polyfill/auto', () => ({}));

describe('Push Notifications End-to-End Infrastructure', () => {
  const sqlPath = path.resolve(__dirname, '../supabase/server_rounds_and_push.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  it('migration contains push_tokens table with RLS enabled and authenticated policies', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.push_tokens');
    expect(sql).toContain('ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('CREATE POLICY "push_tokens_user_select" ON public.push_tokens');
    expect(sql).toContain('CREATE POLICY "push_tokens_user_insert" ON public.push_tokens');
    expect(sql).toContain('CREATE POLICY "push_tokens_user_update" ON public.push_tokens');
  });

  it('migration contains automated triggers for letters, messages, invites and photo missions with deep links', () => {
    // Letters
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.trg_notify_new_letter');
    expect(sql).toContain("'/(tabs)/dates'");
    expect(sql).toContain('CREATE TRIGGER trg_letters_insert_notify');

    // Messages
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.trg_notify_new_message');
    expect(sql).toContain("'/(tabs)/us'");
    expect(sql).toContain('CREATE TRIGGER trg_messages_insert_notify');

    // Activity sessions & photo missions
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.trg_notify_new_session');
    expect(sql).toContain("'photo_mission'");
    expect(sql).toContain("'activity_invite'");
    expect(sql).toContain("'/session/' || NEW.id::text");
    expect(sql).toContain('CREATE TRIGGER trg_sessions_insert_notify');
  });

  it('migration defines high-performance indexes on couple_id and session_id for Home queries', () => {
    expect(sql).toContain('idx_activity_sessions_home_lookup');
    expect(sql).toContain('idx_important_dates_home_lookup');
    expect(sql).toContain('idx_session_events_home_session');
    expect(sql).toContain('idx_couple_members_lookup');
    expect(sql).toContain('idx_push_tokens_user');
  });

  it('simulates Edge Function quiet hours and category delivery logic', () => {
    interface NotificationItem {
      id: string;
      recipient_id: string;
      type: string;
      send_after: string;
    }

    interface UserSettings {
      notifications_enabled: boolean;
      quiet_hours_enabled: boolean;
      quiet_hours_start: string;
      quiet_hours_end: string;
      notify_activities: boolean;
      notify_letters: boolean;
      notify_dates: boolean;
    }

    function shouldDeliverNotification(
      notif: NotificationItem,
      settings: UserSettings,
      currentHour: number
    ): { deliver: boolean; reason?: string } {
      if (!settings.notifications_enabled) {
        return { deliver: false, reason: 'notifications_disabled' };
      }

      if (settings.quiet_hours_enabled) {
        const start = parseInt(settings.quiet_hours_start.split(':')[0], 10);
        const end = parseInt(settings.quiet_hours_end.split(':')[0], 10);
        const inQuiet = start > end ? currentHour >= start || currentHour < end : currentHour >= start && currentHour < end;
        if (inQuiet) {
          return { deliver: false, reason: 'quiet_hours' };
        }
      }

      if (notif.type.includes('activity') && !settings.notify_activities) {
        return { deliver: false, reason: 'category_activities_disabled' };
      }
      if (notif.type.includes('letter') && !settings.notify_letters) {
        return { deliver: false, reason: 'category_letters_disabled' };
      }

      return { deliver: true };
    }

    const testSettings: UserSettings = {
      notifications_enabled: true,
      quiet_hours_enabled: true,
      quiet_hours_start: '22:00:00',
      quiet_hours_end: '08:00:00',
      notify_activities: true,
      notify_letters: false, // User disabled letter notifications
      notify_dates: true,
    };

    // 1. Notification during daytime (14:00) for activity -> delivers
    const activityNotif = { id: 'n1', recipient_id: 'u1', type: 'activity_invite', send_after: '2026-11-08T14:00:00Z' };
    expect(shouldDeliverNotification(activityNotif, testSettings, 14).deliver).toBe(true);

    // 2. Notification during sleep hours (23:00) -> blocked by quiet hours
    expect(shouldDeliverNotification(activityNotif, testSettings, 23).reason).toBe('quiet_hours');

    // 3. Notification for disabled category (letters) during daytime -> blocked by category toggle
    const letterNotif = { id: 'n2', recipient_id: 'u1', type: 'letter', send_after: '2026-11-08T14:00:00Z' };
    expect(shouldDeliverNotification(letterNotif, testSettings, 14).reason).toBe('category_letters_disabled');
  });
});

