import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SparklesIcon, DatesIcon, LetterIcon, FadeInView } from '@/shared/ui';
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
      <FadeInView delay={0}>
        <FadeInView delay={0}>
        <Text style={styles.sectionTitle}>{t('home.quickPlay')}</Text>
      </FadeInView>
      </FadeInView>
      <View style={styles.row}>
        {/* Play Card */}
        <FadeInView delay={60}>
          <TouchableOpacity
            style={styles.cardWrapper}
            onPress={() => handlePress(onPlayPress)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('home.startPlay')}
          >
            <View style={styles.cardSurface}>
              <View style={[styles.iconCircle, styles.playCircle]}>
                <SparklesIcon color={theme.colors.text} size={scale(20)} />
              </View>
              <Text style={styles.cardTitle} maxFontSizeMultiplier={1.3}>
                {t('home.startPlay')}
              </Text>
            </View>
          </TouchableOpacity>
        </FadeInView>

        {/* Date Card */}
        <FadeInView delay={120}>
          <TouchableOpacity
            style={styles.cardWrapper}
            onPress={() => handlePress(onDatePress)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('home.planDate')}
          >
            <View style={styles.cardSurface}>
              <View style={[styles.iconCircle, styles.dateCircle]}>
                <DatesIcon color="#FFFFFF" size={scale(20)} />
              </View>
              <Text style={styles.cardTitle} maxFontSizeMultiplier={1.3}>
                {t('home.planDate')}
              </Text>
            </View>
          </TouchableOpacity>
        </FadeInView>

        {/* Letter Card */}
        <FadeInView delay={180}>
          <TouchableOpacity
            style={styles.cardWrapper}
            onPress={() => handlePress(onLetterPress)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('home.writeLetter')}
          >
            <View style={styles.cardSurface}>
              <View style={[styles.iconCircle, styles.letterCircle]}>
                <LetterIcon color="#FFFFFF" size={scale(20)} />
              </View>
              <Text style={styles.cardTitle} maxFontSizeMultiplier={1.3}>
                {t('home.writeLetter')}
              </Text>
            </View>
          </TouchableOpacity>
        </FadeInView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: scale(10),
  },
  sectionTitle: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(16),
    fontWeight: '700',
    color: theme.colors.text, // #3E2723
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
  },
  cardSurface: {
    backgroundColor: theme.colors.surface, // #FFFFFF with 1px solid #FBE9E7
    borderRadius: 20,
    paddingVertical: scale(16),
    paddingHorizontal: scale(8),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border, // #FBE9E7
    ...theme.shadows.card,
  },
  iconCircle: {
    width: scale(44),
    height: scale(44),
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(8),
  },
  playCircle: {
    backgroundColor: theme.colors.sunset, // Warm Sunset #FFB74D
  },
  dateCircle: {
    backgroundColor: theme.colors.coral, // Joyful Coral #FF7043
  },
  letterCircle: {
    backgroundColor: theme.colors.rose, // Blushing Rose #F48FB1
  },
  cardTitle: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(12),
    fontWeight: '700',
    color: theme.colors.text, // #3E2723
    textAlign: 'center',
    letterSpacing: -0.1,
  },
});
