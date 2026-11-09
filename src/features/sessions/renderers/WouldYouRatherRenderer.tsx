import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Button } from '@/shared/ui';
import type { SessionData } from '../hooks/useSession';
import {
  useSubmitEvent,
  useCompleteSession,
  useSaveSessionAsMemory,
  useAdvanceRound,
} from '../hooks/useSession';
import { theme, scale, triggerHaptic } from '@/shared/theme';

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

  const [playMode, setPlayMode] = useState<'couple' | 'solo'>('couple');
  const rounds = config?.rounds || [];
  // Server-authoritative round index
  const serverRound = session.current_round || 1;
  const currentRoundIdx = Math.min(Math.max(0, rounds.length - 1), Math.max(0, serverRound - 1));
  const currentRound = rounds[currentRoundIdx] || rounds[0];

  const { mutate: submitEvent, isPending: isSubmitting } = useSubmitEvent(session.id);
  const { mutate: advanceRound, isPending: isAdvancing } = useAdvanceRound(session.id);
  const { mutate: completeSession, isPending: isCompleting } = useCompleteSession(session.id);
  const { mutate: saveMemory, isSuccess: isMemorySaved } = useSaveSessionAsMemory();

  // Find answers for this round
  const roundEvents = events.filter(
    (e) => e.type === 'answer_submitted' && (e.payload as any)?.round === currentRound?.id
  );

  const [selectedChoice, setSelectedChoice] = useState<'A' | 'B' | null>(null);

  useEffect(() => {
    setSelectedChoice(null);
  }, [currentRound?.id]);

  const myAnswerEvent = roundEvents.find((e) => e.user_id === myUserId);
  const partnerAnswerEvent = roundEvents.find((e) => e.user_id === partnerId);

  const myChoice = (myAnswerEvent?.payload as any)?.choice;
  const effectiveMyChoice = myChoice || selectedChoice;
  const partnerChoice = (partnerAnswerEvent?.payload as any)?.choice;
  const isPartnerMasked = (partnerAnswerEvent?.payload as any)?.masked === true;
  const isBothRevealed = myChoice && partnerChoice && !isPartnerMasked;

  const isLastRound = currentRoundIdx === rounds.length - 1;
  const isCompleted = session.status === 'completed';

  const handleSelect = (choice: 'A' | 'B') => {
    if (effectiveMyChoice || isSubmitting) return;
    triggerHaptic('selection');
    setSelectedChoice(choice);
    submitEvent({
      type: 'answer_submitted',
      payload: {
        round: currentRound.id,
        choice,
        choiceText: choice === 'A' ? currentRound.optionA : currentRound.optionB,
        playMode,
      },
    });
  };

  const handleNextRound = () => {
    triggerHaptic('light');
    if (isLastRound) {
      completeSession(activity.id);
    } else {
      advanceRound({ expectedRound: serverRound });
    }
  };

  if (isCompleted) {
    // Gather all user's answers for summary
    const myAllEvents = events.filter(
      (e) => e.type === 'answer_submitted' && e.user_id === myUserId
    );

    return (
      <View style={styles.completedContainer}>
        <Text style={styles.completedEmoji}>🎉</Text>
        <Text style={styles.completedTitle}>
          {playMode === 'solo' ? 'Solo Play Completed! 🌟' : t('sessions.sessionCompletedTitle')}
        </Text>
        <Text style={styles.completedSubtitle}>
          {playMode === 'solo'
            ? `You completed all ${rounds.length} questions! Answers are saved.`
            : t('sessions.sessionCompletedSubtitle')}
        </Text>

        {/* Solo Mode Summary of choices */}
        {playMode === 'solo' && myAllEvents.length > 0 && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Your Choices:</Text>
            {myAllEvents.slice(0, 5).map((ev, i) => (
              <Text key={i} style={styles.summaryItem}>
                • Round {(ev.payload as any)?.round || i + 1}: {(ev.payload as any)?.choiceText || `Choice ${(ev.payload as any)?.choice}`}
              </Text>
            ))}
          </View>
        )}

        <Button
          title={isMemorySaved ? t('sessions.savedToMemories') : t('sessions.saveAsMemory')}
          variant={isMemorySaved ? 'secondary' : 'primary'}
          size="lg"
          disabled={isMemorySaved}
          onPress={() =>
            saveMemory({
              sessionId: session.id,
              title: activity.title,
              note: `Completed all ${rounds.length} rounds of ${activity.title} in ${playMode} mode!`,
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
      {/* Mode Selector Header: Couple Mode vs Solo Mode */}
      <View style={styles.modeSelectorRow}>
        <TouchableOpacity
          style={[styles.modeTab, playMode === 'couple' && styles.modeTabActive]}
          onPress={() => {
            triggerHaptic('selection');
            setPlayMode('couple');
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.modeTabText, playMode === 'couple' && styles.modeTabTextActive]}>
            💕 Couple Mode
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTab, playMode === 'solo' && styles.modeTabActive]}
          onPress={() => {
            triggerHaptic('selection');
            setPlayMode('solo');
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.modeTabText, playMode === 'solo' && styles.modeTabTextActive]}>
            🎮 Solo Mode
          </Text>
        </TouchableOpacity>
      </View>

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
          effectiveMyChoice === 'A' && styles.optionSelected,
          isBothRevealed && partnerChoice === 'A' && styles.optionPartnerPicked,
        ]}
        onPress={() => handleSelect('A')}
        disabled={!!effectiveMyChoice || isSubmitting}
        activeOpacity={0.8}
      >
        <Text style={styles.optionLetter}>A</Text>
        <Text style={styles.optionTitle}>{currentRound.optionA}</Text>
        {effectiveMyChoice === 'A' && <Text style={styles.pickBadge}>✓ {t('sessions.yourChoice')}</Text>}
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
          effectiveMyChoice === 'B' && styles.optionSelected,
          isBothRevealed && partnerChoice === 'B' && styles.optionPartnerPicked,
        ]}
        onPress={() => handleSelect('B')}
        disabled={!!effectiveMyChoice || isSubmitting}
        activeOpacity={0.8}
      >
        <Text style={styles.optionLetter}>B</Text>
        <Text style={styles.optionTitle}>{currentRound.optionB}</Text>
        {effectiveMyChoice === 'B' && <Text style={styles.pickBadge}>✓ {t('sessions.yourChoice')}</Text>}
        {isBothRevealed && partnerChoice === 'B' && (
          <Text style={styles.partnerBadge}>♥ {t('sessions.partnerChoice', { name: partnerName })}</Text>
        )}
      </TouchableOpacity>

      {/* Solo Mode: Immediate progression */}
      {playMode === 'solo' && effectiveMyChoice ? (
        <View style={styles.soloNextContainer}>
          <Text style={styles.soloAnsweredText}>✓ Choice recorded!</Text>
          <Button
            title={isLastRound ? 'Finish All Questions 🎉' : 'Next Question →'}
            variant="primary"
            size="lg"
            loading={isCompleting || isAdvancing}
            onPress={handleNextRound}
            style={styles.nextButton}
          />
        </View>
      ) : null}

      {/* Couple Mode: Status Banners */}
      {playMode === 'couple' && effectiveMyChoice && !partnerAnswerEvent ? (
        <Card style={styles.statusCard}>
          <Text style={styles.statusText}>
            🔒 {t('sessions.waitingForPartner', { name: partnerName })}
          </Text>
          <TouchableOpacity
            style={styles.switchSoloBtn}
            onPress={() => setPlayMode('solo')}
            activeOpacity={0.7}
          >
            <Text style={styles.switchSoloText}>
              Switch to Solo Mode to keep answering now →
            </Text>
          </TouchableOpacity>
        </Card>
      ) : null}

      {playMode === 'couple' && !effectiveMyChoice && partnerAnswerEvent ? (
        <Card style={styles.partnerWaitingCard}>
          <Text style={styles.partnerWaitingText}>
            ⚡ {t('sessions.partnerWaitingAnswer', { name: partnerName })}
          </Text>
        </Card>
      ) : null}

      {/* Couple Mode: Both Revealed */}
      {playMode === 'couple' && isBothRevealed ? (
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
            loading={isCompleting || isAdvancing}
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
  modeSelectorRow: {
    flexDirection: 'row',
    backgroundColor: '#EFE7DA',
    padding: scale(3),
    borderRadius: scale(12),
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    marginBottom: scale(16),
  },
  modeTab: {
    flex: 1,
    paddingVertical: scale(6),
    alignItems: 'center',
    borderRadius: scale(9),
  },
  modeTabActive: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modeTabText: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(12),
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  modeTabTextActive: {
    fontWeight: '800',
    color: theme.colors.text,
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
    borderColor: theme.colors.primary, // #b69788
    backgroundColor: theme.colors.primaryLight, // #f4ede8
  },
  optionPartnerPicked: {
    borderColor: theme.colors.secondary, // #a8917f
  },
  optionLetter: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text, // #42362e
    textAlign: 'center',
  },
  pickBadge: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary, // #b69788
  },
  partnerBadge: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.secondary, // #a8917f
  },
  orDivider: {
    alignItems: 'center',
    marginVertical: 12,
  },
  orText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textMuted,
  },
  statusCard: {
    backgroundColor: theme.colors.surfaceSubtle,
    marginTop: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  partnerWaitingCard: {
    backgroundColor: theme.colors.warningLight,
    borderColor: theme.colors.border,
    marginTop: 20,
    alignItems: 'center',
  },
  partnerWaitingText: {
    fontSize: 14,
    color: theme.colors.warning,
    fontWeight: '700',
    textAlign: 'center',
  },
  revealSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  matchCard: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
    width: '100%',
    alignItems: 'center',
  },
  differCard: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderColor: theme.colors.border,
    width: '100%',
    alignItems: 'center',
  },
  revealTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  nextButton: {
    width: '100%',
    marginTop: 16,
  },
  soloNextContainer: {
    marginTop: scale(16),
    alignItems: 'center',
    width: '100%',
  },
  soloAnsweredText: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(13),
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: scale(8),
  },
  switchSoloBtn: {
    marginTop: scale(10),
    paddingVertical: scale(4),
  },
  switchSoloText: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(12),
    fontWeight: '700',
    color: theme.colors.primary,
  },
  summaryBox: {
    width: '100%',
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: scale(14),
    padding: scale(14),
    marginBottom: scale(20),
  },
  summaryTitle: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(14),
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: scale(8),
  },
  summaryItem: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(12),
    color: theme.colors.text,
    lineHeight: scale(18),
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
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  completedSubtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
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

