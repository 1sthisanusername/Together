import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, DatePickerField, HeartIcon } from '@/shared/ui';
import type { Profile } from '@/shared/types';
import {
  calculateDaysTogether,
  formatRelationshipDuration,
  type DurationDisplayFormat,
  safeSecureStore as SecureStore,
} from '@/shared/utils';
import { useUpdateStartDate } from '@/features/couple';
import { theme, scale, triggerHaptic } from '@/shared/theme';

const DURATION_FORMAT_KEY = 'together_duration_format';

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

  useEffect(() => {
    SecureStore.getItemAsync(DURATION_FORMAT_KEY).then((saved) => {
      if (saved === 'total_days' || saved === 'years_months_days' || saved === 'both') {
        setDurationFormat(saved as DurationDisplayFormat);
      }
    }).catch(() => {});
  }, []);

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
      let next: DurationDisplayFormat = 'total_days';
      if (prev === 'total_days') next = 'years_months_days';
      else if (prev === 'years_months_days') next = 'both';
      else next = 'total_days';

      SecureStore.setItemAsync(DURATION_FORMAT_KEY, next).catch(() => {});
      return next;
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
        {/* Partner Names with Vector Heart */}
        <View style={styles.namesRow}>
          <Text style={styles.partnerNames} numberOfLines={1}>
            {myDisplayName}
          </Text>
          <HeartIcon color={theme.colors.primary} size={scale(16)} filled />
          <Text style={styles.partnerNames} numberOfLines={1}>
            {partnerDisplayName}
          </Text>
        </View>

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
            <View style={styles.setAnniversaryRow}>
              <HeartIcon color={theme.colors.primary} size={scale(13)} filled />
              <Text style={styles.setAnniversaryText}>
                Set your start date to count days together
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Date Picker Modal / Form (when updating start date) */}
      {showDatePicker && (
        <View style={styles.pickerWrapper}>
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
    marginTop: scale(2),
    marginBottom: scale(6),
    alignItems: 'flex-start',
  },
  namesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  partnerNames: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(17),
    fontWeight: '700',
    color: theme.colors.text, // Cozy Night #3E2723
    letterSpacing: -0.2,
  },
  durationBadgeWrapper: {
    marginTop: scale(6),
  },
  durationSurface: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    backgroundColor: theme.colors.surfaceBlush, // #FFF0ED
    borderWidth: 1,
    borderColor: theme.colors.border, // #FBE9E7
    paddingHorizontal: scale(14),
    paddingVertical: scale(6),
    borderRadius: 9999,
    ...theme.shadows.hardSm,
  },
  durationText: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(13),
    fontWeight: '700',
    color: theme.colors.primary, // Amour Red #E53935 for high-emotion milestone count
  },
  durationCycleHint: {
    fontSize: scale(11),
    color: theme.colors.textSecondary, // #7A625A
  },
  setAnniversaryBtn: {
    marginTop: scale(6),
    paddingVertical: scale(4),
  },
  setAnniversaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  setAnniversaryText: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(12),
    color: theme.colors.primary,
    fontWeight: '600',
  },
  pickerWrapper: {
    marginVertical: scale(10),
  },
  pickerForm: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 20,
    padding: scale(16),
    ...theme.shadows.card,
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
