import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
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
import { useUnreadNotificationsCount } from '@/features/notifications';
import { LoadingState, ErrorState } from '@/shared/ui';
import { theme, scale, triggerHaptic } from '@/shared/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const { data: coupleData, isLoading: isCoupleLoading } = useActiveCouple();
  const { data: homeData, isLoading: isHomeLoading, error, refetch } = useHomeData();
  const { data: unreadNotifsCount = 0 } = useUnreadNotificationsCount();

  const [showLetterModal, setShowLetterModal] = useState(false);

  const isInitialLoading = (isCoupleLoading || isHomeLoading) && (!homeData || !coupleData);

  const partnerName = coupleData?.partner?.display_name || 'Partner';

  const insets = useSafeAreaInsets();
  let tabBarHeight = 56;
  try {
    tabBarHeight = useBottomTabBarHeight();
  } catch {
    tabBarHeight = 56;
  }
  const bottomPadding = tabBarHeight + insets.bottom + 16;

  const handleNav = (route: string) => {
    triggerHaptic('light');
    router.push(route as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Playful Top Bar with Chunky Sticker Badges */}
      <View style={styles.topBar}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>Together</Text>
          <View style={styles.brandDot} />
        </View>

        <View style={styles.topBarActions}>
          {/* Notifications Button */}
          <TouchableOpacity
            style={styles.actionBtnWrapper}
            onPress={() => {
              triggerHaptic('light');
              router.push('/notifications');
            }}
            activeOpacity={0.8}
            accessibilityLabel={`Notifications, ${unreadNotifsCount} unread`}
          >
            <View style={styles.actionBtnShadow} />
            <View style={styles.actionBtnSurface}>
              <Text style={styles.actionIcon}>🔔</Text>
              {unreadNotifsCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadNotifsCount > 99 ? '99+' : unreadNotifsCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Chat Button */}
          <TouchableOpacity
            style={styles.actionBtnWrapper}
            onPress={() => {
              triggerHaptic('light');
              router.push('/chat');
            }}
            activeOpacity={0.8}
            accessibilityLabel="Messages"
          >
            <View style={styles.actionBtnShadow} />
            <View style={styles.actionBtnSurface}>
              <Text style={styles.actionIcon}>💬</Text>
            </View>
          </TouchableOpacity>

          {/* Settings Button */}
          <TouchableOpacity
            style={styles.actionBtnWrapper}
            onPress={() => {
              triggerHaptic('light');
              router.push('/settings');
            }}
            activeOpacity={0.8}
            accessibilityLabel="Settings"
          >
            <View style={styles.actionBtnShadow} />
            <View style={styles.actionBtnSurface}>
              <Text style={styles.actionIcon}>⚙️</Text>
            </View>
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
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={false} onRefresh={() => { refetch(); }} />}
        >
          {/* Partner String Header (Slack when away, tight with wiggle when online) */}
          <CoupleHeader
            coupleName={homeData.coupleName}
            me={profile}
            partner={coupleData.partner}
            daysTogether={homeData.daysTogether}
            startDate={homeData.startDate}
          />

          {homeData.activeSession ? (
            <ActiveSessionBanner
              onJoin={() => router.push(`/session/${homeData.activeSession!.id}`)}
            />
          ) : null}

          {/* TimeZone Sticker Clock */}
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

          {/* Quick Actions Sticker Cards */}
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
    backgroundColor: theme.colors.background, // Paper #FFF4E3
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(18),
    paddingVertical: scale(12),
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
  },
  brandTitle: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(24),
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  brandDot: {
    width: scale(7),
    height: scale(7),
    borderRadius: scale(3.5),
    backgroundColor: theme.colors.primary, // Tomato #FF5A3C
    marginTop: scale(4),
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  actionBtnWrapper: {
    position: 'relative',
    marginRight: 2,
    marginBottom: 2,
  },
  actionBtnShadow: {
    position: 'absolute',
    top: 2.5,
    left: 2.5,
    right: -2.5,
    bottom: -2.5,
    backgroundColor: theme.colors.shadowInk,
    borderRadius: scale(12),
  },
  actionBtnSurface: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(12),
    backgroundColor: theme.colors.surface,
    borderWidth: theme.borders.chunky,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: scale(16),
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: theme.colors.primary, // Tomato #FF5A3C
    borderRadius: scale(10),
    minWidth: scale(18),
    height: scale(18),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(3),
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  badgeText: {
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(10),
    fontWeight: '800',
    lineHeight: scale(12),
  },
  scrollContent: {
    paddingHorizontal: scale(18),
    paddingBottom: scale(24),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(20),
  },
});
