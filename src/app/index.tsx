import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/features/auth';
import { useActiveCouple } from '@/features/couple';
import { LoadingState } from '@/shared/ui';

export default function IndexScreen() {
  const router = useRouter();
  const { session, isInitialized } = useAuthStore();
  const { data: coupleData, isLoading: isCoupleLoading } = useActiveCouple();

  useEffect(() => {
    if (!isInitialized || isCoupleLoading) return;

    if (!session) {
      router.replace('/(auth)/login');
    } else if (coupleData?.isComplete) {
      router.replace('/(tabs)/home');
    } else {
      router.replace('/(auth)/pair');
    }
  }, [session, isInitialized, isCoupleLoading, coupleData, router]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <LoadingState message="Loading Together..." />
    </SafeAreaView>
  );
}
