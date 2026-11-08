import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Share, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Button } from '@/shared/ui';
import { theme } from '@/shared/theme';

export interface InvitePartnerCardProps {
  code: string;
  expiresAt?: string;
  onCancel?: () => void;
  onResend?: () => void;
}

export const InvitePartnerCard: React.FC<InvitePartnerCardProps> = ({
  code,
  expiresAt,
  onCancel,
  onResend,
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const inviteLink = `together://pair?code=${code}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on Together! Use my invite code: ${code}\nOr open link: ${inviteLink}`,
        title: 'Together Couple Space Invite',
      });
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleResend = async () => {
    if (onResend) {
      setIsResending(true);
      try {
        await onResend();
      } finally {
        setTimeout(() => setIsResending(false), 1000);
      }
    } else {
      handleShare();
    }
  };

  const formattedExpiry = expiresAt
    ? new Date(expiresAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{t('couple.shareCodeTitle')}</Text>
      <Text style={styles.subtitle}>{t('couple.shareCodeSubtitle')}</Text>

      <View style={styles.codeContainer}>
        <Text style={styles.codeLabel}>{t('couple.yourCode')}</Text>
        <Text style={styles.codeText}>{code}</Text>
      </View>

      {formattedExpiry ? (
        <Text style={styles.expiryText}>Expires: {formattedExpiry}</Text>
      ) : null}

      <View style={styles.linkRow}>
        <Text style={styles.linkLabel}>Invite Link:</Text>
        <Text style={styles.linkText} numberOfLines={1} ellipsizeMode="middle">
          {inviteLink}
        </Text>
      </View>

      <View style={styles.buttonRow}>
        <Button
          title={copied ? t('common.copied') : 'Share / Copy Link'}
          variant={copied ? 'secondary' : 'primary'}
          size="md"
          onPress={handleShare}
          style={styles.actionBtn}
        />
        <Button
          title={isResending ? 'Refreshing...' : 'Resend Code'}
          variant="outline"
          size="md"
          onPress={handleResend}
          disabled={isResending}
          style={styles.actionBtn}
        />
      </View>

      <View style={styles.waitingContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.waitingText}>{t('couple.waitingForPartner')}</Text>
      </View>

      {onCancel ? (
        <Button
          title="Cancel Space"
          variant="ghost"
          size="sm"
          onPress={onCancel}
          style={styles.cancelBtn}
        />
      ) : null}
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
    color: theme.colors.text,
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  codeContainer: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
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
    color: theme.colors.text,
    letterSpacing: 6,
  },
  expiryText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  linkRow: {
    width: '100%',
    backgroundColor: theme.colors.surfaceSubtle,
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  linkLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  linkText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  waitingText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  cancelBtn: {
    marginTop: 8,
  },
});
