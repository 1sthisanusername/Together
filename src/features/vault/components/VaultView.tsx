import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLetters, LetterCard, ReadLetterModal, EnhancedLetter } from '@/features/letters';
import { useVaultItems, useCreateVaultItem, useDeleteVaultItem, VaultItem } from '../hooks/useVaultItems';
import { useAuthStore } from '@/features/auth';
import { useActiveCouple } from '@/features/couple';
import { Button, LoadingState, EmptyState, FormSheet } from '@/shared/ui';
import { theme, scale, triggerHaptic } from '@/shared/theme';

export interface VaultViewProps {
  onLock: () => void;
}

export const VaultView: React.FC<VaultViewProps> = ({ onLock }) => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const { data: coupleData } = useActiveCouple();
  const partnerName = coupleData?.partner?.display_name || 'Partner';

  const [activeTab, setActiveTab] = useState<'letters' | 'notes'>('letters');
  const [selectedLetter, setSelectedLetter] = useState<EnhancedLetter | null>(null);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  const { data: vaultLetters, isLoading: lettersLoading } = useLetters({ includeVaultOnly: true });
  const { data: vaultItems, isLoading: itemsLoading } = useVaultItems();
  const { mutateAsync: createItem, isPending: isCreating } = useCreateVaultItem();
  const { mutateAsync: deleteItem } = useDeleteVaultItem();

  const handleCreateNote = async () => {
    if (!newNoteContent.trim()) return;
    try {
      await createItem({
        title: newNoteTitle.trim(),
        content: newNoteContent.trim(),
        itemType: 'secret',
      });
      setNewNoteTitle('');
      setNewNoteContent('');
      setShowAddNoteModal(false);
      triggerHaptic('success');
    } catch {
      Alert.alert('Error', 'Could not save note to vault.');
    }
  };

  const handleDeleteItem = (id: string) => {
    Alert.alert(
      'Delete Vault Note',
      'Are you sure you want to permanently delete this secret note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItem(id);
              triggerHaptic('medium');
            } catch {
              Alert.alert('Error', 'Failed to delete note.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Vault Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <Text style={styles.vaultBadgeEmoji}>🔒</Text>
          <View>
            <Text style={styles.vaultTitle}>Couple Vault</Text>
            <Text style={styles.vaultSubtitle}>Private & Encrypted</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.lockBtn} onPress={onLock} activeOpacity={0.8}>
          <Text style={styles.lockBtnText}>Lock 🔒</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'letters' && styles.tabBtnActive]}
          onPress={() => {
            triggerHaptic('light');
            setActiveTab('letters');
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, activeTab === 'letters' && styles.tabBtnTextActive]}>
            💌 Secret Letters ({vaultLetters?.length || 0})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'notes' && styles.tabBtnActive]}
          onPress={() => {
            triggerHaptic('light');
            setActiveTab('notes');
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, activeTab === 'notes' && styles.tabBtnTextActive]}>
            🤫 Private Notes ({vaultItems?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
        {activeTab === 'letters' ? (
          lettersLoading ? (
            <LoadingState message="Unlocking vault letters..." />
          ) : !vaultLetters || vaultLetters.length === 0 ? (
            <EmptyState
              title="No Vault Letters"
              description="When writing a letter, toggle 'Lock in Private Vault' to keep it confidential here."
            />
          ) : (
            vaultLetters.map((letter) => (
              <LetterCard
                key={letter.id}
                letter={letter}
                isFromMe={letter.sender_id === user?.id}
                partnerName={partnerName}
                onPress={() => {
                  triggerHaptic('light');
                  setSelectedLetter(letter);
                }}
              />
            ))
          )
        ) : (
          /* Notes tab */
          <View>
            <TouchableOpacity
              style={styles.addNoteBtn}
              onPress={() => {
                triggerHaptic('light');
                setShowAddNoteModal(true);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.addNoteBtnText}>+ Add Secret Vault Note</Text>
            </TouchableOpacity>

            {itemsLoading ? (
              <LoadingState message="Loading secrets..." />
            ) : !vaultItems || vaultItems.length === 0 ? (
              <EmptyState
                title="No Private Notes"
                description="Keep shared passwords, secret wishes, or private memories locked here."
              />
            ) : (
              vaultItems.map((item) => (
                <View key={item.id} style={styles.noteCard}>
                  <View style={styles.noteHeader}>
                    <Text style={styles.noteTitle}>{item.title || 'Secret Note'}</Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteItem(item.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.deleteIcon}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.noteContent}>{item.content}</Text>
                  <Text style={styles.noteDate}>
                    {new Date(item.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Read Letter Modal */}
      <ReadLetterModal
        letter={selectedLetter}
        visible={!!selectedLetter}
        onClose={() => setSelectedLetter(null)}
        partnerName={partnerName}
      />

      {/* Add Secret Note Modal */}
      <FormSheet
        visible={showAddNoteModal}
        onClose={() => setShowAddNoteModal(false)}
        title="🔒 New Secret Note"
        primaryLabel="Save Secret 🔒"
        onPrimary={handleCreateNote}
        primaryDisabled={!newNoteContent.trim() || isCreating}
        primaryLoading={isCreating}
        disabledReason={!newNoteContent.trim() ? 'Please write your secret note before saving' : null}
        secondary={
          <Button
            title="Cancel"
            variant="outline"
            size="md"
            onPress={() => setShowAddNoteModal(false)}
            style={styles.modalBtn}
          />
        }
      >
        <TextInput
          style={styles.inputTitle}
          placeholder="Title (optional)"
          placeholderTextColor="#7A6B5D"
          value={newNoteTitle}
          onChangeText={setNewNoteTitle}
        />

        <TextInput
          style={styles.inputContent}
          placeholder="Write something private..."
          placeholderTextColor="#7A6B5D"
          value={newNoteContent}
          onChangeText={setNewNoteContent}
          multiline
          numberOfLines={5}
        />
      </FormSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: scale(14),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceBlush,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  vaultBadgeEmoji: {
    fontSize: scale(26),
  },
  vaultTitle: {
    fontSize: scale(18),
    fontWeight: '900',
    color: theme.colors.text,
  },
  vaultSubtitle: {
    fontSize: scale(11),
    fontWeight: '700',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lockBtn: {
    paddingVertical: scale(7),
    paddingHorizontal: scale(14),
    borderRadius: theme.roundness.full,
    backgroundColor: theme.colors.sunset,
    ...theme.shadows.hardSm,
  },
  lockBtnText: {
    fontSize: scale(12),
    fontWeight: '800',
    color: theme.colors.text,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    gap: scale(10),
  },
  tabBtn: {
    flex: 1,
    paddingVertical: scale(10),
    borderRadius: theme.roundness.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    ...theme.shadows.hardSm,
  },
  tabBtnText: {
    fontSize: scale(12),
    fontWeight: '800',
    color: theme.colors.text,
  },
  tabBtnTextActive: {
    color: theme.colors.textInverse,
  },
  contentScroll: {
    paddingHorizontal: scale(16),
    paddingBottom: scale(40),
  },
  addNoteBtn: {
    paddingVertical: scale(13),
    paddingHorizontal: scale(18),
    borderRadius: theme.roundness.full,
    backgroundColor: theme.colors.rose,
    alignItems: 'center',
    marginBottom: scale(16),
    ...theme.shadows.hardSm,
  },
  addNoteBtnText: {
    fontSize: scale(14),
    fontWeight: '900',
    color: theme.colors.text,
  },
  noteCard: {
    padding: scale(16),
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    marginBottom: scale(12),
    ...theme.shadows.card,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(8),
  },
  noteTitle: {
    fontSize: scale(16),
    fontWeight: '800',
    color: theme.colors.text,
    flex: 1,
  },
  deleteIcon: {
    fontSize: scale(16),
  },
  noteContent: {
    fontSize: scale(14),
    lineHeight: scale(22),
    color: theme.colors.text,
    marginBottom: scale(10),
  },
  noteDate: {
    fontSize: scale(11),
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(62, 39, 35, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  modalContainer: {
    width: '90%',
    maxWidth: scale(360),
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: scale(20),
    ...theme.shadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(16),
  },
  modalTitle: {
    fontSize: scale(18),
    fontWeight: '900',
    color: theme.colors.text,
  },
  modalClose: {
    fontSize: scale(20),
    fontWeight: '800',
    color: theme.colors.text,
    padding: scale(4),
  },
  inputTitle: {
    height: scale(48),
    borderRadius: theme.roundness.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: scale(14),
    fontSize: scale(15),
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: scale(12),
  },
  inputContent: {
    height: scale(120),
    borderRadius: theme.roundness.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: scale(14),
    paddingVertical: scale(12),
    fontSize: scale(14),
    color: theme.colors.text,
    textAlignVertical: 'top',
    marginBottom: scale(16),
  },
  modalActions: {
    flexDirection: 'row',
    gap: scale(10),
  },
  modalBtn: {
    flex: 1,
  },
});

