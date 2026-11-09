import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input } from '@/shared/ui';
import { useAuthStore } from '@/features/auth';
import { useUnlinkCouple, UnlinkCoupleDialog, useActiveCouple } from '@/features/couple';
import { useUpdateProfile } from '../hooks/useSettings';
import { TimeZonePickerModal, getUtcOffsetString } from './TimeZonePickerModal';
import {
  createDualBackup,
  getBackupFrequency,
  setBackupFrequency,
  type BackupFrequency,
} from '../services/googleDriveBackup';
import { theme, triggerHaptic } from '@/shared/theme';

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
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);

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
        <Button
          title={t('settings.unlinkCouple')}
          variant="outline"
          size="md"
          onPress={() => setShowUnlinkModal(true)}
          style={styles.unlinkBtn}
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

      <Button
        title={t('settings.signOut')}
        variant="ghost"
        size="md"
        onPress={signOut}
        style={styles.signOutBtn}
      />

      <TimeZonePickerModal
        visible={showTimeZoneModal}
        selectedZone={timeZone}
        onClose={() => setShowTimeZoneModal(false)}
        onSelectZone={(selected) => setTimeZone(selected)}
      />

      <UnlinkCoupleDialog
        visible={showUnlinkModal}
        onClose={() => setShowUnlinkModal(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    padding: 20,
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderLight,
  },
  timeZoneField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  fieldHint: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: -8,
    marginBottom: 14,
    lineHeight: 16,
  },
  timeZonePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  timeZoneTextCol: {
    flex: 1,
    marginRight: 8,
  },
  timeZoneValue: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  timeZoneSub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  offsetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  offsetBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  saveBtn: {
    marginTop: 8,
  },
  vaultBtn: {
    marginBottom: 12,
  },
  backupSubtext: {
    fontSize: 13,
    color: '#5C4A3A',
    lineHeight: 18,
    marginBottom: 12,
  },
  backupFieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  freqRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  freqChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freqChipActive: {
    backgroundColor: '#FFC93C', // Sunshine accent
    borderColor: theme.colors.border,
    ...theme.shadows.hardSm,
  },
  freqChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  freqChipTextActive: {
    color: theme.colors.text,
    fontWeight: '800',
  },
  backupBtn: {
    backgroundColor: '#2EC4B6',
  },
  unlinkBtn: {
    borderColor: theme.colors.danger,
  },
  signOutBtn: {
    marginTop: 16,
  },
});

