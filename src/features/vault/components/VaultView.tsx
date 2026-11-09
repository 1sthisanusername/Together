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
import { Button, LoadingState, EmptyState } from '@/shared/ui';
import { triggerHaptic } from '@/shared/theme';

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
      <Modal visible={showAddNoteModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔒 New Secret Note</Text>
              <TouchableOpacity onPress={() => setShowAddNoteModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.inputTitle}
              placeholder="Title (optional)"
              placeholderTextColor="#7A6B5D"
              value={newNoteTitle}
              onChangeText={setNewNoteTitle}
            />

            <TextInput
              style={styles.inputContent}
              placeholder="Write your secret, password, or confession..."
              placeholderTextColor="#7A6B5D"
              value={newNoteContent}
              onChangeText={setNewNoteContent}
              multiline
              numberOfLines={5}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                size="md"
                onPress={() => setShowAddNoteModal(false)}
                style={styles.modalBtn}
              />
              <Button
                title="Save Secret 🔒"
                variant="primary"
                size="md"
                loading={isCreating}
                disabled={!newNoteContent.trim()}
                onPress={handleCreateNote}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF4E3',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: '#2B2118',
    backgroundColor: '#FFF8EE',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  vaultBadgeEmoji: {
    fontSize: 26,
  },
  vaultTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2B2118',
  },
  vaultSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2EC4B6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lockBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2B2118',
    backgroundColor: '#FFC93C',
    shadowColor: '#2B2118',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  lockBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2B2118',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#2B2118',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#2EC4B6',
    shadowColor: '#2B2118',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2B2118',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  contentScroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  addNoteBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#2B2118',
    backgroundColor: '#FF8FB1',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#2B2118',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  addNoteBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#2B2118',
  },
  noteCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#2B2118',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    shadowColor: '#2B2118',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2B2118',
    flex: 1,
  },
  deleteIcon: {
    fontSize: 16,
  },
  noteContent: {
    fontSize: 14,
    lineHeight: 22,
    color: '#2B2118',
    marginBottom: 10,
  },
  noteDate: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7A6B5D',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(43, 33, 24, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFF4E3',
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: '#2B2118',
    padding: 20,
    shadowColor: '#2B2118',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2B2118',
  },
  modalClose: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2B2118',
    padding: 4,
  },
  inputTitle: {
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2B2118',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '700',
    color: '#2B2118',
    marginBottom: 12,
  },
  inputContent: {
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2B2118',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#2B2118',
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalBtn: {
    flex: 1,
  },
});
