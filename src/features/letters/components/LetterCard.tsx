import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/ui';
import type { EnhancedLetter } from '../hooks/useLetters';
import { theme, scale } from '@/shared/theme';

export interface LetterCardProps {
  letter: EnhancedLetter;
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

  const seal = letter.seal_sticker || '❤️';

  const getStatusBadge = () => {
    if (isFromMe) {
      if (isOpened) {
        return (
          <View style={[styles.badge, styles.badgeOpened]}>
            <Text style={styles.badgeOpenedText}>📖 Opened</Text>
          </View>
        );
      }
      if (isLocked) {
        return (
          <View style={[styles.badge, styles.badgeLocked]}>
            <Text style={styles.badgeLockedText}>
              🔒 Scheduled ({new Date(letter.unlock_at!).toLocaleDateString()})
            </Text>
          </View>
        );
      }
      return (
        <View style={[styles.badge, styles.badgeDelivered]}>
          <Text style={styles.badgeDeliveredText}>✉️ Delivered</Text>
        </View>
      );
    }

    if (isOpened) {
      return (
        <View style={[styles.badge, styles.badgeOpened]}>
          <Text style={styles.badgeOpenedText}>📖 Opened</Text>
        </View>
      );
    }
    if (isLocked) {
      return (
        <View style={[styles.badge, styles.badgeLocked]}>
          <Text style={styles.badgeLockedText}>
            🔒 Sealed Until {new Date(letter.unlock_at!).toLocaleDateString()}
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
    <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
      <Card style={[styles.card, isOpened ? styles.cardOpened : styles.cardSealed]}>
        <View style={styles.headerRow}>
          <View style={styles.sealWrapper}>
            <Text style={styles.envelopeIcon}>{isOpened ? '📖' : '✉️'}</Text>
            <View style={styles.waxSealStamp}>
              <Text style={styles.waxSealText}>{seal}</Text>
            </View>
          </View>
          <View style={styles.badgeRow}>
            {letter.is_vault ? (
              <View style={[styles.badge, styles.badgeVault]}>
                <Text style={styles.badgeVaultText}>🔒 Vault</Text>
              </View>
            ) : null}
            {getStatusBadge()}
          </View>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {letter.title}
        </Text>

        <View style={styles.footerRow}>
          <Text style={styles.subtext}>
            {isFromMe
              ? t('letters.forPartner', { name: partnerName })
              : t('letters.fromPartner', { name: partnerName })}
          </Text>
          {letter.stationery_theme && letter.stationery_theme !== 'parchment_cream' ? (
            <Text style={styles.themeTag}>
              {letter.stationery_theme.replace('_', ' ')}
            </Text>
          ) : null}
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: scale(16),
    marginVertical: scale(6),
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  cardSealed: {
    backgroundColor: theme.colors.surfaceBlush,
  },
  cardOpened: {
    backgroundColor: theme.colors.surface,
    borderStyle: 'dashed',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scale(8),
  },
  sealWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  envelopeIcon: {
    fontSize: scale(24),
  },
  waxSealStamp: {
    width: scale(28),
    height: scale(28),
    borderRadius: 9999,
    backgroundColor: theme.colors.primary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waxSealText: {
    fontSize: scale(14),
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  badge: {
    paddingVertical: scale(4),
    paddingHorizontal: scale(10),
    borderRadius: theme.roundness.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  badgeVault: {
    backgroundColor: theme.colors.rose,
  },
  badgeVaultText: {
    fontSize: scale(10),
    fontWeight: '800',
    color: theme.colors.text,
  },
  badgeOpened: {
    backgroundColor: theme.colors.surfaceBlush,
  },
  badgeOpenedText: {
    fontSize: scale(11),
    fontWeight: '800',
    color: theme.colors.textSecondary,
  },
  badgeLocked: {
    backgroundColor: theme.colors.surfaceDisabled,
  },
  badgeLockedText: {
    fontSize: scale(11),
    fontWeight: '800',
    color: theme.colors.text,
  },
  badgeReady: {
    backgroundColor: theme.colors.sunset,
  },
  badgeReadyText: {
    fontSize: scale(11),
    fontWeight: '800',
    color: theme.colors.text,
  },
  badgeDelivered: {
    backgroundColor: theme.colors.surfaceBlush,
  },
  badgeDeliveredText: {
    fontSize: scale(11),
    fontWeight: '800',
    color: theme.colors.primary,
  },
  title: {
    fontSize: scale(17),
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: scale(6),
    letterSpacing: -0.2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: scale(2),
  },
  subtext: {
    fontSize: scale(13),
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  themeTag: {
    fontSize: scale(10),
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
});
