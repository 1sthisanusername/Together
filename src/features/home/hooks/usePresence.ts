import { useEffect, useState, useRef, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/features/auth';
import { useActiveCouple } from '@/features/couple';

export interface PresencePayload {
  user_id: string;
  online_at: string;
  app_state: 'active' | 'background';
}

export interface PresenceStateResult {
  isPartnerOnline: boolean;
  isMyPresenceActive: boolean;
  partnerLastSeen: string | null;
}

export function usePresence(): PresenceStateResult {
  const user = useAuthStore((state) => state.user);
  const { data: coupleData } = useActiveCouple();
  const coupleId = coupleData?.couple?.id;
  const partnerId = coupleData?.partner?.id;

  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const [partnerLastSeen, setPartnerLastSeen] = useState<string | null>(null);
  const [isMyPresenceActive, setIsMyPresenceActive] = useState(false);

  const channelRef = useRef<any>(null);
  const heartbeatTimerRef = useRef<any>(null);

  // Helper to evaluate partner online state from presence dictionary
  const evaluatePartnerState = useCallback(
    (presenceState: Record<string, PresencePayload[]>) => {
      if (!partnerId) {
        setIsPartnerOnline(false);
        return;
      }

      // Check if partnerId exists as a presence key or inside any presence payload
      let foundPartner = false;
      let latestOnlineAt: string | null = null;

      for (const key of Object.keys(presenceState)) {
        const presences = presenceState[key] || [];
        for (const p of presences) {
          if (p.user_id === partnerId || key === partnerId) {
            const timeDiffMs = Date.now() - new Date(p.online_at).getTime();
            // Fresh heartbeat within last 50 seconds and active app state
            if (timeDiffMs < 50000 && p.app_state === 'active') {
              foundPartner = true;
              latestOnlineAt = p.online_at;
              break;
            }
          }
        }
        if (foundPartner) break;
      }

      setIsPartnerOnline(foundPartner);
      if (latestOnlineAt) {
        setPartnerLastSeen(latestOnlineAt);
      }
    },
    [partnerId]
  );

  useEffect(() => {
    if (!coupleId || !user?.id) {
      setIsPartnerOnline(false);
      setIsMyPresenceActive(false);
      return;
    }

    const channelName = `presence_couple_${coupleId}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channelRef.current = channel;

    const trackPresence = async (appState: 'active' | 'background' = 'active') => {
      try {
        if (appState === 'active') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
            app_state: 'active',
          });
          setIsMyPresenceActive(true);

          // Update DB heartbeat silently
          try {
            await (supabase.rpc as any)('heartbeat_presence');
          } catch {}
        } else {
          await channel.untrack();
          setIsMyPresenceActive(false);
        }
      } catch (err) {
        console.warn('[usePresence] Failed to track presence:', err);
      }
    };

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresencePayload>();
        evaluatePartnerState(state);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        const state = channel.presenceState<PresencePayload>();
        evaluatePartnerState(state);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const state = channel.presenceState<PresencePayload>();
        evaluatePartnerState(state);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await trackPresence('active');
        }
      });

    // Heartbeat every 25 seconds while active
    heartbeatTimerRef.current = setInterval(() => {
      if (AppState.currentState === 'active') {
        trackPresence('active');
      }
    }, 25000);

    // AppState lifecycle listener (foreground / background)
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active') {
          trackPresence('active');
        } else {
          trackPresence('background');
        }
      }
    );

    return () => {
      subscription.remove();
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
      try {
        channel.untrack();
        supabase.removeChannel(channel);
      } catch {}
    };
  }, [coupleId, user?.id, partnerId, evaluatePartnerState]);

  return {
    isPartnerOnline,
    isMyPresenceActive,
    partnerLastSeen,
  };
}
