import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../hooks/useNotifications';
import { getNotificationIcon } from './InAppNotificationBanner';
import { getRouteForNotification } from '@/services/push';
import type { AppNotification } from '../types';
import { theme, scale, triggerHaptic } from '@/shared/theme';

function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export const NotificationInboxView: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: notifications = [], isLoading, isRefetching, refetch } = useNotifications();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllNotificationsRead();

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const handleNotificationPress = (item: AppNotification) => {
    if (!item.read_at) {
      markRead(item.id);
    }

    const route = getRouteForNotification(item.type, {
      ...item.payload,
      deepLink: item.deep_link,
    });

    if (route) {
      router.push(route as any);
    }
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const isUnread = !item.read_at;
    const icon = getNotificationIcon(item.type);
    const title = item.payload?.title || 'Notification';
    const body = item.payload?.body || '';
    const time = formatTimestamp(item.created_at);

    return (
      <TouchableOpacity
        style={[styles.itemCard, isUnread && styles.itemCardUnread]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.iconWrapper}>
          <Text style={styles.itemIcon}>{icon}</Text>
          {isUnread && <View style={styles.unreadDot} />}
        </View>

        <View style={styles.contentWrapper}>
          <View style={styles.headerRow}>
            <Text style={[styles.itemTitle, isUnread && styles.itemTitleUnread]} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.itemTime}>{time}</Text>
          </View>

          {body ? (
            <Text style={styles.itemBody} numberOfLines={2}>
              {body}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Go back"
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Notifications</Text>

        {unreadCount > 0 ? (
          <TouchableOpacity
            onPress={() => markAllRead()}
            disabled={isMarkingAll}
            style={styles.markAllBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerPlaceholder} />
        )}
      </View>

      {/* Main List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💌</Text>
          <Text style={styles.emptyTitle}>You're all caught up</Text>
          <Text style={styles.emptySubtitle}>
            When your partner sends a message, letter, or activity invite, it will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 24 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                refetch();
              }}
              tintColor={theme.colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    height: scale(54),
    paddingHorizontal: scale(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backText: {
    fontSize: scale(22),
    color: theme.colors.text,
    fontWeight: '400',
  },
  headerTitle: {
    fontSize: scale(18),
    fontWeight: '800',
    color: theme.colors.text,
  },
  markAllBtn: {
    paddingVertical: scale(6),
    paddingHorizontal: scale(8),
    minHeight: 36,
    justifyContent: 'center',
  },
  markAllText: {
    fontSize: scale(13),
    color: theme.colors.primary,
    fontWeight: '700',
  },
  headerPlaceholder: {
    width: 36,
  },
  listContent: {
    paddingHorizontal: scale(16),
    paddingTop: scale(12),
  },
  itemCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: scale(16),
    padding: scale(14),
    marginBottom: scale(10),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  itemCardUnread: {
    backgroundColor: '#FFFFFF',
    borderColor: theme.colors.primaryBorder,
  },
  iconWrapper: {
    position: 'relative',
    marginRight: scale(14),
  },
  itemIcon: {
    fontSize: scale(24),
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  contentWrapper: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(4),
  },
  itemTitle: {
    fontSize: scale(14),
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
    marginRight: scale(8),
  },
  itemTitleUnread: {
    fontWeight: '800',
    color: theme.colors.text,
  },
  itemTime: {
    fontSize: scale(12),
    color: theme.colors.textSecondary,
  },
  itemBody: {
    fontSize: scale(13),
    color: theme.colors.textSecondary,
    lineHeight: scale(18),
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(36),
  },
  emptyIcon: {
    fontSize: scale(48),
    marginBottom: scale(16),
  },
  emptyTitle: {
    fontSize: scale(18),
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: scale(8),
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: scale(14),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: scale(20),
  },
});
