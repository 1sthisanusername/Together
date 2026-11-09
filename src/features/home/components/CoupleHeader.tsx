import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, DatePickerField } from '@/shared/ui';
import type { Profile } from '@/shared/types';
import { calculateTogetherDuration, calculateDaysTogether } from '@/shared/utils';
import { useUpdateStartDate } from '@/features/couple';
import { theme, scale } from '@/shared/theme';
import { PartnerString } from './PartnerString';

export interface CoupleHeaderProps {
  coupleName?: string | null;
  me: Profile | null;
  partner: Profile | null;
  daysTogether: number | null;
  startDate?: string | null;
  isPartnerOnline?: boolean;
}

export const CoupleHeader: React.FC<CoupleHeaderProps> = ({
  coupleName,
  me,
  partner,
  startDate,
  isPartnerOnline = false,
}) => {
  const { t } = useTranslation();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateInput, setDateInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { mutate: updateDate, isPending } = useUpdateStartDate();

  const duration = startDate ? calculateTogetherDuration(startDate) : null;
  const totalDays = startDate ? calculateDaysTogether(startDate) : null;

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
      {/* 1. Couple Title Sticker */}
      <View style={styles.titleWrapper}>
        <Text style={styles.coupleTitle}>{coupleName || 'Together'}</Text>
      </View>

      {/* 2. Partner String (Slack when away, tight with a wiggle when online) */}
      <PartnerString
        myName={me?.display_name || 'You'}
        myAvatarUrl={me?.avatar_url}
        partnerName={partner?.display_name || 'Partner'}
        partnerAvatarUrl={partner?.avatar_url}
        isPartnerOnline={isPartnerOnline}
      />

      {/* 3. Together Since Breakdown & Days Counter Badge */}
      {duration && totalDays !== null ? (
        <TouchableOpacity
          style={styles.counterWrapper}
          onPress={() => {
            setDateInput(startDate || '');
            setShowDatePicker(!showDatePicker);
          }}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Anniversary date tracker"
        >
          <View style={styles.counterShadow} />
          <View style={styles.counterSurface}>
            <Text style={styles.durationText}>{duration.formattedText}</Text>
            <Text style={styles.counterLabel}>
              ({totalDays} {totalDays === 1 ? 'day' : 'days'} together 💕)
            </Text>
          </View>
        </TouchableOpacity>
      ) : (
        /* Empty state: friendly sticker prompt to set anniversary */
        <TouchableOpacity
          style={styles.emptyPromptWrapper}
          onPress={() => setShowDatePicker(!showDatePicker)}
          activeOpacity={0.8}
        >
          <View style={styles.emptyShadow} />
          <View style={styles.emptySurface}>
            <Text style={styles.emptyPromptIcon}>💕</Text>
            <Text style={styles.emptyPromptText}>
              When did you two get together? Tap to count your days together!
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* 4. Date Picker Form */}
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
              <Text style={{ color: theme.colors.danger, fontSize: 12, marginTop: -8, marginBottom: 8, fontWeight: '700' }}>
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
    alignItems: 'center',
    paddingVertical: scale(8),
    width: '100%',
  },
  titleWrapper: {
    marginBottom: scale(4),
  },
  coupleTitle: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(24),
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.4,
  },

  // Counter Badge
  counterWrapper: {
    position: 'relative',
    marginVertical: scale(8),
  },
  counterShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: -3,
    bottom: -3,
    backgroundColor: theme.colors.shadowInk,
    borderRadius: scale(16),
  },
  counterSurface: {
    backgroundColor: theme.colors.secondary, // Sunshine #FFC93C
    borderWidth: theme.borders.chunky,
    borderColor: theme.colors.border,
    paddingHorizontal: scale(18),
    paddingVertical: scale(8),
    borderRadius: scale(16),
    alignItems: 'center',
  },
  durationText: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(15),
    fontWeight: '800',
    color: theme.colors.text,
  },
  counterLabel: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(12),
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: scale(2),
  },

  // Empty Prompt
  emptyPromptWrapper: {
    position: 'relative',
    marginVertical: scale(8),
    maxWidth: '92%',
  },
  emptyShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: -3,
    bottom: -3,
    backgroundColor: theme.colors.shadowInk,
    borderRadius: scale(14),
  },
  emptySurface: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: theme.borders.chunky,
    borderColor: theme.colors.border,
    paddingHorizontal: scale(14),
    paddingVertical: scale(10),
    borderRadius: scale(14),
    gap: scale(8),
  },
  emptyPromptIcon: {
    fontSize: scale(18),
  },
  emptyPromptText: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(13),
    color: theme.colors.text,
    fontWeight: '700',
    flex: 1,
  },

  // Date Picker Form
  pickerWrapper: {
    position: 'relative',
    width: '92%',
    marginTop: scale(12),
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
    padding: scale(16),
    borderRadius: scale(16),
    borderWidth: theme.borders.chunky,
    borderColor: theme.colors.border,
  },
  pickerTitle: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(14),
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: scale(10),
    textAlign: 'center',
  },
  formRow: {
    flexDirection: 'row',
    gap: scale(10),
    marginTop: scale(8),
  },
});
