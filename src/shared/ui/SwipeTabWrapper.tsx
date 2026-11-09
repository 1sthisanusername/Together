import React, { useRef } from 'react';
import { View, StyleSheet, PanResponder, GestureResponderEvent, PanResponderGestureState } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { triggerHaptic } from '@/shared/theme';

const TAB_ROUTES = [
  '/(tabs)/home',
  '/(tabs)/play',
  '/(tabs)/camera',
  '/(tabs)/memories',
  '/(tabs)/us',
];

export interface SwipeTabWrapperProps {
  currentTab: string;
  children: React.ReactNode;
}

export const SwipeTabWrapper: React.FC<SwipeTabWrapperProps> = ({
  currentTab,
  children,
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        // Only capture if horizontal swipe is decisive and significantly larger than vertical movement
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2.5;
        const hasMinDistance = Math.abs(gestureState.dx) > 35;
        return isHorizontal && hasMinDistance;
      },
      onPanResponderRelease: (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const threshold = 60;
        const currentIndex = TAB_ROUTES.findIndex((r) => r.includes(currentTab));
        if (currentIndex === -1) return;

        // Swipe Left -> Next Tab
        if (gestureState.dx < -threshold && currentIndex < TAB_ROUTES.length - 1) {
          triggerHaptic('selection');
          router.replace(TAB_ROUTES[currentIndex + 1] as any);
        }
        // Swipe Right -> Previous Tab
        else if (gestureState.dx > threshold && currentIndex > 0) {
          triggerHaptic('selection');
          router.replace(TAB_ROUTES[currentIndex - 1] as any);
        }
      },
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
