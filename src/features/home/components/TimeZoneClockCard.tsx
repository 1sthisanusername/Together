import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/ui';
import type { TimeZoneInfo } from '@/shared/lib/timezone';
import { theme } from '@/shared/theme';

export interface TimeZoneClockCardProps {
  partnerName: string;
  myTimeInfo: TimeZoneInfo;
  partnerTimeInfo: TimeZoneInfo;
  timeDifferenceHours: number;
}

export const TimeZoneClockCard: React.FC<TimeZoneClockCardProps> = ({
  partnerName,
  myTimeInfo,
  partnerTimeInfo,
  timeDifferenceHours,
}) => {
  const { t } = useTranslation();

  const getDiffText = () => {
    if (timeDifferenceHours === 0) return t('home.sameTime');
    if (timeDifferenceHours > 0) return t('home.hoursAhead', { hours: timeDifferenceHours });
    return t('home.hoursBehind', { hours: Math.abs(timeDifferenceHours) });
  };

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        {/* Partner Side */}
        <View style={styles.column}>
          <Text style={styles.locationTitle}>{t('home.partnerTime', { name: partnerName })}</Text>
          <Text style={styles.timeBig}>{partnerTimeInfo.timeString}</Text>
          <Text style={styles.dateSub}>{partnerTimeInfo.dateString}</Text>
          <View
            style={[
              styles.statusBadge,
              partnerTimeInfo.isNight ? styles.badgeNight : styles.badgeDay,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                partnerTimeInfo.isNight ? styles.statusNightText : styles.statusDayText,
              ]}
            >
              {partnerTimeInfo.isNight ? `🌙 ${t('home.partnerSleeping')}` : `☀️ ${t('home.partnerAwake')}`}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* My Side */}
        <View style={styles.column}>
          <Text style={styles.locationTitle}>{t('home.myTime')}</Text>
          <Text style={styles.timeBig}>{myTimeInfo.timeString}</Text>
          <Text style={styles.dateSub}>{myTimeInfo.dateString}</Text>
          <View style={styles.diffBadge}>
            <Text style={styles.diffText}>{getDiffText()}</Text>
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 18,
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderLight,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 72,
    backgroundColor: theme.colors.border,
    marginHorizontal: 10,
  },
  locationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
    textAlign: 'center',
  },
  timeBig: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  dateSub: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginBottom: 8,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  badgeDay: {
    backgroundColor: theme.colors.warningLight,
  },
  badgeNight: {
    backgroundColor: '#f3eef4',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusDayText: {
    color: theme.colors.warning,
  },
  statusNightText: {
    color: theme.colors.moon,
  },
  diffBadge: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  diffText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text,
  },
});
