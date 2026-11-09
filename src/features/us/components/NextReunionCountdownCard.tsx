import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, DatePickerField } from '@/shared/ui';
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
  const { mutate: addDate, isPending } = useAddImportantDate();

  const handleSetDate = () => {
    if (!targetDateStr.trim()) return;
    addDate({
      title: 'Next Reunion Trip',
      eventDate: targetDateStr.trim(),
      category: 'meeting',
    });
    setShowDatePicker(false);
    setTargetDateStr('');
  };

  return (
    <View style={styles.cardWrapper}>
      {/* Hard Ink Shadow */}
      <View style={styles.cardShadow} />

      {/* Paper Surface */}
      <View style={styles.cardSurface}>
        <View style={styles.headerRow}>
          <View style={styles.labelBadge}>
            <Text style={styles.labelText}>✈️ Next Reunion</Text>
          </View>
        </View>

        {nextMeeting && daysRemaining !== null ? (
          <View style={styles.countdownContainer}>
            <View style={styles.numberRow}>
              <Text style={styles.daysNumber}>{daysRemaining}</Text>
              <Text style={styles.daysUnit}>
                {daysRemaining === 1 ? 'day' : 'days'}
              </Text>
            </View>
            <Text style={styles.daysSub}>until we are together again 💕</Text>
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
              <TouchableOpacity
                style={styles.setBtn}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.setBtnText}>＋ Set Reunion Countdown</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.inputContainer}>
                <DatePickerField
                  placeholder="Select next reunion date"
                  value={targetDateStr}
                  minDate={new Date()}
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
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: scale(18),
    marginVertical: scale(8),
    position: 'relative',
  },
  cardShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    backgroundColor: theme.colors.border,
    borderRadius: 20,
    zIndex: 0,
  },
  cardSurface: {
    position: 'relative',
    zIndex: 1,
    backgroundColor: theme.colors.background, // Paper #FFF4E3
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: theme.colors.border,
    padding: scale(18),
    alignItems: 'center',
  },
  headerRow: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: scale(8),
  },
  labelBadge: {
    backgroundColor: theme.colors.stickers.sunshine, // Sunshine Yellow
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
  },
  labelText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(11),
    color: theme.colors.text,
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
    fontWeight: '900',
    color: theme.colors.text,
    lineHeight: scale(58),
  },
  daysUnit: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(20),
    color: theme.colors.primary,
  },
  daysSub: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(13),
    color: theme.colors.textSecondary,
    marginTop: scale(2),
  },
  dateDetail: {
    fontFamily: theme.typography.families.body,
    fontSize: scale(12),
    color: theme.colors.textMuted,
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
    marginBottom: scale(10),
    textAlign: 'center',
  },
  setBtn: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
    ...theme.shadows.hardSm,
  },
  setBtnText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(13),
    color: theme.colors.text,
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
