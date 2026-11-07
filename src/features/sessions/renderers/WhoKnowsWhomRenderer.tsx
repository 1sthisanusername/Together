import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input } from '@/shared/ui';
import type { SessionData } from '../hooks/useSession';
import { useSubmitEvent, useCompleteSession, useSaveSessionAsMemory } from '../hooks/useSession';

export interface WhoKnowsWhomProps {
  data: SessionData;
  partnerName: string;
  onFinish: () => void;
}

export const WhoKnowsWhomRenderer: React.FC<WhoKnowsWhomProps> = ({
  data,
  partnerName,
  onFinish,
}) => {
  const { t } = useTranslation();
  const { session, activity, events, myUserId, partnerId } = data;
  const config = activity.config as {
    rounds: { id: number; prompt: string; target: string; type?: string; options?: string[] }[];
  };

  const rounds = config?.rounds || [];
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const currentRound = rounds[currentRoundIdx] || rounds[0];
  const [inputText, setInputText] = useState('');

  const { mutate: submitEvent, isPending: isSubmitting } = useSubmitEvent(session.id);
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

  const handleSubmit = (answerValue: string) => {
    if (!answerValue.trim() || myAnswer || isSubmitting) return;
    submitEvent({
      type: 'answer_submitted',
      payload: {
        round: currentRound.id,
        answer: answerValue.trim(),
      },
    });
    setInputText('');
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
              note: `Played ${activity.title} with ${partnerName}!`,
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

      <Text style={styles.promptText}>{currentRound.prompt}</Text>

      {currentRound.options ? (
        <View style={styles.optionsList}>
          {currentRound.options.map((option, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.optionBtn,
                myAnswer === option && styles.optionSelected,
                isBothRevealed && partnerAnswer === option && styles.optionPartner,
              ]}
              onPress={() => handleSubmit(option)}
              disabled={!!myAnswer || isSubmitting}
            >
              <Text style={styles.optionBtnText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.inputSection}>
          {!myAnswer ? (
            <>
              <Input
                placeholder="Type your answer..."
                value={inputText}
                onChangeText={setInputText}
              />
              <Button
                title={t('sessions.submitAnswer')}
                variant="primary"
                size="md"
                disabled={!inputText.trim() || isSubmitting}
                loading={isSubmitting}
                onPress={() => handleSubmit(inputText)}
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
            <Text style={styles.revealPartnerLabel}>
              ♥ {t('sessions.partnerChoice', { name: partnerName })}:
            </Text>
            <Text style={styles.revealPartnerValue}>{partnerAnswer}</Text>
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
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  promptText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 28,
  },
  optionsList: {
    gap: 10,
  },
  optionBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
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
  optionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  inputSection: {
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
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
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
    padding: 16,
  },
  revealPartnerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DB2777',
    marginBottom: 4,
  },
  revealPartnerValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#831843',
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

