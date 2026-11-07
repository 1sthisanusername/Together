import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/ui';
import type { Activity } from '@/shared/types';
import { theme } from '@/shared/theme';

export interface ActivityCardProps {
  activity: Activity;
  onPress: () => void;
  isStarting?: boolean;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  onPress,
  isStarting,
}) => {
  const { t } = useTranslation();

  const getIcon = () => {
    switch (activity.kind) {
      case 'would_you_rather':
        return '⚖️';
      case 'who_knows_whom':
        return '💭';
      case 'guess_my_answer':
        return '🎯';
      case 'drawing_guess':
        return '🎨';
      case 'quiz':
        return '🧠';
      case 'guided_date':
        return '🍷';
      case 'photo_mission':
        return '📸';
      default:
        return '✨';
    }
  };

  return (
    <TouchableOpacity onPress={onPress} disabled={isStarting} activeOpacity={0.8}>
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.icon}>{getIcon()}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {activity.mode === 'live' ? '⚡ Live' : activity.mode === 'async' ? '⏳ Turn-based' : '⚡ Live / Turn'}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>{activity.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {activity.description}
        </Text>

        <View style={styles.footerRow}>
          <Text style={styles.duration}>
            ⏱️ {t('activities.duration', { minutes: activity.duration_minutes })}
          </Text>
          <Text style={styles.startText}>{t('activities.startActivity')} →</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 18,
    marginVertical: 6,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderLight,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  icon: {
    fontSize: 24,
  },
  badge: {
    backgroundColor: theme.colors.surfaceSubtle, // #f0ece6
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary, // #a8917f
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.text, // #42362e
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 13,
    color: theme.colors.textSecondary, // #a8917f
    lineHeight: 19,
    marginBottom: 14,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceSubtle,
  },
  duration: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  startText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary, // #b69788
  },
});

