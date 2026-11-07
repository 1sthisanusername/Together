import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input } from '@/shared/ui';
import type { ImportantDate } from '@/shared/types';
import { useAddImportantDate } from '../hooks/useUsData';
import { theme } from '@/shared/theme';

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
    padding: 22,
    marginVertical: 8,
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderLight,
    borderRadius: 20,
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
    color: theme.colors.text, // #42362e
    letterSpacing: -0.3,
  },
  addForm: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  list: {
    gap: 10,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.surfaceSubtle, // #f0ece6
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
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
    color: theme.colors.text, // #42362e
    marginBottom: 2,
  },
  dateSub: {
    fontSize: 12,
    color: theme.colors.textSecondary, // #a8917f
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
});
