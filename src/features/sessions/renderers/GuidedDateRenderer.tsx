import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Button, ProgressBar } from '@/shared/ui';
import type { SessionData } from '../hooks/useSession';
import {
  useSubmitEvent,
  useCompleteSession,
  useSaveSessionAsMemory,
  useAdvanceRound,
} from '../hooks/useSession';
import { theme, scale } from '@/shared/theme';

export interface GuidedDateProps {
  data: SessionData;
  partnerName: string;
  onFinish: () => void;
}

interface CallAppOption {
  id: string;
  name: string;
  url: string;
  icon: string;
}

const CALL_APPS: CallAppOption[] = [
  { id: 'facetime', name: 'FaceTime', url: 'facetime://', icon: '📹' },
  { id: 'whatsapp', name: 'WhatsApp', url: 'whatsapp://send', icon: '💬' },
  { id: 'meet', name: 'Google Meet', url: 'https://meet.google.com/new', icon: '🎥' },
];

// Dynamically resolve Linking to support React Native runtime while remaining robust in test mocks
function resolveLinking(): { canOpenURL: (url: string) => Promise<boolean>; openURL: (url: string) => Promise<any> } {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const rn = require('react-native');
    if (rn?.Linking) return rn.Linking;
    if (rn?.default?.Linking) return rn.default.Linking;
  } catch {
    // Ignored in headless environments
  }
  return {
    canOpenURL: async () => true,
    openURL: async () => {},
  };
}

const Linking = resolveLinking();

