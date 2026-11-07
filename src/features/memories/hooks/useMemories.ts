import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, analytics } from '@/services';
import { useAuthStore } from '@/features/auth';
import { useActiveCouple } from '@/features/couple';
import type { Memory } from '@/shared/types';

export function useMemories() {
  const user = useAuthStore((state) => state.user);
  const { data: coupleData } = useActiveCouple();

  return useQuery<Memory[]>({
    queryKey: ['memories', coupleData?.couple?.id],
    enabled: !!coupleData?.couple?.id && !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('couple_id', coupleData!.couple.id)
        .is('deleted_at', null)
        .order('memory_date', { ascending: false });

      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useCreateMemory() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { data: coupleData } = useActiveCouple();

  return useMutation({
    mutationFn: async ({
      title,
      note,
      memoryDate,
    }: {
      title: string;
      note?: string;
      memoryDate?: string;
    }) => {
      if (!user?.id || !coupleData?.couple?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('memories')
        .insert({
          couple_id: coupleData.couple.id,
          created_by: user.id,
          title,
          note: note || null,
          memory_date: memoryDate || new Date().toISOString().split('T')[0],
          favorite: false,
        })
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      analytics.track('memory_created');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
  });
}

