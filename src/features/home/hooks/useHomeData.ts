import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { supabase, analytics, persistQueryCache } from '@/services';
import { useAuthStore } from '@/features/auth';
import { useActiveCouple } from '@/features/couple';
import {
  getTimeInZone,
  getTimeDifference,
  getDaysTogether,
  getDeviceTimeZone,
  type TimeZoneInfo,
} from '@/shared/lib/timezone';
import type { ActivitySession, ImportantDate } from '@/shared/types';

export interface HomeData {
  daysTogether: number | null;
  startDate: string | null;
  coupleName: string | null;
  myTimeZone: string;
  myTimeInfo: TimeZoneInfo;
  partnerTimeZone: string;
  partnerTimeInfo: TimeZoneInfo;
  timeDifferenceHours: number;
  activeSession: ActivitySession | null;
  nextMeeting: ImportantDate | null;
  daysToNextMeeting: number | null;
}

export function useHomeData() {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const { data: coupleData } = useActiveCouple();
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Update clock every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Track couple_returned event on home mount
  useEffect(() => {
    if (coupleData?.couple?.id) {
      analytics.track('couple_returned');
    }
  }, [coupleData?.couple?.id]);

  return useQuery<HomeData>({
    queryKey: ['homeData', coupleData?.couple?.id, currentDate.getMinutes()],
    enabled: !!coupleData?.couple?.id,
    queryFn: async () => {
      const coupleId = coupleData?.couple.id;
      if (!coupleId) throw new Error('No active couple');

      const myZone = profile?.timezone || getDeviceTimeZone();
      const partnerZone = coupleData.partner?.timezone || myZone;

      const myTimeInfo = getTimeInZone(myZone, currentDate);
      const partnerTimeInfo = getTimeInZone(partnerZone, currentDate);
      const timeDiff = getTimeDifference(myZone, partnerZone, currentDate);

      // Parallel fetch for active session and next reunion date (Promise.all)
      const todayStr = currentDate.toISOString().split('T')[0];
      const [{ data: activeSession }, { data: nextMeeting }] = await Promise.all([
        supabase
          .from('activity_sessions')
          .select('*')
          .eq('couple_id', coupleId)
          .in('status', ['waiting', 'active'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('important_dates')
          .select('*')
          .eq('couple_id', coupleId)
          .gte('event_date', todayStr)
          .order('event_date', { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);

      let daysToNextMeeting: number | null = null;
      if (nextMeeting?.event_date) {
        const target = new Date(nextMeeting.event_date);
        if (!isNaN(target.getTime())) {
          const diffMs = target.getTime() - currentDate.getTime();
          daysToNextMeeting = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        }
      }

      // Persist cache snapshot for instant reopen
      persistQueryCache().catch(() => {});

      return {
        daysTogether: getDaysTogether(coupleData.couple.start_date),
        startDate: coupleData.couple.start_date,
        coupleName: coupleData.couple.name,
        myTimeZone: myZone,
        myTimeInfo,
        partnerTimeZone: partnerZone,
        partnerTimeInfo,
        timeDifferenceHours: timeDiff,
        activeSession: activeSession ?? null,
        nextMeeting: nextMeeting ?? null,
        daysToNextMeeting,
      };
    },
    refetchInterval: 30000,
  });
}

