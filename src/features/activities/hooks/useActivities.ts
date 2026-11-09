import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, analytics, push } from '@/services';
import { useAuthStore } from '@/features/auth';
import { useActiveCouple } from '@/features/couple';
import type { Activity, ActivitySession } from '@/shared/types';

import { FALLBACK_ACTIVITIES } from '../fallbackActivities';
import { ENABLE_SIMULTANEOUS_ACTIVITIES } from '../config';

export function useActivities(category?: string) {
  return useQuery<Activity[]>({
    queryKey: ['activities', category],
    queryFn: async (): Promise<Activity[]> => {
      let query = supabase.from('activities').select('*').order('title', { ascending: true });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      let activities: Activity[] = (data as Activity[]) || [];
      if (error || !data || data.length === 0) {
        // Fallback on offline or unseeded database
        activities = filterFallback(category);
      }

      // Hide unsupported simultaneous activities (e.g. live drawing without sync infrastructure)
      if (!ENABLE_SIMULTANEOUS_ACTIVITIES) {
        activities = activities.filter((a) => a.kind !== 'drawing_guess');
      }

      return activities;
    },
  });
}

function filterFallback(category?: string): Activity[] {
  let list = FALLBACK_ACTIVITIES;
  if (category && category !== 'all') {
    list = list.filter((a) => a.category === category);
  }
  if (!ENABLE_SIMULTANEOUS_ACTIVITIES) {
    list = list.filter((a) => a.kind !== 'drawing_guess');
  }
  return list;
}

export function useStartActivity() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const { data: coupleData } = useActiveCouple();

  return useMutation({
    mutationFn: async (activityId: string): Promise<ActivitySession> => {
      if (!user?.id) throw new Error('Not authenticated');
      if (!coupleData?.couple?.id) throw new Error('No active couple');

      const { data, error } = await supabase
        .from('activity_sessions')
        .insert({
          activity_id: activityId,
          couple_id: coupleData.couple.id,
          created_by: user.id,
          status: 'waiting',
          started_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) throw new Error(error.message);

      // Notify partner with game invitation push notification
      if (coupleData.partner?.id) {
        push.queueNotification({
          recipientId: coupleData.partner.id,
          coupleId: coupleData.couple.id,
          type: 'game_invite',
          payload: {
            title: `${profile?.display_name || 'Your partner'} started an activity! 🎮`,
            body: 'Tap to join and play together now.',
            sessionId: data.id,
          },
          deepLink: `together://session/${data.id}`,
        }).catch(() => {});
      }

      analytics.track('activity_started', { activity_id: activityId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeSession'] });
      queryClient.invalidateQueries({ queryKey: ['homeData'] });
    },
  });
}

