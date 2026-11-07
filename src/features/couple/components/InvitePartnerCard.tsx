import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Button } from '@/shared/ui';
import { theme } from '@/shared/theme';

export interface InvitePartnerCardProps {
  code: string;
  expiresAt?: string;
}

export const InvitePartnerCard: React.FC<InvitePartnerCardProps> = ({
  code,
  expiresAt,
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{t('couple.shareCodeTitle')}</Text>
      <Text style={styles.subtitle}>{t('couple.shareCodeSubtitle')}</Text>

      <View style={styles.codeContainer}>
        <Text style={styles.codeLabel}>{t('couple.yourCode')}</Text>
        <Text style={styles.codeText}>{code}</Text>
      </View>

      <Button
        title={copied ? t('common.copied') : t('common.copy')}
        variant={copied ? 'secondary' : 'outline'}
        size="md"
        onPress={handleCopy}
        style={styles.copyButton}
      />

      <View style={styles.waitingContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.waitingText}>{t('couple.waitingForPartner')}</Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    alignItems: 'center',
    padding: 24,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderLight,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text, // #42362e
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary, // #a8917f
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  codeContainer: {
    backgroundColor: theme.colors.surfaceSubtle, // #f0ece6
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
    borderWidth: 1.5,
    borderColor: theme.colors.border, // #d2ccc4
    borderStyle: 'dashed',
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  codeText: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.colors.text, // #42362e
    letterSpacing: 6,
  },
  copyButton: {
    width: '100%',
    marginBottom: 20,
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  waitingText: {
    marginLeft: 10,
    fontSize: 14,
    color: theme.colors.primary, // #b69788
    fontWeight: '600',
  },
});
