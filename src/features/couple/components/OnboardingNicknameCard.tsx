import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Button, Input } from '@/shared/ui';
import { theme, scale, triggerHaptic } from '@/shared/theme';

export interface OnboardingNicknameCardProps {
  initialGoogleName: string;
  onConfirm: (nickname: string, letPartnerChoose: boolean) => void;
  isLoading?: boolean;
}

export const OnboardingNicknameCard: React.FC<OnboardingNicknameCardProps> = ({
  initialGoogleName,
  onConfirm,
  isLoading = false,
}) => {
  const [nickname, setNickname] = useState('');
  const [mode, setMode] = useState<'custom' | 'let_partner_choose'>('custom');
  const [error, setError] = useState<string | null>(null);

  const handleContinue = () => {
    if (mode === 'custom') {
      const trimmed = nickname.trim();
      if (!trimmed) {
        setError('Please enter a nickname or choose to let your partner decide.');
        return;
      }
      if (trimmed.length > 30) {
        setError('Nickname must be 30 characters or fewer.');
        return;
      }
      triggerHaptic('medium');
      onConfirm(trimmed, false);
    } else {
      triggerHaptic('medium');
      onConfirm(initialGoogleName || '', true);
    }
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.emoji}>✨</Text>
      <Text style={styles.title}>What should your partner call you?</Text>
      <Text style={styles.subtitle}>
        Give your partner a sweet nickname to see in your shared space.
      </Text>

      {/* Choice Selector */}
      <View style={styles.modeContainer}>
        <TouchableOpacity
          style={[
            styles.modeOption,
            mode === 'custom' && styles.modeOptionActive,
          ]}
          onPress={() => {
            triggerHaptic('selection');
            setMode('custom');
            setError(null);
          }}
          activeOpacity={0.8}
        >
          <View style={[styles.radioCircle, mode === 'custom' && styles.radioCircleActive]}>
            {mode === 'custom' ? <View style={styles.radioDot} /> : null}
          </View>
          <View style={styles.modeTextCol}>
            <Text style={styles.modeTitle}>Choose my nickname</Text>
            <Text style={styles.modeSubtitle}>Set your own custom display name now</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeOption,
            mode === 'let_partner_choose' && styles.modeOptionActive,
          ]}
          onPress={() => {
            triggerHaptic('selection');
            setMode('let_partner_choose');
            setError(null);
          }}
          activeOpacity={0.8}
        >
          <View style={[styles.radioCircle, mode === 'let_partner_choose' && styles.radioCircleActive]}>
            {mode === 'let_partner_choose' ? <View style={styles.radioDot} /> : null}
          </View>
          <View style={styles.modeTextCol}>
            <Text style={styles.modeTitle}>Let my partner choose 💌</Text>
            <Text style={styles.modeSubtitle}>
              Shows your Google first name ({initialGoogleName || 'You'}) until your partner names you
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Custom input only when 'custom' is active */}
      {mode === 'custom' ? (
        <View style={styles.inputWrapper}>
          <Input
            placeholder="Your nickname"
            value={nickname}
            onChangeText={(val) => {
              setNickname(val);
              if (error) setError(null);
            }}
            maxLength={30}
            error={error || undefined}
          />
        </View>
      ) : null}

      <Button
        title="Continue to Space Setup →"
        variant="primary"
        size="lg"
        loading={isLoading}
        onPress={handleContinue}
        style={styles.continueBtn}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: scale(20),
    marginBottom: scale(16),
  },
  emoji: {
    fontSize: scale(36),
    textAlign: 'center',
    marginBottom: scale(8),
  },
  title: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(20),
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: scale(6),
  },
  subtitle: {
    fontFamily: theme.typography.families.body,
    fontSize: scale(14),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: scale(20),
    marginBottom: scale(18),
  },
  modeContainer: {
    gap: scale(10),
    marginBottom: scale(16),
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(14),
    borderRadius: theme.roundness.md,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: theme.colors.borderLight,
    gap: scale(12),
  },
  modeOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceBlush,
  },
  radioCircle: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: theme.colors.primary,
  },
  radioDot: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    backgroundColor: theme.colors.primary,
  },
  modeTextCol: {
    flex: 1,
  },
  modeTitle: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(15),
    fontWeight: '700',
    color: theme.colors.text,
  },
  modeSubtitle: {
    fontFamily: theme.typography.families.body,
    fontSize: scale(12),
    color: theme.colors.textSecondary,
    marginTop: scale(2),
  },
  inputWrapper: {
    marginBottom: scale(8),
  },
  continueBtn: {
    width: '100%',
    marginTop: scale(8),
  },
});

