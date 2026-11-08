import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingState } from '@/shared/ui';
import { theme } from '@/shared/theme';

export default function IndexScreen() {
  // Route decisions are managed exclusively by the RootRouteGuard at the app root
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <LoadingState message="Loading Together..." />
    </SafeAreaView>
  );
}
