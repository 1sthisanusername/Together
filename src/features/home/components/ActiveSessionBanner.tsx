import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui';

export interface ActiveSessionBannerProps {
  onJoin: () => void;
}

export const ActiveSessionBanner: React.FC<ActiveSessionBannerProps> = ({ onJoin }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.banner}>
      <View style={styles.textContainer}>
        <Text style={styles.pulseDot}>● </Text>
        <Text style={styles.bannerText}>{t('home.activeSessionBanner')}</Text>
      </View>
      <Button
        title={t('home.joinSession')}
        size="sm"
        variant="primary"
        onPress={onJoin}
        style={styles.joinButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    marginVertical: 10,
    width: '100%',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  pulseDot: {
    color: '#4F46E5',
    fontSize: 16,
  },
  bannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3730A3',
    flexShrink: 1,
  },
  joinButton: {
    backgroundColor: '#4F46E5',
  },
});

