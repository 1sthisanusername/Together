import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Button } from '@/shared/ui';
import { theme, scale, triggerHaptic } from '@/shared/theme';

export interface RestoreBackupPromptCardProps {
  backupDate: string;
  backupSize: string;
  onRestore: () => void;
  onSkip: () => void;
  isLoading?: boolean;
}

export const RestoreBackupPromptCard: React.FC<RestoreBackupPromptCardProps> = ({
  backupDate,
  backupSize,
  onRestore,
  onSkip,
  isLoading = false,
}) => {
  return (
    <Card style={styles.card}>
      <Text style={styles.emoji}>☁️</Text>
      <Text style={styles.title}>Found Google Drive Backup!</Text>
      <Text style={styles.subtitle}>
        We found an existing Together app backup saved in your private Google Drive appdata.
      </Text>

      <View style={styles.infoBox}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Backup Date:</Text>
          <Text style={styles.infoVal}>{backupDate}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Archive Size:</Text>
          <Text style={styles.infoVal}>{backupSize}</Text>
        </View>
      </View>

      <Text style={styles.safeNote}>
        Restoring will safely populate your letters and memories without creating duplicates.
      </Text>

      <View style={styles.btnRow}>
        <Button
          title="Skip for now"
          variant="ghost"
          size="md"
          onPress={() => {
            triggerHaptic('light');
            onSkip();
          }}
          disabled={isLoading}
          style={{ flex: 1 }}
        />
        <Button
          title="Restore Space ☁️"
          variant="primary"
          size="md"
          loading={isLoading}
          onPress={() => {
            triggerHaptic('medium');
            onRestore();
          }}
          style={{ flex: 1.4 }}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: scale(20),
    marginBottom: scale(16),
    borderColor: theme.colors.sunset,
    borderWidth: 1.5,
  },
  emoji: {
    fontSize: scale(36),
    textAlign: 'center',
    marginBottom: scale(8),
  },
  title: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(19),
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: scale(6),
  },
  subtitle: {
    fontFamily: theme.typography.families.body,
    fontSize: scale(13),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: scale(18),
    marginBottom: scale(14),
  },
  infoBox: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.roundness.md,
    padding: scale(12),
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    marginBottom: scale(10),
    gap: scale(6),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontFamily: theme.typography.families.body,
    fontSize: scale(13),
    color: theme.colors.textSecondary,
  },
  infoVal: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(13),
    color: theme.colors.text,
  },
  safeNote: {
    fontFamily: theme.typography.families.body,
    fontSize: scale(11),
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: scale(14),
  },
  btnRow: {
    flexDirection: 'row',
    gap: scale(10),
  },
});

