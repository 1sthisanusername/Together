import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services';
import { useAuthStore } from '@/features/auth';
import { useActiveCouple } from '@/features/couple';
import type { BucketItem } from '@/shared/types';

export interface BucketListFilters {
  status?: 'all' | 'pending' | 'completed';
  category?: string | null;
}

export function useBucketListItems(filters?: BucketListFilters) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { data: coupleData } = useActiveCouple();
  const coupleId = coupleData?.couple?.id;

  const query = useQuery<BucketItem[]>({
    queryKey: ['bucketList', coupleId],
    enabled: !!coupleId && !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bucket_items')
        .select('*')
        .eq('couple_id', coupleId!)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  // Realtime subscription for cross-device synchronization
  useEffect(() => {
    if (!coupleId) return;

    const channel = supabase
      .channel(`bucket_items_${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bucket_items',
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['bucketList', coupleId] });
          queryClient.invalidateQueries({ queryKey: ['bucketItems', coupleId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, queryClient]);

  // Client-side filtering
  const allItems = query.data ?? [];
  const filteredItems = allItems.filter((item) => {
    if (filters?.status === 'pending' && item.completed_at) return false;
    if (filters?.status === 'completed' && !item.completed_at) return false;
    if (filters?.category && filters.category !== 'all' && item.category !== filters.category) {
      return false;
    }
    return true;
  });

  const pendingCount = allItems.filter((i) => !i.completed_at).length;
  const completedCount = allItems.filter((i) => !!i.completed_at).length;

  return {
    ...query,
    items: filteredItems,
    allItems,
    pendingCount,
    completedCount,
  };
}

export function useAddBucketListItem() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { data: coupleData } = useActiveCouple();

  return useMutation({
    mutationFn: async ({
      title,
      description,
      category = 'adventure',
      targetDate,
    }: {
      title: string;
      description?: string;
      category?: string;
      targetDate?: string | null;
    }) => {
      if (!user?.id || !coupleData?.couple?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bucket_items')
        .insert({
          couple_id: coupleData.couple.id,
          created_by: user.id,
          title: title.trim(),
          description: description?.trim() || null,
          category,
          target_date: targetDate || null,
        })
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bucketList'] });
      queryClient.invalidateQueries({ queryKey: ['bucketItems'] });
    },
  });
}

export function useUpdateBucketListItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      description,
      category,
      targetDate,
    }: {
      id: string;
      title: string;
      description?: string | null;
      category?: string;
      targetDate?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('bucket_items')
        .update({
          title: title.trim(),
          description: description?.trim() || null,
          category,
          target_date: targetDate || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bucketList'] });
      queryClient.invalidateQueries({ queryKey: ['bucketItems'] });
    },
  });
}

export function useToggleBucketListItem() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
      const { data, error } = await supabase
        .from('bucket_items')
        .update({
          completed_at: isCompleted ? new Date().toISOString() : null,
          completed_by: isCompleted ? user?.id : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bucketList'] });
      queryClient.invalidateQueries({ queryKey: ['bucketItems'] });
    },
  });
}

export function useDeleteBucketListItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bucket_items')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bucketList'] });
      queryClient.invalidateQueries({ queryKey: ['bucketItems'] });
    },
  });
}
