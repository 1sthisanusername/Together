import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Button } from '@/shared/ui';
import type { SessionData } from '../hooks/useSession';
import { useSubmitEvent, useCompleteSession, useSaveSessionAsMemory } from '../hooks/useSession';

export interface GuidedDateProps {
  data: SessionData;
  partnerName: string;
  onFinish: () => void;
}

export const GuidedDateRenderer: React.FC<GuidedDateProps> = ({
  data,
  partnerName,
  onFinish,
}) => {
  const { t } = useTranslation();
  const { session, activity, events, myUserId } = data;
  const config = activity.config as {
    steps: { id: string; title: string; duration_minutes: number; description: string }[];
  };

  const steps = config?.steps || [];
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const currentStep = steps[currentStepIdx] || steps[0];

  const [secondsRemaining, setSecondsRemaining] = useState(
    (currentStep?.duration_minutes || 5) * 60
  );
  const [isRunning, setIsRunning] = useState(true);

  const { mutate: submitEvent } = useSubmitEvent(session.id);
  const { mutate: completeSession, isPending: isCompleting } = useCompleteSession(session.id);
  const { mutate: saveMemory, isSuccess: isMemorySaved } = useSaveSessionAsMemory();

  // Reset timer on step change
  useEffect(() => {
    if (currentStep) {
      setSecondsRemaining(currentStep.duration_minutes * 60);
      setIsRunning(true);
    }
  }, [currentStepIdx, currentStep]);

  // Countdown timer
  useEffect(() => {
    if (!isRunning || secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, secondsRemaining]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isLastStep = currentStepIdx === steps.length - 1;
  const isCompleted = session.status === 'completed';

  const handleNextStep = () => {
    submitEvent({
      type: 'step_completed',
      payload: {
        stepId: currentStep.id,
        stepTitle: currentStep.title,
      },
    });

    if (isLastStep) {
      completeSession(activity.id);
    } else {
      setCurrentStepIdx((prev) => prev + 1);
    }
  };

  if (isCompleted) {
    return (
      <View style={styles.completedContainer}>
        <Text style={styles.completedEmoji}>🍷</Text>
        <Text style={styles.completedTitle}>Date Completed!</Text>
        <Text style={styles.completedSubtitle}>
          You two shared a special virtual date together!
        </Text>

        <Button
          title={isMemorySaved ? t('sessions.savedToMemories') : t('sessions.saveAsMemory')}
          variant={isMemorySaved ? 'secondary' : 'primary'}
          size="lg"
          disabled={isMemorySaved}
          onPress={() =>
            saveMemory({
              sessionId: session.id,
              title: activity.title,
              note: `Enjoyed our virtual date: ${activity.title}!`,
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
        <Text style={styles.stepBadge}>
          {t('dates.step', { current: currentStepIdx + 1, total: steps.length })}
        </Text>
      </View>

      <Text style={styles.stepTitle}>{currentStep.title}</Text>

      {/* Synced Timer Card */}
      <Card style={styles.timerCard}>
        <Text style={styles.timerLabel}>Shared Step Timer</Text>
        <Text style={styles.timerDigits}>{formatTimer(secondsRemaining)}</Text>
        <Button
          title={isRunning ? 'Pause Timer' : 'Resume Timer'}
          variant="ghost"
          size="sm"
          onPress={() => setIsRunning(!isRunning)}
        />
      </Card>

      {/* Step Guide Instructions */}
      <Card style={styles.instructionCard}>
        <Text style={styles.instructionText}>{currentStep.description}</Text>
      </Card>

      <Button
        title={isLastStep ? t('dates.finishDate') : t('dates.nextStep')}
        variant="primary"
        size="lg"
        loading={isCompleting}
        onPress={handleNextStep}
        style={styles.actionButton}
      />
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
  stepBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E11D48',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 16,
  },
  timerCard: {
    alignItems: 'center',
    paddingVertical: 18,
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
    marginBottom: 16,
  },
  timerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9F1239',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  timerDigits: {
    fontSize: 40,
    fontWeight: '800',
    color: '#BE123C',
    fontVariant: ['tabular-nums'],
  },
  instructionCard: {
    padding: 20,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  instructionText: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 24,
    textAlign: 'center',
  },
  actionButton: {
    width: '100%',
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

