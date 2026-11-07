import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/shared/ui';
import type { Memory } from '@/shared/types';
import { theme } from '@/shared/theme';

export interface MemoryCardProps {
  memory: Memory;
}

export const MemoryCard: React.FC<MemoryCardProps> = ({ memory }) => {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.dateBadge}>
          📅 {new Date(memory.memory_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
        {memory.favorite && <Text style={styles.favoriteBadge}>⭐ Favorite</Text>}
      </View>

      <Text style={styles.title}>{memory.title}</Text>
      {memory.note ? <Text style={styles.note}>{memory.note}</Text> : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 18,
    marginVertical: 6,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  favoriteBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.warning,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text, // #42362e
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  note: {
    fontSize: 14,
    color: theme.colors.textSecondary, // #a8917f
    lineHeight: 21,
  },
});
