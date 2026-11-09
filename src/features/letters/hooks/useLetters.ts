import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, analytics, push } from '@/services';
import { useAuthStore } from '@/features/auth';
import { useActiveCouple } from '@/features/couple';
import type { Letter } from '@/shared/types';

export type StationeryTheme =
  | 'parchment_cream'
  | 'rose_petal'
  | 'matcha_mint'
  | 'midnight_sky';

export type SealSticker = '❤️' | '💌' | '🌸' | '🌙' | '✨';

export interface EnhancedLetter extends Letter {
  stationery_theme?: StationeryTheme;
  seal_sticker?: SealSticker;
  is_vault?: boolean;
  photo_url?: string | null;
  voice_url?: string | null;
  voice_duration_seconds?: number | null;
}

export function useLetters(options?: { includeVaultOnly?: boolean }) {
  const user = useAuthStore((state) => state.user);
  const { data: coupleData } = useActiveCouple();

  return useQuery<EnhancedLetter[]>({
    queryKey: ['letters', coupleData?.couple?.id, options?.includeVaultOnly],
    enabled: !!coupleData?.couple?.id && !!user?.id,
    queryFn: async () => {
      let query: any = supabase
        .from('letters')
        .select('*')
        .eq('couple_id', coupleData!.couple.id)
        .is('deleted_at', null);

      if (options?.includeVaultOnly) {
        query = query.eq('is_vault', true);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data as EnhancedLetter[]) ?? [];
    },
  });
}

export function useSendLetter() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const { data: coupleData } = useActiveCouple();

  return useMutation({
    mutationFn: async ({
      title,
      content,
      unlockAt,
      stationeryTheme = 'parchment_cream',
      sealSticker = '❤️',
      isVault = false,
      photoUrl,
      voiceUrl,
      voiceDurationSeconds,
    }: {
      title: string;
      content: string;
      unlockAt?: string | null;
      stationeryTheme?: StationeryTheme;
      sealSticker?: SealSticker;
      isVault?: boolean;
      photoUrl?: string | null;
      voiceUrl?: string | null;
      voiceDurationSeconds?: number | null;
    }) => {
      if (!user?.id || !coupleData?.couple?.id || !coupleData.partner?.id) {
        throw new Error('Not ready to send letter');
      }

      const insertPayload: any = {
        couple_id: coupleData.couple.id,
        sender_id: user.id,
        recipient_id: coupleData.partner.id,
        title,
        content,
        unlock_at: unlockAt || null,
        stationery_theme: stationeryTheme,
        seal_sticker: sealSticker,
        is_vault: isVault,
      };

      if (photoUrl) insertPayload.photo_url = photoUrl;
      if (voiceUrl) {
        insertPayload.voice_url = voiceUrl;
        insertPayload.voice_duration_seconds = voiceDurationSeconds || 0;
      }

      const { data, error } = await (supabase.from('letters') as any)
        .insert(insertPayload)
        .select('*')
        .single();

      if (error) throw new Error(error.message);

      // Notify partner
      push.queueNotification({
        recipientId: coupleData.partner.id,
        coupleId: coupleData.couple.id,
        type: 'letter',
        payload: {
          title: `You received a letter from ${profile?.display_name || 'your partner'} 💌`,
          body: unlockAt
            ? `Sealed until ${new Date(unlockAt).toLocaleDateString()}`
            : 'Ready for you to tear open!',
        },
        deepLink: 'together://(tabs)/dates',
      }).catch(() => {});

      (analytics.track as any)('letter_sent');
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
