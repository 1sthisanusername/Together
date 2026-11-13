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
            <ClockIcon color={theme.colors.textInverse} size={scale(14)} />
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
                <MoonIcon color={theme.colors.textInverse} size={scale(14)} />
              ) : (
                <SunIcon color={theme.colors.kintsugi} size={scale(14)} />
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
              <PinIcon color={theme.colors.coral} size={scale(14)} />
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
    marginVertical: scale(8),
  },
  cardSurface: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.lg,
    borderWidth: theme.borders.subtle,
    borderColor: theme.colors.border,
    padding: scale(20),
    ...theme.shadows.elevated,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(16),
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.surfaceBlush,
    borderWidth: theme.borders.subtle,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.full,
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    ...theme.shadows.tiny,
  },
  titleText: {
    fontFamily: theme.typography.fontFamilies.bold,
    fontSize: scale(12),
    color: theme.colors.textInverse,
  },
  diffPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.surfaceBlush,
    borderWidth: theme.borders.subtle,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.full,
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    ...theme.shadows.tiny,
  },
  diffText: {
    fontFamily: theme.typography.fontFamilies.bold,
    fontSize: scale(12),
    color: theme.colors.primary,
  },
  clocksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: scale(12),
  },
  clockColumn: {
    flex: 1,
    alignItems: 'center',
  },
  columnHeader: {
    fontFamily: theme.typography.fontFamilies.bold,
    fontSize: scale(11),
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: scale(6),
    textAlign: 'center',
  },
  timeBig: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(26),
    fontWeight: '700',
    color: theme.colors.textInverse,
    marginBottom: scale(4),
    letterSpacing: -0.3,
  },
  dateSub: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(12),
    color: theme.colors.textSecondary,
    marginBottom: scale(8),
  },
  divider: {
    width: 1,
    height: scale(80),
    backgroundColor: theme.colors.border,
    marginHorizontal: scale(10),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: theme.borders.subtle,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.full,
    paddingVertical: scale(6),
    paddingHorizontal: scale(14),
    justifyContent: 'center',
    ...theme.shadows.tiny,
  },
  badgeDay: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  badgeNight: {
    backgroundColor: theme.colors.surfaceBlush,
  },
  badgeMy: {
    backgroundColor: theme.colors.background,
    ...theme.shadows.tiny,
  },
  statusText: {
    fontFamily: theme.typography.fontFamilies.bold,
    fontSize: scale(11),
    color: theme.colors.textInverse,
  },
});