import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../hooks/useSession';
import { getActivityRenderer } from '@/features/activities/registry';
import { LoadingState, ErrorState } from '@/shared/ui';

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
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  exitBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  exitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  liveIndicator: {
    paddingHorizontal: 10,
  },
  liveDot: {
    color: '#10B981',
    fontSize: 18,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
});

