import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { SparklesIcon, DatesIcon, LetterIcon, FadeInView } from '@/shared/ui';
import { theme, scale, triggerHaptic, motion } from '@/shared/theme';

export interface QuickActionsProps {
  onPlayPress: () => void;
  onDatePress: () => void;
  onLetterPress: () => void;
}

/** Reusable spring-press action card */
const ActionCard: React.FC<{
  onPress: () => void;
  accessibilityLabel: string;
  icon: React.ReactNode;
  title: string;
}> = ({ onPress, accessibilityLabel, icon, title }) => {
  const scale_ = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale_.value }] }));

  return (
    <Pressable
      style={styles.cardWrapper}
      onPress={() => { triggerHaptic('light'); onPress(); }}
      onPressIn={() => { scale_.value = withSpring(0.95, motion.spring); }}
      onPressOut={() => { scale_.value = withSpring(1, motion.spring); }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[styles.cardSurface, animStyle]}>
        {icon}
        <Text style={styles.cardTitle} maxFontSizeMultiplier={1.3}>{title}</Text>
      </Animated.View>
    </Pressable>
  );
};

export const QuickActions: React.FC<QuickActionsProps> = ({
  onPlayPress,
  onDatePress,
  onLetterPress,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <FadeInView delay={0} marginBottom={0}>
        <Text style={styles.sectionTitle}>{t('home.quickPlay')}</Text>
      </FadeInView>
      <View style={styles.row}>
        <FadeInView delay={60} marginBottom={0} style={{ flex: 1 }}>
          <ActionCard
            onPress={onPlayPress}
            accessibilityLabel={t('home.startPlay')}
            icon={<View style={[styles.iconCircle, styles.playCircle]}><SparklesIcon color={theme.colors.textInverse} size={scale(22)} /></View>}
            title={t('home.startPlay')}
          />
        </FadeInView>

        <FadeInView delay={120} marginBottom={0} style={{ flex: 1 }}>
          <ActionCard
            onPress={onDatePress}
            accessibilityLabel={t('home.planDate')}
            icon={<View style={[styles.iconCircle, styles.dateCircle]}><DatesIcon color={theme.colors.textInverse} size={scale(22)} /></View>}
            title={t('home.planDate')}
          />
        </FadeInView>

        <FadeInView delay={180} marginBottom={0} style={{ flex: 1 }}>
          <ActionCard
            onPress={onLetterPress}
            accessibilityLabel={t('home.writeLetter')}
            icon={<View style={[styles.iconCircle, styles.letterCircle]}><LetterIcon color={theme.colors.textInverse} size={scale(22)} /></View>}
            title={t('home.writeLetter')}
          />
        </FadeInView>
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
    fontSize: scale(17),
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: scale(12),
    letterSpacing: -0.4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(12),
  },
  cardWrapper: {
    flex: 1,
    width: '100%',
  },
  cardSurface: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.lg,
    paddingVertical: scale(20),
    paddingHorizontal: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: theme.borders.subtle,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  iconCircle: {
    width: scale(52),
    height: scale(52),
    borderRadius: theme.roundness.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(10),
    ...theme.shadows.soft,
  },
  playCircle: {
    backgroundColor: theme.colors.kintsugi, // Warm gold
  },
  dateCircle: {
    backgroundColor: theme.colors.coral, // Joyful coral
  },
  letterCircle: {
    backgroundColor: theme.colors.rose, // Blushing rose
  },
  cardTitle: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(13),
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    letterSpacing: -0.1,
    lineHeight: scale(18),
  },
});