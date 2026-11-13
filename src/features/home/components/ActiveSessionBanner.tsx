import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { WarmGradient, HeartBeat } from '@/shared/ui';
import { theme, scale, triggerHaptic, motion } from '@/shared/theme';

export interface ActiveSessionBannerProps {
  onJoin: () => void;
}

export const ActiveSessionBanner: React.FC<ActiveSessionBannerProps> = ({ onJoin }) => {
  const { t } = useTranslation();
  const pillScale = useSharedValue(1);
  const pillAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pillScale.value }],
  }));

  return (
    <View style={styles.cardWrapper}>
      <WarmGradient style="hero" borderRadius={theme.roundness.lg} containerStyle={styles.gradientCard}>
        <View style={styles.banner}>
          <View style={styles.textContainer}>
            <View style={styles.liveBadge}>
              <HeartBeat active color="#FFB74D" size={6} />
              <Text style={styles.liveLabel}>LIVE</Text>
            </View>
            <Text style={styles.bannerText}>{t('home.activeSessionBanner')}</Text>
          </View>
          <Pressable
            onPress={() => {
              triggerHaptic('medium');
              onJoin();
            }}
            onPressIn={() => {
              pillScale.value = withSpring(0.94, motion.spring);
            }}
            onPressOut={() => {
              pillScale.value = withSpring(1, motion.spring);
            }}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel={t('home.joinSession')}
          >
            <Animated.View style={[styles.joinPillBtn, pillAnimStyle]}>
              <Text style={styles.joinPillText}>{t('home.joinSession')}</Text>
            </Animated.View>
          </Pressable>
        </View>
      </WarmGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
    marginVertical: scale(8),
    borderRadius: theme.roundness.lg,
    ...theme.shadows.card,
  },
  gradientCard: {
    borderRadius: theme.roundness.lg,
  },
  banner: {
    paddingVertical: scale(14),
    paddingHorizontal: scale(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: scale(10),
    gap: scale(8),
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  liveLabel: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(10),
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  bannerText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(13),
    color: '#FFFFFF',
    flexShrink: 1,
  },
  joinPillBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.roundness.full,
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
    minHeight: Math.max(48, scale(38)),
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinPillText: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(12),
    fontWeight: '700',
    color: theme.colors.primary, // #E53935
  },
});
