import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';

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

class AppPushService implements PushService {
  /**
   * Registers or refreshes push token for the current user.
   * If on a physical device with Expo push configured, retrieves the token and persists to push_tokens table.
   */
  async registerForPushNotifications(userId: string): Promise<string | null> {
    if (!userId) return null;

    try {
      // Dynamic import to prevent crash in environments without expo-notifications native module
      let token: string | null = null;

      try {
        const Notifications = require('expo-notifications');
        const Device = require('expo-device');

        if (Device.isDevice) {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;

          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }

          if (finalStatus === 'granted') {
            const expoTokenData = await Notifications.getExpoPushTokenAsync();
            token = expoTokenData.data;
          }
        }
      } catch {
        // Fallback or development / simulated token
      }

      if (token) {
        await this.savePushToken(userId, token, Platform.OS);
      }

      return token;
    } catch (err) {
      console.warn('[Push] Failed to register push token:', err);
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
   * Listens for push notification tap responses and routes to deep-linked screen
   */
  setupNotificationResponseListener(onNavigate: (url: string) => void): () => void {
    try {
      const Notifications = require('expo-notifications');
      const subscription = Notifications.addNotificationResponseReceivedListener(
        (response: any) => {
          const deepLink = response?.notification?.request?.content?.data?.deepLink;
          if (deepLink && typeof deepLink === 'string') {
            onNavigate(deepLink);
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
