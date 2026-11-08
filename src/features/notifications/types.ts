export type NotificationType =
  | 'message'
  | 'voice_note'
  | 'photo_message'
  | 'letter'
  | 'photo_mission'
  | 'date'
  | 'memory'
  | 'game_invite'
  | 'anniversary'
  | 'daily_mission';

export interface NotificationPayload {
  title?: string;
  body?: string;
  senderName?: string;
  sessionId?: string;
  memoryId?: string;
  letterId?: string;
  [key: string]: any;
}

export interface AppNotification {
  id: string;
  recipient_id: string;
  couple_id: string;
  type: string;
  payload: NotificationPayload;
  deep_link: string | null;
  send_after: string;
  sent_at: string | null;
  read_at: string | null;
  created_at: string;
}

