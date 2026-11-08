import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Button } from '@/shared/ui';
import type { SessionData } from '../hooks/useSession';
import {
  useSubmitEvent,
  useCompleteSession,
  useSaveSessionAsMemory,
  useAdvanceRound,
} from '../hooks/useSession';

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
  callContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 16,
  },
  callSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  callButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  callButtonIcon: {
    fontSize: 14,
  },
  callButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
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
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  instructionText: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 24,
    textAlign: 'center',
  },
  checklistCard: {
    padding: 16,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  checklistTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  checkboxIcon: {
    fontSize: 16,
  },
  checklistText: {
    fontSize: 15,
    color: '#1E293B',
    flex: 1,
  },
  checklistTextChecked: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
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
