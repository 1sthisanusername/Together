import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../hooks/useSession';
import { getActivityRenderer } from '@/features/activities/registry';
import { LoadingState, ErrorState } from '@/shared/ui';
import { theme } from '@/shared/theme';

export interface ActivityRoomProps {
  sessionId: string;
  onExit: () => void;
  partnerName: string;
}

export const ActivityRoom: React.FC<ActivityRoomProps> = ({
  sessionId,
  onExit,
  partnerName,
}) => {
  const { t } = useTranslation();
  const { data: sessionData, isLoading, error, refetch } = useSession(sessionId);

  // Find latest round_advanced event to display synchronised banner
  const latestAdvanceEvent = useMemo(() => {
    if (!sessionData?.events) return null;
    return [...sessionData.events]
      .reverse()
      .find((e) => e.type === 'round_advanced');
  }, [sessionData?.events]);

  const advanceBannerText = useMemo(() => {
    if (!latestAdvanceEvent || !sessionData?.session) return null;
    const payload = latestAdvanceEvent.payload as any;
    if (payload?.to_round === sessionData.session.current_round) {
      const moverName =
        payload?.by_name ||
        (latestAdvanceEvent.user_id === sessionData.myUserId ? 'You' : partnerName);
      return `${moverName} moved to round ${payload?.to_round}`;
    }
    return null;
  }, [latestAdvanceEvent, sessionData?.session?.current_round, sessionData?.myUserId, partnerName]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState message={t('common.loading')} />
      </SafeAreaView>
    );
  }

  if (error || !sessionData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          title={t('common.errorTitle')}
          message={error?.message || 'Unable to load room'}
          onRetry={refetch}
          retryTitle={t('common.retry')}
        />
      </SafeAreaView>
    );
  }

  const { Component } = getActivityRenderer(sessionData.activity.kind);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onExit} style={styles.exitBtn}>
          <Text style={styles.exitText}>✕ {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {sessionData.activity.title}
        </Text>
        <View style={styles.liveIndicator}>
          <Text style={styles.liveDot}>●</Text>
        </View>
      </View>

      {/* Synchronized Server Round Banner */}
      {advanceBannerText ? (
        <View style={styles.advanceBanner}>
          <Text style={styles.advanceBannerIcon}>🔔</Text>
          <Text style={styles.advanceBannerText}>{advanceBannerText}</Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Component
          data={sessionData}
          partnerName={partnerName}
          onFinish={onExit}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  exitBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  exitText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  liveIndicator: {
    paddingHorizontal: 10,
  },
  liveDot: {
    color: theme.colors.success || '#10B981',
    fontSize: 18,
  },
  advanceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF5F2',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    paddingVertical: 9,
    paddingHorizontal: 16,
    gap: 8,
  },
  advanceBannerIcon: {
    fontSize: 14,
  },
  advanceBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
});

