import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { supabase } from './supabase';

/**
 * Feature flag: Remote push notifications are disabled until credentials exist.
 * The in-app notification inbox operates independently via database and Realtime.
 */
export const PUSH_NOTIFICATIONS_ENABLED = process.env.EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS === 'true';

export interface PushNotificationPayload {
  recipientId: string;
  coupleId: string;
  type: string;
  payload: Record<string, unknown>;
  deepLink?: string;
  sendAfter?: string; // ISO 8601 UTC
}

export interface PushService {
  registerForPushNotifications: (userId: string) => Promise<string | null>;
  savePushToken: (userId: string, token: string, platform?: string) => Promise<void>;
  queueNotification: (notification: PushNotificationPayload) => Promise<void>;
  setupNotificationResponseListener: (onNavigate: (url: string) => void) => () => void;
}

/**
 * Maps notification types and payloads to app routes
 * Handles deep-links for all 7 types:
 * invite, message, letter, photo mission, date, memory, anniversary
 */
export function getRouteForNotification(type: string, data?: Record<string, any>): string {
  if (data?.deepLink && typeof data.deepLink === 'string') {
    return data.deepLink.replace(/^together:\/\//, '/');
  }

  const normalizedType = type?.toLowerCase() || '';

  if (normalizedType.includes('invite') && !normalizedType.includes('game')) {
    return '/pair';
  }
  if (normalizedType.includes('message') || normalizedType.includes('chat') || normalizedType.includes('voice')) {
    return '/chat';
  }
  if (normalizedType.includes('letter')) {
    return '/(tabs)/memories';
  }
  if (normalizedType.includes('photo') || normalizedType.includes('mission') || normalizedType.includes('challenge')) {
    return '/(tabs)/play';
  }
  if (normalizedType.includes('game')) {
    const sessionId = data?.sessionId || data?.session_id;
    return sessionId ? `/session/${sessionId}` : '/(tabs)/play';
  }
  if (normalizedType.includes('date')) {
    const sessionId = data?.sessionId || data?.session_id;
    return sessionId ? `/session/${sessionId}` : '/(tabs)/dates';
  }
  if (normalizedType.includes('memory')) {
    return '/(tabs)/memories';
  }
  if (normalizedType.includes('anniversary') || normalizedType.includes('milestone')) {
    return '/(tabs)/us';
  }

  return '/(tabs)/home';
}

class AppPushService implements PushService {
  /**
   * Registers or refreshes push token for the current user.
   * On Android:
   * 1. Requests permission.
   * 2. Creates Android notification channel.
   * 3. Retrieves Expo push token with eas.projectId.
   * 4. Upserts into push_tokens (user_id, token, platform).
   * Refreshed on login and app launch. Handles permission denied without crashing.
   */
  async registerForPushNotifications(userId: string): Promise<string | null> {
    if (!userId) return null;
    if (!PUSH_NOTIFICATIONS_ENABLED) {
      // Remote push disabled by feature flag until credentials exist.
      return null;
    }

    try {
      let token: string | null = null;

      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Notifications = require('expo-notifications');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const Device = require('expo-device');

        // Configure default Android Notification Channel
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#E11D48',
          });
        }

        // On physical devices, request permissions and get token
        if (Device?.isDevice) {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;

          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }

          if (finalStatus !== 'granted') {
            console.log('[Push] Notification permission not granted');
            return null;
          }

          const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ||
            'c510d504-0c36-482b-b71e-aabb35477de6';

          const expoTokenData = await Notifications.getExpoPushTokenAsync({
            projectId,
          });
          token = expoTokenData?.data || null;
        }
      } catch (nativeErr) {
        // Handle gracefully if running in simulator, web, or headless test runners
        console.log('[Push] Notification provider not available in this environment:', nativeErr);
      }

      if (token) {
        await this.savePushToken(userId, token, Platform.OS);
      }

      return token;
    } catch (err) {
      console.warn('[Push] Error in registerForPushNotifications:', err);
      return null;
    }
  }

  /**
   * Persists push token to public.push_tokens table (refreshed on login and launch)
   */
  async savePushToken(userId: string, token: string, platform: string = Platform.OS): Promise<void> {
    try {
      const { error } = await supabase.from('push_tokens').upsert(
        {
          user_id: userId,
          token,
          platform,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id, token' }
      );

      if (error) {
        console.warn('[Push] Error upserting push token:', error.message);
      }
    } catch (err) {
      console.warn('[Push] Error saving token to database:', err);
    }
  }

  /**
   * Inserts notification into outbox notifications table for Edge Function delivery
   */
  async queueNotification(notification: PushNotificationPayload): Promise<void> {
    try {
      const { error } = await supabase.from('notifications').insert({
        recipient_id: notification.recipientId,
        couple_id: notification.coupleId,
        type: notification.type,
        payload: notification.payload as any,
        deep_link: notification.deepLink || null,
        send_after: notification.sendAfter || new Date().toISOString(),
      });

      if (error) {
        console.warn('[Push] Error queueing notification:', error.message);
      }
    } catch (err) {
      console.warn('[Push] Error inserting notification row:', err);
    }
  }

  /**
   * Listens for push notification tap responses and deep-links to the target screen
   * Maps all 7 types: invite, message, letter, photo mission, date, memory, anniversary
   */
  setupNotificationResponseListener(onNavigate: (url: string) => void): () => void {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Notifications = require('expo-notifications');

      // Check cold-start notification tap
      Notifications.getLastNotificationResponseAsync?.().then((response: any) => {
        if (response) {
          const data = response?.notification?.request?.content?.data;
          const type = data?.type || '';
          const route = getRouteForNotification(type, data);
          if (route) {
            onNavigate(route);
          }
        }
      }).catch(() => {});

      const subscription = Notifications.addNotificationResponseReceivedListener(
        (response: any) => {
          const data = response?.notification?.request?.content?.data;
          const type = data?.type || '';
          const route = getRouteForNotification(type, data);
          if (route) {
            onNavigate(route);
          }
        }
      );

      return () => {
        subscription.remove();
      };
    } catch {
      // In web or mock environments, listen via Linking
      const linkingSub = Linking.addEventListener('url', ({ url }) => {
        onNavigate(url);
      });
      return () => linkingSub.remove();
    }
  }
}

export const push = new AppPushService();

// Refresh push token on auth state change (login and app launch)
supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user?.id) {
    push.registerForPushNotifications(session.user.id).catch(() => {});
  }
});
