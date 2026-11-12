import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Button, Input } from '@/shared/ui';
import { theme, scale, triggerHaptic } from '@/shared/theme';

export interface PartnerNamePromptCardProps {
  partnerName: string;
  onSave: (chosenNickname: string) => void;
  onDismiss: () => void;
  isLoading?: boolean;
}

export const PartnerNamePromptCard: React.FC<PartnerNamePromptCardProps> = ({
  partnerName,
  onSave,
  onDismiss,
  isLoading = false,
}) => {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setError(`Please enter a nickname for ${partnerName}`);
      return;
    }
    triggerHaptic('medium');
    onSave(trimmed);
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.emoji}>💌</Text>
      <Text style={styles.title}>Pick a nickname for {partnerName}</Text>
      <Text style={styles.subtitle}>
        Your partner left their nickname up to you! What sweet name would you like to call them?
      </Text>

      <Input
        placeholder={`e.g. My Love, ${partnerName}...`}
        value={nickname}
        onChangeText={(val) => {
          setNickname(val);
          if (error) setError(null);
        }}
        maxLength={30}
        error={error || undefined}
      />

      <View style={styles.btnRow}>
        <Button
          title="Keep Default"
          variant="ghost"
          size="md"
          onPress={onDismiss}
          style={{ flex: 1 }}
        />
        <Button
          title="Save Nickname ✨"
          variant="primary"
          size="md"
          loading={isLoading}
          disabled={!nickname.trim() || isLoading}
          onPress={handleSave}
          style={{ flex: 1.5 }}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: scale(18),
    marginVertical: scale(12),
    backgroundColor: theme.colors.surfaceBlush,
    borderColor: theme.colors.rose,
    borderWidth: 1.5,
  },
  emoji: {
    fontSize: scale(32),
    textAlign: 'center',
    marginBottom: scale(6),
  },
  title: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(18),
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: scale(4),
  },
  subtitle: {
    fontFamily: theme.typography.families.body,
    fontSize: scale(13),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: scale(18),
    marginBottom: scale(14),
  },
  btnRow: {
    flexDirection: 'row',
    gap: scale(10),
    marginTop: scale(10),
  },
});

