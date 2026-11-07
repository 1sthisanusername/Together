import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input } from '@/shared/ui';
import { useAuthStore } from '@/features/auth';
import { useUnlinkCouple, UnlinkCoupleDialog } from '@/features/couple';
import { useUpdateProfile } from '../hooks/useSettings';

export const SettingsView: React.FC = () => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const signOut = useAuthStore((state) => state.signOut);

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [timeZone, setTimeZone] = useState(profile?.timezone || 'UTC');
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);

  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();

  const handleSaveProfile = () => {
    updateProfile({
      displayName: displayName.trim(),
      timeZone: timeZone.trim(),
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionHeading}>{t('settings.accountSection')}</Text>
      <Card style={styles.card}>
        <Input
          label={t('settings.displayName')}
          value={displayName}
          onChangeText={setDisplayName}
        />
        <Input
          label={t('settings.timeZone')}
          value={timeZone}
          onChangeText={setTimeZone}
        />
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
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    padding: 20,
    marginBottom: 16,
  },
  saveBtn: {
    marginTop: 8,
  },
  unlinkBtn: {
    borderColor: '#EF4444',
  },
  signOutBtn: {
    marginTop: 16,
  },
});

