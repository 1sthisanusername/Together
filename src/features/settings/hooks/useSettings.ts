import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services';
import { useAuthStore } from '@/features/auth';
import type { UserSetting } from '@/shared/types';

export function useUserSettings() {
  const user = useAuthStore((state) => state.user);

  return useQuery<UserSetting | null>({
    queryKey: ['userSettings', user?.id],
    enabled: !!user?.id,
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

