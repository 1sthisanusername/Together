import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Button } from '@/shared/ui';

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
    // Clipboard copy
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
        <ActivityIndicator size="small" color="#6366F1" />
        <Text style={styles.waitingText}>{t('couple.waitingForPartner')}</Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  codeContainer: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderStyle: 'dashed',
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  codeText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#312E81',
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
    color: '#6366F1',
    fontWeight: '500',
  },
});

