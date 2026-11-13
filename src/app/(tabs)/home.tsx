import React, { useState, useEffect } from 'react';
import { View, StyleSheet, RefreshControl, TouchableOpacity, Text, Modal } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import {
  CoupleHeader,
  HomePagePhotoCard,
  TimeZoneClockCard,
  ActiveSessionBanner,
  QuickActions,
  DailyQuestionCard,
  QuickPhotosCard,
  useHomeData,
  usePresence,
} from '@/features/home';
import { useActiveCouple } from '@/features/couple';
import { PartnerNamePromptCard } from '@/features/couple';
import { useAuthStore } from '@/features/auth';
import { useUpdateProfile } from '@/features/settings/hooks/useSettings';
import { safeSecureStore as SecureStore } from '@/shared/utils';
// Letter modals replaced by full-screen routes: /letter/write and /letter/read/[id]
import { NextReunionCountdownCard } from '@/features/us';
import { useUnreadNotificationsCount } from '@/features/notifications';
import {
  LoadingState,
  ErrorState,
  SwipeTabWrapper,
  ResponsiveContainer,
  BellIcon,
  ChatIcon,
  GearIcon,
  StaggeredList,
} from '@/shared/ui';
import { theme, scale, useResponsiveLayout, triggerHaptic } from '@/shared/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const { data: coupleData, isLoading: isCoupleLoading } = useActiveCouple();
  const { data: homeData, isLoading: isHomeLoading, error, refetch } = useHomeData();
  const { isPartnerOnline } = usePresence();
  const { data: unreadNotifsCount = 0 } = useUnreadNotificationsCount();

  // Letter navigation handled via full-screen routes (no modal state needed)
  const [showPickPartnerName, setShowPickPartnerName] = useState(false);
  const { mutateAsync: updateProfile } = useUpdateProfile();

  const partnerId = coupleData?.partner?.id;
  const coupleId = coupleData?.couple?.id;

  useEffect(() => {
    if (!coupleId || !partnerId) return;
    const partnerChooseKey = `let_partner_choose_${coupleId}_${partnerId}`;
    const promptDismissedKey = `partner_name_prompt_dismissed_${coupleId}_${partnerId}`;

    Promise.all([
      SecureStore.getItemAsync(partnerChooseKey),
      SecureStore.getItemAsync(promptDismissedKey),
    ]).then(([letChoose, dismissed]) => {
      if (letChoose === 'true' && !dismissed) {
        setShowPickPartnerName(true);
      }
    }).catch(() => {});
  }, [coupleId, partnerId]);

  const handleSavePartnerNickname = async (chosenName: string) => {
    if (!coupleId || !partnerId) return;
    try {
      await SecureStore.setItemAsync(
        `partner_name_prompt_dismissed_${coupleId}_${partnerId}`,
        'true'
      );
      // Clean up the let-choose flag so prompt never reappears
      await SecureStore.deleteItemAsync(`let_partner_choose_${coupleId}_${partnerId}`);
      setShowPickPartnerName(false);
      refetch();
    } catch {
      setShowPickPartnerName(false);
    }
  };

  const handleDismissPartnerNickname = async () => {
    if (!coupleId || !partnerId) return;
    await SecureStore.setItemAsync(
      `partner_name_prompt_dismissed_${coupleId}_${partnerId}`,
      'true'
    );
    setShowPickPartnerName(false);
  };

  const isInitialLoading = (isCoupleLoading || isHomeLoading) && (!homeData || !coupleData);

  const partnerName = coupleData?.partner?.display_name || 'Partner';

  const isSessionFresh =
    !!homeData?.activeSession?.created_at &&
    Date.now() - new Date(homeData.activeSession.created_at).getTime() < 30 * 60 * 1000;

  const shouldShowActiveSession =
    !!homeData?.activeSession && isPartnerOnline && isSessionFresh;

  const { horizontalGutter, sectionGap, s } = useResponsiveLayout();
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
      <SwipeTabWrapper currentTab="home">
        {/* Playful Top Bar with Chunky Sticker Badges */}
      <ResponsiveContainer style={[styles.topBar, { paddingHorizontal: horizontalGutter }]}>
        <View style={styles.brandContainer}>
          <Text style={[styles.brandTitle, { fontSize: s(24) }]}>Together</Text>
          <View style={styles.brandDot} />
        </View>

        <View style={styles.topBarActions}>
          {/* Notifications Button */}
          <TouchableOpacity
            style={styles.actionBtnSurface}
            onPress={() => {
              triggerHaptic('light');
              router.push('/notifications');
            }}
            activeOpacity={0.8} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={`Notifications, ${unreadNotifsCount} unread`}
          >
            <BellIcon color={theme.colors.text} size={scale(20)} />
            {unreadNotifsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadNotifsCount > 99 ? '99+' : unreadNotifsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Chat Button */}
          <TouchableOpacity
            style={styles.actionBtnSurface}
            onPress={() => {
              triggerHaptic('light');
              router.push('/chat');
            }}
            activeOpacity={0.8} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Messages"
          >
            <ChatIcon color={theme.colors.text} size={scale(20)} />
          </TouchableOpacity>

          {/* Settings Button */}
          <TouchableOpacity
            style={styles.actionBtnSurface}
            onPress={() => {
              triggerHaptic('light');
              router.push('/settings');
            }}
            activeOpacity={0.8} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Settings"
          >
            <GearIcon color={theme.colors.text} size={scale(20)} />
          </TouchableOpacity>
        </View>
      </ResponsiveContainer>

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
        <KeyboardAwareScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: horizontalGutter, paddingBottom: bottomPadding },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          bottomOffset={scale(32)}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={false} onRefresh={() => { refetch(); }} />}
        >
          <ResponsiveContainer style={{ gap: sectionGap }}>
            {/* One-time prompt: Pick a nickname for partner if they chose 'let my partner choose' */}
            {showPickPartnerName && (
              <Modal
                visible={true}
                transparent={true}
                animationType="fade"
                onRequestClose={handleDismissPartnerNickname}
                accessibilityViewIsModal={true}
              >
                <View style={styles.modalBackdrop} accessible={true} accessibilityLabel="Partner nickname prompt">
                  <PartnerNamePromptCard
                    partnerName={partnerName}
                    onSave={handleSavePartnerNickname}
                    onDismiss={handleDismissPartnerNickname}
                  />
                </View>
              </Modal>
            )}

            <StaggeredList baseDelay={80} staggerGap={55}>
              {/* 1. Header (Both Names + Duration) */}
              <CoupleHeader
                coupleName={homeData.coupleName}
                me={profile}
                partner={coupleData.partner}
                daysTogether={homeData.daysTogether}
                startDate={homeData.startDate}
                isPartnerOnline={isPartnerOnline}
              />

              {/* 2. Shared Couple Home Page Cover Photo */}
              <HomePagePhotoCard partnerName={partnerName} />

              {/* 3. Activity Indicator: only when partner is actively online and session is fresh */}
              {shouldShowActiveSession && (
                <ActiveSessionBanner
                  onJoin={() => router.push(`/session/${homeData.activeSession!.id}`)}
                />
              )}

              {/* 3. Daily Question Prompt Card */}
              <DailyQuestionCard partnerName={partnerName} />

              {/* 4. Quick Photos Polaroid Carousel */}
              <QuickPhotosCard />

              {/* 5. TimeZone Sticker Clock */}
              <TimeZoneClockCard
                partnerName={partnerName}
                myTimeInfo={homeData.myTimeInfo}
                partnerTimeInfo={homeData.partnerTimeInfo}
                timeDifferenceHours={homeData.timeDifferenceHours}
              />

              {/* 6. Reunion Countdown Card */}
              {homeData.nextMeeting && (
                <NextReunionCountdownCard
                  nextMeeting={homeData.nextMeeting}
                  daysRemaining={homeData.daysToNextMeeting}
                />
              )}

              {/* 7. Quick Actions Sticker Cards */}
              <QuickActions
                onPlayPress={() => router.push('/(tabs)/play')}
                onDatePress={() => router.push('/(tabs)/memories')}
                onLetterPress={() => router.push('/letter/write')}
              />
            </StaggeredList>
          </ResponsiveContainer>
        </KeyboardAwareScrollView>
      )}
      </SwipeTabWrapper>
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
    borderRadius: 9999,
    backgroundColor: theme.colors.primary, // Amour Red #E53935
    marginTop: scale(4),
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  actionBtnSurface: {
    position: 'relative',
    width: scale(42),
    height: scale(42),
    borderRadius: 9999,
    backgroundColor: theme.colors.surfaceBlush, // #FFF0ED
    borderWidth: 1,
    borderColor: theme.colors.border, // #FBE9E7
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hardSm,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.primary, // Amour Red #E53935
    borderRadius: 9999,
    minWidth: scale(18),
    height: scale(18),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(4),
    borderWidth: 1.5,
    borderColor: theme.colors.background,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(20),
  },
});
