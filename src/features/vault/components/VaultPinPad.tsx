import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LockIcon } from '@/shared/ui';
import { theme, scale, triggerHaptic } from '@/shared/theme';

export interface VaultPinPadProps {
  isSetup?: boolean;
  onSuccess: (pin: string) => void;
  error?: string | null;
}

export const VaultPinPad: React.FC<VaultPinPadProps> = ({
  isSetup = false,
  onSuccess,
  error,
}) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>(isSetup ? 'enter' : 'confirm');
  const [localError, setLocalError] = useState<string | null>(null);

  const currentPin = isSetup && step === 'confirm' ? confirmPin : pin;

  const handlePressDigit = (digit: string) => {
    triggerHaptic('light');
    setLocalError(null);

    if (currentPin.length >= 4) return;
    const nextPin = currentPin + digit;

    if (isSetup) {
      if (step === 'enter') {
        setPin(nextPin);
        if (nextPin.length === 4) {
          triggerHaptic('medium');
          setStep('confirm');
        }
      } else {
        setConfirmPin(nextPin);
        if (nextPin.length === 4) {
          if (nextPin === pin) {
            triggerHaptic('success');
            onSuccess(nextPin);
          } else {
            triggerHaptic('error');
            setLocalError('PINs do not match. Try again.');
            setConfirmPin('');
            setStep('enter');
            setPin('');
          }
        }
      }
    } else {
      setPin(nextPin);
      if (nextPin.length === 4) {
        onSuccess(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    triggerHaptic('light');
    if (isSetup && step === 'confirm') {
      setConfirmPin((prev) => prev.slice(0, -1));
    } else {
      setPin((prev) => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    triggerHaptic('medium');
    setPin('');
    setConfirmPin('');
    if (isSetup) setStep('enter');
  };

  const titleText = isSetup
    ? step === 'enter'
      ? 'Create a Vault PIN'
      : 'Confirm your PIN'
    : 'Enter Vault PIN';

  const subText = isSetup
    ? step === 'enter'
      ? 'Choose a 4-digit code to protect your private couple secrets'
      : 'Re-enter the 4-digit code to confirm'
    : 'Keep your most intimate letters and memories safe';

  const activeError = localError || error;

  return (
    <View style={styles.container}>
      <View style={styles.padlockIcon}>
        <LockIcon color={theme.colors.text} size={28} focused />
      </View>

      <Text style={styles.title}>{titleText}</Text>
      <Text style={styles.subtitle}>{subText}</Text>

      {/* 4 Pin Dots */}
      <View style={styles.dotsRow}>
        {[0, 1, 2, 3].map((idx) => {
          const filled = idx < currentPin.length;
          return (
            <View
              key={idx}
              style={[
                styles.dot,
                filled && styles.dotFilled,
              ]}
            />
          );
        })}
      </View>

      {activeError ? <Text style={styles.errorText}>{activeError}</Text> : null}

      {/* Chunky Keypad */}
      <View style={styles.keypad}>
        {[
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
          ['C', '0', '⌫'],
        ].map((row, rIdx) => (
          <View key={rIdx} style={styles.keyRow}>
            {row.map((key) => {
              const isSpecial = key === 'C' || key === '⌫';
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.keyButton,
                    isSpecial && styles.keySpecial,
                  ]}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={
                    key === 'C' ? 'Clear PIN' : key === '⌫' ? 'Delete digit' : `Digit ${key}`
                  }
                  onPress={() => {
                    if (key === 'C') handleClear();
                    else if (key === '⌫') handleBackspace();
                    else handlePressDigit(key);
                  }}
                >
                  <Text style={[styles.keyText, isSpecial && styles.keySpecialText]}>
                    {key}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: scale(24),
    paddingHorizontal: scale(20),
  },
  padlockIcon: {
    width: scale(64),
    height: scale(64),
    borderRadius: 9999,
    backgroundColor: theme.colors.sunset,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(16),
    ...theme.shadows.card,
  },
  padlockEmoji: {
    fontSize: scale(32),
  },
  title: {
    fontSize: scale(22),
    fontWeight: '900',
    color: theme.colors.text,
    marginBottom: scale(6),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: scale(13),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: scale(24),
    paddingHorizontal: scale(20),
    lineHeight: scale(18),
  },
  dotsRow: {
    flexDirection: 'row',
    gap: scale(16),
    marginBottom: scale(20),
  },
  dot: {
    width: scale(20),
    height: scale(20),
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  dotFilled: {
    backgroundColor: theme.colors.primary,
    transform: [{ scale: 1.15 }],
  },
  errorText: {
    fontSize: scale(13),
    fontWeight: '700',
    color: theme.colors.danger,
    marginBottom: scale(14),
    textAlign: 'center',
  },
  keypad: {
    width: '82%',
    maxWidth: scale(280),
    gap: scale(12),
    marginTop: scale(8),
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(12),
  },
  keyButton: {
    flex: 1,
    height: scale(56),
    borderRadius: theme.roundness.lg,
    backgroundColor: theme.colors.surfaceBlush,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.hardSm,
  },
  keySpecial: {
    backgroundColor: theme.colors.surfaceDisabled,
  },
  keyText: {
    fontSize: scale(22),
    fontWeight: '800',
    color: theme.colors.text,
  },
  keySpecialText: {
    fontSize: scale(18),
  },
});

