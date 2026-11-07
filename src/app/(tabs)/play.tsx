import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useActivities, useStartActivity, ActivityCard } from '@/features/activities';
import { LoadingState, ErrorState } from '@/shared/ui';
import { theme } from '@/shared/theme';

export default function PlayScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'play' | 'deep_talk'>('all');

  const { data: activities, isLoading, error, refetch } = useActivities(
    filter === 'all' ? undefined : filter
  );
  const { mutateAsync: startActivity, isPending: isStarting } = useStartActivity();

  const handleStart = async (activityId: string) => {
    try {
      const session = await startActivity(activityId);
      router.push(`/session/${session.id}`);
    } catch {
      // Handled
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('activities.title')}</Text>
        <Text style={styles.subtitle}>{t('activities.subtitle')}</Text>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              {t('activities.tabAll')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBtn, filter === 'play' && styles.filterBtnActive]}
            onPress={() => setFilter('play')}
          >
            <Text style={[styles.filterText, filter === 'play' && styles.filterTextActive]}>
              {t('activities.tabPlay')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBtn, filter === 'deep_talk' && styles.filterBtnActive]}
            onPress={() => setFilter('deep_talk')}
          >
            <Text style={[styles.filterText, filter === 'deep_talk' && styles.filterTextActive]}>
              {t('activities.tabDeepTalk')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <LoadingState message={t('common.loading')} />
      ) : error ? (
        <ErrorState
          title={t('common.errorTitle')}
          message={error.message}
          onRetry={refetch}
          retryTitle={t('common.retry')}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={false} onRefresh={() => { refetch(); }} />}
        >
          {activities?.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onPress={() => handleStart(activity.id)}
              isStarting={isStarting}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background, // #f7f9f6
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.text, // #42362e
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary, // #a8917f
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterBtn: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceSubtle, // #f0ece6
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  filterBtnActive: {
    backgroundColor: theme.colors.primary, // #b69788
    borderColor: theme.colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  filterTextActive: {
    color: theme.colors.textInverse, // #ffffff
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
});
