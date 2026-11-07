import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input } from '@/shared/ui';
import type { ImportantDate } from '@/shared/types';
import { useAddImportantDate } from '../hooks/useUsData';

export interface ImportantDatesListProps {
  dates: ImportantDate[];
}

export const ImportantDatesList: React.FC<ImportantDatesListProps> = ({ dates }) => {
  const { t } = useTranslation();
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [dateStr, setDateStr] = useState('');

  const { mutate: addDate, isPending } = useAddImportantDate();

  const handleAdd = () => {
    if (!title.trim() || !dateStr.trim()) return;
    addDate({
      title: title.trim(),
      eventDate: dateStr.trim(),
      category: 'anniversary',
    });
    setTitle('');
    setDateStr('');
    setShowAdd(false);
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>📅 {t('us.importantDatesTitle')}</Text>
        <Button
          title={showAdd ? t('common.cancel') : `+ ${t('us.addDate')}`}
          size="sm"
          variant="ghost"
          onPress={() => setShowAdd(!showAdd)}
        />
      </View>

      {showAdd ? (
        <View style={styles.addForm}>
          <Input
            placeholder={t('us.dateTitlePlaceholder')}
            value={title}
            onChangeText={setTitle}
          />
          <Input
            placeholder="YYYY-MM-DD"
            value={dateStr}
            onChangeText={setDateStr}
          />
          <Button
            title={t('common.save')}
            variant="primary"
            size="sm"
            loading={isPending}
            onPress={handleAdd}
          />
        </View>
      ) : null}

      <View style={styles.list}>
        {dates.length === 0 ? (
          <Text style={styles.emptyText}>{t('common.empty')}</Text>
        ) : (
          dates.map((d) => (
            <View key={d.id} style={styles.dateRow}>
              <View style={styles.dateIconWrapper}>
                <Text style={styles.dateIcon}>💍</Text>
              </View>
              <View style={styles.dateContent}>
                <Text style={styles.dateTitle}>{d.title}</Text>
                <Text style={styles.dateSub}>
                  {new Date(d.event_date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 20,
    marginVertical: 8,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  addForm: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  list: {
    gap: 10,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FDF2F8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCE7F3',
  },
  dateIconWrapper: {
    marginRight: 12,
  },
  dateIcon: {
    fontSize: 20,
  },
  dateContent: {
    flex: 1,
  },
  dateTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 2,
  },
  dateSub: {
    fontSize: 12,
    color: '#BE185D',
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
});

