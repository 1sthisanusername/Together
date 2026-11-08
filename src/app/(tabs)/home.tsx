import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CoupleHeader,
  TimeZoneClockCard,
  ActiveSessionBanner,
  QuickActions,
  useHomeData,
} from '@/features/home';
import { useActiveCouple } from '@/features/couple';
import { useAuthStore } from '@/features/auth';
import { WriteLetterModal } from '@/features/letters';
import { NextReunionCountdownCard } from '@/features/us';
import { LoadingState, ErrorState } from '@/shared/ui';
import { theme } from '@/shared/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const { data: coupleData, isLoading: isCoupleLoading } = useActiveCouple();
  const { data: homeData, isLoading: isHomeLoading, error, refetch } = useHomeData();

  const [showLetterModal, setShowLetterModal] = useState(false);

  const isInitialLoading = (isCoupleLoading || isHomeLoading) && (!homeData || !coupleData);

  const partnerName = coupleData?.partner?.display_name || 'Partner';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Text style={styles.brandTitle}>Together</Text>
        <View style={styles.topBarActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/chat')}
            accessibilityLabel="Messages"
          >
            <Text style={styles.actionIcon}>💬</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/settings')}
            accessibilityLabel="Settings"
          >
            <Text style={styles.actionIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isInitialLoading ? (
        <View style={styles.loadingContainer}>
          <LoadingState message={t('common.loading')} />
        </View>
      ) : error || !homeData || !coupleData ? (
        <ErrorState
          title={t('common.errorTitle')}
          message={error?.message || 'Unable to load space'}
          onRetry={refetch}
          retryTitle={t('common.retry')}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={false} onRefresh={() => { refetch(); }} />}
        >
          <CoupleHeader
            coupleName={homeData.coupleName}
            me={profile}
            partner={coupleData.partner}
            daysTogether={homeData.daysTogether}
          />

          {homeData.activeSession ? (
            <ActiveSessionBanner
              onJoin={() => router.push(`/session/${homeData.activeSession!.id}`)}
            />
          ) : null}

          <TimeZoneClockCard
            partnerName={partnerName}
            myTimeInfo={homeData.myTimeInfo}
            partnerTimeInfo={homeData.partnerTimeInfo}
            timeDifferenceHours={homeData.timeDifferenceHours}
          />

          {homeData.nextMeeting ? (
            <NextReunionCountdownCard
              nextMeeting={homeData.nextMeeting}
              daysRemaining={homeData.daysToNextMeeting}
            />
          ) : null}

          <QuickActions
            onPlayPress={() => router.push('/(tabs)/play')}
            onDatePress={() => router.push('/(tabs)/dates')}
            onLetterPress={() => setShowLetterModal(true)}
          />
        </ScrollView>
      )}

      <WriteLetterModal
        visible={showLetterModal}
        onClose={() => setShowLetterModal(false)}
        partnerName={partnerName}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background, // #f7f9f6
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text, // #42362e
    letterSpacing: -0.5,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  actionIcon: {
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
});
