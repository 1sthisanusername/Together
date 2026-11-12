import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, persistQueryCache } from '@/services';
import { useAuthStore } from '@/features/auth';
import type { UserSetting } from '@/shared/types';

export function useUserSettings() {
  const user = useAuthStore((state) => state.user);

  return useQuery<UserSetting | null>({
    queryKey: ['userSettings', user?.id],
    enabled: !!user?.id,
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export type UserSettingsUpdate = Partial<
  Omit<UserSetting, 'user_id' | 'created_at' | 'updated_at'>
>;

export function useUpdateUserSettings() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (updates: UserSettingsUpdate) => {
      if (!user?.id) throw new Error('Not authenticated');

      const payload = {
        user_id: user.id,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('user_settings')
        .upsert(payload, { onConflict: 'user_id' })
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      return data as UserSetting;
    },
    onMutate: async (updates) => {
      if (!user?.id) return;
      const key = ['userSettings', user.id];
      const previous = queryClient.getQueryData<UserSetting | null>(key);
      queryClient.setQueryData<UserSetting | null>(key, (old) =>
        old
          ? { ...old, ...updates, updated_at: new Date().toISOString() }
          : ({
              user_id: user.id,
              notifications_enabled: true,
              notify_activities: true,
              notify_messages: true,
              notify_letters: true,
              notify_daily_question: true,
              notify_photos: true,
              notify_games: true,
              notify_dates: true,
              quiet_hours_enabled: false,
              quiet_hours_start: '22:00:00',
              quiet_hours_end: '08:00:00',
              backup_account_email: null,
              last_backup_at: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...updates,
            } as UserSetting)
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (user?.id && context?.previous !== undefined) {
        queryClient.setQueryData(['userSettings', user.id], context.previous);
      }
    },
    onSuccess: (data) => {
      if (user?.id) {
        queryClient.setQueryData(['userSettings', user.id], data);
        persistQueryCache().catch(() => {});
      }
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);

  return useMutation({
    mutationFn: async ({
      displayName,
      timeZone,
    }: {
      displayName?: string;
      timeZone?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const updates: { display_name?: string; timezone?: string } = {};
      if (displayName !== undefined) updates.display_name = displayName;
      if (timeZone !== undefined) updates.timezone = timeZone;

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      await fetchProfile(user.id);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeCouple'] });
      queryClient.invalidateQueries({ queryKey: ['homeData'] });
    },
  });
}

