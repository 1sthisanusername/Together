import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useBucketItems,
  useImportantDates,
  NextReunionCountdownCard,
  BucketListCard,
  ImportantDatesList,
} from '@/features/us';
import { useHomeData } from '@/features/home';
import { LoadingState, ErrorState } from '@/shared/ui';

export default function UsScreen() {
  const { t } = useTranslation();
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
        <Text style={styles.title}>{t('us.title')}</Text>
        <Text style={styles.subtitle}>{t('us.subtitle')}</Text>
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
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={false} onRefresh={handleRefresh} />}
        >
          {/* Next Reunion Countdown */}
          <NextReunionCountdownCard
            nextMeeting={homeData?.nextMeeting ?? null}
            daysRemaining={homeData?.daysToNextMeeting ?? null}
          />

          {/* Shared Bucket List */}
          <BucketListCard items={bucketItems ?? []} />

          {/* Important Dates */}
          <ImportantDatesList dates={importantDates ?? []} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
});

