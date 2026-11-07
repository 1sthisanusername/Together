import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/ui';
import type { Letter } from '@/shared/types';

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
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
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
  },
  cardSealed: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
  },
  cardOpened: {
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
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
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  badgeOpened: {
    backgroundColor: '#DCFCE7',
  },
  badgeOpenedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  badgeLocked: {
    backgroundColor: '#FEF3C7',
  },
  badgeLockedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  badgeReady: {
    backgroundColor: '#EEF2FF',
  },
  badgeReadyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtext: {
    fontSize: 13,
    color: '#64748B',
  },
});

