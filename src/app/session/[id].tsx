import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityRoom } from '@/features/sessions';
import { useActiveCouple } from '@/features/couple';
import { GameErrorBoundary } from '@/shared/ui';

export default function SessionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: coupleData } = useActiveCouple();

  const partnerName = coupleData?.partner?.display_name || 'Partner';

  return (
    <GameErrorBoundary onExit={() => router.back()}>
      <ActivityRoom
        sessionId={id!}
        onExit={() => router.back()}
        partnerName={partnerName}
      />
    </GameErrorBoundary>
  );
}

