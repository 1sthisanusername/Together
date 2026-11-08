import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useActivities, useStartActivity, ActivityCard } from '@/features/activities';
import { useLetters, LetterCard, WriteLetterModal, ReadLetterModal } from '@/features/letters';
import { useActiveCouple } from '@/features/couple';
import { useAuthStore } from '@/features/auth';
import { LoadingState, ErrorState, Button } from '@/shared/ui';
import type { Letter } from '@/shared/types';
import { theme, scale, triggerHaptic } from '@/shared/theme';

export default function DatesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const { data: coupleData } = useActiveCouple();
  const partnerName = coupleData?.partner?.display_name || 'Partner';

  const { data: datesActivities, isLoading, error, refetch: refetchDates } = useActivities('dates');
  const { data: letters, refetch: refetchLetters } = useLetters();
  const { mutateAsync: startActivity, isPending: isStarting } = useStartActivity();

  const [showWriteModal, setShowWriteModal] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);

  const insets = useSafeAreaInsets();
  let tabBarHeight = 56;
  try {
    tabBarHeight = useBottomTabBarHeight();
  } catch {
    tabBarHeight = 56;
  }
  const bottomPadding = tabBarHeight + insets.bottom + 16;

  const handleStartDate = async (activityId: string) => {
    try {
      triggerHaptic('medium');
      const session = await startActivity(activityId);
      router.push(`/session/${session.id}`);
    } catch {
      // Handled
    }
  };

  const handleRefresh = () => {
    refetchDates();
    refetchLetters();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title} maxFontSizeMultiplier={1.35}>
          {t('dates.title')}
        </Text>
        <Text style={styles.subtitle} maxFontSizeMultiplier={1.35}>
          {t('dates.subtitle')}
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
          {/* Guided Virtual Dates */}
          <Text style={styles.sectionHeader} maxFontSizeMultiplier={1.35}>
            Guided Dates
          </Text>
          {datesActivities?.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onPress={() => handleStartDate(activity.id)}
              isStarting={isStarting}
            />
          ))}

          {/* Open When Letters Section */}
          <View style={styles.lettersHeaderRow}>
            <Text style={styles.sectionHeader} maxFontSizeMultiplier={1.35}>
              {t('letters.title')}
            </Text>
            <Button
              title={`+ ${t('letters.writeNew')}`}
              variant="outline"
              size="sm"
              onPress={() => {
                triggerHaptic('light');
                setShowWriteModal(true);
              }}
            />
          </View>

          {letters?.length === 0 ? (
            <Text style={styles.emptyLetters} maxFontSizeMultiplier={1.35}>
              {t('common.empty')}
            </Text>
          ) : (
            letters?.map((letter) => (
              <LetterCard
                key={letter.id}
                letter={letter}
                isFromMe={letter.sender_id === user?.id}
                partnerName={partnerName}
                onPress={() => {
                  triggerHaptic('light');
                  setSelectedLetter(letter);
                }}
              />
            ))
          )}
        </ScrollView>
      )}

      <WriteLetterModal
        visible={showWriteModal}
        onClose={() => setShowWriteModal(false)}
        partnerName={partnerName}
      />

      <ReadLetterModal
        letter={selectedLetter}
        visible={!!selectedLetter}
        onClose={() => setSelectedLetter(null)}
        partnerName={partnerName}
      />
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
  sectionHeader: {
    fontSize: scale(17),
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: scale(10),
    marginTop: scale(8),
    letterSpacing: -0.3,
  },
  lettersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: scale(24),
    marginBottom: scale(10),
  },
  emptyLetters: {
    fontSize: scale(13),
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: scale(16),
    textAlign: 'center',
  },
});
