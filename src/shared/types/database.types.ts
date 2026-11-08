export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string;
          avatar_url: string | null;
          timezone: string;
          locale: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string;
          avatar_url?: string | null;
          timezone?: string;
          locale?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string;
          avatar_url?: string | null;
          timezone?: string;
          locale?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      couples: {
        Row: {
          id: string;
          name: string | null;
          start_date: string | null;
          status: 'active' | 'unlinked';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          start_date?: string | null;
          status?: 'active' | 'unlinked';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          start_date?: string | null;
          status?: 'active' | 'unlinked';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      couple_members: {
        Row: {
          id: string;
          couple_id: string;
          user_id: string;
          role: 'creator' | 'partner';
          status: 'active' | 'unlinked';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          user_id: string;
          role?: 'creator' | 'partner';
          status?: 'active' | 'unlinked';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          user_id?: string;
          role?: 'creator' | 'partner';
          status?: 'active' | 'unlinked';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      invitations: {
        Row: {
          id: string;
          couple_id: string;
          inviter_id: string;
          code: string;
          status: 'pending' | 'accepted' | 'expired' | 'revoked';
          expires_at: string;
          accepted_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          inviter_id: string;
          code: string;
          status?: 'pending' | 'accepted' | 'expired' | 'revoked';
          expires_at?: string;
          accepted_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          inviter_id?: string;
          code?: string;
          status?: 'pending' | 'accepted' | 'expired' | 'revoked';
          expires_at?: string;
          accepted_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      activities: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string;
          kind: string;
          category: string;
          mode: 'live' | 'async' | 'both';
          duration_minutes: number;
          config: Json;
          version: number;
          locale: string;
          icon: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description: string;
          kind: string;
          category: string;
          mode?: 'live' | 'async' | 'both';
          duration_minutes?: number;
          config?: Json;
          version?: number;
          locale?: string;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          description?: string;
          kind?: string;
          category?: string;
          mode?: 'live' | 'async' | 'both';
          duration_minutes?: number;
          config?: Json;
          version?: number;
          locale?: string;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      activity_sessions: {
        Row: {
          id: string;
          couple_id: string;
          activity_id: string;
          created_by: string;
          status: 'created' | 'waiting' | 'active' | 'paused' | 'completed' | 'cancelled';
          current_round: number;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          activity_id: string;
          created_by: string;
          status?: 'created' | 'waiting' | 'active' | 'paused' | 'completed' | 'cancelled';
          current_round?: number;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          activity_id?: string;
          created_by?: string;
          status?: 'created' | 'waiting' | 'active' | 'paused' | 'completed' | 'cancelled';
          current_round?: number;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      session_events: {
        Row: {
          id: string;
          session_id: string;
          couple_id: string;
          user_id: string;
          type: string;
          payload: Json;
          idempotency_key: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          couple_id: string;
          user_id: string;
          type: string;
          payload?: Json;
          idempotency_key: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          couple_id?: string;
          user_id?: string;
          type?: string;
          payload?: Json;
          idempotency_key?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      letters: {
        Row: {
          id: string;
          couple_id: string;
          sender_id: string;
          recipient_id: string;
          title: string;
          content: string;
          unlock_at: string | null;
          opened_at: string | null;
          media_id: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          sender_id: string;
          recipient_id: string;
          title: string;
          content: string;
          unlock_at?: string | null;
          opened_at?: string | null;
          media_id?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          sender_id?: string;
          recipient_id?: string;
          title?: string;
          content?: string;
          unlock_at?: string | null;
          opened_at?: string | null;
          media_id?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          couple_id: string;
          sender_id: string;
          recipient_id: string;
          content: string | null;
          media_id: string | null;
          played_at: string | null;
          deleted_at: string | null;
          idempotency_key: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          sender_id: string;
          recipient_id: string;
          content?: string | null;
          media_id?: string | null;
          played_at?: string | null;
          deleted_at?: string | null;
          idempotency_key?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          sender_id?: string;
          recipient_id?: string;
          content?: string | null;
          media_id?: string | null;
          played_at?: string | null;
          deleted_at?: string | null;
          idempotency_key?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      memories: {
        Row: {
          id: string;
          couple_id: string;
          created_by: string;
          session_id: string | null;
          title: string;
          note: string | null;
          memory_date: string;
          media_id: string | null;
          favorite: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          created_by: string;
          session_id?: string | null;
          title: string;
          note?: string | null;
          memory_date?: string;
          media_id?: string | null;
          favorite?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          created_by?: string;
          session_id?: string | null;
          title?: string;
          note?: string | null;
          memory_date?: string;
          media_id?: string | null;
          favorite?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      media_files: {
        Row: {
          id: string;
          couple_id: string;
          owner_id: string;
          bucket_path: string;
          mime_type: string;
          file_size: number | null;
          duration_seconds: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          owner_id: string;
          bucket_path: string;
          mime_type: string;
          file_size?: number | null;
          duration_seconds?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          owner_id?: string;
          bucket_path?: string;
          mime_type?: string;
          file_size?: number | null;
          duration_seconds?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bucket_items: {
        Row: {
          id: string;
          couple_id: string;
          created_by: string;
          title: string;
          description: string | null;
          category: string | null;
          completed_at: string | null;
          completed_by: string | null;
          target_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          created_by: string;
          title: string;
          description?: string | null;
          category?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          target_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          created_by?: string;
          title?: string;
          description?: string | null;
          category?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          target_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      important_dates: {
        Row: {
          id: string;
          couple_id: string;
          created_by: string;
          title: string;
          event_date: string;
          is_recurring: boolean;
          category: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          created_by: string;
          title: string;
          event_date: string;
          is_recurring?: boolean;
          category?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          created_by?: string;
          title?: string;
          event_date?: string;
          is_recurring?: boolean;
          category?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          couple_id: string;
          type: string;
          payload: Json;
          deep_link: string | null;
          send_after: string;
          sent_at: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          couple_id: string;
          type: string;
          payload?: Json;
          deep_link?: string | null;
          send_after?: string;
          sent_at?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipient_id?: string;
          couple_id?: string;
          type?: string;
          payload?: Json;
          deep_link?: string | null;
          send_after?: string;
          sent_at?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          user_id: string;
          notifications_enabled: boolean;
          notify_activities: boolean;
          notify_letters: boolean;
          notify_dates: boolean;
          quiet_hours_enabled: boolean;
          quiet_hours_start: string | null;
          quiet_hours_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          notifications_enabled?: boolean;
          notify_activities?: boolean;
          notify_letters?: boolean;
          notify_dates?: boolean;
          quiet_hours_enabled?: boolean;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          notifications_enabled?: boolean;
          notify_activities?: boolean;
          notify_letters?: boolean;
          notify_dates?: boolean;
          quiet_hours_enabled?: boolean;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      feature_flags: {
        Row: {
          key: string;
          enabled: boolean;
          rollout_percent: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          key: string;
          enabled?: boolean;
          rollout_percent?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          key?: string;
          enabled?: boolean;
          rollout_percent?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      entitlements: {
        Row: {
          id: string;
          couple_id: string;
          key: string;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          key: string;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          key?: string;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      push_tokens: {
        Row: {
          user_id: string;
          token: string;
          platform: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          token: string;
          platform: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          token?: string;
          platform?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_active_couple_id: {
        Args: {
          p_user_id: string;
        };
        Returns: string | null;
      };
      create_couple_with_invite: {
        Args: {
          p_couple_name?: string | null;
        };
        Returns: {
          couple_id: string;
          couple_name: string | null;
          invitation_id: string;
          invite_code: string;
          expires_at: string;
        };
      };
      accept_invitation: {
        Args: {
          p_invite_code: string;
        };
        Returns: {
          couple_id: string;
          status: string;
        };
      };
      unlink_couple: {
        Args: Record<PropertyKey, never>;
        Returns: {
          couple_id: string;
          status: string;
        };
      };
      get_session_events_masked: {
        Args: {
          p_session_id: string;
        };
        Returns: {
          id: string;
          session_id: string;
          couple_id: string;
          user_id: string;
          type: string;
          payload: Json;
          idempotency_key: string;
          created_at: string;
          is_revealed: boolean;
        }[];
      };
      open_letter: {
        Args: {
          p_letter_id: string;
        };
        Returns: {
          letter_id: string;
          status: string;
          opened_at: string;
        };
      };
      advance_round: {
        Args: {
          p_session_id: string;
          p_expected_round: number;
        };
        Returns: {
          session_id: string;
          current_round: number;
          advanced: boolean;
          by_name?: string;
          message?: string;
        };
      };
      delete_message: {
        Args: {
          p_message_id: string;
        };
        Returns: {
          message_id: string;
          deleted: boolean;
          media_bucket_path?: string | null;
        };
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Profile = Tables<'profiles'>;
export type Couple = Tables<'couples'>;
export type CoupleMember = Tables<'couple_members'>;
export type Invitation = Tables<'invitations'>;
export type Activity = Tables<'activities'>;
export type ActivitySession = Tables<'activity_sessions'>;
export type SessionEvent = Tables<'session_events'>;
export type Letter = Tables<'letters'>;
export type Message = Tables<'messages'>;
export type Memory = Tables<'memories'>;
export type MediaFile = Tables<'media_files'>;
export type BucketItem = Tables<'bucket_items'>;
export type ImportantDate = Tables<'important_dates'>;
export type Notification = Tables<'notifications'>;
export type UserSetting = Tables<'user_settings'>;
export type FeatureFlag = Tables<'feature_flags'>;
export type Entitlement = Tables<'entitlements'>;
