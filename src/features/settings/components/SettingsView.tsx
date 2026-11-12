import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input, ThemedConfirmDialog, ThemedToast } from '@/shared/ui';
import { useAuthStore } from '@/features/auth';
import { useActiveCouple } from '@/features/couple';
import { useUpdateProfile, useUserSettings, useUpdateUserSettings } from '../hooks/useSettings';
import { TimeZonePickerModal, getUtcOffsetString } from './TimeZonePickerModal';
import {
  createDualBackup,
  getBackupFrequency,
  setBackupFrequency,
  getBackupAccountEmail,
  getLastBackupAt,
  selectBackupGoogleAccount,
  type BackupFrequency,
} from '../services/googleDriveBackup';
import { theme, scale, triggerHaptic } from '@/shared/theme';

function timeStringToDate(timeStr?: string | null, defaultHour = 22, defaultMin = 0): Date {
  const d = new Date();
  if (timeStr) {
    const [h, m] = timeStr.split(':').map((n) => parseInt(n, 10));
    if (!Number.isNaN(h) && !Number.isNaN(m)) {
      d.setHours(h, m, 0, 0);
      return d;
    }
  }
  d.setHours(defaultHour, defaultMin, 0, 0);
  return d;
}

function dateToTimeString(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}:00`;
}

function formatTimeDisplay(timeStr?: string | null, fallback = '10:00 PM'): string {
  if (!timeStr) return fallback;
  const d = timeStringToDate(timeStr);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export const SettingsView: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const signOut = useAuthStore((state) => state.signOut);
  const { data: coupleData } = useActiveCouple();
  const { data: userSettings } = useUserSettings();
  const { mutate: updateUserSettings } = useUpdateUserSettings();

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupFrequency, setBackupFrequencyState] = useState<BackupFrequency>('weekly');
  const [backupAccountEmail, setBackupAccountEmail] = useState<string | null>(null);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const [showDriveScopeDialog, setShowDriveScopeDialog] = useState(false);
  const [isSelectingAccount, setIsSelectingAccount] = useState(false);
  const [quietPickerTarget, setQuietPickerTarget] = useState<'start' | 'end' | null>(null);
  const [iosTempTime, setIosTempTime] = useState<Date>(new Date());
  const [toastState, setToastState] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ visible: false, message: '', type: 'info' });

  const showThemedToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastState({ visible: true, message, type });
  };

  useEffect(() => {
    getBackupFrequency().then((freq) => setBackupFrequencyState(freq));
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    getBackupAccountEmail(user.id).then((localEmail) => {
      setBackupAccountEmail(
        userSettings?.backup_account_email || localEmail || user.email || null
      );
    });
    getLastBackupAt(user.id).then((localLast) => {
      setLastBackupAt(userSettings?.last_backup_at || localLast || null);
    });
  }, [user?.id, user?.email, userSettings?.backup_account_email, userSettings?.last_backup_at]);

  const handleSelectFrequency = async (freq: BackupFrequency) => {
    triggerHaptic('light');
    setBackupFrequencyState(freq);
    await setBackupFrequency(freq);
  };

  const handleConfirmAccountPick = async () => {
    if (!user?.id) return;
    setShowDriveScopeDialog(false);
    try {
      setIsSelectingAccount(true);
      const { email } = await selectBackupGoogleAccount(user.id);
      setBackupAccountEmail(email);
      updateUserSettings({ backup_account_email: email });
      showThemedToast(`Backup account set to ${email}`, 'success');
    } catch (err: any) {
      showThemedToast(err?.message || 'Could not switch Google backup account.', 'error');
    } finally {
      setIsSelectingAccount(false);
    }
  };

  const handleOpenQuietPicker = (target: 'start' | 'end') => {
    const current =
      target === 'start'
        ? timeStringToDate(userSettings?.quiet_hours_start, 22, 0)
        : timeStringToDate(userSettings?.quiet_hours_end, 8, 0);
    setIosTempTime(current);
    setQuietPickerTarget(target);
  };

  const handleQuietTimeAndroidChange = (event: DateTimePickerEvent, selected?: Date) => {
    const target = quietPickerTarget;
    setQuietPickerTarget(null);
    if (event.type === 'set' && selected && target) {
      const formatted = dateToTimeString(selected);
      updateUserSettings(
        target === 'start' ? { quiet_hours_start: formatted } : { quiet_hours_end: formatted }
      );
    }
  };

  const handleQuietTimeIosConfirm = () => {
    if (quietPickerTarget) {
      const formatted = dateToTimeString(iosTempTime);
      updateUserSettings(
        quietPickerTarget === 'start'
          ? { quiet_hours_start: formatted }
          : { quiet_hours_end: formatted }
      );
    }
    setQuietPickerTarget(null);
  };

  const detectedZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  }, []);

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [timeZone, setTimeZone] = useState(profile?.timezone || detectedZone);
  const [showTimeZoneModal, setShowTimeZoneModal] = useState(false);

  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
    if (profile?.timezone) setTimeZone(profile.timezone);
  }, [profile?.display_name, profile?.timezone]);

  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();

  const handleSaveProfile = () => {
    updateProfile({
      displayName: displayName.trim(),
      timeZone: timeZone.trim(),
    });
  };

  const handleCreateBackup = async () => {
    if (!coupleData?.couple?.id || !user?.id) return;
    try {
      setIsBackingUp(true);
      triggerHaptic('medium');
      const { couple } = await createDualBackup(coupleData.couple.id, user.id);
      const nowIso = new Date().toISOString();
      setLastBackupAt(nowIso);
      setIsBackingUp(false);
      triggerHaptic('success');
      showThemedToast(
        `Backed up ${couple.archive.stats.lettersCount} letters & ${couple.archive.stats.memoriesCount} memories.`,
        'success'
      );
    } catch {
      setIsBackingUp(false);
      showThemedToast('Could not create couple data archive. Please try again.', 'error');
    }
  };

  const currentOffset = useMemo(() => getUtcOffsetString(timeZone), [timeZone]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionHeading}>{t('settings.accountSection')}</Text>
      <Card style={styles.card}>
        <Input
          label={t('settings.displayName')}
          value={displayName}
          onChangeText={setDisplayName}
        />
        <Text style={styles.fieldHint}>
          Your partner sees this nickname in your space. Changing it only updates your name, never your partner's.
        </Text>

        {/* Interactive Time Zone Selector */}
        <View style={styles.timeZoneField}>
          <Text style={styles.fieldLabel}>{t('settings.timeZone')}</Text>
          <TouchableOpacity
            style={styles.timeZonePickerBtn}
            onPress={() => setShowTimeZoneModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.timeZoneTextCol}>
              <Text style={styles.timeZoneValue}>{timeZone.replace(/_/g, ' ')}</Text>
            </View>
            <View style={styles.offsetBadge}>
              <Text style={styles.offsetBadgeText}>{currentOffset}</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Button
          title={t('common.save')}
          variant="primary"
          size="md"
          loading={isUpdating}
          onPress={handleSaveProfile}
          style={styles.saveBtn}
        />
      </Card>

      <Text style={styles.sectionHeading}>{t('settings.coupleSection')}</Text>
      <Card style={styles.card}>
        <Button
          title={t('settings.openVault')}
          variant="primary"
          size="md"
          onPress={() => {
            triggerHaptic('medium');
            router.push('/vault');
          }}
          style={styles.vaultBtn}
        />
      </Card>

      <Text style={styles.sectionHeading}>{t('settings.notificationsQuietTitle')}</Text>
      <Card style={styles.card}>
        {[
          { key: 'notify_messages' as const, label: 'Messages & Voice Notes' },
          { key: 'notify_letters' as const, label: 'Letters' },
          { key: 'notify_daily_question' as const, label: 'Daily Question' },
          { key: 'notify_photos' as const, label: 'Photos & Memories' },
          { key: 'notify_games' as const, label: 'Games & Activities' },
        ].map((item) => {
          const val = userSettings ? userSettings[item.key] !== false : true;
          return (
            <View key={item.key} style={styles.settingSwitchRow}>
              <Text style={styles.settingSwitchLabel}>{item.label}</Text>
              <Switch
                value={val}
                onValueChange={(next) => {
                  triggerHaptic('light');
                  updateUserSettings({
                    [item.key]: next,
                    ...(item.key === 'notify_games' ? { notify_activities: next } : {}),
                  });
                }}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          );
        })}

        <View style={[styles.settingSwitchRow, styles.settingSwitchRowDivider]}>
          <View style={styles.timeZoneTextCol}>
            <Text style={styles.settingSwitchLabel}>Quiet Hours</Text>
            <Text style={styles.fieldHintInline}>Silence banners and pushes while resting</Text>
          </View>
          <Switch
            value={!!userSettings?.quiet_hours_enabled}
            onValueChange={(next) => {
              triggerHaptic('light');
              updateUserSettings({ quiet_hours_enabled: next });
            }}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {userSettings?.quiet_hours_enabled ? (
          <View style={styles.quietTimeRow}>
            <TouchableOpacity
              style={[styles.timeZonePickerBtn, styles.quietTimeBtn]}
              onPress={() => handleOpenQuietPicker('start')}
              activeOpacity={0.7}
            >
              <View>
                <Text style={styles.timeZoneSub}>Start</Text>
                <Text style={styles.timeZoneValue}>
                  {formatTimeDisplay(userSettings?.quiet_hours_start, '10:00 PM')}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.timeZonePickerBtn, styles.quietTimeBtn]}
              onPress={() => handleOpenQuietPicker('end')}
              activeOpacity={0.7}
            >
              <View>
                <Text style={styles.timeZoneSub}>End</Text>
                <Text style={styles.timeZoneValue}>
                  {formatTimeDisplay(userSettings?.quiet_hours_end, '8:00 AM')}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </Card>

      <Text style={styles.sectionHeading}>{t('settings.dataBackupTitle')}</Text>
      <Card style={styles.card}>
        <Text style={styles.backupSubtext}>
          Export a complete, encrypted dual archive: your isolated personal settings and your shared couple data (letters, memories, bucket list, dates).
          Synchronizes with Google Drive appdata without polluting your main Drive files.
        </Text>

        <View style={styles.timeZoneField}>
          <Text style={styles.backupFieldLabel}>Backup Google Account</Text>
          <TouchableOpacity
            style={styles.timeZonePickerBtn}
            onPress={() => setShowDriveScopeDialog(true)}
            disabled={isSelectingAccount}
            activeOpacity={0.7}
          >
            <View style={styles.timeZoneTextCol}>
              <Text style={styles.timeZoneValue} numberOfLines={1}>
                {backupAccountEmail || user?.email || 'Not selected'}
              </Text>
              <Text style={styles.timeZoneSub}>
                {isSelectingAccount ? 'Opening Google account picker…' : 'Tap to choose Google account'}
              </Text>
            </View>
            <View style={styles.offsetBadge}>
              <Text style={styles.offsetBadgeText}>Change</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.lastBackupText}>
            Last backup: {lastBackupAt ? new Date(lastBackupAt).toLocaleString() : 'Never'}
          </Text>
        </View>

        <Text style={styles.backupFieldLabel}>Automatic Sync Frequency</Text>
        <View style={styles.freqRow}>
          {(
            [
              { id: 'daily', label: 'Daily ⏱️' },
              { id: 'weekly', label: 'Weekly 🌟' },
              { id: 'monthly', label: 'Monthly 📅' },
              { id: 'manual', label: 'Manual ⚙️' },
            ] as const
          ).map((item) => {
            const isSelected = backupFrequency === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.freqChip, isSelected && styles.freqChipActive]}
                onPress={() => handleSelectFrequency(item.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.freqChipText,
                    isSelected && styles.freqChipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Button
          title={isBackingUp ? '⏳ Backing up…' : 'Backup Now ☁️'}
          variant="primary"
          size="md"
          loading={isBackingUp}
          disabled={!coupleData?.couple?.id}
          onPress={handleCreateBackup}
          style={styles.backupBtn}
        />
      </Card>

      <TimeZonePickerModal
        visible={showTimeZoneModal}
        selectedZone={timeZone}
        onClose={() => setShowTimeZoneModal(false)}
        onSelectZone={(selected) => setTimeZone(selected)}
      />

      {quietPickerTarget && Platform.OS === 'android' && (
        <DateTimePicker
          value={iosTempTime}
          mode="time"
          display="default"
          onChange={handleQuietTimeAndroidChange}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal
          visible={!!quietPickerTarget}
          transparent
          animationType="fade"
          onRequestClose={() => setQuietPickerTarget(null)}
        >
          <View style={styles.iosModalOverlay}>
            <View style={styles.iosPickerContainer}>
              <View style={styles.iosToolbar}>
                <TouchableOpacity onPress={() => setQuietPickerTarget(null)}>
                  <Text style={styles.iosCancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.fieldLabel}>
                  {quietPickerTarget === 'start' ? 'Quiet Hours Start' : 'Quiet Hours End'}
                </Text>
                <TouchableOpacity onPress={handleQuietTimeIosConfirm}>
                  <Text style={styles.iosConfirmText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={iosTempTime}
                mode="time"
                display="spinner"
                onChange={(_e, d) => {
                  if (d) setIosTempTime(d);
                }}
              />
            </View>
          </View>
        </Modal>
      )}

      <ThemedConfirmDialog
        visible={showDriveScopeDialog}
        title="Choose Backup Google Account"
        message="Together requests private Google Drive app-data access (drive.appdata) solely to store your encrypted couple backup in a hidden app folder. It cannot see or modify your other Google Drive files."
        emoji="☁️"
        confirmLabel="Choose Account"
        cancelLabel="Cancel"
        onConfirm={handleConfirmAccountPick}
        onCancel={() => setShowDriveScopeDialog(false)}
      />

      <ThemedToast
        visible={toastState.visible}
        message={toastState.message}
        type={toastState.type}
        onDismiss={() => setToastState((prev) => ({ ...prev, visible: false }))}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: scale(20),
    backgroundColor: theme.colors.background,
  },
  sectionHeading: {
    fontSize: scale(13),
    fontWeight: '800',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: scale(12),
    marginBottom: scale(8),
    marginLeft: scale(4),
  },
  card: {
    padding: scale(20),
    marginBottom: scale(16),
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderLight,
  },
  timeZoneField: {
    marginBottom: scale(16),
  },
  fieldLabel: {
    fontSize: scale(14),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: scale(6),
    letterSpacing: 0.1,
  },
  fieldHint: {
    fontSize: scale(12),
    color: theme.colors.textMuted,
    marginTop: -scale(8),
    marginBottom: scale(14),
    lineHeight: scale(16),
  },
  timeZonePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: scale(14),
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
  },
  timeZoneTextCol: {
    flex: 1,
    marginRight: scale(8),
  },
  timeZoneValue: {
    fontSize: scale(15),
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: scale(2),
  },
  timeZoneSub: {
    fontSize: scale(12),
    color: theme.colors.textSecondary,
  },
  offsetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  offsetBadgeText: {
    fontSize: scale(13),
    fontWeight: '700',
    color: theme.colors.primary,
  },
  chevron: {
    fontSize: scale(20),
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  saveBtn: {
    marginTop: scale(8),
  },
  vaultBtn: {
    marginBottom: scale(12),
  },
  backupSubtext: {
    fontSize: scale(13),
    color: theme.colors.textSecondary,
    lineHeight: scale(18),
    marginBottom: scale(12),
  },
  backupFieldLabel: {
    fontSize: scale(13),
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: scale(8),
  },
  freqRow: {
    flexDirection: 'row',
    gap: scale(8),
    marginBottom: scale(16),
  },
  freqChip: {
    flex: 1,
    paddingVertical: scale(9),
    paddingHorizontal: scale(6),
    borderRadius: theme.roundness.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceBlush,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freqChipActive: {
    backgroundColor: theme.colors.sunset,
    borderColor: theme.colors.sunset,
    ...theme.shadows.hardSm,
  },
  freqChipText: {
    fontSize: scale(12),
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  freqChipTextActive: {
    color: theme.colors.text,
    fontWeight: '800',
  },
  backupBtn: {
    backgroundColor: theme.colors.secondary,
  },
  dangerHeading: {
    fontSize: scale(13),
    fontWeight: '800',
    color: theme.colors.danger,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: scale(16),
    marginBottom: scale(8),
    marginLeft: scale(4),
  },
  dangerCard: {
    padding: scale(18),
    marginBottom: scale(16),
    backgroundColor: theme.colors.surfaceBlush,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  dangerRow: {
    flexDirection: 'row',
    gap: scale(12),
    marginBottom: scale(14),
    alignItems: 'flex-start',
  },
  dangerIcon: {
    fontSize: scale(24),
  },
  dangerTextCol: {
    flex: 1,
  },
  dangerTitle: {
    fontSize: scale(15),
    fontWeight: '800',
    color: theme.colors.danger,
    marginBottom: scale(4),
  },
  dangerSub: {
    fontSize: scale(13),
    color: theme.colors.primaryPressed,
    lineHeight: scale(18),
  },
  dangerBtn: {
    borderColor: theme.colors.danger,
    backgroundColor: '#FFFFFF',
  },
  dangerBtnText: {
    color: theme.colors.danger,
    fontWeight: '700',
  },
  signOutBtn: {
    marginTop: scale(16),
  },
  settingSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scale(10),
  },
  settingSwitchRowDivider: {
    marginTop: scale(6),
    paddingTop: scale(14),
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  settingSwitchLabel: {
    fontSize: scale(15),
    fontWeight: '600',
    color: theme.colors.text,
  },
  fieldHintInline: {
    fontSize: scale(12),
    color: theme.colors.textMuted,
    marginTop: scale(2),
  },
  quietTimeRow: {
    flexDirection: 'row',
    gap: scale(10),
    marginTop: scale(10),
  },
  quietTimeBtn: {
    flex: 1,
  },
  lastBackupText: {
    fontSize: scale(12),
    color: theme.colors.textSecondary,
    marginTop: scale(8),
  },
  iosModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(43, 33, 24, 0.45)',
    justifyContent: 'flex-end',
  },
  iosPickerContainer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    paddingBottom: scale(24),
  },
  iosToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  iosCancelText: {
    fontSize: scale(15),
    color: theme.colors.textSecondary,
  },
  iosConfirmText: {
    fontSize: scale(15),
    fontWeight: '700',
    color: theme.colors.primary,
  },
});

