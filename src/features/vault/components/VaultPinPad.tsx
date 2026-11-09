import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { triggerHaptic } from '@/shared/theme';

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
        <Text style={styles.padlockEmoji}>🔒</Text>
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
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  padlockIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFC93C',
    borderWidth: 2.5,
    borderColor: '#2B2118',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#2B2118',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  padlockEmoji: {
    fontSize: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2B2118',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#5C4A3A',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2B2118',
    backgroundColor: '#FFFFFF',
  },
  dotFilled: {
    backgroundColor: '#2EC4B6',
    transform: [{ scale: 1.15 }],
  },
  errorText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF5A3C',
    marginBottom: 14,
    textAlign: 'center',
  },
  keypad: {
    width: '100%',
    maxWidth: 280,
    gap: 12,
    marginTop: 8,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  keyButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFF4E3',
    borderWidth: 2,
    borderColor: '#2B2118',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2B2118',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  keySpecial: {
    backgroundColor: '#EAE0D2',
  },
  keyText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2B2118',
  },
  keySpecialText: {
    fontSize: 18,
  },
});
