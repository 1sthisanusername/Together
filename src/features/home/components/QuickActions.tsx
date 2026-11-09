import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme, scale, triggerHaptic } from '@/shared/theme';

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

  const handlePress = (action: () => void) => {
    triggerHaptic('light');
    action();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('home.quickPlay')}</Text>
      <View style={styles.row}>
        {/* Play Card */}
        <TouchableOpacity
          style={styles.cardWrapper}
          onPress={() => handlePress(onPlayPress)}
          activeOpacity={0.85}
        >
          <View style={styles.cardShadow} />
          <View style={[styles.cardSurface, styles.playSurface]}>
            <View style={[styles.iconCircle, styles.playCircle]}>
              <Text style={styles.icon}>✨</Text>
            </View>
            <Text style={styles.cardTitle}>{t('home.startPlay')}</Text>
          </View>
        </TouchableOpacity>

        {/* Date Card */}
        <TouchableOpacity
          style={styles.cardWrapper}
          onPress={() => handlePress(onDatePress)}
          activeOpacity={0.85}
        >
          <View style={styles.cardShadow} />
          <View style={[styles.cardSurface, styles.dateSurface]}>
            <View style={[styles.iconCircle, styles.dateCircle]}>
              <Text style={styles.icon}>🕯️</Text>
            </View>
            <Text style={styles.cardTitle}>{t('home.planDate')}</Text>
          </View>
        </TouchableOpacity>

        {/* Letter Card */}
        <TouchableOpacity
          style={styles.cardWrapper}
          onPress={() => handlePress(onLetterPress)}
          activeOpacity={0.85}
        >
          <View style={styles.cardShadow} />
          <View style={[styles.cardSurface, styles.letterSurface]}>
            <View style={[styles.iconCircle, styles.letterCircle]}>
              <Text style={styles.icon}>💌</Text>
            </View>
            <Text style={styles.cardTitle}>{t('home.writeLetter')}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: scale(12),
  },
  sectionTitle: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(16),
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: scale(10),
    letterSpacing: -0.3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(10),
  },
  cardWrapper: {
    flex: 1,
    position: 'relative',
    marginRight: 3,
    marginBottom: 3,
  },
  cardShadow: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: -3,
    bottom: -3,
    backgroundColor: theme.colors.shadowInk,
    borderRadius: scale(14),
    zIndex: 0,
  },
  cardSurface: {
    position: 'relative',
    zIndex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: scale(14),
    paddingVertical: scale(14),
    paddingHorizontal: scale(6),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: theme.borders.chunky,
    borderColor: theme.colors.border,
  },
  playSurface: {
    backgroundColor: theme.colors.surface,
  },
  dateSurface: {
    backgroundColor: theme.colors.surface,
  },
  letterSurface: {
    backgroundColor: theme.colors.surface,
  },
  iconCircle: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(6),
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  playCircle: {
    backgroundColor: theme.colors.secondary, // Sunshine #FFC93C
  },
  dateCircle: {
    backgroundColor: theme.colors.primary, // Tomato #FF5A3C
  },
  letterCircle: {
    backgroundColor: theme.colors.bubblegum, // Bubblegum #FF8FB1
  },
  icon: {
    fontSize: scale(18),
  },
  cardTitle: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(12),
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
    letterSpacing: -0.1,
  },
});
