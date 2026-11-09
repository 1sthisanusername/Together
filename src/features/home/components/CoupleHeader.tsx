import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, DatePickerField } from '@/shared/ui';
import type { Profile } from '@/shared/types';
import {
  calculateDaysTogether,
  formatRelationshipDuration,
  type DurationDisplayFormat,
} from '@/shared/utils';
import { useUpdateStartDate } from '@/features/couple';
import { theme, scale, triggerHaptic } from '@/shared/theme';

// Together couple header: clean layout with partner names and relationship duration
export interface CoupleHeaderProps {
  coupleName?: string | null;
  me: Profile | null;
  partner: Profile | null;
  daysTogether: number | null;
  startDate?: string | null;
  isPartnerOnline?: boolean;
}

export const CoupleHeader: React.FC<CoupleHeaderProps> = ({
  me,
  partner,
  startDate,
}) => {
  const { t } = useTranslation();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateInput, setDateInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [durationFormat, setDurationFormat] = useState<DurationDisplayFormat>('total_days');

  const { mutate: updateDate, isPending } = useUpdateStartDate();

  const myDisplayName = me?.display_name || 'You';
  const partnerDisplayName = partner?.display_name || 'Partner';

  const totalDays = startDate ? calculateDaysTogether(startDate) : null;
  const durationText = startDate
    ? formatRelationshipDuration(startDate, durationFormat)
    : null;

  const cycleDurationFormat = () => {
    triggerHaptic('light');
    setDurationFormat((prev) => {
      if (prev === 'total_days') return 'years_months_days';
      if (prev === 'years_months_days') return 'both';
      return 'total_days';
    });
  };

  const handleSaveDate = () => {
    if (!dateInput.trim()) return;
    setErrorMsg(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      if (dateInput.trim() > today) {
        setErrorMsg('Anniversary date cannot be in the future');
        return;
      }

      updateDate(dateInput.trim(), {
        onSuccess: () => {
          setShowDatePicker(false);
          setDateInput('');
        },
        onError: (err: any) => {
          setErrorMsg(err.message || 'Failed to update date');
        },
      });
    } catch (e: any) {
      setErrorMsg(e.message || 'Invalid date');
    }
  };

  return (
    <View style={styles.container}>
      {/* Names and Relationship Duration (Logo on top in bar, then names, then days) */}
      <View style={styles.headerBlock}>
        {/* Partner Names */}
        <Text style={styles.partnerNames} numberOfLines={1}>
          {myDisplayName} ❤️ {partnerDisplayName}
        </Text>

        {/* Relationship Duration with format cycling on tap & edit on long press */}
        {durationText ? (
          <TouchableOpacity
            style={styles.durationBadgeWrapper}
            onPress={cycleDurationFormat}
            onLongPress={() => {
              setDateInput(startDate || '');
              setShowDatePicker(!showDatePicker);
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`${durationText}. Tap to toggle display format.`}
          >
            <View style={styles.durationShadow} />
            <View style={styles.durationSurface}>
              <Text style={styles.durationText}>{durationText}</Text>
              <Text style={styles.durationCycleHint}>↻</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.setAnniversaryBtn}
            onPress={() => setShowDatePicker(!showDatePicker)}
            activeOpacity={0.8}
          >
            <Text style={styles.setAnniversaryText}>
              💕 Set your start date to count days together
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Date Picker Modal / Form (when updating start date) */}
      {showDatePicker && (
        <View style={styles.pickerWrapper}>
          <View style={styles.pickerShadow} />
          <View style={styles.pickerForm}>
            <Text style={styles.pickerTitle}>Set When You Got Together</Text>
            <DatePickerField
              placeholder="Select start date"
              value={dateInput}
              maxDate={new Date()}
              onChange={(val) => {
                setDateInput(val);
                setErrorMsg(null);
              }}
            />
            {errorMsg && (
              <Text style={styles.errorText}>
                {errorMsg}
              </Text>
            )}
            <View style={styles.formRow}>
              <Button
                title="Cancel"
                variant="ghost"
                size="sm"
                onPress={() => {
                  setShowDatePicker(false);
                  setErrorMsg(null);
                }}
                style={{ flex: 1 }}
              />
              <Button
                title="Save"
                variant="primary"
                size="sm"
                loading={isPending}
                disabled={!dateInput.trim() || isPending}
                onPress={handleSaveDate}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: scale(2),
    width: '100%',
  },
  headerBlock: {
    paddingHorizontal: scale(18),
    marginTop: scale(2),
    marginBottom: scale(6),
    alignItems: 'flex-start',
  },
  partnerNames: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(15),
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: 0.1,
  },
  durationBadgeWrapper: {
    position: 'relative',
    marginTop: scale(4),
  },
  durationShadow: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: -2,
    bottom: -2,
    backgroundColor: theme.colors.shadowInk,
    borderRadius: scale(12),
  },
  durationSurface: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    backgroundColor: theme.colors.secondary, // Sunshine #FFC93C
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    paddingHorizontal: scale(12),
    paddingVertical: scale(5),
    borderRadius: scale(12),
  },
  durationText: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(13),
    fontWeight: '700',
    color: theme.colors.text,
  },
  durationCycleHint: {
    fontSize: scale(11),
    color: theme.colors.text,
    opacity: 0.6,
  },
  setAnniversaryBtn: {
    marginTop: scale(6),
    paddingVertical: scale(4),
  },
  setAnniversaryText: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(12),
    color: theme.colors.primary,
    fontWeight: '600',
  },
  pickerWrapper: {
    position: 'relative',
    marginHorizontal: scale(18),
    marginVertical: scale(12),
  },
  pickerShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    backgroundColor: theme.colors.shadowInk,
    borderRadius: scale(16),
  },
  pickerForm: {
    backgroundColor: theme.colors.surface,
    borderWidth: theme.borders.chunky,
    borderColor: theme.colors.border,
    borderRadius: scale(16),
    padding: scale(16),
  },
  pickerTitle: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(16),
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: scale(12),
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    fontWeight: '700',
  },
  formRow: {
    flexDirection: 'row',
    gap: scale(8),
    marginTop: scale(8),
  },
});
