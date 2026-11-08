import React from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatThread } from '@/features/messages';
import { theme } from '@/shared/theme';

export default function ChatScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ChatThread onBack={() => router.back()} />
    </SafeAreaView>
  );
}

