import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Share, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Button } from '@/shared/ui';
import { theme, scale } from '@/shared/theme';

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
    padding: scale(24),
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderLight,
  },
  title: {
    fontSize: scale(20),
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: scale(6),
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: scale(14),
    color: theme.colors.textSecondary,
    lineHeight: scale(20),
    marginBottom: scale(16),
    textAlign: 'center',
  },
  codeContainer: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.roundness.lg,
    paddingVertical: scale(18),
    paddingHorizontal: scale(24),
    alignItems: 'center',
    marginBottom: scale(8),
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  codeLabel: {
    fontSize: scale(12),
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: scale(6),
  },
  codeText: {
    fontSize: scale(34),
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: scale(6),
  },
  expiryText: {
    fontSize: scale(12),
    color: theme.colors.textSecondary,
    marginBottom: scale(12),
  },
  linkRow: {
    width: '100%',
    backgroundColor: theme.colors.surfaceSubtle,
    padding: scale(10),
    borderRadius: scale(12),
    marginBottom: scale(16),
    alignItems: 'center',
  },
  linkLabel: {
    fontSize: scale(11),
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: scale(2),
  },
  linkText: {
    fontSize: scale(12),
    color: theme.colors.primary,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: scale(10),
    width: '100%',
    marginBottom: scale(16),
  },
  actionBtn: {
    flex: 1,
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    paddingVertical: scale(8),
  },
  waitingText: {
    fontSize: scale(14),
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  cancelBtn: {
    marginTop: scale(8),
  },
});
