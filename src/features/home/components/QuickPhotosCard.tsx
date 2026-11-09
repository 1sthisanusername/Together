import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useMemories } from '@/features/memories';
import { theme, scale, triggerHaptic } from '@/shared/theme';

export const QuickPhotosCard: React.FC = () => {
  const router = useRouter();
  const { data: memories = [] } = useMemories();
  const [selectedPhoto, setSelectedPhoto] = useState<{
    id: string;
    url: string;
    title: string;
  } | null>(null);
  const [activeReaction, setActiveReaction] = useState<string | null>(null);

  // Extract recent photo URLs from memories
  const recentPhotos: { id: string; url: string; title: string }[] = [];
  for (const mem of memories) {
    if (mem.photoUrls && mem.photoUrls.length > 0) {
      for (const url of mem.photoUrls) {
        recentPhotos.push({
          id: `${mem.id}_${url}`,
          url,
          title: mem.title || 'Our Memory',
        });
        if (recentPhotos.length >= 6) break;
      }
    }
    if (recentPhotos.length >= 6) break;
  }

  const handleOpenMemories = () => {
    triggerHaptic('light');
    router.push('/(tabs)/memories');
  };

  const handleSelectPhoto = (photo: { id: string; url: string; title: string }) => {
    triggerHaptic('light');
    setActiveReaction(null);
    setSelectedPhoto(photo);
  };

  const handleReaction = (emoji: string) => {
    triggerHaptic('medium');
    setActiveReaction(emoji);
  };

  return (
    <View style={styles.cardWrapper}>
      {/* Hard Ink Shadow */}
      <View style={styles.cardShadow} />

      {/* Paper Surface */}
      <View style={styles.cardSurface}>
        <View style={styles.headerRow}>
          <View style={styles.titleBadge}>
            <Text style={styles.titleText}>📸 Quick Photos</Text>
          </View>
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={handleOpenMemories}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        {recentPhotos.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photosRow}
          >
            {recentPhotos.map((item, idx) => {
              const rotation = idx % 2 === 0 ? '-1.5deg' : '1.5deg';
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.polaroidFrame,
                    { transform: [{ rotate: rotation }] },
                  ]}
                  onPress={() => handleSelectPhoto(item)}
                  activeOpacity={0.85}
                >
                  <Image
                    source={{ uri: item.url }}
                    style={styles.polaroidImage}
                    contentFit="cover"
                  />
                  <Text style={styles.polaroidCaption} numberOfLines={1}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Quick Add Polaroid Slot */}
            <TouchableOpacity
              style={[styles.polaroidFrame, styles.addPolaroidSlot]}
              onPress={handleOpenMemories}
              activeOpacity={0.7}
            >
              <Text style={styles.addIcon}>＋</Text>
              <Text style={styles.addText}>Add Photo</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          /* Empty State Polaroid Prompt */
          <TouchableOpacity
            style={styles.emptyPrompt}
            onPress={handleOpenMemories}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyEmoji}>🖼️</Text>
            <Text style={styles.emptyTitle}>Pin Your First Snap!</Text>
            <Text style={styles.emptySubtitle}>
              Tap to add romantic moments and polaroids to your private space.
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Full-Screen Photo Viewer & Reactions Modal */}
      <Modal
        visible={!!selectedPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.viewerOverlay}>
          <View style={styles.viewerHeader}>
            <Text style={styles.viewerTitle} numberOfLines={1}>
              {selectedPhoto?.title}
            </Text>
            <TouchableOpacity
              style={styles.viewerCloseBtn}
              onPress={() => setSelectedPhoto(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.viewerCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.viewerImageContainer}>
            {selectedPhoto?.url ? (
              <Image
                source={{ uri: selectedPhoto.url }}
                style={styles.viewerImage}
                contentFit="contain"
              />
            ) : null}

            {activeReaction && (
              <View style={styles.activeReactionBadge}>
                <Text style={styles.activeReactionText}>
                  {activeReaction} Reacted!
                </Text>
              </View>
            )}
          </View>

          {/* Quick Reaction Stickers */}
          <View style={styles.reactionsBar}>
            {['❤️', '🔥', '🥰', '✨', '💌'].map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.reactionBtn,
                  activeReaction === emoji && styles.reactionBtnActive,
                ]}
                onPress={() => handleReaction(emoji)}
                activeOpacity={0.7}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* View in Memories Button */}
          <TouchableOpacity
            style={styles.openMemoriesBtn}
            onPress={() => {
              setSelectedPhoto(null);
              handleOpenMemories();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.openMemoriesText}>Open in Memories Story →</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: scale(18),
    marginVertical: scale(8),
    position: 'relative',
  },
  cardShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    backgroundColor: theme.colors.border,
    borderRadius: 20,
  },
  cardSurface: {
    backgroundColor: theme.colors.background, // Paper #FFF4E3
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: theme.colors.border,
    padding: scale(16),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  titleBadge: {
    backgroundColor: theme.colors.stickers.pool, // Pool Teal
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
  },
  titleText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(11),
    color: theme.colors.text,
  },
  viewAllBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  viewAllText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(12),
    color: theme.colors.primary,
  },
  photosRow: {
    paddingVertical: scale(6),
    gap: scale(12),
  },
  polaroidFrame: {
    width: scale(112),
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: scale(6),
    ...theme.shadows.hardSm,
  },
  polaroidImage: {
    width: '100%',
    height: scale(96),
    borderRadius: 8,
    backgroundColor: '#F3E9DF',
  },
  polaroidCaption: {
    fontFamily: theme.typography.families.body,
    fontSize: scale(11),
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: scale(4),
  },
  addPolaroidSlot: {
    justifyContent: 'center',
    alignItems: 'center',
    height: scale(122),
    borderStyle: 'dashed',
    backgroundColor: '#FFF9F0',
  },
  addIcon: {
    fontSize: scale(24),
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  addText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(11),
    color: theme.colors.textSecondary,
    marginTop: scale(2),
  },
  emptyPrompt: {
    alignItems: 'center',
    paddingVertical: scale(14),
    gap: 4,
  },
  emptyEmoji: {
    fontSize: scale(28),
  },
  emptyTitle: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(14),
    color: theme.colors.text,
  },
  emptySubtitle: {
    fontFamily: theme.typography.families.body,
    fontSize: scale(12),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    maxWidth: scale(260),
    lineHeight: scale(16),
  },
  viewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 16, 12, 0.94)',
    justifyContent: 'space-between',
    paddingVertical: scale(48),
    paddingHorizontal: scale(20),
  },
  viewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  viewerTitle: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(16),
    color: '#FFF4E3',
    flex: 1,
    marginRight: 12,
  },
  viewerCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerCloseText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  viewerImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  viewerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  activeReactionBadge: {
    position: 'absolute',
    bottom: scale(20),
    backgroundColor: theme.colors.stickers.sunshine,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    ...theme.shadows.hardSm,
  },
  activeReactionText: {
    fontFamily: theme.typography.families.bold,
    fontSize: 14,
    color: theme.colors.text,
  },
  reactionsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scale(14),
    marginVertical: scale(16),
  },
  reactionBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionBtnActive: {
    backgroundColor: '#FFC93C',
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
  },
  reactionEmoji: {
    fontSize: 22,
  },
  openMemoriesBtn: {
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 14,
    paddingVertical: scale(12),
    alignItems: 'center',
    ...theme.shadows.hardSm,
  },
  openMemoriesText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(14),
    color: '#FFFFFF',
  },
});

