import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input } from '@/shared/ui';
import type { SessionData } from '../hooks/useSession';
import { useSubmitEvent, useAdvanceRound, useCompleteSession, useSaveSessionAsMemory } from '../hooks/useSession';

export interface QuizProps {
  data: SessionData;
  partnerName: string;
  onFinish: () => void;
}

export const QuizRenderer: React.FC<QuizProps> = ({
  data,
  partnerName,
  onFinish,
}) => {
  const { t } = useTranslation();
  const { session, activity, events, myUserId, partnerId } = data;
  const config = activity.config as {
    rounds: { id: number; question: string; options?: string[]; type?: string }[];
  };

  const rounds = config?.rounds || [];
  // Server-authoritative round index (never kept on client)
  const serverRound = session.current_round || 1;
  const currentRoundIdx = Math.min(Math.max(0, rounds.length - 1), Math.max(0, serverRound - 1));
  const currentRound = rounds[currentRoundIdx] || rounds[0];
  const [textInput, setTextInput] = useState('');

  const { mutate: submitEvent, isPending: isSubmitting } = useSubmitEvent(session.id);
  const { mutate: advanceRound, isPending: isAdvancing } = useAdvanceRound(session.id);
  const { mutate: completeSession, isPending: isCompleting } = useCompleteSession(session.id);
  const { mutate: saveMemory, isSuccess: isMemorySaved } = useSaveSessionAsMemory();

  const roundEvents = events.filter(
    (e) => e.type === 'answer_submitted' && (e.payload as any)?.round === currentRound?.id
  );

  const myAnswerEvent = roundEvents.find((e) => e.user_id === myUserId);
  const partnerAnswerEvent = roundEvents.find((e) => e.user_id === partnerId);

  const myAnswer = (myAnswerEvent?.payload as any)?.answer;
  const partnerAnswer = (partnerAnswerEvent?.payload as any)?.answer;
  const isPartnerMasked = (partnerAnswerEvent?.payload as any)?.masked === true;
  const isBothRevealed = myAnswer && partnerAnswer && !isPartnerMasked;

  const isLastRound = currentRoundIdx === rounds.length - 1;
  const isCompleted = session.status === 'completed';

  const handleAnswer = (val: string) => {
    if (!val.trim() || myAnswer || isSubmitting) return;
    submitEvent({
      type: 'answer_submitted',
      payload: {
        round: currentRound.id,
        answer: val.trim(),
      },
    });
    setTextInput('');
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
        <Text style={styles.completedEmoji}>🧠</Text>
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
              note: `Completed quiz together!`,
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

      {currentRound.options ? (
        <View style={styles.optionsList}>
          {currentRound.options.map((opt, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.optionBtn,
                myAnswer === opt && styles.optionSelected,
                isBothRevealed && partnerAnswer === opt && styles.optionPartner,
              ]}
              onPress={() => handleAnswer(opt)}
              disabled={!!myAnswer || isSubmitting}
            >
              <Text style={styles.optionText}>{opt}</Text>
              {myAnswer === opt && <Text style={styles.myBadge}>✓ {t('sessions.yourChoice')}</Text>}
              {isBothRevealed && partnerAnswer === opt && (
                <Text style={styles.partnerBadge}>♥ {t('sessions.partnerChoice', { name: partnerName })}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.textSection}>
          {!myAnswer ? (
            <>
              <Input
                placeholder="Share your thoughts..."
                value={textInput}
                onChangeText={setTextInput}
                multiline
                numberOfLines={3}
              />
              <Button
                title={t('sessions.submitAnswer')}
                variant="primary"
                size="md"
                disabled={!textInput.trim() || isSubmitting}
                loading={isSubmitting}
                onPress={() => handleAnswer(textInput)}
              />
            </>
          ) : (
            <Card style={styles.lockedCard}>
              <Text style={styles.lockedLabel}>{t('sessions.yourChoice')}:</Text>
              <Text style={styles.lockedValue}>{myAnswer}</Text>
            </Card>
          )}
        </View>
      )}

      {myAnswer && !partnerAnswerEvent ? (
        <Card style={styles.statusCard}>
          <Text style={styles.statusText}>
            🔒 {t('sessions.waitingForPartner', { name: partnerName })}
          </Text>
        </Card>
      ) : null}

      {!myAnswer && partnerAnswerEvent ? (
        <Card style={styles.partnerWaitingCard}>
          <Text style={styles.partnerWaitingText}>
            ⚡ {t('sessions.partnerWaitingAnswer', { name: partnerName })}
          </Text>
        </Card>
      ) : null}

      {isBothRevealed ? (
        <View style={styles.revealSection}>
          <Card style={styles.partnerRevealCard}>
            <Text style={styles.partnerLabel}>♥ {t('sessions.partnerChoice', { name: partnerName })}:</Text>
            <Text style={styles.partnerValue}>{partnerAnswer}</Text>
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
    marginBottom: 8,
  },
  roundText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366F1',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 28,
  },
  optionsList: {
    gap: 10,
  },
  optionBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  optionSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  optionPartner: {
    borderColor: '#EC4899',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
  myBadge: {
    marginTop: 4,
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
  textSection: {
    marginTop: 8,
  },
  lockedCard: {
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    padding: 16,
  },
  lockedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  lockedValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
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
    marginTop: 20,
  },
  partnerRevealCard: {
    backgroundColor: '#FDF2F8',
    borderColor: '#FCE7F3',
    alignItems: 'center',
  },
  partnerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DB2777',
    marginBottom: 4,
  },
  partnerValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#831843',
    textAlign: 'center',
  },
  nextButton: {
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

