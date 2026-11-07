import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/shared/ui';
import type { Profile } from '@/shared/types';
import { theme } from '@/shared/theme';

export interface CoupleHeaderProps {
  coupleName?: string | null;
  me: Profile | null;
  partner: Profile | null;
  daysTogether: number | null;
}

export const CoupleHeader: React.FC<CoupleHeaderProps> = ({
  coupleName,
  me,
  partner,
  daysTogether,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.avatarsRow}>
        <View style={styles.avatarWrapper}>
          <Avatar name={me?.display_name || 'Me'} url={me?.avatar_url} size={58} />
          <Text style={styles.nameLabel} numberOfLines={1}>
            {me?.display_name || 'You'}
          </Text>
        </View>

        <View style={styles.heartWrapper}>
          <Text style={styles.heartText}>♥</Text>
        </View>

        <View style={styles.avatarWrapper}>
          <Avatar name={partner?.display_name || 'Partner'} url={partner?.avatar_url} size={58} />
          <Text style={styles.nameLabel} numberOfLines={1}>
            {partner?.display_name || 'Partner'}
          </Text>
        </View>
      </View>

      <Text style={styles.coupleTitle}>{coupleName || 'Together'}</Text>

      {daysTogether !== null ? (
        <View style={styles.counterBadge}>
          <Text style={styles.counterNumber}>{daysTogether}</Text>
          <Text style={styles.counterLabel}>{t('home.daysTogether')}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarWrapper: {
    alignItems: 'center',
    width: 84,
  },
  nameLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary, // #a8917f
    marginTop: 6,
    textAlign: 'center',
  },
  heartWrapper: {
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  heartText: {
    fontSize: 26,
    color: theme.colors.primary, // #b69788
  },
  coupleTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.text, // #42362e
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSubtle, // #f0ece6
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border, // #d2ccc4
  },
  counterNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.primary, // #b69788
    marginRight: 6,
  },
  counterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary, // #a8917f
  },
});
