import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, analytics } from '@/services';
import { useAuthStore } from '@/features/auth';
import { useActiveCouple } from '@/features/couple';
import type { Activity, ActivitySession } from '@/shared/types';

export function useActivities(category?: string) {
  return useQuery<Activity[]>({
    queryKey: ['activities', category],
    queryFn: async () => {
      let query = supabase.from('activities').select('*').order('title', { ascending: true });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useStartActivity() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
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

      analytics.track('activity_started', { activity_id: activityId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeSession'] });
      queryClient.invalidateQueries({ queryKey: ['homeData'] });
    },
  });
}

