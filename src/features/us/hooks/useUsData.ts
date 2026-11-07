import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services';
import { useAuthStore } from '@/features/auth';
import { useActiveCouple } from '@/features/couple';
import type { BucketItem, ImportantDate } from '@/shared/types';

export function useBucketItems() {
  const user = useAuthStore((state) => state.user);
  const { data: coupleData } = useActiveCouple();

  return useQuery<BucketItem[]>({
    queryKey: ['bucketItems', coupleData?.couple?.id],
    enabled: !!coupleData?.couple?.id && !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bucket_items')
        .select('*')
        .eq('couple_id', coupleData!.couple.id)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useAddBucketItem() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { data: coupleData } = useActiveCouple();

  return useMutation({
    mutationFn: async ({ title, category }: { title: string; category?: string }) => {
      if (!user?.id || !coupleData?.couple?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bucket_items')
        .insert({
          couple_id: coupleData.couple.id,
          created_by: user.id,
          title,
          category: category || 'adventure',
        })
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bucketItems'] });
    },
  });
}

export function useToggleBucketItem() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
      const { data, error } = await supabase
        .from('bucket_items')
        .update({
          completed_at: isCompleted ? new Date().toISOString() : null,
          completed_by: isCompleted ? user?.id : null,
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bucketItems'] });
    },
  });
}

export function useImportantDates() {
  const user = useAuthStore((state) => state.user);
  const { data: coupleData } = useActiveCouple();

  return useQuery<ImportantDate[]>({
    queryKey: ['importantDates', coupleData?.couple?.id],
    enabled: !!coupleData?.couple?.id && !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('important_dates')
        .select('*')
        .eq('couple_id', coupleData!.couple.id)
        .order('event_date', { ascending: true });

      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useAddImportantDate() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { data: coupleData } = useActiveCouple();

  return useMutation({
    mutationFn: async ({
      title,
      eventDate,
      category,
    }: {
      title: string;
      eventDate: string;
      category?: string;
    }) => {
      if (!user?.id || !coupleData?.couple?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('important_dates')
        .insert({
          couple_id: coupleData.couple.id,
          created_by: user.id,
          title,
          event_date: eventDate,
          category: category || 'anniversary',
        })
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['importantDates'] });
      queryClient.invalidateQueries({ queryKey: ['homeData'] });
    },
  });
}

