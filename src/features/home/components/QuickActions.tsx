import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '@/shared/theme';

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
        <TouchableOpacity style={styles.card} onPress={onPlayPress} activeOpacity={0.85}>
          <View style={[styles.iconCircle, styles.playCircle]}>
            <Text style={styles.icon}>✨</Text>
          </View>
          <Text style={styles.cardTitle}>{t('home.startPlay')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={onDatePress} activeOpacity={0.85}>
          <View style={[styles.iconCircle, styles.dateCircle]}>
            <Text style={styles.icon}>🕯️</Text>
          </View>
          <Text style={styles.cardTitle}>{t('home.planDate')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={onLetterPress} activeOpacity={0.85}>
          <View style={[styles.iconCircle, styles.letterCircle]}>
            <Text style={styles.icon}>💌</Text>
          </View>
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
    color: theme.colors.text, // #42362e
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface, // #ffffff
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  playCircle: {
    backgroundColor: theme.colors.surfaceSubtle, // #f0ece6
  },
  dateCircle: {
    backgroundColor: theme.colors.primaryLight, // #f4ede8
  },
  letterCircle: {
    backgroundColor: theme.colors.secondaryLight, // #ede5de
  },
  icon: {
    fontSize: 20,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text, // #42362e
    textAlign: 'center',
    letterSpacing: 0.1,
  },
});
