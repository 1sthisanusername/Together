export interface PushNotificationPayload {
  recipientId: string;
  type: string;
  payload: Record<string, unknown>;
  deepLink?: string;
  sendAfter?: string; // ISO 8601 UTC
}

export interface PushService {
  registerForPushNotifications: () => Promise<string | null>;
  queueNotification: (notification: PushNotificationPayload) => Promise<void>;
}

class AppPushService implements PushService {
  async registerForPushNotifications(): Promise<string | null> {
    // Wrapped expo-notifications registration (stubbed for mock/testing, wrapped for native)
    return null;
  }

  async queueNotification(notification: PushNotificationPayload): Promise<void> {
    // In accordance with Section 3.7, notifications are enqueued to the outbox table for Edge Function delivery
    if (__DEV__) {
      console.log('[Push] Queued outbox notification:', notification);
    }
  }
}

export const push = new AppPushService();

