import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useActiveCouple,
  usePartnerUnlinkStore,
  CreateCoupleCard,
  InvitePartnerCard,
  JoinCoupleCard,
  UnlinkCoupleDialog,
} from '@/features/couple';
import { useAuthStore, OnboardingWalkthrough } from '@/features/auth';
import { LoadingState, ErrorState, Avatar, Button, Card } from '@/shared/ui';
import { theme } from '@/shared/theme';

export default function PairScreen() {
  const { t } = useTranslation();
  const { signOut } = useAuthStore();
  const { data: coupleData, isLoading, error, refetch } = useActiveCouple();
  const { unlinkedMessage, clearUnlinkedMessage } = usePartnerUnlinkStore();

  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);

  if (isLoading) {
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

  // 1. ACTIVE: 2 members linked
  if (coupleState === 'ACTIVE' && coupleData?.partner) {
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
            onResend={() => refetch()}
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
            isCancel={true}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 3. NO_COUPLE: "Create couple space / Enter invite code"
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
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
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlinkedBanner: {
    width: '100%',
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unlinkedBannerText: {
    fontSize: 14,
    color: '#92400e',
    fontWeight: '600',
    flex: 1,
  },
  dismissBtn: {
    marginLeft: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#fef3c7',
  },
  dismissBtnText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '700',
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
    width: '100%',
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentActive: {
    backgroundColor: theme.colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
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
    padding: 24,
  },
  connectedBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
    backgroundColor: theme.colors.surfaceSubtle,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  partnerName: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    marginTop: 12,
    marginBottom: 6,
  },
  connectedSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  unlinkButton: {
    marginTop: 8,
  },
  signOutButton: {
    marginTop: 20,
  },
});
