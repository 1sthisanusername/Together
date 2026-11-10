import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Sheet, Button, Input, ErrorState } from '@/shared/ui';
import { useUnlinkCouple } from '../hooks/useCouple';
import { theme, scale, triggerHaptic } from '@/shared/theme';

export interface UnlinkCoupleDialogProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isCancel?: boolean;
}

export const UnlinkCoupleDialog: React.FC<UnlinkCoupleDialogProps> = ({
  visible,
  onClose,
  onSuccess,
  isCancel = false,
}) => {
  const { t } = useTranslation();
  const { mutateAsync: unlink, isPending, error, reset } = useUnlinkCouple();

  // Multi-step verification state (for active couple unlinking)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [confirmationPhrase, setConfirmationPhrase] = useState('');
  const [countdown, setCountdown] = useState(5);

  // Reset dialog state whenever opened
  useEffect(() => {
    if (visible) {
      setStep(1);
      setHasAcknowledged(false);
      setConfirmationPhrase('');
      setCountdown(5);
      reset();
    }
  }, [visible, reset]);

  // Countdown timer for Step 3 to prevent quick accidental double-tapping
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (visible && !isCancel && step === 3 && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [visible, isCancel, step, countdown]);

  const handleUnlink = async () => {
    try {
      triggerHaptic('heavy');
      await unlink();
      onClose();
      onSuccess?.();
    } catch {
      // Handled by error state
    }
  };

  const isPhraseMatched = confirmationPhrase.trim().toUpperCase() === 'UNLINK';

  // --- RENDER LIGHTWEIGHT CANCEL FLOW FOR PENDING INVITES ---
  if (isCancel) {
    return (
      <Sheet visible={visible} onClose={onClose} title="Cancel Couple Space">
        <View style={styles.container}>
          <Text style={styles.warningHeading}>
            Cancel this pending couple space?
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • The pending invitation code will be revoked immediately.
            </Text>
            <Text style={styles.bulletItem}>
              • You can create a fresh space or join another couple whenever you are ready.
            </Text>
          </View>

          {error ? (
            <ErrorState
              title={t('common.errorTitle')}
              message={error.message}
              onRetry={reset}
              retryTitle={t('common.retry')}
            />
          ) : null}

          <View style={styles.actions}>
            <Button
              title="Keep Invite"
              variant="outline"
              size="md"
              onPress={onClose}
              disabled={isPending}
              style={styles.button}
            />
            <Button
              title="Cancel Space"
              variant="danger"
              size="md"
              loading={isPending}
              onPress={handleUnlink}
              style={styles.button}
            />
          </View>
        </View>
      </Sheet>
    );
  }

  // --- RENDER 3-STEP PROTECTED SAFEGUARD FLOW FOR ACTIVE COUPLES ---
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={
        step === 1
          ? 'Step 1/3: Consequences'
          : step === 2
          ? 'Step 2/3: Verify Intent'
          : 'Step 3/3: Final Confirmation'
      }
    >
      <View style={styles.container}>
        {/* Step Progression Bar */}
        <View style={styles.stepIndicatorRow}>
          <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
          <View style={[styles.stepBar, step >= 2 && styles.stepBarActive]} />
          <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
          <View style={[styles.stepBar, step >= 3 && styles.stepBarActive]} />
          <View style={[styles.stepDot, step >= 3 && styles.stepDotActive]} />
        </View>

        {/* STEP 1: IMPACT & ACKNOWLEDGMENT */}
        {step === 1 && (
          <View>
            <Text style={styles.warningHeading}>
              What happens when you unlink:
            </Text>

            <View style={styles.bulletList}>
              <Text style={styles.bulletItem}>
                🚫 <Text style={styles.boldText}>Immediate Disconnect:</Text> Access to shared letters, chats, memories, voice notes, and games will end immediately for both of you.
              </Text>
              <Text style={styles.bulletItem}>
                📱 <Text style={styles.boldText}>Both Devices Reset:</Text> You and your partner will both land back on the setup screen.
              </Text>
              <Text style={styles.bulletItem}>
                ☁️ <Text style={styles.boldText}>Backup Recommended:</Text> If you want to keep your archives, make sure you ran "Backup Now" in Settings first.
              </Text>
            </View>

            {/* Checkbox Acknowledgment */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => {
                triggerHaptic('light');
                setHasAcknowledged(!hasAcknowledged);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.checkboxBox, hasAcknowledged && styles.checkboxBoxChecked]}>
                {hasAcknowledged && <Text style={styles.checkboxCheckmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                I understand that unlinking immediately disconnects our couple space and cannot be undone.
              </Text>
            </TouchableOpacity>

            <View style={styles.actions}>
              <Button
                title="Cancel (Keep Space)"
                variant="outline"
                size="md"
                onPress={onClose}
                style={styles.button}
              />
              <Button
                title="Next Step ›"
                variant="primary"
                size="md"
                disabled={!hasAcknowledged}
                onPress={() => {
                  triggerHaptic('medium');
                  setStep(2);
                }}
                style={styles.button}
              />
            </View>
          </View>
        )}

        {/* STEP 2: EXPLICIT TYPING VERIFICATION */}
        {step === 2 && (
          <View>
            <Text style={styles.warningHeading}>
              Type "UNLINK" to Confirm
            </Text>
            <Text style={styles.stepInstructions}>
              To ensure this is not an accidental click, please type <Text style={styles.codeText}>UNLINK</Text> in all caps below:
            </Text>

            <Input
              value={confirmationPhrase}
              onChangeText={setConfirmationPhrase}
              placeholder="Type UNLINK"
              autoCapitalize="characters"
              autoCorrect={false}
              containerStyle={styles.inputContainer}
            />

            <Text
              style={[
                styles.feedbackText,
                isPhraseMatched ? styles.feedbackSuccess : styles.feedbackMuted,
              ]}
            >
              {isPhraseMatched
                ? '✓ Phrase matched. You may proceed.'
                : 'Type "UNLINK" to unlock the final step.'}
            </Text>

            <View style={styles.actions}>
              <Button
                title="‹ Back"
                variant="outline"
                size="md"
                onPress={() => setStep(1)}
                style={styles.button}
              />
              <Button
                title="Final Step ›"
                variant="primary"
                size="md"
                disabled={!isPhraseMatched}
                onPress={() => {
                  triggerHaptic('warning');
                  setStep(3);
                }}
                style={styles.button}
              />
            </View>
          </View>
        )}

        {/* STEP 3: FINAL COOLDOWN & IRREVERSIBLE ACTION */}
        {step === 3 && (
          <View>
            <View style={styles.dangerAlertBox}>
              <Text style={styles.dangerAlertEmoji}>🚨</Text>
              <Text style={styles.dangerAlertTitle}>Final Confirmation</Text>
              <Text style={styles.dangerAlertSub}>
                This is your last chance to turn back. Once disconnected, neither partner will be able to restore this session.
              </Text>
            </View>

            {error ? (
              <ErrorState
                title={t('common.errorTitle')}
                message={error.message}
                onRetry={reset}
                retryTitle={t('common.retry')}
              />
            ) : null}

            <View style={styles.step3Col}>
              <Button
                title="❤️ Keep Our Space Safe"
                variant="primary"
                size="lg"
                onPress={onClose}
                style={styles.keepSpaceBtn}
              />

              <Button
                title={
                  countdown > 0
                    ? `Disconnect Couple (${countdown}s cooldown)`
                    : 'Permanently Disconnect Couple Space'
                }
                variant="danger"
                size="md"
                disabled={countdown > 0 || isPending}
                loading={isPending}
                onPress={handleUnlink}
                style={styles.finalUnlinkBtn}
              />
            </View>
          </View>
        )}
      </View>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(16),
  },
  stepDot: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    backgroundColor: '#E2E8F0',
  },
  stepDotActive: {
    backgroundColor: theme.colors.primary,
  },
  stepBar: {
    width: scale(40),
    height: scale(3),
    backgroundColor: '#E2E8F0',
    marginHorizontal: scale(4),
  },
  stepBarActive: {
    backgroundColor: theme.colors.primary,
  },
  warningHeading: {
    fontSize: scale(16),
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: scale(10),
  },
  stepInstructions: {
    fontSize: scale(14),
    color: theme.colors.textSecondary,
    lineHeight: scale(20),
    marginBottom: scale(14),
  },
  codeText: {
    fontFamily: theme.typography.fontFamilies.display,
    fontWeight: '800',
    color: theme.colors.danger,
    letterSpacing: 1,
  },
  boldText: {
    fontWeight: '700',
    color: theme.colors.text,
  },
  bulletList: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: scale(12),
    padding: scale(14),
    marginBottom: scale(16),
    gap: scale(10),
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  bulletItem: {
    fontSize: scale(13),
    color: theme.colors.text,
    lineHeight: scale(19),
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    backgroundColor: '#FFF5F5',
    borderColor: '#FECACA',
    borderWidth: 1.5,
    borderRadius: scale(10),
    padding: scale(12),
    marginBottom: scale(18),
  },
  checkboxBox: {
    width: scale(22),
    height: scale(22),
    borderRadius: scale(6),
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: theme.colors.danger,
    borderColor: theme.colors.danger,
  },
  checkboxCheckmark: {
    color: '#FFFFFF',
    fontSize: scale(14),
    fontWeight: '800',
    marginTop: -scale(2),
  },
  checkboxLabel: {
    flex: 1,
    fontSize: scale(12),
    color: '#991B1B',
    lineHeight: scale(16),
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: scale(8),
  },
  feedbackText: {
    fontSize: scale(12),
    marginBottom: scale(16),
    fontWeight: '600',
  },
  feedbackSuccess: {
    color: '#16A34A',
  },
  feedbackMuted: {
    color: theme.colors.textMuted,
  },
  dangerAlertBox: {
    backgroundColor: '#FFF0ED',
    borderColor: '#FFB8AA',
    borderWidth: 2,
    borderRadius: scale(12),
    padding: scale(16),
    alignItems: 'center',
    marginBottom: scale(18),
  },
  dangerAlertEmoji: {
    fontSize: scale(28),
    marginBottom: scale(4),
  },
  dangerAlertTitle: {
    fontSize: scale(16),
    fontWeight: '800',
    color: theme.colors.danger,
    marginBottom: scale(4),
  },
  dangerAlertSub: {
    fontSize: scale(13),
    color: '#991B1B',
    textAlign: 'center',
    lineHeight: scale(18),
  },
  actions: {
    flexDirection: 'row',
    gap: scale(12),
  },
  button: {
    flex: 1,
  },
  step3Col: {
    gap: scale(12),
    width: '100%',
  },
  keepSpaceBtn: {
    width: '100%',
  },
  finalUnlinkBtn: {
    width: '100%',
  },
});
