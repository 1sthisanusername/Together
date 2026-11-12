import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input } from '@/shared/ui';
import { useAuthStore } from '@/features/auth';
import { useActiveCouple } from '@/features/couple';
import { useUpdateProfile } from '../hooks/useSettings';
import { TimeZonePickerModal, getUtcOffsetString } from './TimeZonePickerModal';
import {
  createDualBackup,
  getBackupFrequency,
  setBackupFrequency,
  type BackupFrequency,
} from '../services/googleDriveBackup';
import { theme, scale, triggerHaptic } from '@/shared/theme';

export const SettingsView: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const signOut = useAuthStore((state) => state.signOut);
  const { data: coupleData } = useActiveCouple();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupFrequency, setBackupFrequencyState] = useState<BackupFrequency>('weekly');

  useEffect(() => {
    getBackupFrequency().then((freq) => setBackupFrequencyState(freq));
  }, []);

  const handleSelectFrequency = async (freq: BackupFrequency) => {
    triggerHaptic('light');
    setBackupFrequencyState(freq);
    await setBackupFrequency(freq);
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
      const { individual, couple } = await createDualBackup(coupleData.couple.id, user.id);
      setIsBackingUp(false);
      triggerHaptic('success');
      Alert.alert(
        'Dual Backup Created! ☁️',
        `Successfully backed up:\n• Personal device preferences (${individual.archive.checksum})\n• Shared couple archive:\n  - ${couple.archive.stats.lettersCount} Letters\n  - ${couple.archive.stats.memoriesCount} Memories\n  - ${couple.archive.stats.vaultItemsCount} Vault Items\n  - ${couple.archive.stats.bucketItemsCount || 0} Bucket List Items\n\nChecksum: ${couple.archive.checksum}\nIsolated in Google Drive appdata.`
      );
    } catch {
      setIsBackingUp(false);
      Alert.alert('Backup Error', 'Could not create couple data archive.');
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
              <Text style={styles.timeZoneSub}>{timeZone}</Text>
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
          title="🔒 Open Private Vault"
          variant="primary"
          size="md"
          onPress={() => {
            triggerHaptic('medium');
            router.push('/vault');
          }}
          style={styles.vaultBtn}
        />
      </Card>

      <Text style={styles.sectionHeading}>Data & Cloud Backup</Text>
      <Card style={styles.card}>
        <Text style={styles.backupSubtext}>
          Export a complete, encrypted dual archive: your isolated personal settings and your shared couple data (letters, memories, bucket list, dates).
          Synchronizes with Google Drive appdata without polluting your main Drive files.
        </Text>

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
          title="Backup Now ☁️"
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
});

