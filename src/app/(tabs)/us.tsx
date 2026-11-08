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
import { LoadingState, ErrorState } from '@/shared/ui';
import { theme, scale } from '@/shared/theme';

export default function UsScreen() {
  const { t } = useTranslation();
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
      <View style={styles.header}>
        <Text style={styles.title} maxFontSizeMultiplier={1.35}>
          {t('us.title')}
        </Text>
        <Text style={styles.subtitle} maxFontSizeMultiplier={1.35}>
          {t('us.subtitle')}
        </Text>
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
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={false} onRefresh={handleRefresh} />}
        >
          <CoupleProfileCard />

          {homeData?.nextMeeting ? (
            <NextReunionCountdownCard
              nextMeeting={homeData.nextMeeting}
              daysRemaining={homeData.daysToNextMeeting}
            />
          ) : null}

          <ImportantDatesList dates={importantDates || []} />

          <BucketListCard items={bucketItems || []} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: scale(20),
    paddingTop: scale(16),
    paddingBottom: scale(14),
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: scale(26),
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: scale(4),
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: scale(14),
    color: theme.colors.textSecondary,
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingVertical: scale(16),
  },
});
