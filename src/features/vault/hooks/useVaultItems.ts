import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services';
import { useAuthStore } from '@/features/auth';
import { useActiveCouple } from '@/features/couple';

export interface VaultItem {
  id: string;
  couple_id: string;
  created_by: string;
  item_type: 'note' | 'secret' | 'photo';
  title?: string | null;
  content?: string | null;
  media_url?: string | null;
  tags?: string[] | null;
  is_pinned?: boolean;
  created_at: string;
  updated_at?: string;
}

export function useVaultItems() {
  const user = useAuthStore((state) => state.user);
  const { data: coupleData } = useActiveCouple();

  return useQuery<VaultItem[]>({
    queryKey: ['vault_items', coupleData?.couple?.id],
    enabled: !!coupleData?.couple?.id && !!user?.id,
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('vault_items')
        .select('*')
        .eq('couple_id', coupleData!.couple.id)
        .is('deleted_at', null)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data as VaultItem[]) ?? [];
    },
  });
}

export function useCreateVaultItem() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { data: coupleData } = useActiveCouple();

  return useMutation({
    mutationFn: async ({
      title,
      content,
      itemType = 'secret',
      mediaUrl,
    }: {
      title?: string;
      content: string;
      itemType?: 'note' | 'secret' | 'photo';
      mediaUrl?: string;
    }) => {
      if (!user?.id || !coupleData?.couple?.id) {
        throw new Error('Not connected as a couple');
      }

      const { data, error } = await (supabase.from as any)('vault_items')
        .insert({
          couple_id: coupleData.couple.id,
          created_by: user.id,
          title: title?.trim() || null,
          content: content.trim(),
          item_type: itemType,
          media_url: mediaUrl || null,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as VaultItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['vault_items', coupleData?.couple?.id],
      });
    },
  });
}

export function useDeleteVaultItem() {
  const queryClient = useQueryClient();
  const { data: coupleData } = useActiveCouple();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await (supabase.from as any)('vault_items')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', itemId);

      if (error) throw new Error(error.message);
      return itemId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['vault_items', coupleData?.couple?.id],
      });
    },
  });
}

