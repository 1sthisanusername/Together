import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/shared/ui';
import type { Memory } from '@/shared/types';

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
    color: '#64748B',
  },
  favoriteBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EAB308',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  note: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
});

