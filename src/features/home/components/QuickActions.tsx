import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

export interface QuickActionsProps {
  onPlayPress: () => void;
  onDatePress: () => void;
  onLetterPress: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onPlayPress,
  onDatePress,
  onLetterPress,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('home.quickPlay')}</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.card, styles.playCard]} onPress={onPlayPress} activeOpacity={0.8}>
          <Text style={styles.icon}>🎮</Text>
          <Text style={styles.cardTitle}>{t('home.startPlay')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, styles.dateCard]} onPress={onDatePress} activeOpacity={0.8}>
          <Text style={styles.icon}>🕯️</Text>
          <Text style={styles.cardTitle}>{t('home.planDate')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, styles.letterCard]} onPress={onLetterPress} activeOpacity={0.8}>
          <Text style={styles.icon}>💌</Text>
          <Text style={styles.cardTitle}>{t('home.writeLetter')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  playCard: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  dateCard: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  letterCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  icon: {
    fontSize: 26,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
});

