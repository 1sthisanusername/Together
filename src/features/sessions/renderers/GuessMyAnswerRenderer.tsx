import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Button, ProgressBar } from '@/shared/ui';
import type { SessionData } from '../hooks/useSession';
import { useSubmitEvent, useAdvanceRound, useCompleteSession, useSaveSessionAsMemory } from '../hooks/useSession';
import { theme, scale } from '@/shared/theme';

export interface GuessMyAnswerProps {
  data: SessionData;
  partnerName: string;
  onFinish: () => void;
}

export const GuessMyAnswerRenderer: React.FC<GuessMyAnswerProps> = ({
  data,
  partnerName,
  onFinish,
}) => {
  const { t } = useTranslation();
  const { session, activity, events, myUserId, partnerId } = data;
  const config = activity.config as {
    rounds: { id: number; question: string; options: string[] }[];
  };

  const rounds = config?.rounds || [];
  // Server-authoritative round index (never kept on client)
  const serverRound = session.current_round || 1;
  const currentRoundIdx = Math.min(Math.max(0, rounds.length - 1), Math.max(0, serverRound - 1));
  const currentRound = rounds[currentRoundIdx] || rounds[0];

  const { mutate: submitEvent, isPending: isSubmitting } = useSubmitEvent(session.id);
  const { mutate: advanceRound, isPending: isAdvancing } = useAdvanceRound(session.id);
  const { mutate: completeSession, isPending: isCompleting } = useCompleteSession(session.id);
  const { mutate: saveMemory, isSuccess: isMemorySaved } = useSaveSessionAsMemory();

  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  useEffect(() => {
    setSelectedOption(null);
  }, [currentRound?.id]);

  const roundEvents = events.filter(
    (e) => e.type === 'answer_submitted' && (e.payload as any)?.round === currentRound?.id
  );

  const myAnswerEvent = roundEvents.find((e) => e.user_id === myUserId);
  const partnerAnswerEvent = roundEvents.find((e) => e.user_id === partnerId);

  const myAnswer = (myAnswerEvent?.payload as any)?.answer;
  const effectiveMyAnswer = myAnswer || selectedOption;
  const partnerAnswer = (partnerAnswerEvent?.payload as any)?.answer;
  const isPartnerMasked = (partnerAnswerEvent?.payload as any)?.masked === true;
  const isBothRevealed = myAnswer && partnerAnswer && !isPartnerMasked;

  const isLastRound = currentRoundIdx === rounds.length - 1;
  const isCompleted = session.status === 'completed';

  const handleSelect = (option: string) => {
    if (effectiveMyAnswer || isSubmitting) return;
    setSelectedOption(option);
    submitEvent({
      type: 'answer_submitted',
      payload: {
        round: currentRound.id,
        answer: option,
      },
    });
  };

  const handleNextRound = () => {
    if (isLastRound) {
      completeSession(activity.id);
    } else {
      advanceRound({ expectedRound: serverRound });
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
              note: `Completed ${activity.title}!`,
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
      <ProgressBar current={currentRoundIdx + 1} total={rounds.length} />

      <Text style={styles.questionText}>{currentRound.question}</Text>

      <View style={styles.optionsList}>
        {currentRound.options.map((option, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              styles.optionBtn,
              effectiveMyAnswer === option && styles.optionSelected,
              isBothRevealed && partnerAnswer === option && styles.optionPartner,
            ]}
            onPress={() => handleSelect(option)}
            disabled={!!effectiveMyAnswer || isSubmitting}
            activeOpacity={0.8}
          >
            <Text style={styles.optionText}>{option}</Text>
            {effectiveMyAnswer === option && (
              <Text style={styles.myBadge}>✓ {t('sessions.yourChoice')}</Text>
            )}
            {isBothRevealed && partnerAnswer === option && (
              <Text style={styles.partnerBadge}>♥ {t('sessions.partnerChoice', { name: partnerName })}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {effectiveMyAnswer && !partnerAnswerEvent ? (
        <Card style={styles.statusCard}>
          <Text style={styles.statusText}>
            🔒 {t('sessions.waitingForPartner', { name: partnerName })}
          </Text>
        </Card>
      ) : null}

      {!effectiveMyAnswer && partnerAnswerEvent ? (
        <Card style={styles.partnerWaitingCard}>
          <Text style={styles.partnerWaitingText}>
            ⚡ {t('sessions.partnerWaitingAnswer', { name: partnerName })}
          </Text>
        </Card>
      ) : null}

      {isBothRevealed ? (
        <View style={styles.revealSection}>
          <Card style={myAnswer === partnerAnswer ? styles.matchCard : styles.differCard}>
            <Text style={styles.revealTitle}>
              {myAnswer === partnerAnswer
                ? '🎯 Match! You are on the exact same wavelength!'
                : `Partner picked: "${partnerAnswer}"`}
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
    padding: scale(16),
    width: '100%',
  },
  progressHeader: {
    alignItems: 'center',
    marginBottom: scale(12),
  },
  roundText: {
    fontSize: scale(13),
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: scale(20),
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: scale(20),
    lineHeight: scale(28),
  },
  optionsList: {
    gap: scale(10),
  },
  optionBtn: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.lg,
    padding: scale(16),
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    ...theme.shadows.card,
  },
  optionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceBlush,
  },
  optionPartner: {
    borderColor: theme.colors.rose,
  },
  optionText: {
    fontSize: scale(15),
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  myBadge: {
    marginTop: scale(6),
    fontSize: scale(12),
    fontWeight: '700',
    color: theme.colors.primary,
  },
  partnerBadge: {
    marginTop: scale(4),
    fontSize: scale(12),
    fontWeight: '700',
    color: theme.colors.rose,
  },
  statusCard: {
    backgroundColor: theme.colors.surfaceBlush,
    marginTop: scale(20),
    alignItems: 'center',
  },
  statusText: {
    fontSize: scale(14),
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  partnerWaitingCard: {
    backgroundColor: theme.colors.surfaceBlush,
    borderColor: theme.colors.sunset,
    marginTop: scale(20),
    alignItems: 'center',
  },
  partnerWaitingText: {
    fontSize: scale(14),
    color: theme.colors.secondary,
    fontWeight: '700',
    textAlign: 'center',
  },
  revealSection: {
    marginTop: scale(20),
  },
  matchCard: {
    backgroundColor: theme.colors.surfaceBlush,
    borderColor: theme.colors.primary,
    alignItems: 'center',
  },
  differCard: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  revealTitle: {
    fontSize: scale(15),
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  nextButton: {
    marginTop: scale(16),
  },
  completedContainer: {
    alignItems: 'center',
    padding: scale(32),
  },
  completedEmoji: {
    fontSize: scale(48),
    marginBottom: scale(16),
  },
  completedTitle: {
    fontSize: scale(24),
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: scale(8),
  },
  completedSubtitle: {
    fontSize: scale(15),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: scale(28),
  },
  saveButton: {
    width: '100%',
    marginBottom: scale(12),
  },
  homeButton: {
    width: '100%',
  },
});

