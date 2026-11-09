import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Card, ThemedConfirmDialog } from '@/shared/ui';
import type { MemoryWithMedia } from '../hooks/useMemories';
import { useDeleteMemory } from '../hooks/useMemories';
import { useAuthStore } from '@/features/auth';
import { theme } from '@/shared/theme';

export interface MemoryCardProps {
  memory: MemoryWithMedia;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  deleteBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceSubtle,
  },
  deleteText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 6,
  },
  note: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  photosScroll: {
    flexDirection: 'row',
    marginTop: 8,
  },
  photoWrapper: {
    marginRight: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeFullscreenBtn: {
    position: 'absolute',
    top: 50,
    right: 24,
    zIndex: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeFullscreenText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fullscreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
});
