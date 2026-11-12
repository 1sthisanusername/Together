import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services';
import { useAuthStore } from '@/features/auth';
import { useActiveCouple } from '@/features/couple';
import { formatDateToDateString } from '@/shared/ui';
import type { BucketItem, ImportantDate } from '@/shared/types';

/** Returns true when an important date is in the past relative to today. */
export function isImportantDateInPast(dateStr: string): boolean {
  const today = formatDateToDateString(new Date());
  return dateStr < today;
}

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
      isRecurring = true,
    }: {
      title: string;
      eventDate: string;
      category?: string;
      isRecurring?: boolean;
    }) => {
      if (!user?.id || !coupleData?.couple?.id) throw new Error('Not authenticated');

      if ((category || 'anniversary') === 'meeting' && isImportantDateInPast(eventDate)) {
        throw new Error('Next reunion date must be today or in the future.');
      }

      const { data, error } = await supabase
        .from('important_dates')
        .insert({
          couple_id: coupleData.couple.id,
          created_by: user.id,
          title,
          event_date: eventDate,
          category: category || 'anniversary',
          is_recurring: isRecurring,
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

export function useUpdateImportantDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      eventDate,
      category,
      isRecurring,
    }: {
      id: string;
      title: string;
      eventDate: string;
      category?: string;
      isRecurring?: boolean;
    }) => {
      if (category === 'meeting' && isImportantDateInPast(eventDate)) {
        throw new Error('Next reunion date must be today or in the future.');
      }

      const { data, error } = await supabase
        .from('important_dates')
        .update({
          title,
          event_date: eventDate,
          category: category || 'anniversary',
          is_recurring: isRecurring ?? true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
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

export function useDeleteImportantDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('important_dates')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['importantDates'] });
      queryClient.invalidateQueries({ queryKey: ['homeData'] });
    },
  });
}

