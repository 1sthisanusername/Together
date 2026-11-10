import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TimeZoneInfo } from '@/shared/lib/timezone';
import { theme, scale } from '@/shared/theme';

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

  const diffHours = isNaN(timeDifferenceHours) ? 0 : timeDifferenceHours;

  const getDiffText = () => {
    if (diffHours === 0) return t('home.sameTime', 'Same time zone');
    if (diffHours > 0) return t('home.hoursAhead', { hours: diffHours });
    return t('home.hoursBehind', { hours: Math.abs(diffHours) });
  };

  return (
    <View style={styles.cardWrapper}>
      {/* 1. Hard Offset Ink Shadow Underlay */}
      <View style={styles.cardShadow} />

      {/* 2. Paper Surface matching Quick Photos & Next Reunion */}
      <View style={styles.cardSurface}>
        {/* Top Header Sticker Row */}
        <View style={styles.headerRow}>
          <View style={styles.titleBadge}>
            <Text style={styles.titleText}>⏰ Time Zones</Text>
          </View>
          <View style={styles.diffPill}>
            <Text style={styles.diffText}>{getDiffText()}</Text>
          </View>
        </View>

        {/* Dual Clocks */}
        <View style={styles.clocksRow}>
          {/* Partner Side */}
          <View style={styles.clockColumn}>
            <Text style={styles.columnHeader} numberOfLines={1}>
              {t('home.partnerTime', { name: partnerName })}
            </Text>
            <Text style={styles.timeBig}>{partnerTimeInfo.timeString}</Text>
            <Text style={styles.dateSub}>{partnerTimeInfo.dateString}</Text>
            <View
              style={[
                styles.statusBadge,
                partnerTimeInfo.isNight ? styles.badgeNight : styles.badgeDay,
              ]}
            >
              <Text style={styles.statusText}>
                {partnerTimeInfo.isNight
                  ? `🌙 ${t('home.partnerSleeping', 'Likely sleeping')}`
                  : `☀️ ${t('home.partnerAwake', 'Likely awake')}`}
              </Text>
            </View>
          </View>

          {/* Chunky Ink Divider */}
          <View style={styles.divider} />

          {/* My Side */}
          <View style={styles.clockColumn}>
            <Text style={styles.columnHeader} numberOfLines={1}>
              {t('home.myTime', 'Your Time')}
            </Text>
            <Text style={styles.timeBig}>{myTimeInfo.timeString}</Text>
            <Text style={styles.dateSub}>{myTimeInfo.dateString}</Text>
            <View style={[styles.statusBadge, styles.badgeMy]}>
              <Text style={styles.statusText}>📍 Local time</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    position: 'relative',
    marginVertical: scale(6),
    marginRight: 4,
    marginBottom: 4,
    width: '100%',
  },
  cardShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    backgroundColor: theme.colors.shadowInk,
    borderRadius: 20,
    zIndex: 0,
  },
  cardSurface: {
    position: 'relative',
    zIndex: 1,
    backgroundColor: theme.colors.background, // Paper #FFF4E3 matching other cards
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: theme.colors.border, // Chunky Ink #2B2118
    padding: scale(16),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(14),
  },
  titleBadge: {
    backgroundColor: theme.colors.stickers.pool, // Pool Teal sticker
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
  },
  titleText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(11),
    color: theme.colors.text,
  },
  diffPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
  },
  diffText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(11),
    color: theme.colors.primary, // Tomato #FF5A3C
  },
  clocksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clockColumn: {
    flex: 1,
    alignItems: 'center',
  },
  columnHeader: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(11),
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: scale(4),
    textAlign: 'center',
  },
  timeBig: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(24),
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: scale(2),
    letterSpacing: -0.5,
  },
  dateSub: {
    fontFamily: theme.typography.families.body,
    fontSize: scale(11),
    color: theme.colors.textMuted,
    marginBottom: scale(8),
  },
  divider: {
    width: 2,
    height: scale(64),
    backgroundColor: theme.colors.border,
    marginHorizontal: scale(8),
    borderRadius: 1,
  },
  statusBadge: {
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    paddingVertical: scale(3),
    paddingHorizontal: scale(8),
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDay: {
    backgroundColor: '#FFF8E6', // Sunshine Light
  },
  badgeNight: {
    backgroundColor: '#E6FAF8', // Pool Light
  },
  badgeMy: {
    backgroundColor: '#FFFFFF', // Sticker White
  },
  statusText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(10),
    color: theme.colors.text,
  },
});
