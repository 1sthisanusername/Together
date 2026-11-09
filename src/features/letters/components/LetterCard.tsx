import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/ui';
import type { EnhancedLetter } from '../hooks/useLetters';
import { theme } from '@/shared/theme';

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
    padding: 16,
    marginVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#2B2118',
    shadowColor: '#2B2118',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  cardSealed: {
    backgroundColor: '#FFF8EE',
  },
  cardOpened: {
    backgroundColor: '#F5EFE6',
    borderStyle: 'dashed',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sealWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  envelopeIcon: {
    fontSize: 24,
  },
  waxSealStamp: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF5A3C',
    borderWidth: 1.5,
    borderColor: '#2B2118',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waxSealText: {
    fontSize: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#2B2118',
  },
  badgeVault: {
    backgroundColor: '#FF8FB1',
  },
  badgeVaultText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2B2118',
  },
  badgeOpened: {
    backgroundColor: '#E8F8F5',
  },
  badgeOpenedText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0E3B33',
  },
  badgeLocked: {
    backgroundColor: '#FFE8B6',
  },
  badgeLockedText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2B2118',
  },
  badgeReady: {
    backgroundColor: '#FFC93C',
  },
  badgeReadyText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2B2118',
  },
  badgeDelivered: {
    backgroundColor: '#E8F8F5',
  },
  badgeDeliveredText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0E3B33',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2B2118',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  subtext: {
    fontSize: 13,
    color: '#7A6B5D',
    fontWeight: '600',
  },
  themeTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7A6B5D',
    textTransform: 'capitalize',
  },
});
