import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/ui';
import type { Letter } from '@/shared/types';
import { theme } from '@/shared/theme';

export interface LetterCardProps {
  letter: Letter;
  isFromMe: boolean;
  partnerName: string;
  onPress: () => void;
}

export const LetterCard: React.FC<LetterCardProps> = ({
  letter,
  isFromMe,
  partnerName,
  onPress,
}) => {
  const { t } = useTranslation();

  const isLocked =
    letter.unlock_at && new Date(letter.unlock_at).getTime() > Date.now();
  const isOpened = !!letter.opened_at;

  const getStatusBadge = () => {
    if (isOpened) {
      return (
        <View style={[styles.badge, styles.badgeOpened]}>
          <Text style={styles.badgeOpenedText}>✓ Opened</Text>
        </View>
      );
    }
    if (isLocked) {
      return (
        <View style={[styles.badge, styles.badgeLocked]}>
          <Text style={styles.badgeLockedText}>
            🔒 {new Date(letter.unlock_at!).toLocaleDateString()}
          </Text>
        </View>
      );
    }
    return (
      <View style={[styles.badge, styles.badgeReady]}>
        <Text style={styles.badgeReadyText}>💌 Ready to Open</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Card style={[styles.card, isOpened ? styles.cardOpened : styles.cardSealed]}>
        <View style={styles.headerRow}>
          <Text style={styles.envelopeIcon}>{isOpened ? '📖' : '✉️'}</Text>
          {getStatusBadge()}
        </View>

        <Text style={styles.title}>{letter.title}</Text>

        <Text style={styles.subtext}>
          {isFromMe
            ? t('letters.forPartner', { name: partnerName })
            : t('letters.fromPartner', { name: partnerName })}
        </Text>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 18,
    marginVertical: 6,
    borderRadius: 18,
    borderColor: theme.colors.borderLight,
  },
  cardSealed: {
    backgroundColor: theme.colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary, // #b69788
  },
  cardOpened: {
    backgroundColor: theme.colors.surfaceSubtle, // #f0ece6
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.border, // #d2ccc4
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  envelopeIcon: {
    fontSize: 24,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  badgeOpened: {
    backgroundColor: theme.colors.successLight,
  },
  badgeOpenedText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.success,
  },
  badgeLocked: {
    backgroundColor: theme.colors.warningLight,
  },
  badgeLockedText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.warning,
  },
  badgeReady: {
    backgroundColor: theme.colors.primaryLight,
  },
  badgeReadyText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary, // #b69788
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text, // #42362e
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  subtext: {
    fontSize: 13,
    color: theme.colors.textSecondary, // #a8917f
  },
});
