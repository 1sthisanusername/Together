import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useActiveCouple,
  CreateCoupleCard,
  InvitePartnerCard,
  JoinCoupleCard,
  UnlinkCoupleDialog,
} from '@/features/couple';
import { useAuthStore } from '@/features/auth';
import { LoadingState, ErrorState, Avatar, Button, Card } from '@/shared/ui';
import { theme } from '@/shared/theme';

export default function PairScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { session, user, isInitialized, signOut } = useAuthStore();
  const { data: coupleData, isLoading, error, refetch } = useActiveCouple();
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);

  React.useEffect(() => {
    if (isInitialized && (!session || !user)) {
      router.replace('/(auth)/login');
    }
  }, [isInitialized, session, user, router]);

  if (!isInitialized || !session || !user || isLoading) {
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

  // State 1: Both partners linked
  if (coupleData?.isComplete && coupleData.partner) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
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

            <Button
              title={t('couple.goToHome')}
              variant="primary"
              size="lg"
              onPress={() => router.replace('/(tabs)/home')}
              style={styles.enterHomeButton}
            />

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
            onPress={signOut}
            style={styles.signOutButton}
          />

          <UnlinkCoupleDialog
            visible={showUnlinkModal}
            onClose={() => setShowUnlinkModal(false)}
            onSuccess={() => refetch()}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // State 2: Couple created, waiting for partner
  if (coupleData?.pendingInvite) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <InvitePartnerCard
            code={coupleData.pendingInvite.code}
            expiresAt={coupleData.pendingInvite.expires_at}
          />

          <Button
            title={t('couple.unlinkTitle')}
            variant="ghost"
            size="sm"
            onPress={() => setShowUnlinkModal(true)}
            style={styles.cancelCoupleButton}
          />

          <Button
            title={t('auth.signOut')}
            variant="ghost"
            size="md"
            onPress={signOut}
            style={styles.signOutButton}
          />

          <UnlinkCoupleDialog
            visible={showUnlinkModal}
            onClose={() => setShowUnlinkModal(false)}
            onSuccess={() => refetch()}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // State 3: No couple yet -> Choose between Create or Join
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>{t('couple.pairTitle')}</Text>
          <Text style={styles.subtitle}>{t('couple.pairSubtitle')}</Text>
        </View>

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
          onPress={signOut}
          style={styles.signOutButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background, // #f7f9f6
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text, // #42362e
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary, // #a8917f
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceSubtle, // #f0ece6
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentActive: {
    backgroundColor: theme.colors.surface, // #ffffff
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary, // #a8917f
  },
  segmentTextActive: {
    color: theme.colors.text, // #42362e
    fontWeight: '700',
  },
  connectedCard: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderLight,
  },
  connectedBadge: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.success,
    backgroundColor: theme.colors.successLight,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 20,
  },
  partnerName: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text, // #42362e
    marginTop: 14,
    marginBottom: 6,
  },
  connectedSubtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  enterHomeButton: {
    width: '100%',
    marginBottom: 12,
  },
  unlinkButton: {
    borderColor: theme.colors.danger,
  },
  cancelCoupleButton: {
    marginTop: 16,
  },
  signOutButton: {
    marginTop: 24,
  },
});

