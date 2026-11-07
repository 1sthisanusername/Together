import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, analytics } from '@/services';
import { useAuthStore } from '@/features/auth';
import { useActiveCouple } from '@/features/couple';
import type { Letter } from '@/shared/types';

export function useLetters() {
  const user = useAuthStore((state) => state.user);
  const { data: coupleData } = useActiveCouple();

  return useQuery<Letter[]>({
    queryKey: ['letters', coupleData?.couple?.id],
    enabled: !!coupleData?.couple?.id && !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('letters')
        .select('*')
        .eq('couple_id', coupleData!.couple.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useSendLetter() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { data: coupleData } = useActiveCouple();

  return useMutation({
    mutationFn: async ({
      title,
      content,
      unlockAt,
    }: {
      title: string;
      content: string;
      unlockAt?: string | null;
    }) => {
      if (!user?.id || !coupleData?.couple?.id || !coupleData.partner?.id) {
        throw new Error('Not ready to send letter');
      }

      const { data, error } = await supabase
        .from('letters')
        .insert({
          couple_id: coupleData.couple.id,
          sender_id: user.id,
          recipient_id: coupleData.partner.id,
          title,
          content,
          unlock_at: unlockAt || null,
        })
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letters'] });
    },
  });
}

export function useOpenLetter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (letterId: string) => {
      const { data, error } = await supabase.rpc('open_letter', {
        p_letter_id: letterId,
      });

      if (error) throw new Error(error.message);
      analytics.track('letter_opened');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letters'] });
    },
  });
}

