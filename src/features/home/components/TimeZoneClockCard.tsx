import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/ui';
import type { TimeZoneInfo } from '@/shared/lib/timezone';

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
    padding: 16,
    width: '100%',
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
    height: 70,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  locationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  timeBig: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  dateSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 8,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  badgeDay: {
    backgroundColor: '#FEF3C7',
  },
  badgeNight: {
    backgroundColor: '#EDE9FE',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusDayText: {
    color: '#B45309',
  },
  statusNightText: {
    color: '#6D28D9',
  },
  diffBadge: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  diffText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
});

