import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase, analytics } from '@/services';
import { useAuthStore } from '@/features/auth';
import { useActiveCouple } from '@/features/couple';
import type { Activity, ActivitySession, SessionEvent } from '@/shared/types';

export interface MaskedEvent extends SessionEvent {
  is_revealed: boolean;
}

export interface SessionData {
  session: ActivitySession;
  activity: Activity;
  events: MaskedEvent[];
  myUserId: string;
  partnerId: string | null;
  isPartnerPresent: boolean;
}

export function useSession(sessionId: string) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { data: coupleData } = useActiveCouple();

  const query = useQuery<SessionData | null>({
    queryKey: ['session', sessionId],
    enabled: !!sessionId && !!user?.id,
    queryFn: async () => {
      // 1. Fetch session
      const { data: session, error: sessionError } = await supabase
        .from('activity_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError || !session) throw new Error(sessionError?.message || 'Session not found');

      // 2. Fetch activity
      const { data: activity, error: activityError } = await supabase
        .from('activities')
        .select('*')
        .eq('id', session.activity_id)
        .single();

      if (activityError || !activity) throw new Error(activityError?.message || 'Activity not found');

      // 3. Fetch masked events from server function
      const { data: events, error: eventsError } = await supabase.rpc('get_session_events_masked', {
        p_session_id: sessionId,
      });

      if (eventsError) throw new Error(eventsError.message);

      const partnerId = coupleData?.partner?.id ?? null;

      return {
        session,
        activity,
        events: (events as MaskedEvent[]) ?? [],
        myUserId: user!.id,
        partnerId,
        isPartnerPresent: true,
      };
    },
    refetchInterval: 2500, // Safe poll + Realtime subscription
  });

  // Supabase Realtime channel subscription
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`session_${sessionId}_${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_events',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'activity_sessions',
          filter: `id=eq.${sessionId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, queryClient]);

  return query;
}

export function useSubmitEvent(sessionId: string) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { data: coupleData } = useActiveCouple();

  return useMutation({
    mutationFn: async ({
      type,
      payload,
    }: {
      type: string;
      payload: Record<string, unknown>;
    }) => {
      if (!user?.id || !coupleData?.couple?.id) throw new Error('Not authenticated');

      // Client-generated idempotency key
      const idempotencyKey = `${user.id}_${sessionId}_${type}_${payload.round || Date.now()}_${Math.random().toString(36).substring(7)}`;

      const { data, error } = await supabase
        .from('session_events')
        .insert({
          session_id: sessionId,
          couple_id: coupleData.couple.id,
          user_id: user.id,
          type,
          payload: payload as any,
          idempotency_key: idempotencyKey,
        })
        .select('*')
        .single();

      if (error) {
        // If duplicate idempotency key, ignore safely
        if (error.code === '23505') {
          return null;
        }
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    },
  });
}

export function useCompleteSession(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activityId: string) => {
      const { data, error } = await supabase
        .from('activity_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
        .select('*')
        .single();

      if (error) throw new Error(error.message);

      analytics.track('activity_completed', { activity_id: activityId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['homeData'] });
    },
  });
}

export function useSaveSessionAsMemory() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { data: coupleData } = useActiveCouple();

  return useMutation({
    mutationFn: async ({
      sessionId,
      title,
      note,
    }: {
      sessionId: string;
      title: string;
      note?: string;
    }) => {
      if (!user?.id || !coupleData?.couple?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('memories')
        .insert({
          couple_id: coupleData.couple.id,
          created_by: user.id,
          session_id: sessionId,
          title,
          note: note || null,
          memory_date: new Date().toISOString().split('T')[0],
          favorite: true,
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