export const GuidedDateRenderer: React.FC<GuidedDateProps> = ({
  data,
  partnerName,
  onFinish,
}) => {
  const { t } = useTranslation();
  const { session, activity, events, myUserId } = data;
  const config = activity.config as {
    steps: {
      id: string;
      title: string;
      prompt?: string;
      description?: string;
      duration_minutes?: number;
      timer_minutes?: number;
      checklist?: string[];
    }[];
  };

  const steps = config?.steps || [];
  // Server-authoritative step synchronization (steps advance on both phones simultaneously)
  const serverRound = session.current_round || 1;
  const currentStepIdx = Math.min(Math.max(0, steps.length - 1), Math.max(0, serverRound - 1));
  const currentStep = steps[currentStepIdx] || steps[0];

  const stepDuration = currentStep?.duration_minutes ?? currentStep?.timer_minutes;
  const hasTimer = typeof stepDuration === 'number' && stepDuration > 0;

  const [secondsRemaining, setSecondsRemaining] = useState((stepDuration || 5) * 60);
  const [isRunning, setIsRunning] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [availableCallApps, setAvailableCallApps] = useState<CallAppOption[]>([]);

  const { mutate: submitEvent } = useSubmitEvent(session.id);
  const { mutate: advanceRound, isPending: isAdvancing } = useAdvanceRound(session.id);
  const { mutate: completeSession, isPending: isCompleting } = useCompleteSession(session.id);
  const { mutate: saveMemory, isSuccess: isMemorySaved } = useSaveSessionAsMemory();

  // Check supported call apps using canOpenURL (hide button if canOpenURL fails)
  useEffect(() => {
    let isMounted = true;
    const checkCallApps = async () => {
      const available: CallAppOption[] = [];
      for (const app of CALL_APPS) {
        try {
          const supported = await Linking.canOpenURL(app.url);
          if (supported) {
            available.push(app);
          }
        } catch {
          // If check fails or app is unsupported, omit button
        }
      }
      if (isMounted) {
        setAvailableCallApps(available);
      }
    };
    checkCallApps();
    return () => {
      isMounted = false;
    };
  }, []);

  // Reset timer on step change
  useEffect(() => {
    if (hasTimer && stepDuration) {
      setSecondsRemaining(stepDuration * 60);
      setIsRunning(true);
    }
  }, [currentStepIdx, hasTimer, stepDuration]);

  // Countdown timer
  useEffect(() => {
    if (!hasTimer || !isRunning || secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [hasTimer, isRunning, secondsRemaining]);

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
      advanceRound({ expectedRound: serverRound });
    }
  };

  const handleOpenCall = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      // Ignored
    }
  };

  const toggleChecklist = (item: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [item]: !prev[item],
    }));
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

  const promptText = currentStep?.prompt || currentStep?.description || '';
  const checklist = currentStep?.checklist || [];

  return (
    <View style={styles.container}>
      <View style={styles.progressHeader}>
        <Text style={styles.stepBadge}>
          {t('dates.step', { current: currentStepIdx + 1, total: steps.length })}
        </Text>
      </View>
      <ProgressBar current={currentStepIdx + 1} total={steps.length} />

      <Text style={styles.stepTitle}>{currentStep.title}</Text>

      {/* Start a Call buttons (FaceTime, WhatsApp, Google Meet) */}
      {availableCallApps.length > 0 && (
        <View style={styles.callContainer}>
          <Text style={styles.callSectionLabel}>📞 Start a call with {partnerName}</Text>
          <View style={styles.callButtonsRow}>
            {availableCallApps.map((app) => (
              <TouchableOpacity
                key={app.id}
                style={styles.callButton}
                onPress={() => handleOpenCall(app.url)}
                activeOpacity={0.7}
              >
                <Text style={styles.callButtonIcon}>{app.icon}</Text>
                <Text style={styles.callButtonText}>{app.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Synced Timer Card (optional per step) */}
      {hasTimer && (
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
      )}

      {/* Step Guide Prompt & Instructions */}
      {promptText ? (
        <Card style={styles.instructionCard}>
          <Text style={styles.instructionText}>{promptText}</Text>
        </Card>
      ) : null}

      {/* Optional Step Checklist */}
      {checklist.length > 0 && (
        <Card style={styles.checklistCard}>
          <Text style={styles.checklistTitle}>Date Checklist</Text>
          {checklist.map((item, idx) => {
            const isChecked = !!checkedItems[item];
            return (
              <TouchableOpacity
                key={idx}
                style={styles.checklistItem}
                onPress={() => toggleChecklist(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.checkboxIcon}>{isChecked ? '☑️' : '⬜'}</Text>
                <Text style={[styles.checklistText, isChecked && styles.checklistTextChecked]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Card>
      )}

      <Button
        title={isLastStep ? t('dates.finishDate') : t('dates.nextStep')}
        variant="primary"
        size="lg"
        loading={isAdvancing || isCompleting}
        onPress={handleNextStep}
        style={styles.actionButton}
      />
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
  stepBadge: {
    fontSize: scale(13),
    fontWeight: '700',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stepTitle: {
    fontSize: scale(22),
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: scale(16),
  },
  callContainer: {
    backgroundColor: theme.colors.surfaceBlush,
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: scale(12),
    marginBottom: scale(16),
  },
  callSectionLabel: {
    fontSize: scale(12),
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: scale(8),
    textAlign: 'center',
  },
  callButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scale(8),
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.full,
    paddingVertical: scale(8),
    paddingHorizontal: scale(14),
    gap: scale(6),
  },
  callButtonIcon: {
    fontSize: scale(14),
  },
  callButtonText: {
    fontSize: scale(13),
    fontWeight: '600',
    color: theme.colors.text,
  },
  timerCard: {
    alignItems: 'center',
    paddingVertical: scale(18),
    backgroundColor: theme.colors.surfaceBlush,
    borderColor: theme.colors.border,
    marginBottom: scale(16),
  },
  timerLabel: {
    fontSize: scale(12),
    fontWeight: '700',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: scale(4),
  },
  timerDigits: {
    fontSize: scale(40),
    fontWeight: '800',
    color: theme.colors.primary,
    fontVariant: ['tabular-nums'],
  },
  instructionCard: {
    padding: scale(20),
    marginBottom: scale(16),
    backgroundColor: theme.colors.surface,
  },
  instructionText: {
    fontSize: scale(16),
    color: theme.colors.text,
    lineHeight: scale(24),
    textAlign: 'center',
  },
  checklistCard: {
    padding: scale(16),
    marginBottom: scale(20),
    backgroundColor: theme.colors.surface,
  },
  checklistTitle: {
    fontSize: scale(14),
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: scale(12),
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(8),
    gap: scale(10),
  },
  checkboxIcon: {
    fontSize: scale(16),
  },
  checklistText: {
    fontSize: scale(15),
    color: theme.colors.text,
    flex: 1,
  },
  checklistTextChecked: {
    textDecorationLine: 'line-through',
    color: theme.colors.textSecondary,
  },
  actionButton: {
    width: '100%',
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
