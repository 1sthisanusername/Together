import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { create } from 'zustand';
import { supabase, analytics, clearAppCache } from '@/services';
import type { Couple, Profile, Invitation } from '@/shared/types';
import { useAuthStore } from '@/features/auth';

export type CoupleState = 'NO_COUPLE' | 'PENDING' | 'ACTIVE';

export interface CoupleData {
  state: CoupleState;
  couple: Couple;
  partner: Profile | null;
  myMemberRole: 'creator' | 'partner';
  activeMemberCount: number;
  isComplete: boolean;
  pendingInvite?: Invitation | null;
}

interface PartnerUnlinkStore {
  unlinkedMessage: string | null;
  setUnlinkedMessage: (message: string | null) => void;
  clearUnlinkedMessage: () => void;
}

export const usePartnerUnlinkStore = create<PartnerUnlinkStore>((set) => ({
  unlinkedMessage: null,
  setUnlinkedMessage: (unlinkedMessage) => set({ unlinkedMessage }),
  clearUnlinkedMessage: () => set({ unlinkedMessage: null }),
}));

export const useActiveCouple = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const setUnlinkedMessage = usePartnerUnlinkStore((state) => state.setUnlinkedMessage);

  const query = useQuery<CoupleData | null>({
    queryKey: ['activeCouple', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user) return null;

      // 1. Find caller's active membership
      const { data: myMember, error: myMemberError } = await supabase
        .from('couple_members')
        .select('couple_id, role')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (myMemberError) {
        throw new Error(myMemberError.message);
      }

      // NO_COUPLE: No active membership row found
      if (!myMember) {
        return null;
      }

      // 2. Fetch couple and all active members in parallel (Promise.all)
      const [
        { data: couple, error: coupleError },
        { data: members, error: membersError },
      ] = await Promise.all([
        supabase
          .from('couples')
          .select('*')
          .eq('id', myMember.couple_id)
          .single(),
        supabase
          .from('couple_members')
          .select('user_id, role, status')
          .eq('couple_id', myMember.couple_id)
          .eq('status', 'active'),
      ]);

      if (coupleError) throw new Error(coupleError.message);
      if (membersError) throw new Error(membersError.message);

      const activeMembers = members || [];
      const activeCount = activeMembers.length;

      // PENDING: Couple exists, but only 1 active member (waiting for partner)
      if (activeCount <= 1) {
        const { data: inviteData } = await supabase
          .from('invitations')
          .select('*')
          .eq('couple_id', myMember.couple_id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          state: 'PENDING',
          couple,
          partner: null,
          myMemberRole: myMember.role,
          activeMemberCount: activeCount,
          isComplete: false,
          pendingInvite: inviteData,
        };
      }

      // ACTIVE: Exactly 2 active members (full couple space)
      const partnerMember = activeMembers.find((m) => m.user_id !== user.id);
      let partnerProfile: Profile | null = null;

      if (partnerMember) {
        const { data: partnerData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', partnerMember.user_id)
          .maybeSingle();

        partnerProfile = partnerData;
      }

      return {
        state: 'ACTIVE',
        couple,
        partner: partnerProfile,
        myMemberRole: myMember.role,
        activeMemberCount: activeCount,
        isComplete: true,
      };
    },
  });

  // Supabase Realtime subscription: Partner's app redirects immediately when unlinked
  useEffect(() => {
    if (!user) return;

    // Use unique channel topic to prevent collisions when multiple components invoke useActiveCouple()
    const channelName = `couple_members_${user.id}_${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'couple_members',
        },
        (payload) => {
          // If membership row updated to unlinked, partner unlinked!
          if (
            payload.eventType === 'UPDATE' &&
            (payload.new as any)?.status === 'unlinked'
          ) {
            clearAppCache();
            setUnlinkedMessage('Your partner unlinked');
          }
          queryClient.invalidateQueries({ queryKey: ['activeCouple', user.id] });
          queryClient.invalidateQueries({ queryKey: ['homeData'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, setUnlinkedMessage]);

  return query;
};

export const useCreateCouple = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (coupleName?: string) => {
      if (!user) {
        throw new Error('You must be logged in to create a couple space.');
      }
      const { data, error } = await supabase.rpc('create_couple_with_invite', {
        p_couple_name: coupleName || null,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data as {
        couple_id: string;
        couple_name: string | null;
        invitation_id: string;
        invite_code: string;
        expires_at: string;
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeCouple', user?.id] });
    },
  });
};

export const useAcceptInvite = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      if (!user) {
        throw new Error('You must be logged in to join a couple space.');
      }
      const { data, error } = await supabase.rpc('accept_invitation', {
        p_invite_code: inviteCode.trim().toUpperCase(),
      });

      if (error) {
        throw new Error(error.message);
      }

      analytics.track('partner_linked');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeCouple', user?.id] });
    },
  });
};

export const useUnlinkCouple = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('unlink_couple');
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: () => {
      // Clear all cached queries, persisted storage, and local data on unlink
      clearAppCache();
      queryClient.invalidateQueries({ queryKey: ['activeCouple', user?.id] });
    },
  });
};

export const useUpdateStartDate = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (startDate: string | null) => {
      if (!user) throw new Error('Not authenticated');

      if (startDate) {
        const today = new Date().toISOString().split('T')[0];
        if (startDate > today) {
          throw new Error('Anniversary date cannot be in the future');
        }
      }

      // 1. Locate user active couple
      const { data: member } = await supabase
        .from('couple_members')
        .select('couple_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!member?.couple_id) {
        throw new Error('No active couple found');
      }

      // 2. Update couple start_date
      const { data, error } = await supabase
        .from('couples')
        .update({
          start_date: startDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', member.couple_id)
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeCouple', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['homeData'] });
    },
  });
};
