import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityRoom } from '@/features/sessions';
import { useActiveCouple } from '@/features/couple';

export default function SessionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: coupleData } = useActiveCouple();

  const partnerName = coupleData?.partner?.display_name || 'Partner';

  return (
    <ActivityRoom
      sessionId={id!}
      onExit={() => router.back()}
      partnerName={partnerName}
    />
  );
}

