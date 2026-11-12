import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useActiveCouple,
  useUpdateStartDate,
  usePartnerUnlinkStore,
  CreateCoupleCard,
  InvitePartnerCard,
  JoinCoupleCard,
  UnlinkCoupleDialog,
  OnboardingNicknameCard,
  RestoreBackupPromptCard,
} from '@/features/couple';
import { useAuthStore, OnboardingWalkthrough } from '@/features/auth';
import { useUpdateProfile } from '@/features/settings/hooks/useSettings';
import { restoreBackupArchive, validateCoupleBackupArchive } from '@/features/settings/services/googleDriveBackup';
import { safeSecureStore as SecureStore } from '@/shared/utils';
import { LoadingState, ErrorState, Avatar, Button, Card, KeyboardScreen, DatePickerField } from '@/shared/ui';
import { theme, scale, triggerHaptic } from '@/shared/theme';

const NICKNAME_SET_PREFIX = 'together_nickname_configured_';
const RESTORE_PROMPTED_PREFIX = 'together_restore_prompted_';

export default function PairScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { signOut, user, profile } = useAuthStore();
  const { data: coupleData, isLoading, error, refetch } = useActiveCouple();
  const { mutate: updateStartDate, isPending: isUpdatingDate } = useUpdateStartDate();
  const { mutateAsync: updateProfile, isPending: isUpdatingProfile } = useUpdateProfile();
  const { unlinkedMessage, clearUnlinkedMessage } = usePartnerUnlinkStore();

  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [annivInput, setAnnivInput] = useState('');
  const [annivError, setAnnivError] = useState<string | null>(null);

  // Dedicated Nickname Step State
  const [hasSetNickname, setHasSetNickname] = useState<boolean | null>(null);

  // Backup restore check state
  const [discoveredBackup, setDiscoveredBackup] = useState<{
    archive: any;
    date: string;
    size: string;
  } | null>(null);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);

  const userId = user?.id || '';

  // 1. Check if user already configured their nickname
  useEffect(() => {
    if (!userId) return;
    SecureStore.getItemAsync(`${NICKNAME_SET_PREFIX}${userId}`)
      .then((val) => {
        setHasSetNickname(val === 'true');
      })
      .catch(() => setHasSetNickname(true));
  }, [userId]);

  // 2. First sign-in device backup discovery
  useEffect(() => {
    if (!userId) return;
    SecureStore.getItemAsync(`${RESTORE_PROMPTED_PREFIX}${userId}`).then((prompted) => {
      if (prompted) return;
      // Probe Google Drive appdata / local backup cache
      try {
        import('expo-file-system/legacy').then((FileSystem) => {
          if (!FileSystem.documentDirectory) return;
          FileSystem.readDirectoryAsync(FileSystem.documentDirectory)
            .then(async (files) => {
              const backupFile = files.find(
                (f) => f.includes('together_couple_') && f.endsWith('.json')
              );
              if (backupFile) {
                const content = await FileSystem.readAsStringAsync(
                  `${FileSystem.documentDirectory}${backupFile}`
                );
                const validated = validateCoupleBackupArchive(content);
                const info = await FileSystem.getInfoAsync(
                  `${FileSystem.documentDirectory}${backupFile}`
                );
                const formattedDate = validated.exportedAt
                  ? new Date(validated.exportedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Recent';
                const formattedSize = `${Math.round(((info as any).size || content.length) / 1024)} KB`;
                setDiscoveredBackup({
                  archive: validated,
                  date: formattedDate,
                  size: formattedSize,
                });
              }
            })
            .catch(() => {});
        });
      } catch {
        // Fallback
      }
    });
  }, [userId]);

  const handleConfirmNickname = async (nickname: string, letPartnerChoose: boolean) => {
    try {
      await updateProfile({ displayName: nickname });
      if (letPartnerChoose && coupleData?.couple?.id) {
        // Record let_partner_choose flag in couple metadata if applicable
        await SecureStore.setItemAsync(
          `let_partner_choose_${coupleData.couple.id}_${userId}`,
          'true'
        );
      }
      await SecureStore.setItemAsync(`${NICKNAME_SET_PREFIX}${userId}`, 'true');
      setHasSetNickname(true);
    } catch {
      // Handled
    }
  };

  const handleRestoreBackup = async () => {
    if (!discoveredBackup || !coupleData?.couple?.id) return;
    try {
      setIsRestoringBackup(true);
      await restoreBackupArchive(discoveredBackup.archive, coupleData.couple.id);
      setIsRestoringBackup(false);
      await SecureStore.setItemAsync(`${RESTORE_PROMPTED_PREFIX}${userId}`, 'true');
      setDiscoveredBackup(null);
      triggerHaptic('success');
      Alert.alert('Space Restored! ☁️', 'Your letters, memories, and dreams have been safely restored.');
    } catch (err: any) {
      setIsRestoringBackup(false);
      Alert.alert('Restore Failed', err.message || 'Could not restore backup.');
    }
  };

  const handleSkipRestore = async () => {
    await SecureStore.setItemAsync(`${RESTORE_PROMPTED_PREFIX}${userId}`, 'true');
    setDiscoveredBackup(null);
  };

  if (isLoading || hasSetNickname === null) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState message={t('common.loading')} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title={t('common.errorTitle')}
          message={error.message}
          onRetry={refetch}
          retryTitle={t('common.retry')}
        />
      </SafeAreaView>
    );
  }

  const coupleState = coupleData?.state || 'NO_COUPLE';

  const handleSignOut = async () => {
    try {
      triggerHaptic('medium');
      await signOut();
      router.replace('/(auth)/login');
    } catch {
      router.replace('/(auth)/login');
    }
  };

  const handleSaveAnniversary = () => {
    setAnnivError(null);
    const today = new Date().toISOString().split('T')[0];
    if (annivInput.trim() > today) {
      setAnnivError('Anniversary date cannot be in the future');
      return;
    }

    updateStartDate(annivInput.trim(), {
      onSuccess: () => {
        router.replace('/(tabs)/home');
      },
      onError: (err: any) => {
        setAnnivError(err.message || 'Failed to save date');
      },
    });
  };

  // Google first name extraction
  const googleFullName = user?.user_metadata?.full_name || user?.user_metadata?.name || '';
  const googleFirstName = googleFullName.split(' ')[0] || user?.email?.split('@')[0] || 'Friend';

  // Dedicated Nickname Step (runs before pairing on fresh sign-in)
  if (!hasSetNickname) {
    return (
      <KeyboardScreen contentContainerStyle={styles.scrollContent}>
        <OnboardingNicknameCard
          initialGoogleName={googleFirstName}
          onConfirm={handleConfirmNickname}
          isLoading={isUpdatingProfile}
        />
        <Button
          title={t('auth.signOut')}
          variant="ghost"
          size="sm"
          onPress={handleSignOut}
          style={styles.signOutButton}
        />
      </KeyboardScreen>
    );
  }

  // 1. ACTIVE: 2 members linked
  if (coupleState === 'ACTIVE' && coupleData?.partner) {
    const hasStartDate = !!coupleData.couple?.start_date;

    return (
      <KeyboardScreen contentContainerStyle={styles.scrollContent}>
        {/* Optional Google Drive restore prompt on first device sign in */}
        {discoveredBackup ? (
          <RestoreBackupPromptCard
            backupDate={discoveredBackup.date}
            backupSize={discoveredBackup.size}
            onRestore={handleRestoreBackup}
            onSkip={handleSkipRestore}
            isLoading={isRestoringBackup}
          />
        ) : null}

        <Card style={styles.connectedCard}>
          <Text style={styles.connectedBadge}>✓ {t('couple.linkedSuccessTitle')}</Text>
          <Avatar
            name={coupleData.partner.display_name || 'Partner'}
            url={coupleData.partner.avatar_url}
            size={72}
          />
          <Text style={styles.partnerName}>
            {coupleData.partner.display_name || 'Partner'}
          </Text>
          <Text style={styles.connectedSubtitle}>{t('couple.linkedSuccessSubtitle')}</Text>

          {/* Onboarding step: Optional anniversary date prompt (Once for new couples only) */}
          {!hasStartDate ? (
            <View style={styles.annivPromptBox}>
              <Text style={styles.annivPromptIcon}>💕</Text>
              <Text style={styles.annivPromptTitle}>When did you two get together?</Text>
              <Text style={styles.annivPromptSubtitle}>
                Add your anniversary to celebrate milestones and count your days together. (Optional)
              </Text>

              <DatePickerField
                placeholder="Select anniversary date"
                value={annivInput}
                maxDate={new Date()}
                onChange={(val) => {
                  setAnnivInput(val);
                  setAnnivError(null);
                }}
              />
              {annivError && <Text style={{ color: '#ef4444', fontSize: 12, marginTop: -8, marginBottom: 8 }}>{annivError}</Text>}

              <Button
                title="Save Anniversary Date"
                variant="primary"
                size="md"
                loading={isUpdatingDate}
                disabled={!annivInput.trim() || isUpdatingDate}
                onPress={handleSaveAnniversary}
                style={{ width: '100%', marginTop: 8 }}
              />

              <Button
                title="Skip for now"
                variant="ghost"
                size="sm"
                onPress={() => router.replace('/(tabs)/home')}
                style={{ marginTop: 6 }}
              />
            </View>
          ) : (
            <Button
              title={t('couple.goToHome')}
              variant="primary"
              size="lg"
              onPress={() => router.replace('/(tabs)/home')}
              style={{ width: '100%', marginTop: 14 }}
            />
          )}

          <Button
            title={t('couple.unlinkTitle')}
            variant="ghost"
            size="sm"
            onPress={() => setShowUnlinkModal(true)}
            style={styles.unlinkButton}
          />
        </Card>

        <Button
          title={t('auth.signOut')}
          variant="ghost"
          size="md"
          onPress={handleSignOut}
          style={styles.signOutButton}
        />

        <UnlinkCoupleDialog
          visible={showUnlinkModal}
          onClose={() => setShowUnlinkModal(false)}
          onSuccess={() => refetch()}
        />
      </KeyboardScreen>
    );
  }

  // 2. PENDING: Couple exists, only 1 active member -> "Waiting for partner" screen
  if (coupleState === 'PENDING' && coupleData?.pendingInvite) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {unlinkedMessage ? (
            <View style={styles.unlinkedBanner}>
              <Text style={styles.unlinkedBannerText}>ℹ️ {unlinkedMessage}</Text>
              <TouchableOpacity onPress={clearUnlinkedMessage} style={styles.dismissBtn}>
                <Text style={styles.dismissBtnText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <InvitePartnerCard
            code={coupleData.pendingInvite.code}
            expiresAt={coupleData.pendingInvite.expires_at}
            onCancel={() => setShowUnlinkModal(true)}
          />

          <Button
            title={t('auth.signOut')}
            variant="ghost"
            size="md"
            onPress={handleSignOut}
            style={styles.signOutButton}
          />

          <UnlinkCoupleDialog
            visible={showUnlinkModal}
            onClose={() => setShowUnlinkModal(false)}
            onSuccess={() => refetch()}
            isCancel={true}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 3. NO_COUPLE: "Create couple space / Enter invite code"
  return (
    <KeyboardScreen contentContainerStyle={styles.scrollContent}>
      {unlinkedMessage ? (
        <View style={styles.unlinkedBanner}>
          <Text style={styles.unlinkedBannerText}>ℹ️ {unlinkedMessage}</Text>
          <TouchableOpacity onPress={clearUnlinkedMessage} style={styles.dismissBtn}>
            <Text style={styles.dismissBtnText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.header}>
        <Text style={styles.title}>{t('couple.pairTitle')}</Text>
        <Text style={styles.subtitle}>{t('couple.pairSubtitle')}</Text>
      </View>

      <OnboardingWalkthrough />

      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[styles.segment, tab === 'create' && styles.segmentActive]}
          onPress={() => setTab('create')}
        >
          <Text style={[styles.segmentText, tab === 'create' && styles.segmentTextActive]}>
            {t('couple.createCouple')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segment, tab === 'join' && styles.segmentActive]}
          onPress={() => setTab('join')}
        >
          <Text style={[styles.segmentText, tab === 'join' && styles.segmentTextActive]}>
            {t('couple.joinButton')}
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'create' ? (
        <CreateCoupleCard onSuccess={() => refetch()} />
      ) : (
        <JoinCoupleCard onSuccess={() => refetch()} />
      )}

      <Button
        title={t('auth.signOut')}
        variant="ghost"
        size="md"
        onPress={handleSignOut}
        style={styles.signOutButton}
      />
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: scale(20),
    paddingVertical: scale(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlinkedBanner: {
    width: '100%',
    backgroundColor: theme.colors.surfaceBlush,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.roundness.lg,
    padding: scale(12),
    marginBottom: scale(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.card,
  },
  unlinkedBannerText: {
    fontSize: scale(14),
    color: theme.colors.primary,
    fontWeight: '600',
    flex: 1,
  },
  dismissBtn: {
    marginLeft: scale(12),
    paddingVertical: scale(5),
    paddingHorizontal: scale(10),
    borderRadius: theme.roundness.full,
    backgroundColor: theme.colors.surfaceDisabled,
  },
  dismissBtnText: {
    fontSize: scale(12),
    color: theme.colors.primary,
    fontWeight: '700',
  },
  header: {
    marginBottom: scale(24),
    alignItems: 'center',
  },
  title: {
    fontSize: scale(26),
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: scale(8),
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: scale(15),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: scale(22),
    paddingHorizontal: scale(16),
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.roundness.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: scale(4),
    marginBottom: scale(24),
    width: '100%',
  },
  segment: {
    flex: 1,
    paddingVertical: scale(10),
    alignItems: 'center',
    borderRadius: theme.roundness.full,
  },
  segmentActive: {
    backgroundColor: theme.colors.surface,
    ...theme.shadows.hardSm,
  },
  segmentText: {
    fontSize: scale(14),
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  segmentTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  connectedCard: {
    width: '100%',
    alignItems: 'center',
    padding: scale(24),
  },
  connectedBadge: {
    fontSize: scale(13),
    fontWeight: '700',
    color: theme.colors.primary,
    backgroundColor: theme.colors.surfaceSubtle,
    paddingVertical: scale(4),
    paddingHorizontal: scale(12),
    borderRadius: theme.roundness.full,
    marginBottom: scale(16),
    overflow: 'hidden',
  },
  partnerName: {
    fontSize: scale(22),
    fontWeight: '800',
    color: theme.colors.text,
    marginTop: scale(12),
    marginBottom: scale(6),
  },
  connectedSubtitle: {
    fontSize: scale(14),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: scale(20),
  },
  unlinkButton: {
    marginTop: scale(8),
  },
  annivPromptBox: {
    width: '100%',
    backgroundColor: theme.colors.surfaceBlush,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.lg,
    padding: scale(16),
    alignItems: 'center',
    marginVertical: scale(12),
  },
  annivPromptIcon: {
    fontSize: scale(26),
    marginBottom: scale(6),
  },
  annivPromptTitle: {
    fontSize: scale(16),
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: scale(4),
    textAlign: 'center',
  },
  annivPromptSubtitle: {
    fontSize: scale(12),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: scale(12),
    lineHeight: scale(18),
  },
  signOutButton: {
    marginTop: scale(20),
  },
});
