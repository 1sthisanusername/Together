import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useActivities, useStartActivity, ActivityCard } from '@/features/activities';
import { LoadingState, ErrorState, SwipeTabWrapper } from '@/shared/ui';
import { theme, scale, radii, triggerHaptic } from '@/shared/theme';

export default function PlayScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'play' | 'deep_talk'>('all');

  const { data: activities, isLoading, error, refetch } = useActivities(
    filter === 'all' ? undefined : filter
  );
  const { mutateAsync: startActivity, isPending: isStarting } = useStartActivity();

  const insets = useSafeAreaInsets();
  let tabBarHeight = 56;
  try {
    tabBarHeight = useBottomTabBarHeight();
  } catch {
    tabBarHeight = 56;
  }
  const bottomPadding = tabBarHeight + insets.bottom + 16;

  const handleStart = async (activityId: string) => {
    try {
      triggerHaptic('medium');
      const session = await startActivity(activityId);
      router.push(`/session/${session.id}`);
    } catch {
      // Handled
    }
  };

  const handleFilterChange = (newFilter: 'all' | 'play' | 'deep_talk') => {
    triggerHaptic('selection');
    setFilter(newFilter);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <SwipeTabWrapper currentTab="play">
        <View style={styles.header}>
        <Text style={styles.title} maxFontSizeMultiplier={1.35}>
          {t('activities.title')}
        </Text>
        <Text style={styles.subtitle} maxFontSizeMultiplier={1.35}>
          {t('activities.subtitle')}
        </Text>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
            onPress={() => handleFilterChange('all')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === 'all' }}
          >
            <Text
              style={[styles.filterText, filter === 'all' && styles.filterTextActive]}
              maxFontSizeMultiplier={1.35}
            >
              {t('activities.tabAll')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBtn, filter === 'play' && styles.filterBtnActive]}
            onPress={() => handleFilterChange('play')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === 'play' }}
          >
            <Text
              style={[styles.filterText, filter === 'play' && styles.filterTextActive]}
              maxFontSizeMultiplier={1.35}
            >
              {t('activities.tabPlay')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBtn, filter === 'deep_talk' && styles.filterBtnActive]}
            onPress={() => handleFilterChange('deep_talk')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === 'deep_talk' }}
          >
            <Text
              style={[styles.filterText, filter === 'deep_talk' && styles.filterTextActive]}
              maxFontSizeMultiplier={1.35}
            >
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
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
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
    marginBottom: scale(16),
  },
  filterRow: {
    flexDirection: 'row',
    gap: scale(8),
  },
  filterBtn: {
    paddingVertical: scale(8),
    paddingHorizontal: scale(16),
    borderRadius: radii.pill,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: Math.max(38, scale(38)),
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: {
    fontSize: scale(13),
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingVertical: scale(14),
  },
});
