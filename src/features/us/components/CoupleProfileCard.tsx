import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { useAuthStore } from '@/features/auth';
import { useActiveCouple, useUpdateStartDate } from '@/features/couple';
import { Card, Button, DatePickerField, HeartIcon, PinIcon } from '@/shared/ui';
import {
  calculateTogetherDuration,
  calculateDaysTogether,
  calculateNextAnniversary,
  calculateNextMilestone,
} from '@/shared/utils';
import { theme, scale, triggerHaptic } from '@/shared/theme';

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

  // Anniversary section ⋮ overflow menu & milestones modal
  const [menuVisible, setMenuVisible] = useState(false);
  const [showMilestonesModal, setShowMilestonesModal] = useState(false);

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
          <View style={styles.tzRow}>
            <PinIcon color={theme.colors.textSecondary} size={11} />
            <Text style={styles.avatarTz} numberOfLines={1}>{myTz.split('/').pop()?.replace('_', ' ')}</Text>
          </View>
        </View>

        <View style={styles.centerHeart}>
          <HeartIcon color={theme.colors.primary} size={24} filled />
          <Text style={styles.togetherTag}>Together</Text>
        </View>

        <View style={styles.avatarWrapper}>
          <View style={[styles.avatar, styles.partnerAvatar]}>
            <Text style={styles.avatarInitial}>{partnerInitial}</Text>
          </View>
          <Text style={styles.avatarName} numberOfLines={1}>{partnerName}</Text>
          <View style={styles.tzRow}>
            <PinIcon color={theme.colors.textSecondary} size={11} />
            <Text style={styles.avatarTz} numberOfLines={1}>{partnerTz.split('/').pop()?.replace('_', ' ')}</Text>
          </View>
        </View>
      </View>

      {/* Anniversary & Milestones Section with ⋮ menu */}
      {startDate && duration ? (
        <View style={styles.anniversarySection}>
          <View style={styles.anniversaryHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>💍 Together Since</Text>

            {/* Anniversary ⋮ Menu Trigger */}
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                setMenuVisible(true);
              }}
              style={styles.moreBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Anniversary options"
            >
              <Text style={styles.moreDots}>⋮</Text>
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

      {/* Anniversary Header Dropdown ⋮ Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.menuDropdown}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    triggerHaptic('light');
                    handleStartEdit();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.menuItemIcon}>✎</Text>
                  <Text style={styles.menuItemText}>Edit "Together Since"</Text>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    triggerHaptic('light');
                    setShowMilestonesModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.menuItemIcon}>🏆</Text>
                  <Text style={styles.menuItemText}>View Milestones</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Milestones Viewer Modal */}
      <Modal
        visible={showMilestonesModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMilestonesModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowMilestonesModal(false)}>
          <View style={styles.milestonesModalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.milestonesCard}>
                <View style={styles.milestonesHeader}>
                  <Text style={styles.milestonesTitle}>Milestones & Memories ✨</Text>
                  <TouchableOpacity
                    onPress={() => setShowMilestonesModal(false)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.milestonesClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.milestoneItem}>
                  <Text style={styles.milestoneEmoji}>📅</Text>
                  <View style={styles.milestoneTextCol}>
                    <Text style={styles.milestoneHeading}>Next Anniversary</Text>
                    <Text style={styles.milestoneValue}>
                      {nextAnniv
                        ? `${nextAnniv.daysRemaining === 0 ? 'Today!' : `In ${nextAnniv.daysRemaining} days`} (Year ${nextAnniv.yearsTogetherNext})`
                        : 'Set a start date to calculate'}
                    </Text>
                  </View>
                </View>

                <View style={styles.milestoneItem}>
                  <Text style={styles.milestoneEmoji}>🌟</Text>
                  <View style={styles.milestoneTextCol}>
                    <Text style={styles.milestoneHeading}>Next Big Milestone</Text>
                    <Text style={styles.milestoneValue}>
                      {nextMilestone
                        ? `${nextMilestone.description} (in ${nextMilestone.daysRemaining} days)`
                        : 'Calculated from your start date'}
                    </Text>
                  </View>
                </View>

                <View style={styles.milestoneItem}>
                  <Text style={styles.milestoneEmoji}>⏳</Text>
                  <View style={styles.milestoneTextCol}>
                    <Text style={styles.milestoneHeading}>Total Days of Loving Each Other</Text>
                    <Text style={styles.milestoneValue}>
                      {totalDays !== null ? `${totalDays} days together` : 'N/A'}
                    </Text>
                  </View>
                </View>

                <Button
                  title="Close"
                  variant="outline"
                  size="md"
                  onPress={() => setShowMilestonesModal(false)}
                  style={{ marginTop: scale(14) }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: scale(18),
    marginBottom: scale(16),
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.roundness.lg,
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: scale(8),
  },
  avatarWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: scale(58),
    height: scale(58),
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(8),
    ...theme.shadows.hardSm,
  },
  myAvatar: {
    backgroundColor: theme.colors.coral,
  },
  partnerAvatar: {
    backgroundColor: theme.colors.rose,
  },
  avatarInitial: {
    fontSize: scale(24),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  avatarName: {
    fontSize: scale(15),
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: scale(2),
  },
  tzRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(3),
    justifyContent: 'center',
  },
  avatarTz: {
    fontSize: scale(12),
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  centerHeart: {
    alignItems: 'center',
    paddingHorizontal: scale(8),
    gap: scale(4),
  },
  togetherTag: {
    fontSize: scale(11),
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  anniversarySection: {
    marginTop: scale(14),
    paddingTop: scale(14),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  anniversaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(4),
  },
  sectionHeaderTitle: {
    fontSize: scale(14),
    fontWeight: '700',
    color: theme.colors.text,
  },
  moreBtn: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreDots: {
    fontSize: scale(18),
    fontWeight: '900',
    color: theme.colors.text,
  },
  startDateFormatted: {
    fontSize: scale(13),
    color: theme.colors.textSecondary,
    marginBottom: scale(10),
  },
  durationCard: {
    backgroundColor: theme.colors.surfaceBlush,
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: scale(14),
    alignItems: 'center',
    marginBottom: scale(10),
  },
  durationText: {
    fontSize: scale(15),
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  totalDaysBadge: {
    fontSize: scale(12),
    fontWeight: '700',
    color: theme.colors.primary,
    marginTop: scale(3),
  },
  countdownRow: {
    flexDirection: 'row',
    gap: scale(10),
  },
  countdownBox: {
    flex: 1,
    backgroundColor: theme.colors.surfaceBlush,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: scale(16),
    padding: scale(12),
    alignItems: 'center',
  },
  countdownNumber: {
    fontSize: scale(18),
    fontWeight: '800',
    color: theme.colors.primary,
  },
  countdownLabel: {
    fontSize: scale(11),
    color: theme.colors.textSecondary,
    marginTop: scale(2),
    textAlign: 'center',
  },
  emptyAnniversaryBox: {
    marginTop: scale(14),
    paddingTop: scale(14),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: 'center',
  },
  emptyHeartIcon: {
    fontSize: scale(24),
    marginBottom: scale(4),
  },
  emptyTitle: {
    fontSize: scale(14),
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: scale(2),
  },
  emptySubtitle: {
    fontSize: scale(12),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: scale(12),
    marginBottom: scale(10),
  },
  setDateBtn: {
    alignSelf: 'center',
  },
  editFormContainer: {
    marginTop: scale(14),
    padding: scale(14),
    backgroundColor: theme.colors.surfaceBlush,
    borderRadius: scale(14),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  editFormTitle: {
    fontSize: scale(13),
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: scale(8),
    textAlign: 'center',
  },
  formBtnRow: {
    flexDirection: 'row',
    gap: scale(10),
    marginTop: scale(6),
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuDropdown: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: scale(6),
    minWidth: scale(200),
    ...theme.shadows.hardSm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(14),
    paddingVertical: scale(10),
    gap: scale(10),
  },
  menuItemIcon: {
    fontSize: scale(16),
  },
  menuItemText: {
    fontFamily: theme.typography.families.body,
    fontSize: scale(14),
    fontWeight: '700',
    color: theme.colors.text,
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: scale(4),
  },
  milestonesModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  milestonesCard: {
    width: '100%',
    maxWidth: scale(380),
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.lg,
    padding: scale(18),
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.hardSm,
  },
  milestonesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(14),
  },
  milestonesTitle: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(18),
    fontWeight: '800',
    color: theme.colors.text,
  },
  milestonesClose: {
    fontSize: scale(18),
    fontWeight: '700',
    color: theme.colors.textSecondary,
    padding: scale(4),
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    paddingVertical: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  milestoneEmoji: {
    fontSize: scale(24),
  },
  milestoneTextCol: {
    flex: 1,
  },
  milestoneHeading: {
    fontSize: scale(12),
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  milestoneValue: {
    fontSize: scale(14),
    color: theme.colors.text,
    fontWeight: '700',
    marginTop: scale(2),
  },
});
