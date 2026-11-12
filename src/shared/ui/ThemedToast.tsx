import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { theme, scale } from '@/shared/theme';

export interface ThemedToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  onDismiss?: () => void;
  onRetry?: () => void;
  durationMs?: number;
}

export const ThemedToast: React.FC<ThemedToastProps> = ({
  visible,
  message,
  type = 'info',
  onDismiss,
  onRetry,
  durationMs = 3500,
}) => {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      if (!onRetry && durationMs > 0) {
        const timer = setTimeout(() => {
          hide();
        }, durationMs);
        return () => clearTimeout(timer);
      }
    } else {
      hide();
    }
  }, [visible]);

  const hide = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -80,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  if (!visible) return null;

  const emoji =
    type === 'success' ? '✨' : type === 'error' ? '⚠️' : '💌';

  const badgeBg =
    type === 'success'
      ? theme.colors.stickers.matcha
      : type === 'error'
      ? theme.colors.stickers.bubblegum
      : theme.colors.stickers.sunshine;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={styles.toastShadow} />
      <View style={styles.toastSurface}>
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Text style={styles.badgeEmoji}>{emoji}</Text>
        </View>

        <Text style={styles.messageText} numberOfLines={2}>
          {message}
        </Text>

        {onRetry ? (
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={onRetry}
            activeOpacity={0.75}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={hide}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.dismissIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 28,
    left: scale(20),
    right: scale(20),
    zIndex: 9999,
  },
  toastShadow: {
    display: 'none',
  },
  toastSurface: {
    backgroundColor: theme.colors.background, // #FFFDFB
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border, // #FBE9E7
    paddingHorizontal: scale(14),
    paddingVertical: scale(10),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    ...theme.shadows.card,
  },
  badge: {
    width: scale(32),
    height: scale(32),
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeEmoji: {
    fontSize: scale(16),
  },
  messageText: {
    flex: 1,
    fontFamily: theme.typography.families.body,
    fontSize: scale(13),
    color: theme.colors.text,
    lineHeight: scale(18),
  },
  retryBtn: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
    borderRadius: theme.roundness.full,
    backgroundColor: theme.colors.stickers.sunshine,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  retryText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(12),
    color: theme.colors.text,
  },
  dismissBtn: {
    padding: scale(4),
  },
  dismissIcon: {
    fontSize: scale(14),
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
  },
});

