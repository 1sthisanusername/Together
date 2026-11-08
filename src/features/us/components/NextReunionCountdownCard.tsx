import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input, DatePickerField } from '@/shared/ui';
import type { ImportantDate } from '@/shared/types';
import { useAddImportantDate } from '../hooks/useUsData';
import { theme } from '@/shared/theme';

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
    <Card style={styles.card}>
      <Text style={styles.label}>✈️ {t('us.nextMeetingTitle')}</Text>

      {nextMeeting && daysRemaining !== null ? (
        <View style={styles.countdownContainer}>
          <Text style={styles.daysNumber}>{daysRemaining}</Text>
          <Text style={styles.daysSub}>{t('us.daysToGo')}</Text>
          <Text style={styles.dateDetail}>
            Target: {new Date(nextMeeting.event_date).toLocaleDateString()}
          </Text>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('home.noMeetingSet')}</Text>
          {!showDatePicker ? (
            <Button
              title={t('us.setNextMeeting')}
              variant="outline"
              size="sm"
              onPress={() => setShowDatePicker(true)}
              style={styles.setBtn}
            />
          ) : (
            <View style={styles.inputContainer}>
              <DatePickerField
                placeholder="Select next reunion date"
                value={targetDateStr}
                minDate={new Date()}
                onChange={setTargetDateStr}
              />
              <Button
                title={t('common.save')}
                variant="primary"
                size="sm"
                loading={isPending}
                disabled={!targetDateStr.trim()}
                onPress={handleSetDate}
              />
            </View>
          )}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 22,
    marginVertical: 8,
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderLight,
    alignItems: 'center',
    borderRadius: 22,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.primary, // #b69788
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  countdownContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  daysNumber: {
    fontSize: 56,
    fontWeight: '900',
    color: theme.colors.text, // #42362e
    lineHeight: 62,
    letterSpacing: -1,
  },
  daysSub: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary, // #a8917f
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dateDetail: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  setBtn: {
    marginTop: 4,
  },
  inputContainer: {
    width: '100%',
    marginTop: 8,
  },
});
