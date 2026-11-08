import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase, analytics } from '@/services';
import type { Couple, Profile, Invitation } from '@/shared/types';
import { useAuthStore } from '@/features/auth';

export interface CoupleData {
  couple: Couple;
  partner: Profile | null;
  myMemberRole: 'creator' | 'partner';
  isComplete: boolean;
  pendingInvite?: Invitation | null;
}

export const useActiveCouple = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const query = useQuery<CoupleData | null>({
    queryKey: ['activeCouple', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user) return null;

      // 1. Find my active membership
      const { data: myMember, error: myMemberError } = await supabase
        .from('couple_members')
        .select('couple_id, role')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (myMemberError) {
        throw new Error(myMemberError.message);
      }

      if (!myMember) {
        return null;
      }

      // 2. Fetch couple
      const { data: couple, error: coupleError } = await supabase
        .from('couples')
        .select('*')
        .eq('id', myMember.couple_id)
        .single();

      if (coupleError) {
        throw new Error(coupleError.message);
      }

      // 3. Fetch all active members in this couple
      const { data: members, error: membersError } = await supabase
        .from('couple_members')
        .select('user_id, role, status')
        .eq('couple_id', myMember.couple_id)
        .eq('status', 'active');

      if (membersError) {
        throw new Error(membersError.message);
      }

      const partnerMember = members?.find((m) => m.user_id !== user.id);
      let partnerProfile: Profile | null = null;

      if (partnerMember) {
        const { data: partnerData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', partnerMember.user_id)
          .maybeSingle();

        partnerProfile = partnerData;
      }

      // 4. If partner not yet joined, find active pending invitation
      let pendingInvite: Invitation | null = null;
      if (!partnerProfile) {
        const { data: inviteData } = await supabase
          .from('invitations')
          .select('*')
          .eq('couple_id', myMember.couple_id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        pendingInvite = inviteData;
      }

      return {
        couple,
        partner: partnerProfile,
        myMemberRole: myMember.role,
        isComplete: !!partnerProfile,
        pendingInvite,
      };
    },
  });

  // Supabase Realtime subscription for couple_members to auto-update when partner links
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`couple_members_${user.id}_${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'couple_members',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['activeCouple', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

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
      queryClient.invalidateQueries({ queryKey: ['activeCouple', user?.id] });
    },
  });
};

