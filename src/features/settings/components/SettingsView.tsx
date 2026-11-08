import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input } from '@/shared/ui';
import { useAuthStore } from '@/features/auth';
import { useUnlinkCouple, UnlinkCoupleDialog } from '@/features/couple';
import { useUpdateProfile } from '../hooks/useSettings';
import { TimeZonePickerModal, getUtcOffsetString } from './TimeZonePickerModal';
import { theme } from '@/shared/theme';

export const SettingsView: React.FC = () => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const signOut = useAuthStore((state) => state.signOut);

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
          title={t('settings.unlinkCouple')}
          variant="outline"
          size="md"
          onPress={() => setShowUnlinkModal(true)}
          style={styles.unlinkBtn}
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
  unlinkBtn: {
    borderColor: theme.colors.danger,
  },
  signOutBtn: {
    marginTop: 16,
  },
});

