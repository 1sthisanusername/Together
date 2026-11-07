import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Button } from '@/shared/ui';
import type { SessionData } from '../hooks/useSession';
import { useSubmitEvent, useCompleteSession, useSaveSessionAsMemory } from '../hooks/useSession';

export interface WouldYouRatherProps {
  data: SessionData;
  partnerName: string;
  onFinish: () => void;
}

export const WouldYouRatherRenderer: React.FC<WouldYouRatherProps> = ({
  data,
  partnerName,
  onFinish,
}) => {
  const { t } = useTranslation();
  const { session, activity, events, myUserId, partnerId } = data;
  const config = activity.config as {
    rounds: { id: number; question: string; optionA: string; optionB: string }[];
  };

  const rounds = config?.rounds || [];
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const currentRound = rounds[currentRoundIdx] || rounds[0];

  const { mutate: submitEvent, isPending: isSubmitting } = useSubmitEvent(session.id);
  const { mutate: completeSession, isPending: isCompleting } = useCompleteSession(session.id);
  const { mutate: saveMemory, isSuccess: isMemorySaved } = useSaveSessionAsMemory();

  // Find answers for this round
  const roundEvents = events.filter(
    (e) => e.type === 'answer_submitted' && (e.payload as any)?.round === currentRound?.id
  );

  const myAnswerEvent = roundEvents.find((e) => e.user_id === myUserId);
  const partnerAnswerEvent = roundEvents.find((e) => e.user_id === partnerId);

  const myChoice = (myAnswerEvent?.payload as any)?.choice;
  const partnerChoice = (partnerAnswerEvent?.payload as any)?.choice;
  const isPartnerMasked = (partnerAnswerEvent?.payload as any)?.masked === true;
  const isBothRevealed = myChoice && partnerChoice && !isPartnerMasked;

  const isLastRound = currentRoundIdx === rounds.length - 1;
  const isCompleted = session.status === 'completed';

  const handleSelect = (choice: 'A' | 'B') => {
    if (myChoice || isSubmitting) return;
    submitEvent({
      type: 'answer_submitted',
      payload: {
        round: currentRound.id,
        choice,
        choiceText: choice === 'A' ? currentRound.optionA : currentRound.optionB,
      },
    });
  };

  const handleNextRound = () => {
    if (isLastRound) {
      completeSession(activity.id);
    } else {
      setCurrentRoundIdx((prev) => prev + 1);
    }
  };

  if (isCompleted) {
    return (
      <View style={styles.completedContainer}>
        <Text style={styles.completedEmoji}>🎉</Text>
        <Text style={styles.completedTitle}>{t('sessions.sessionCompletedTitle')}</Text>
        <Text style={styles.completedSubtitle}>{t('sessions.sessionCompletedSubtitle')}</Text>

        <Button
          title={isMemorySaved ? t('sessions.savedToMemories') : t('sessions.saveAsMemory')}
          variant={isMemorySaved ? 'secondary' : 'primary'}
          size="lg"
          disabled={isMemorySaved}
          onPress={() =>
            saveMemory({
              sessionId: session.id,
              title: activity.title,
              note: `Completed all ${rounds.length} rounds of ${activity.title} together!`,
            })
          }
          style={styles.saveButton}
        />

        <Button
          title={t('sessions.backToHome')}
          variant="outline"
          size="md"
          onPress={onFinish}
          style={styles.homeButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.progressHeader}>
        <Text style={styles.roundText}>
          {t('sessions.round', { current: currentRoundIdx + 1, total: rounds.length })}
        </Text>
      </View>

      <Text style={styles.questionText}>{currentRound.question}</Text>

      {/* Option A */}
      <TouchableOpacity
        style={[
          styles.optionCard,
          myChoice === 'A' && styles.optionSelected,
          isBothRevealed && partnerChoice === 'A' && styles.optionPartnerPicked,
        ]}
        onPress={() => handleSelect('A')}
        disabled={!!myChoice || isSubmitting}
        activeOpacity={0.8}
      >
        <Text style={styles.optionLetter}>A</Text>
        <Text style={styles.optionTitle}>{currentRound.optionA}</Text>
        {myChoice === 'A' && <Text style={styles.pickBadge}>✓ {t('sessions.yourChoice')}</Text>}
        {isBothRevealed && partnerChoice === 'A' && (
          <Text style={styles.partnerBadge}>♥ {t('sessions.partnerChoice', { name: partnerName })}</Text>
        )}
      </TouchableOpacity>

      <View style={styles.orDivider}>
        <Text style={styles.orText}>OR</Text>
      </View>

      {/* Option B */}
      <TouchableOpacity
        style={[
          styles.optionCard,
          myChoice === 'B' && styles.optionSelected,
          isBothRevealed && partnerChoice === 'B' && styles.optionPartnerPicked,
        ]}
        onPress={() => handleSelect('B')}
        disabled={!!myChoice || isSubmitting}
        activeOpacity={0.8}
      >
        <Text style={styles.optionLetter}>B</Text>
        <Text style={styles.optionTitle}>{currentRound.optionB}</Text>
        {myChoice === 'B' && <Text style={styles.pickBadge}>✓ {t('sessions.yourChoice')}</Text>}
        {isBothRevealed && partnerChoice === 'B' && (
          <Text style={styles.partnerBadge}>♥ {t('sessions.partnerChoice', { name: partnerName })}</Text>
        )}
      </TouchableOpacity>

      {/* Reveal Status Banner */}
      {myChoice && !partnerAnswerEvent ? (
        <Card style={styles.statusCard}>
          <Text style={styles.statusText}>
            🔒 {t('sessions.waitingForPartner', { name: partnerName })}
          </Text>
        </Card>
      ) : null}

      {!myChoice && partnerAnswerEvent ? (
        <Card style={styles.partnerWaitingCard}>
          <Text style={styles.partnerWaitingText}>
            ⚡ {t('sessions.partnerWaitingAnswer', { name: partnerName })}
          </Text>
        </Card>
      ) : null}

      {isBothRevealed ? (
        <View style={styles.revealSection}>
          <Card style={myChoice === partnerChoice ? styles.matchCard : styles.differCard}>
            <Text style={styles.revealTitle}>
              {myChoice === partnerChoice ? '✨ You both chose the same!' : '🎨 Different tastes, still perfect!'}
            </Text>
          </Card>

          <Button
            title={isLastRound ? t('sessions.completeSession') : t('sessions.nextRound')}
            variant="primary"
            size="lg"
            loading={isCompleting}
            onPress={handleNextRound}
            style={styles.nextButton}
          />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    width: '100%',
  },
  progressHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  roundText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366F1',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 28,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  optionSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  optionPartnerPicked: {
    borderColor: '#EC4899',
  },
  optionLetter: {
    fontSize: 14,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 6,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  pickBadge: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  partnerBadge: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: '#DB2777',
  },
  orDivider: {
    alignItems: 'center',
    marginVertical: 12,
  },
  orText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
  },
  statusCard: {
    backgroundColor: '#F8FAFC',
    marginTop: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  partnerWaitingCard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    marginTop: 20,
    alignItems: 'center',
  },
  partnerWaitingText: {
    fontSize: 14,
    color: '#B45309',
    fontWeight: '700',
    textAlign: 'center',
  },
  revealSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  matchCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    width: '100%',
    alignItems: 'center',
  },
  differCard: {
    backgroundColor: '#FDF2F8',
    borderColor: '#FCE7F3',
    width: '100%',
    alignItems: 'center',
  },
  revealTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  nextButton: {
    width: '100%',
    marginTop: 16,
  },
  completedContainer: {
    alignItems: 'center',
    padding: 32,
  },
  completedEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  completedSubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 28,
  },
  saveButton: {
    width: '100%',
    marginBottom: 12,
  },
  homeButton: {
    width: '100%',
  },
});

