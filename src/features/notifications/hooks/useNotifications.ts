import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { create } from 'zustand';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/features/auth';
import type { UserSetting } from '@/shared/types';
import { shouldShowNotificationBanner } from '../utils/notificationPreferences';
import type { AppNotification } from '../types';

interface NotificationBannerState {
  currentNotification: AppNotification | null;
  showBanner: (notif: AppNotification) => void;
  hideBanner: () => void;
}

export const useNotificationBannerStore = create<NotificationBannerState>((set) => ({
  currentNotification: null,
  showBanner: (notif) => set({ currentNotification: notif }),
  hideBanner: () => set({ currentNotification: null }),
}));

/**
 * Hook to fetch all notifications for the current authenticated user (newest first).
 */
export function useNotifications() {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async (): Promise<AppNotification[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw new Error(error.message);
      }

      return (data || []) as AppNotification[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Hook to fetch the exact unread notifications count for the badge.
 * Auto-refreshed on app focus, mount, or Realtime event.
 */
export function useUnreadNotificationsCount() {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['notifications', 'unread-count', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .is('read_at', null);

      if (error) {
        console.warn('[Notifications] Error fetching unread count:', error.message);
        return 0;
      }

      return count || 0;
    },
    enabled: !!user?.id,
    refetchOnMount: 'always',
    staleTime: 1000 * 15,
  });
}

/**
 * Mark a single notification as read.
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('recipient_id', user.id);

      if (error) throw new Error(error.message);
      return notificationId;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<AppNotification[]>(['notifications', user?.id], (old = []) =>
        old.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', user?.id] });
    },
  });
}

/**
 * Mark all notifications for the user as read.
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('recipient_id', user.id)
        .is('read_at', null);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      const now = new Date().toISOString();
      queryClient.setQueryData<AppNotification[]>(['notifications', user?.id], (old = []) =>
        old.map((n) => ({ ...n, read_at: n.read_at || now }))
      );
      queryClient.setQueryData(['notifications', 'unread-count', user?.id], 0);
    },
  });
}

/**
 * Subscribes to Supabase Realtime for instant in-app notification reception while app is open.
 * Invalidates caches and triggers top in-app banner.
 */
export function useNotificationRealtime() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const showBanner = useNotificationBannerStore((state) => state.showBanner);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`inbox_notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as AppNotification;
          queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
          queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count', user.id] });
          const userSettings = queryClient.getQueryData<UserSetting | null>(['userSettings', user.id]);
          if (shouldShowNotificationBanner(newNotif.type, userSettings)) {
            showBanner(newNotif);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient, showBanner]);
}
