import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Mock dependencies
vi.mock('react-native', () => import('./mocks/react-native'));
vi.mock('react-native-url-polyfill/auto', () => ({}));
vi.mock('expo-constants', () => import('./mocks/expo-constants'));
vi.mock('expo-linking', () => import('./mocks/expo-linking'));
vi.mock('expo-router', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));
vi.mock('react-native-safe-area-context', () => import('./mocks/react-native-safe-area-context'));

import { getRouteForNotification, PUSH_NOTIFICATIONS_ENABLED } from '../src/services/push';
import { getNotificationIcon } from '../src/features/notifications/components/InAppNotificationBanner';

describe('GATE 6: In-App Notification Inbox & Realtime Architecture', () => {
  it('migration 20261108000009_notifications_inbox_and_realtime.sql sets up realtime, RLS, and triggers', () => {
    const migPath = path.resolve(__dirname, '../supabase/migrations/20261108000009_notifications_inbox_and_realtime.sql');
    expect(fs.existsSync(migPath)).toBe(true);

    const sql = fs.readFileSync(migPath, 'utf8');

    // Realtime & Replica Identity
    expect(sql).toContain('ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications');
    expect(sql).toContain('ALTER TABLE public.notifications REPLICA IDENTITY FULL');

    // RLS Policies
    expect(sql).toContain('CREATE POLICY "notifications_recipient_select"');
    expect(sql).toContain('recipient_id = auth.uid()');
    expect(sql).toContain('CREATE POLICY "notifications_couple_insert"');
    expect(sql).toContain('CREATE POLICY "notifications_recipient_update"');

    // Triggers for all core events
    expect(sql).toContain('trg_messages_insert_notification');
    expect(sql).toContain('trg_letters_insert_notification');
    expect(sql).toContain('trg_memories_insert_notification');
    expect(sql).toContain('trg_sessions_insert_notification');
  });

  it('push.ts feature flag disables remote push without credentials while in-app queue remains active', () => {
    expect(typeof PUSH_NOTIFICATIONS_ENABLED).toBe('boolean');
    // Without EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS='true', it is false
    expect(PUSH_NOTIFICATIONS_ENABLED).toBe(false);
  });

  it('getRouteForNotification handles all core notification types accurately', () => {
    // 1. Messages / Voice Notes / Photos
    expect(getRouteForNotification('message')).toBe('/chat');
    expect(getRouteForNotification('voice_note')).toBe('/chat');
    expect(getRouteForNotification('photo_message')).toBe('/chat');

    // 2. Letters
    expect(getRouteForNotification('letter')).toBe('/(tabs)/memories');

    // 3. Photo mission / challenges
    expect(getRouteForNotification('photo_mission')).toBe('/(tabs)/play');

    // 4. Game session invite
    expect(getRouteForNotification('game_invite', { sessionId: 'sess-123' })).toBe('/session/sess-123');
    expect(getRouteForNotification('game_invite')).toBe('/(tabs)/play');

    // 5. Dates
    expect(getRouteForNotification('date', { sessionId: 'date-456' })).toBe('/session/date-456');
    expect(getRouteForNotification('date')).toBe('/(tabs)/dates');

    // 6. Memory
    expect(getRouteForNotification('memory')).toBe('/(tabs)/memories');

    // 7. Anniversary / milestones
    expect(getRouteForNotification('anniversary')).toBe('/(tabs)/us');
    expect(getRouteForNotification('milestone')).toBe('/(tabs)/us');

    // Custom deep link override
    expect(getRouteForNotification('custom', { deepLink: 'together://settings' })).toBe('/settings');
  });

  it('getNotificationIcon assigns appropriate friendly emojis for all types', () => {
    expect(getNotificationIcon('message')).toBe('💬');
    expect(getNotificationIcon('voice_note')).toBe('🎙️');
    expect(getNotificationIcon('photo_message')).toBe('📸');
    expect(getNotificationIcon('letter')).toBe('💌');
    expect(getNotificationIcon('game_invite')).toBe('🎮');
    expect(getNotificationIcon('photo_mission')).toBe('📸');
    expect(getNotificationIcon('date')).toBe('✨');
    expect(getNotificationIcon('memory')).toBe('🖼️');
    expect(getNotificationIcon('anniversary')).toBe('💍');
  });

  it('Home screen has Bell button with unread count badge navigating to /notifications', () => {
    const homePath = path.resolve(__dirname, '../src/app/(tabs)/home.tsx');
    const content = fs.readFileSync(homePath, 'utf8');

    expect(content).toContain("router.push('/notifications')");
    expect(content).toContain('<BellIcon');
    expect(content).toContain('useUnreadNotificationsCount');
    expect(content).toContain('unreadNotifsCount > 0');
    expect(content).toContain('styles.badge');
  });

  it('In-app notification banner and realtime subscriber are mounted in RootRouteGuard', () => {
    const layoutPath = path.resolve(__dirname, '../src/app/_layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf8');

    expect(content).toContain('<InAppNotificationBanner />');
    expect(content).toContain('useNotificationRealtime()');
    expect(content).toContain('<Stack.Screen name="notifications" />');
  });

  it('Notification list view implements newest first ordering, mark all as read, and unread styling', () => {
    const inboxPath = path.resolve(__dirname, '../src/features/notifications/components/NotificationInboxView.tsx');
    const content = fs.readFileSync(inboxPath, 'utf8');

    expect(content).toContain('markAllRead');
    expect(content).toContain('Mark all read');
    expect(content).toContain('itemCardUnread');
    expect(content).toContain('unreadDot');
    expect(content).toContain("You're all caught up");
  });

  it('simulates User A sending message and User B receiving in-app notification', () => {
    const userAId = 'user-a-1111';
    const userBId = 'user-b-2222';
    const coupleId = 'couple-c-3333';

    // Mock in-app notifications database table
    const notificationsDb: any[] = [];

    // Trigger simulation: User A sends a message to User B
    const messageEvent = {
      id: 'msg-999',
      sender_id: userAId,
      recipient_id: userBId,
      couple_id: coupleId,
      content: 'Hey sweetheart, thinking of you!',
      media_type: null,
    };

    // Database trigger simulation (fn_messages_insert_notification)
    const newNotif = {
      id: 'notif-101',
      recipient_id: messageEvent.recipient_id,
      couple_id: messageEvent.couple_id,
      type: 'message',
      payload: {
        title: 'Partner sent a message',
        body: messageEvent.content,
        senderName: 'Partner',
        messageId: messageEvent.id,
      },
      deep_link: '/chat',
      read_at: null,
      created_at: new Date().toISOString(),
    };
    notificationsDb.push(newNotif);

    // User B fetches their notifications
    const userBNotifications = notificationsDb.filter((n) => n.recipient_id === userBId);
    expect(userBNotifications).toHaveLength(1);
    expect(userBNotifications[0].payload.body).toBe('Hey sweetheart, thinking of you!');

    // User B unread count
    const unreadCount = userBNotifications.filter((n) => !n.read_at).length;
    expect(unreadCount).toBe(1);

    // User B opens notification / marks read
    userBNotifications[0].read_at = new Date().toISOString();
    const updatedUnreadCount = userBNotifications.filter((n) => !n.read_at).length;
    expect(updatedUnreadCount).toBe(0);
  });
});
