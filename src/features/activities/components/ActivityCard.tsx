import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Card,
  ScaleIcon,
  ThoughtIcon,
  TargetIcon,
  PaletteIcon,
  SparklesIcon,
  WineGlassIcon,
  CameraIcon,
  ClockIcon,
  FlashIcon,
} from '@/shared/ui';
import type { Activity } from '@/shared/types';
import { theme, scale } from '@/shared/theme';

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

  const renderIcon = () => {
    switch (activity.kind) {
      case 'would_you_rather':
        return <ScaleIcon color={theme.colors.primary} size={20} />;
      case 'who_knows_whom':
        return <ThoughtIcon color={theme.colors.coral} size={20} />;
      case 'guess_my_answer':
        return <TargetIcon color={theme.colors.primary} size={20} />;
      case 'drawing_guess':
        return <PaletteIcon color={theme.colors.coral} size={20} />;
      case 'quiz':
        return <SparklesIcon color={theme.colors.sunset} size={20} />;
      case 'guided_date':
        return <WineGlassIcon color={theme.colors.primary} size={20} />;
      case 'photo_mission':
        return <CameraIcon color={theme.colors.coral} size={20} focused />;
      default:
        return <SparklesIcon color={theme.colors.primary} size={20} />;
    }
  };

  return (
    <Card
      style={styles.card}
      onPress={onPress}
      disabled={isStarting}
      accessibilityLabel={`${activity.title} - ${t('activities.duration', { minutes: activity.duration_minutes })}`}
    >
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          {renderIcon()}
        </View>
        <View style={styles.badge}>
          <FlashIcon color={theme.colors.primary} size={12} />
          <Text style={styles.badgeText} maxFontSizeMultiplier={1.3}>
            {activity.mode === 'live'
              ? 'Live'
              : activity.mode === 'async'
              ? 'Turn-based'
              : 'Live / Turn'}
          </Text>
        </View>
      </View>

      <Text style={styles.title} maxFontSizeMultiplier={1.3}>
        {activity.title}
      </Text>
      <Text style={styles.description} numberOfLines={2} maxFontSizeMultiplier={1.3}>
        {activity.description}
      </Text>

      <View style={styles.footerRow}>
        <View style={styles.durationRow}>
          <ClockIcon color={theme.colors.textSecondary} size={13} />
          <Text style={styles.duration} maxFontSizeMultiplier={1.3}>
            {t('activities.duration', { minutes: activity.duration_minutes })}
          </Text>
        </View>
        <View style={styles.startPill}>
          <Text style={styles.startText} maxFontSizeMultiplier={1.3}>
            {t('activities.startActivity')} →
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: scale(18),
    marginVertical: scale(6),
    borderRadius: theme.roundness.lg,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scale(12),
  },
  iconCircle: {
    width: scale(40),
    height: scale(40),
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceBlush,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    backgroundColor: theme.colors.surfaceBlush,
    paddingVertical: scale(5),
    paddingHorizontal: scale(10),
    borderRadius: theme.roundness.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  badgeText: {
    fontSize: scale(11),
    fontWeight: '700',
    color: theme.colors.primary,
  },
  title: {
    fontSize: scale(17),
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: scale(4),
    letterSpacing: -0.3,
  },
  description: {
    fontSize: scale(13),
    color: theme.colors.textSecondary,
    lineHeight: scale(19),
    marginBottom: scale(14),
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: scale(12),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(5),
  },
  duration: {
    fontSize: scale(12),
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  startPill: {
    paddingVertical: scale(5),
    paddingHorizontal: scale(12),
    borderRadius: theme.roundness.full,
    backgroundColor: theme.colors.surfaceBlush,
  },
  startText: {
    fontSize: scale(12),
    fontWeight: '800',
    color: theme.colors.primary,
  },
});

