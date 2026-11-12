import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Card, ThemedConfirmDialog } from '@/shared/ui';
import type { MemoryWithMedia } from '../hooks/useMemories';
import { useDeleteMemory } from '../hooks/useMemories';
import { useAuthStore } from '@/features/auth';
import { theme, scale } from '@/shared/theme';

export interface MemoryCardProps {
  memory: MemoryWithMedia;
}

export const MemoryCard: React.FC<MemoryCardProps> = ({ memory }) => {
  const user = useAuthStore((state) => state.user);
  const { mutate: deleteMemory, isPending: isDeleting } = useDeleteMemory();
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isUploader = memory.created_by === user?.id;
  const photoUrls = memory.photoUrls || [];

  const handleDelete = () => {
    if (!isUploader) return;
    setShowDeleteConfirm(true);
  };

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
        <View style={styles.headerRight}>
          {memory.favorite && <Text style={styles.favoriteBadge}>⭐ Favorite</Text>}
          {/* Delete button: only accessible to the uploader */}
          {isUploader && (
            <TouchableOpacity
              onPress={handleDelete}
              disabled={isDeleting}
              style={styles.deleteBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.deleteText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={styles.title}>{memory.title}</Text>
      {memory.note ? <Text style={styles.note}>{memory.note}</Text> : null}

      {/* Photo Gallery Grid / Carousel */}
      {photoUrls.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.photosScroll}
        >
          {photoUrls.map((url, idx) => (
            <TouchableOpacity
              key={`${url}_${idx}`}
              onPress={() => setFullscreenImage(url)}
              activeOpacity={0.85}
              style={styles.photoWrapper}
            >
              <Image
                source={{ uri: url }}
                style={styles.photoThumbnail}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Fullscreen Photo Modal */}
      <Modal
        visible={!!fullscreenImage}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenImage(null)}
      >
        <View style={styles.fullscreenOverlay}>
          <TouchableOpacity
            style={styles.closeFullscreenBtn}
            onPress={() => setFullscreenImage(null)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.closeFullscreenText}>✕</Text>
          </TouchableOpacity>

          {fullscreenImage && (
            <Image
              source={{ uri: fullscreenImage }}
              style={styles.fullscreenImage}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
          )}
        </View>
      </Modal>

      {/* Themed Confirmation Dialog for Permanent Memory Deletion */}
      <ThemedConfirmDialog
        visible={showDeleteConfirm}
        emoji="🗑️"
        title="Delete Memory"
        message="Permanently delete this memory and its photos? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Keep"
        isDestructive
        isLoading={isDeleting}
        onConfirm={() => {
          deleteMemory(
            { memoryId: memory.id, createdBy: memory.created_by },
            { onSettled: () => setShowDeleteConfirm(false) }
          );
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: scale(18),
    marginVertical: scale(6),
    borderRadius: theme.roundness.lg,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scale(8),
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  dateBadge: {
    fontSize: scale(12),
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  favoriteBadge: {
    fontSize: scale(12),
    fontWeight: '700',
    color: theme.colors.warning,
  },
  deleteBtn: {
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: theme.roundness.full,
    backgroundColor: theme.colors.surfaceSubtle,
  },
  deleteText: {
    fontSize: scale(12),
    color: theme.colors.textSecondary,
  },
  title: {
    fontSize: scale(17),
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: scale(6),
  },
  note: {
    fontSize: scale(14),
    color: theme.colors.textSecondary,
    lineHeight: scale(20),
    marginBottom: scale(10),
  },
  photosScroll: {
    flexDirection: 'row',
    marginTop: scale(8),
  },
  photoWrapper: {
    marginRight: scale(10),
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  photoThumbnail: {
    width: scale(100),
    aspectRatio: 1,
    borderRadius: scale(12),
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(62, 39, 35, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeFullscreenBtn: {
    position: 'absolute',
    top: scale(50),
    right: scale(24),
    zIndex: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    width: scale(36),
    height: scale(36),
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeFullscreenText: {
    color: '#ffffff',
    fontSize: scale(18),
    fontWeight: 'bold',
  },
  fullscreenImage: {
    width: '100%',
    height: '80%',
  },
});
