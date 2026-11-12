import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import {
  useBucketItems,
  useImportantDates,
  NextReunionCountdownCard,
  BucketListCard,
  ImportantDatesList,
  CoupleProfileCard,
} from '@/features/us';
import { useHomeData } from '@/features/home';
import { LoadingState, ErrorState, SwipeTabWrapper, ResponsiveContainer } from '@/shared/ui';
import { theme, scale, useResponsiveLayout } from '@/shared/theme';

export default function UsScreen() {
  const { t } = useTranslation();
  const { horizontalGutter, sectionGap, s } = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  let tabBarHeight = 56;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    tabBarHeight = useBottomTabBarHeight();
  } catch {
    tabBarHeight = 56;
  }
  const bottomPadding = tabBarHeight + insets.bottom + 16;

  const { data: homeData, isLoading: isHomeLoading } = useHomeData();
  const { data: bucketItems, isLoading: isBucketLoading, refetch: refetchBucket } = useBucketItems();
  const { data: importantDates, isLoading: isDatesLoading, refetch: refetchDates, error } = useImportantDates();

  const handleRefresh = () => {
    refetchBucket();
    refetchDates();
  };

  const isLoading = isHomeLoading || isBucketLoading || isDatesLoading;

  return (
    <SafeAreaView style={styles.safeArea}>
      <SwipeTabWrapper currentTab="us">
        <View style={styles.header}>
          <ResponsiveContainer style={{ paddingHorizontal: horizontalGutter }}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { fontSize: s(26) }]} maxFontSizeMultiplier={1.35}>
                {t('us.title')}
              </Text>
              <View style={styles.titleDot} />
            </View>
            <Text style={styles.subtitle} maxFontSizeMultiplier={1.35}>
              {t('us.subtitle')}
            </Text>
          </ResponsiveContainer>
        </View>

        {isLoading ? (
          <LoadingState message={t('common.loading')} />
        ) : error ? (
          <ErrorState
            title={t('common.errorTitle')}
            message={error.message}
            onRetry={handleRefresh}
            retryTitle={t('common.retry')}
          />
        ) : (
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingHorizontal: horizontalGutter, paddingBottom: bottomPadding },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={false} onRefresh={handleRefresh} />}
          >
            <ResponsiveContainer style={{ gap: sectionGap }}>
              <CoupleProfileCard />

              {homeData?.nextMeeting ? (
                <NextReunionCountdownCard
                  nextMeeting={homeData.nextMeeting}
                  daysRemaining={homeData.daysToNextMeeting}
                />
              ) : null}

              <ImportantDatesList dates={importantDates || []} />

              <BucketListCard items={bucketItems || []} />
            </ResponsiveContainer>
          </ScrollView>
        )}
      </SwipeTabWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: scale(14),
    paddingBottom: scale(14),
    backgroundColor: theme.colors.surfaceSubtle, // #FFF0ED
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border, // #FBE9E7
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(5),
    marginBottom: scale(4),
  },
  title: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(26),
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  titleDot: {
    width: scale(7),
    height: scale(7),
    borderRadius: scale(3.5),
    backgroundColor: theme.colors.primary,
    marginTop: scale(4),
  },
  subtitle: {
    fontFamily: theme.typography.families.body,
    fontSize: scale(14),
    color: theme.colors.textSecondary,
  },
  scrollContent: {
    paddingVertical: scale(16),
  },
});
