import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input } from '@/shared/ui';
import type { SessionData } from '../hooks/useSession';
import { useSubmitEvent, useAdvanceRound, useCompleteSession, useSaveSessionAsMemory } from '../hooks/useSession';
import { theme, scale } from '@/shared/theme';

export interface DrawingGuessProps {
  data: SessionData;
  partnerName: string;
  onFinish: () => void;
}

interface Point {
  x: number;
  y: number;
}

export const DrawingGuessRenderer: React.FC<DrawingGuessProps> = ({
  data,
  partnerName,
  onFinish,
}) => {
  const { t } = useTranslation();
  const { session, activity, events, myUserId, partnerId } = data;
  const config = activity.config as {
    rounds: { id: number; drawer: string; prompt: string }[];
  };

  const rounds = config?.rounds || [];
  // Server-authoritative round index (never kept on client)
  const serverRound = session.current_round || 1;
  const currentRoundIdx = Math.min(Math.max(0, rounds.length - 1), Math.max(0, serverRound - 1));
  const currentRound = rounds[currentRoundIdx] || rounds[0];

  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [guessInput, setGuessInput] = useState('');

  const { mutate: submitEvent, isPending: isSubmitting } = useSubmitEvent(session.id);
  const { mutate: advanceRound, isPending: isAdvancing } = useAdvanceRound(session.id);
  const { mutate: completeSession, isPending: isCompleting } = useCompleteSession(session.id);
  const { mutate: saveMemory, isSuccess: isMemorySaved } = useSaveSessionAsMemory();

  // Determine if I am the drawer for this round
  const isMyTurnToDraw =
    (currentRound.drawer === 'partner_a' && session.created_by === myUserId) ||
    (currentRound.drawer === 'partner_b' && session.created_by !== myUserId);

  // Stroke events from DB/Realtime
  const strokes = events
    .filter((e) => e.type === 'stroke' && (e.payload as any)?.round === currentRound?.id)
    .map((e) => (e.payload as any)?.points as Point[]);

  // Guess events
  const guessEvents = events.filter(
    (e) => e.type === 'guess_submitted' && (e.payload as any)?.round === currentRound?.id
  );
  const correctGuess = guessEvents.find((e) => (e.payload as any)?.isCorrect);

  const isLastRound = currentRoundIdx === rounds.length - 1;
  const isCompleted = session.status === 'completed';

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => isMyTurnToDraw,
    onMoveShouldSetPanResponder: () => isMyTurnToDraw,
    onPanResponderGrant: (evt: GestureResponderEvent) => {
      if (!isMyTurnToDraw) return;
      const { locationX, locationY } = evt.nativeEvent;
      setCurrentPath([{ x: locationX, y: locationY }]);
    },
    onPanResponderMove: (evt: GestureResponderEvent) => {
      if (!isMyTurnToDraw) return;
      const { locationX, locationY } = evt.nativeEvent;
      setCurrentPath((prev) => [...prev, { x: locationX, y: locationY }]);
    },
    onPanResponderRelease: () => {
      if (!isMyTurnToDraw || currentPath.length === 0) return;
      submitEvent({
        type: 'stroke',
        payload: {
          round: currentRound.id,
          points: currentPath,
        },
      });
      setCurrentPath([]);
    },
  });

  const handleGuessSubmit = () => {
    if (!guessInput.trim() || isMyTurnToDraw) return;
    const cleanGuess = guessInput.trim().toLowerCase();
    const cleanPrompt = currentRound.prompt.toLowerCase();
    const isCorrect = cleanPrompt.includes(cleanGuess) || cleanGuess.includes(cleanPrompt);

    submitEvent({
      type: 'guess_submitted',
      payload: {
        round: currentRound.id,
        guess: guessInput.trim(),
        isCorrect,
      },
    });
    setGuessInput('');
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
        <Text style={styles.completedEmoji}>🎨</Text>
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
              note: `Doodled and guessed together!`,
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

      {isMyTurnToDraw ? (
        <View style={styles.promptHeader}>
          <Text style={styles.roleTitle}>{t('sessions.drawPrompt')}</Text>
          <Text style={styles.promptWord}>{currentRound.prompt}</Text>
        </View>
      ) : (
        <View style={styles.promptHeader}>
          <Text style={styles.roleTitle}>{t('sessions.guessPrompt', { name: partnerName })}</Text>
        </View>
      )}

      {/* Canvas Area */}
      <View style={styles.canvasContainer} {...panResponder.panHandlers}>
        <View style={styles.canvasSurface}>
          {/* Render committed stroke points */}
          {strokes.map((stroke, sIdx) =>
            stroke.map((p, pIdx) => (
              <View
                key={`${sIdx}-${pIdx}`}
                style={[
                  styles.strokeDot,
                  {
                    left: p.x,
                    top: p.y,
                  },
                ]}
              />
            ))
          )}

          {/* Render active dragging path */}
          {currentPath.map((p, idx) => (
            <View
              key={`active-${idx}`}
              style={[
                styles.strokeDot,
                {
                  left: p.x,
                  top: p.y,
                },
              ]}
            />
          ))}

          {strokes.length === 0 && currentPath.length === 0 ? (
            <Text style={styles.canvasPlaceholder}>
              {isMyTurnToDraw ? 'Draw with your finger here' : 'Watching partner draw live...'}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Guessing or Status Section */}
      {!isMyTurnToDraw ? (
        <View style={styles.guessSection}>
          {correctGuess ? (
            <Card style={styles.correctCard}>
              <Text style={styles.correctText}>🎉 {t('sessions.correctGuess')}</Text>
              <Text style={styles.answerText}>{currentRound.prompt}</Text>
            </Card>
          ) : (
            <View style={styles.inputRow}>
              <Input
                placeholder={t('sessions.guessPlaceholder')}
                value={guessInput}
                onChangeText={setGuessInput}
                containerStyle={styles.guessInput}
              />
              <Button
                title={t('sessions.submitGuess')}
                variant="primary"
                size="md"
                onPress={handleGuessSubmit}
                disabled={!guessInput.trim() || isSubmitting}
              />
            </View>
          )}
        </View>
      ) : (
        <View style={styles.drawerSection}>
          {correctGuess ? (
            <Card style={styles.correctCard}>
              <Text style={styles.correctText}>
                🎉 {partnerName} guessed it: {currentRound.prompt}!
              </Text>
            </Card>
          ) : (
            <Text style={styles.waitingGuessText}>
              Waiting for {partnerName} to guess...
            </Text>
          )}
        </View>
      )}

      {correctGuess ? (
        <Button
          title={isLastRound ? t('sessions.completeSession') : t('sessions.nextRound')}
          variant="primary"
          size="lg"
          loading={isCompleting}
          onPress={handleNextRound}
          style={styles.nextButton}
        />
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
    marginBottom: scale(8),
  },
  roundText: {
    fontSize: scale(13),
    fontWeight: '700',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  promptHeader: {
    alignItems: 'center',
    marginBottom: scale(16),
  },
  roleTitle: {
    fontSize: scale(14),
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  promptWord: {
    fontSize: scale(22),
    fontWeight: '800',
    color: theme.colors.primary,
    marginTop: scale(4),
  },
  canvasContainer: {
    width: '100%',
    aspectRatio: 1.15,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  canvasSurface: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  strokeDot: {
    position: 'absolute',
    width: scale(6),
    height: scale(6),
    borderRadius: 9999,
    backgroundColor: theme.colors.text,
  },
  canvasPlaceholder: {
    fontSize: scale(14),
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  guessSection: {
    marginTop: scale(16),
  },
  inputRow: {
    flexDirection: 'row',
    gap: scale(10),
    alignItems: 'flex-start',
  },
  guessInput: {
    flex: 1,
    marginBottom: 0,
  },
  drawerSection: {
    marginTop: scale(16),
    alignItems: 'center',
  },
  waitingGuessText: {
    fontSize: scale(14),
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  correctCard: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderColor: theme.colors.success,
    alignItems: 'center',
    width: '100%',
  },
  correctText: {
    fontSize: scale(16),
    fontWeight: '800',
    color: theme.colors.success,
  },
  answerText: {
    fontSize: scale(18),
    fontWeight: '800',
    color: theme.colors.text,
    marginTop: scale(4),
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
    fontSize: scale(26),
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: scale(8),
    letterSpacing: -0.5,
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

