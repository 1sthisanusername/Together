import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useActivities, useStartActivity, ActivityCard } from '@/features/activities';
import { SkeletonList, ErrorState, EmptyState, SwipeTabWrapper, ResponsiveContainer } from '@/shared/ui';
import { theme, scale, radii, useResponsiveLayout, triggerHaptic } from '@/shared/theme';

export default function PlayScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'play' | 'deep_talk'>('all');
  const { horizontalGutter, columns, s } = useResponsiveLayout();

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
          <ResponsiveContainer wide style={{ paddingHorizontal: horizontalGutter }}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { fontSize: s(26) }]} maxFontSizeMultiplier={1.35}>
                {t('activities.title')}
              </Text>
              <View style={styles.titleDot} />
            </View>
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
          </ResponsiveContainer>
        </View>

        {isLoading ? (
          <ResponsiveContainer wide>
            <SkeletonList count={4} lines={2} />
          </ResponsiveContainer>
        ) : error ? (
          <ErrorState
            title={t('common.errorTitle')}
            message={error.message}
            onRetry={refetch}
            retryTitle={t('common.retry')}
          />
        ) : !activities || activities.length === 0 ? (
          <ResponsiveContainer wide style={{ paddingVertical: scale(40) }}>
            <EmptyState
              title="No activities found"
              description="Activities will appear here once seeded in your database."
              actionTitle={t('common.retry')}
              onAction={refetch}
            />
          </ResponsiveContainer>
        ) : (
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingHorizontal: horizontalGutter, paddingBottom: bottomPadding },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={false} onRefresh={() => { refetch(); }} />}
          >
            <ResponsiveContainer
              wide
              style={columns === 2 ? styles.gridTwoCols : styles.singleCol}
            >
              {activities?.map((activity) => (
                <View
                  key={activity.id}
                  style={columns === 2 ? styles.gridItemHalf : styles.gridItemFull}
                >
                  <ActivityCard
                    activity={activity}
                    onPress={() => handleStart(activity.id)}
                    isStarting={isStarting}
                  />
                </View>
              ))}
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
    borderRadius: 9999,
    backgroundColor: theme.colors.primary,
    marginTop: scale(4),
  },
  subtitle: {
    fontFamily: theme.typography.families.body,
    fontSize: scale(14),
    color: theme.colors.textSecondary,
    marginBottom: scale(14),
  },
  filterRow: {
    flexDirection: 'row',
    gap: scale(8),
  },
  filterBtn: {
    paddingVertical: scale(8),
    paddingHorizontal: scale(16),
    borderRadius: 9999,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: Math.max(38, scale(38)),
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: theme.colors.primary, // #E53935
    borderColor: theme.colors.primary,
    ...theme.shadows.hardSm,
  },
  filterText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(13),
    color: theme.colors.text,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingVertical: scale(14),
  },
  singleCol: {
    gap: scale(4),
  },
  gridTwoCols: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: scale(12),
  },
  gridItemFull: {
    width: '100%',
  },
  gridItemHalf: {
    width: '48.5%',
  },
});
