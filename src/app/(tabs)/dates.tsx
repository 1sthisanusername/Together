import React, { useEffect } from 'react';
import { StyleSheet, ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

/**
 * Dates tab is retired from navigation.
 * Any incoming direct route to /(tabs)/dates immediately redirects to Memories (letters).
 */
export default function DatesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  let tabBarHeight = 56;
  try {
    tabBarHeight = useBottomTabBarHeight();
  } catch {
    tabBarHeight = 56;
  }
  const bottomPadding = tabBarHeight + insets.bottom + 16;

  useEffect(() => {
    router.replace('/(tabs)/memories');
  }, [router]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Text accessibilityLiveRegion="polite" style={styles.srOnly}>
        Redirecting to Memories...
      </Text>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
  },
});
