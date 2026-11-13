import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { WarmGradient, HeartBeat } from '@/shared/ui';
import { theme, scale, triggerHaptic } from '@/shared/theme';

export interface ActiveSessionBannerProps {
  onJoin: () => void;
}

export const ActiveSessionBanner: React.FC<ActiveSessionBannerProps> = ({ onJoin }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.cardWrapper}>
      <WarmGradient style="hero" borderRadius={20} containerStyle={styles.gradientCard}>
        <View style={styles.banner}>
          <View style={styles.textContainer}>
            <View style={styles.liveBadge}>
              <HeartBeat active color="#FFB74D" size={6} />
              <Text style={styles.liveLabel}>LIVE</Text>
            </View>
            <Text style={styles.bannerText}>{t('home.activeSessionBanner')}</Text>
          </View>
          <TouchableOpacity
            style={styles.joinPillBtn}
            onPress={() => {
              triggerHaptic('light');
              onJoin();
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.joinPillText}>{t('home.joinSession')}</Text>
          </TouchableOpacity>
        </View>
      </WarmGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
    marginVertical: scale(7),
    borderRadius: 20,
    ...theme.shadows.card,
  },
  gradientCard: {
    borderRadius: 20,
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
    borderRadius: 9999,
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
    minHeight: 38,
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
