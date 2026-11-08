import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuthStore } from '@/features/auth';
import { useActiveCouple, useUpdateStartDate } from '@/features/couple';
import { Card, Button, Input, DatePickerField } from '@/shared/ui';
import {
  calculateTogetherDuration,
  calculateDaysTogether,
  calculateNextAnniversary,
  calculateNextMilestone,
} from '@/shared/utils';
import { theme } from '@/shared/theme';

export const CoupleProfileCard: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const { data: coupleData } = useActiveCouple();
  const { mutate: updateStartDate, isPending } = useUpdateStartDate();

  const partner = coupleData?.partner;
  const couple = coupleData?.couple;

  const myName = profile?.display_name || user?.email?.split('@')[0] || 'You';
  const partnerName = partner?.display_name || 'Partner';

  const myInitial = myName.charAt(0).toUpperCase();
  const partnerInitial = partnerName.charAt(0).toUpperCase();

  const myTz = profile?.timezone || 'Auto';
  const partnerTz = partner?.timezone || 'Auto';

  const [isEditingDate, setIsEditingDate] = useState(false);
  const [dateInput, setDateInput] = useState(couple?.start_date || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startDate = couple?.start_date;
  const duration = startDate ? calculateTogetherDuration(startDate) : null;
  const totalDays = startDate ? calculateDaysTogether(startDate) : null;
  const nextAnniv = startDate ? calculateNextAnniversary(startDate) : null;
  const nextMilestone = startDate ? calculateNextMilestone(startDate) : null;

  const handleSaveDate = () => {
    if (!dateInput.trim()) return;
    setErrorMsg(null);

    const today = new Date().toISOString().split('T')[0];
    if (dateInput.trim() > today) {
      setErrorMsg('Anniversary date cannot be in the future');
      return;
    }

    updateStartDate(dateInput.trim(), {
      onSuccess: () => {
        setIsEditingDate(false);
      },
      onError: (err: any) => {
        setErrorMsg(err.message || 'Failed to update date');
      },
    });
  };

  const handleStartEdit = () => {
    setDateInput(couple?.start_date || '');
    setErrorMsg(null);
    setIsEditingDate(true);
  };

  return (
    <Card style={styles.card}>
      <View style={styles.avatarsRow}>
        <View style={styles.avatarWrapper}>
          <View style={[styles.avatar, styles.myAvatar]}>
            <Text style={styles.avatarInitial}>{myInitial}</Text>
          </View>
          <Text style={styles.avatarName} numberOfLines={1}>{myName}</Text>
          <Text style={styles.avatarTz} numberOfLines={1}>📍 {myTz.split('/').pop()?.replace('_', ' ')}</Text>
        </View>

        <View style={styles.centerHeart}>
          <Text style={styles.heartIcon}>♥</Text>
          <Text style={styles.togetherTag}>Together</Text>
        </View>

        <View style={styles.avatarWrapper}>
          <View style={[styles.avatar, styles.partnerAvatar]}>
            <Text style={styles.avatarInitial}>{partnerInitial}</Text>
          </View>
          <Text style={styles.avatarName} numberOfLines={1}>{partnerName}</Text>
          <Text style={styles.avatarTz} numberOfLines={1}>📍 {partnerTz.split('/').pop()?.replace('_', ' ')}</Text>
        </View>
      </View>

      {/* Anniversary & Milestones Section */}
      {startDate && duration ? (
        <View style={styles.anniversarySection}>
          <View style={styles.anniversaryHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>💍 Together Since</Text>
            <TouchableOpacity onPress={handleStartEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.editDateBtn}>✎ Edit</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.startDateFormatted}>
            {new Date(startDate).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>

          <View style={styles.durationCard}>
            <Text style={styles.durationText}>{duration.formattedText}</Text>
            <Text style={styles.totalDaysBadge}>{totalDays} {totalDays === 1 ? 'day' : 'days'} total</Text>
          </View>

          <View style={styles.countdownRow}>
            {nextAnniv && (
              <View style={styles.countdownBox}>
                <Text style={styles.countdownNumber}>
                  {nextAnniv.daysRemaining === 0 ? 'Today!' : `${nextAnniv.daysRemaining}d`}
                </Text>
                <Text style={styles.countdownLabel}>
                  {nextAnniv.daysRemaining === 0
                    ? `Happy Year ${nextAnniv.yearsTogetherNext}!`
                    : `Next Anniversary (Year ${nextAnniv.yearsTogetherNext})`}
                </Text>
              </View>
            )}

            {nextMilestone && (
              <View style={styles.countdownBox}>
                <Text style={styles.countdownNumber}>{nextMilestone.daysRemaining}d</Text>
                <Text style={styles.countdownLabel}>{nextMilestone.description}</Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        /* Empty State: Prompt to add start date */
        <View style={styles.emptyAnniversaryBox}>
          <Text style={styles.emptyHeartIcon}>💕</Text>
          <Text style={styles.emptyTitle}>When did your story begin?</Text>
          <Text style={styles.emptySubtitle}>
            Set your anniversary date to celebrate every milestone together.
          </Text>
          <Button
            title="+ Set Anniversary Date"
            variant="outline"
            size="sm"
            onPress={handleStartEdit}
            style={styles.setDateBtn}
          />
        </View>
      )}

      {/* Inline Date Edit Form */}
      {isEditingDate && (
        <View style={styles.editFormContainer}>
          <Text style={styles.editFormTitle}>Set When You Got Together</Text>
          <DatePickerField
            placeholder="Select anniversary date"
            value={dateInput}
            maxDate={new Date()}
            onChange={(val) => {
              setDateInput(val);
              setErrorMsg(null);
            }}
          />
          {errorMsg && <Text style={{ color: '#ef4444', fontSize: 12, marginTop: -8, marginBottom: 8 }}>{errorMsg}</Text>}
          <View style={styles.formBtnRow}>
            <Button
              title="Cancel"
              variant="ghost"
              size="sm"
              onPress={() => {
                setIsEditingDate(false);
                setErrorMsg(null);
              }}
              style={{ flex: 1 }}
            />
            <Button
              title="Save Date"
              variant="primary"
              size="sm"
              loading={isPending}
              disabled={!dateInput.trim() || isPending}
              onPress={handleSaveDate}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 18,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderColor: theme.colors.borderLight,
    borderRadius: 20,
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  avatarWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  myAvatar: {
    backgroundColor: '#7FA083',
  },
  partnerAvatar: {
    backgroundColor: '#C48B9F',
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  avatarName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  avatarTz: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  centerHeart: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  heartIcon: {
    fontSize: 26,
    color: '#E11D48',
    marginBottom: 2,
  },
  togetherTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  anniversarySection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  anniversaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text,
  },
  editDateBtn: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  startDateFormatted: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 10,
  },
  durationCard: {
    backgroundColor: '#F7F3F0',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  durationText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  totalDaysBadge: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  countdownRow: {
    flexDirection: 'row',
    gap: 10,
  },
  countdownBox: {
    flex: 1,
    backgroundColor: '#FAF5FF',
    borderColor: '#E9D5FF',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  countdownNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7E22CE',
  },
  countdownLabel: {
    fontSize: 11,
    color: '#9333EA',
    marginTop: 2,
    textAlign: 'center',
  },
  emptyAnniversaryBox: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignItems: 'center',
  },
  emptyHeartIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  emptySubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  setDateBtn: {
    alignSelf: 'center',
  },
  editFormContainer: {
    marginTop: 14,
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  editFormTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  formBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
});
