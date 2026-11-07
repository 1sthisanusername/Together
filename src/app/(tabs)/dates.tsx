import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useActivities, useStartActivity, ActivityCard } from '@/features/activities';
import { useLetters, LetterCard, WriteLetterModal, ReadLetterModal } from '@/features/letters';
import { useActiveCouple } from '@/features/couple';
import { useAuthStore } from '@/features/auth';
import { LoadingState, ErrorState, Button } from '@/shared/ui';
import type { Letter } from '@/shared/types';

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

  const handleStartDate = async (activityId: string) => {
    try {
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
        <Text style={styles.title}>{t('dates.title')}</Text>
        <Text style={styles.subtitle}>{t('dates.subtitle')}</Text>
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
          {/* Guided Virtual Dates */}
          <Text style={styles.sectionHeader}>🕯️ Guided Dates</Text>
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
            <Text style={styles.sectionHeader}>💌 {t('letters.title')}</Text>
            <Button
              title={`+ ${t('letters.writeNew')}`}
              variant="outline"
              size="sm"
              onPress={() => setShowWriteModal(true)}
            />
          </View>

          {letters?.length === 0 ? (
            <Text style={styles.emptyLetters}>{t('common.empty')}</Text>
          ) : (
            letters?.map((letter) => (
              <LetterCard
                key={letter.id}
                letter={letter}
                isFromMe={letter.sender_id === user?.id}
                partnerName={partnerName}
                onPress={() => setSelectedLetter(letter)}
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
    paddingVertical: 16,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
    marginTop: 8,
  },
  lettersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 10,
  },
  emptyLetters: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
    paddingVertical: 12,
    textAlign: 'center',
  },
});

