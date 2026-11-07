import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input } from '@/shared/ui';
import type { ImportantDate } from '@/shared/types';
import { useAddImportantDate } from '../hooks/useUsData';

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
              <Input
                placeholder="YYYY-MM-DD (e.g. 2026-12-20)"
                value={targetDateStr}
                onChangeText={setTargetDateStr}
              />
              <Button
                title={t('common.save')}
                variant="primary"
                size="sm"
                loading={isPending}
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
    padding: 20,
    marginVertical: 8,
    width: '100%',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1D4ED8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  countdownContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  daysNumber: {
    fontSize: 54,
    fontWeight: '900',
    color: '#1E40AF',
    lineHeight: 60,
  },
  daysSub: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateDetail: {
    fontSize: 12,
    color: '#60A5FA',
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
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

