import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TimeZoneInfo } from '@/shared/lib/timezone';
import { ClockIcon, SunIcon, MoonIcon, PinIcon } from '@/shared/ui';
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
      <View style={styles.cardSurface}>
        {/* Top Header Sticker Row */}
        <View style={styles.headerRow}>
          <View style={styles.titleBadge}>
            <ClockIcon color={theme.colors.text} size={scale(13)} />
            <Text style={styles.titleText}>Time Zones</Text>
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
              {partnerTimeInfo.isNight ? (
                <MoonIcon color={theme.colors.text} size={scale(12)} />
              ) : (
                <SunIcon color={theme.colors.primary} size={scale(12)} />
              )}
              <Text style={styles.statusText}>
                {partnerTimeInfo.isNight
                  ? t('home.partnerSleeping', 'Likely sleeping')
                  : t('home.partnerAwake', 'Likely awake')}
              </Text>
            </View>
          </View>

          {/* Soft Divider */}
          <View style={styles.divider} />

          {/* My Side */}
          <View style={styles.clockColumn}>
            <Text style={styles.columnHeader} numberOfLines={1}>
              {t('home.myTime', 'Your Time')}
            </Text>
            <Text style={styles.timeBig}>{myTimeInfo.timeString}</Text>
            <Text style={styles.dateSub}>{myTimeInfo.dateString}</Text>
            <View style={[styles.statusBadge, styles.badgeMy]}>
              <PinIcon color={theme.colors.coral} size={scale(12)} />
              <Text style={styles.statusText}>Local time</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
    marginVertical: scale(7),
  },
  cardSurface: {
    backgroundColor: theme.colors.surface, // #FFFFFF with 1px solid #FBE9E7
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border, // #FBE9E7
    padding: scale(18),
    ...theme.shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(14),
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.surfaceBlush, // #FFF0ED
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 9999,
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
  },
  titleText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(11),
    color: theme.colors.text, // #3E2723
  },
  diffPill: {
    backgroundColor: theme.colors.surfaceBlush, // #FFF0ED
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 9999,
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
  },
  diffText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(11),
    color: theme.colors.primary, // Amour Red #E53935
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
    color: theme.colors.textSecondary, // #7A625A
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: scale(4),
    textAlign: 'center',
  },
  timeBig: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(24),
    fontWeight: '700',
    color: theme.colors.text, // Cozy Night #3E2723
    marginBottom: scale(2),
    letterSpacing: -0.5,
  },
  dateSub: {
    fontFamily: theme.typography.families.body,
    fontSize: scale(11),
    color: theme.colors.textSecondary, // #7A625A
    marginBottom: scale(8),
  },
  divider: {
    width: 1,
    height: scale(64),
    backgroundColor: theme.colors.border, // #FBE9E7
    marginHorizontal: scale(8),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: scale(4),
    paddingHorizontal: scale(10),
    borderRadius: 9999,
    justifyContent: 'center',
  },
  badgeDay: {
    backgroundColor: '#FFF8EC', // Soft Warm Sunset tint
  },
  badgeNight: {
    backgroundColor: theme.colors.surfaceBlush, // #FFF0ED
  },
  badgeMy: {
    backgroundColor: theme.colors.background, // #FFFDFB
  },
  statusText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(10),
    color: theme.colors.text, // #3E2723
  },
});
