import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '@/features/auth';
import { useActiveCouple } from '@/features/couple';
import { Card } from '@/shared/ui';
import { theme } from '@/shared/theme';

export const CoupleProfileCard: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const { data: coupleData } = useActiveCouple();

  const partner = coupleData?.partner;
  const couple = coupleData?.couple;

  const myName = profile?.display_name || user?.email?.split('@')[0] || 'You';
  const partnerName = partner?.display_name || 'Partner';

  const myInitial = myName.charAt(0).toUpperCase();
  const partnerInitial = partnerName.charAt(0).toUpperCase();

  const myTz = profile?.timezone || 'Auto';
  const partnerTz = partner?.timezone || 'Auto';

  // Format relationship anniversary / date together if present
  const anniversaryFormatted = couple?.start_date
    ? new Date(couple.start_date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <Card style={styles.card}>
      <View style={styles.avatarsRow}>
        <View style={styles.avatarWrapper}>
          <View style={[styles.avatar, styles.myAvatar]}>
            <Text style={styles.avatarInitial}>{myInitial}</Text>
          </View>
          <Text style={styles.avatarName} numberOfLines={1}>{myName}</Text>
          <Text style={styles.avatarTz} numberOfLines={1}>📍 {myTz.split('/').pop()?.replace('_', ' ')}</Text>
        </View>

        <View style={styles.centerHeart}>
          <Text style={styles.heartIcon}>♥</Text>
          <Text style={styles.togetherTag}>Together</Text>
        </View>

        <View style={styles.avatarWrapper}>
          <View style={[styles.avatar, styles.partnerAvatar]}>
            <Text style={styles.avatarInitial}>{partnerInitial}</Text>
          </View>
          <Text style={styles.avatarName} numberOfLines={1}>{partnerName}</Text>
          <Text style={styles.avatarTz} numberOfLines={1}>📍 {partnerTz.split('/').pop()?.replace('_', ' ')}</Text>
        </View>
      </View>

      {anniversaryFormatted && (
        <View style={styles.anniversaryRow}>
          <Text style={styles.anniversaryLabel}>💍 Anniversary:</Text>
          <Text style={styles.anniversaryValue}>{anniversaryFormatted}</Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderColor: theme.colors.borderLight,
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  avatarWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  myAvatar: {
    backgroundColor: '#7FA083', // primary soft sage/green
  },
  partnerAvatar: {
    backgroundColor: '#C48B9F', // partner soft rose
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  avatarName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  avatarTz: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  centerHeart: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  heartIcon: {
    fontSize: 26,
    color: '#E11D48',
    marginBottom: 2,
  },
  togetherTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  anniversaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 6,
  },
  anniversaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  anniversaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
  },
});
