import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Button,
  DatePickerField,
  PlaneIcon,
  HeartIcon,
  ThemedToast,
  NumberTicker,
  formatDateToDateString,
} from '@/shared/ui';
import type { ImportantDate } from '@/shared/types';
import { useAddImportantDate } from '../hooks/useUsData';
import { theme, scale } from '@/shared/theme';

export interface NextReunionCountdownCardProps {
  nextMeeting: ImportantDate | null;
  daysRemaining: number | null;
}

export const NextReunionCountdownCard: React.FC<NextReunionCountdownCardProps> = ({
  nextMeeting,
  daysRemaining,
}) => {
  const { t } = useTranslation();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [targetDateStr, setTargetDateStr] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const { mutate: addDate, isPending } = useAddImportantDate();

  const startOfToday = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const handleSetDate = () => {
    const trimmed = targetDateStr.trim();
    if (!trimmed) return;

    const todayStr = formatDateToDateString(new Date());
    if (trimmed < todayStr) {
      setToastMsg(t('us.dateMustBeTodayOrFuture'));
      return;
    }

    addDate(
      {
        title: 'Next Reunion Trip',
        eventDate: trimmed,
        category: 'meeting',
      },
      {
        onSuccess: () => {
          setShowDatePicker(false);
          setTargetDateStr('');
        },
        onError: (err) => {
          setToastMsg(err.message || t('us.saveDateFailed'));
        },
      }
    );
  };

  return (
    <View style={styles.cardWrapper}>
      <View style={styles.cardSurface}>
        <View style={styles.headerRow}>
          <View style={styles.labelBadge}>
            <PlaneIcon color={theme.colors.text} size={scale(13)} />
            <Text style={styles.labelText}>Next Reunion</Text>
          </View>
        </View>

        {nextMeeting && daysRemaining !== null ? (
          <View style={styles.countdownContainer}>
            <View style={styles.numberRow}>
              <NumberTicker
                value={daysRemaining}
                textStyle={styles.daysNumber}
                rounded
              />
              <Text style={styles.daysUnit}>
                {daysRemaining === 1 ? 'day' : 'days'}
              </Text>
            </View>
            <View style={styles.subRow}>
              <Text style={styles.daysSub}>until we are together again</Text>
              <HeartIcon color={theme.colors.rose} size={scale(13)} filled />
            </View>
            <Text style={styles.dateDetail}>
              Target: {new Date(nextMeeting.event_date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No upcoming reunion date set yet</Text>
            {!showDatePicker ? (
              <Button
                title="+ Set Reunion Countdown"
                variant="primary"
                size="md"
                onPress={() => setShowDatePicker(true)}
              />
            ) : (
              <View style={styles.inputContainer}>
                <DatePickerField
                  placeholder="Select next reunion date"
                  value={targetDateStr}
                  minDate={startOfToday}
                  onChange={setTargetDateStr}
                />
                <View style={styles.btnRow}>
                  <Button
                    title="Cancel"
                    variant="ghost"
                    size="sm"
                    onPress={() => setShowDatePicker(false)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Save Countdown"
                    variant="primary"
                    size="sm"
                    loading={isPending}
                    disabled={!targetDateStr.trim()}
                    onPress={handleSetDate}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            )}
          </View>
        )}
      </View>
      <ThemedToast
        visible={!!toastMsg}
        message={toastMsg || ''}
        type="error"
        onDismiss={() => setToastMsg(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
    marginVertical: scale(8),
  },
  cardSurface: {
    backgroundColor: theme.colors.surfaceBlush, // #FFF0ED soft pale blush
    borderRadius: theme.roundness.lg,
    borderWidth: theme.borders.subtle,
    borderColor: theme.colors.border, // #FBE9E7
    padding: scale(20),
    alignItems: 'center',
    ...theme.shadows.card,
  },
  headerRow: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: scale(10),
  },
  labelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(5),
    backgroundColor: theme.colors.sunset,
    borderRadius: theme.roundness.full,
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
  },
  labelText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(11),
    color: theme.colors.text, // #3E2723
  },
  countdownContainer: {
    alignItems: 'center',
    paddingVertical: scale(6),
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: scale(6),
  },
  daysNumber: {
    fontFamily: theme.typography.families.display,
    fontSize: scale(52),
    fontWeight: '800',
    color: theme.colors.primary, // Amour Red #E53935 for milestone counter
    lineHeight: scale(58),
  },
  daysUnit: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(20),
    color: theme.colors.coral, // Joyful Coral #FF7043
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(5),
    marginTop: scale(2),
  },
  daysSub: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(13),
    color: theme.colors.text, // Cozy Night #3E2723
  },
  dateDetail: {
    fontFamily: theme.typography.families.body,
    fontSize: scale(12),
    color: theme.colors.textSecondary, // #7A625A
    marginTop: scale(6),
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: scale(8),
    width: '100%',
  },
  emptyText: {
    fontFamily: theme.typography.families.body,
    fontSize: scale(13),
    color: theme.colors.textSecondary,
    marginBottom: scale(12),
    textAlign: 'center',
  },
  setBtn: {
    backgroundColor: theme.colors.primary, // #E53935
    borderRadius: 9999,
    paddingHorizontal: scale(18),
    paddingVertical: scale(10),
    ...theme.shadows.hardSm,
  },
  setBtnText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(13),
    color: '#FFFFFF',
  },
  inputContainer: {
    width: '100%',
    marginTop: scale(4),
    gap: scale(8),
  },
  btnRow: {
    flexDirection: 'row',
    gap: scale(8),
  },
});
