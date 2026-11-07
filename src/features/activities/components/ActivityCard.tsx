import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/ui';
import type { Activity } from '@/shared/types';

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
    padding: 16,
    marginVertical: 6,
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
    backgroundColor: '#F1F5F9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  duration: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  startText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
  },
});

