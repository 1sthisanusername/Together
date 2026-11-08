import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationBannerStore, useMarkNotificationRead } from '../hooks/useNotifications';
import { getRouteForNotification } from '@/services/push';
import { theme } from '@/shared/theme';

export function getNotificationIcon(type: string): string {
  const norm = type?.toLowerCase() || '';
  if (norm.includes('voice')) return '🎙️';
  if (norm.includes('photo')) return '📸';
  if (norm.includes('message') || norm.includes('chat')) return '💬';
  if (norm.includes('letter')) return '💌';
  if (norm.includes('game')) return '🎮';
  if (norm.includes('date')) return '✨';
  if (norm.includes('memory')) return '🖼️';
  if (norm.includes('anniversary') || norm.includes('milestone')) return '💍';
  if (norm.includes('mission')) return '🎯';
  return '🔔';
}

export const InAppNotificationBanner: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentNotif = useNotificationBannerStore((state) => state.currentNotification);
  const hideBanner = useNotificationBannerStore((state) => state.hideBanner);
  const { mutate: markRead } = useMarkNotificationRead();

  const translateY = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    if (currentNotif) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, 4500);

      return () => clearTimeout(timer);
    } else {
      translateY.setValue(-120);
    }
  }, [currentNotif]);

  const handleDismiss = () => {
    Animated.timing(translateY, {
      toValue: -120,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      hideBanner();
    });
  };

  const handlePress = () => {
    if (!currentNotif) return;

    markRead(currentNotif.id);
    const targetRoute = getRouteForNotification(currentNotif.type, {
      ...currentNotif.payload,
      deepLink: currentNotif.deep_link,
    });

    handleDismiss();
    if (targetRoute) {
      router.push(targetRoute as any);
    }
  };

  if (!currentNotif) return null;

  const icon = getNotificationIcon(currentNotif.type);
  const title = currentNotif.payload?.title || 'New Notification';
  const body = currentNotif.payload?.body || '';

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          top: insets.top + 8,
          transform: [{ translateY }],
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={styles.banner}
        activeOpacity={0.9}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${body}`}
      >
        <Text style={styles.icon}>{icon}</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {body ? (
            <Text style={styles.body} numberOfLines={2}>
              {body}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={handleDismiss}
          style={styles.closeBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Dismiss notification"
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  banner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8DFD8',
    shadowColor: '#42362E',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  body: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 17,
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 14,
    color: '#A8917F',
    fontWeight: '600',
  },
});
