import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useMemories } from '@/features/memories';
import { MemoriesIcon, PlusIcon, GalleryIcon, ChevronLeftIcon } from '@/shared/ui';
import { theme, scale, useResponsiveLayout, triggerHaptic, motion } from '@/shared/theme';

/** Spring-animated individual polaroid */
const PolaroidItem: React.FC<{
  item: { id: string; url: string; title: string };
  idx: number;
  width: number;
  onPress: (item: { id: string; url: string; title: string }) => void;
}> = ({ item, idx, width, onPress }) => {
  const rotation = idx % 2 === 0 ? '-1.2deg' : '1.2deg';
  const pScale = useSharedValue(1);
  const pAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pScale.value }, { rotate: rotation }],
  }));
  return (
    <Pressable
      style={{ width }}
      onPress={() => onPress(item)}
      onPressIn={() => { pScale.value = withSpring(0.93, motion.bouncy); triggerHaptic('light'); }}
      onPressOut={() => { pScale.value = withSpring(1, motion.bouncy); }}
    >
      <Animated.View style={[styles.polaroidFrame, pAnimStyle]}>
        <Image source={{ uri: item.url }} style={styles.polaroidImage} contentFit="cover" />
        <Text style={styles.polaroidCaption} numberOfLines={1}>{item.title}</Text>
      </Animated.View>
    </Pressable>
  );
};

export const QuickPhotosCard: React.FC = () => {
  const router = useRouter();
  const { data: memories = [] } = useMemories();
  const { polaroidWidth } = useResponsiveLayout();
  const [selectedPhoto, setSelectedPhoto] = useState<{
    id: string;
    url: string;
    title: string;
  } | null>(null);
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const viewerScale = useSharedValue(0.88);
  const viewerOpacity = useSharedValue(0);
  const viewerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: viewerScale.value }],
    opacity: viewerOpacity.value,
  }));

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
    // Animate viewer entrance
    viewerScale.value = 0.88;
    viewerOpacity.value = 0;
    viewerScale.value = withSpring(1, motion.bouncy);
    viewerOpacity.value = withSpring(1, motion.spring);
  };

  const handleCloseViewer = () => {
    viewerScale.value = withSpring(0.88, motion.spring);
    viewerOpacity.value = withSpring(0, motion.spring);
    setTimeout(() => setSelectedPhoto(null), 220);
  };

  const handleReaction = (emoji: string) => {
    triggerHaptic('medium');
    setActiveReaction(emoji);
  };

  return (
    <View style={styles.cardWrapper}>
      <View style={styles.cardSurface}>
        <View style={styles.headerRow}>
          <View style={styles.titleBadge}>
            <MemoriesIcon color={theme.colors.text} size={scale(13)} />
            <Text style={styles.titleText}>Quick Photos</Text>
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
            {recentPhotos.map((item, idx) => (
              <PolaroidItem
                key={item.id}
                item={item}
                idx={idx}
                width={polaroidWidth}
                onPress={handleSelectPhoto}
              />
            ))}

            {/* Quick Add Polaroid Slot */}
            <TouchableOpacity
              style={[
                styles.polaroidFrame,
                styles.addPolaroidSlot,
                { width: polaroidWidth, minHeight: polaroidWidth + scale(12) },
              ]}
              onPress={handleOpenMemories}
              activeOpacity={0.7}
            >
              <PlusIcon color={theme.colors.primary} size={scale(22)} />
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
            <GalleryIcon color={theme.colors.rose} size={scale(28)} />
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
        onRequestClose={handleCloseViewer}
      >
        <View style={styles.viewerOverlay}>
          <View style={styles.viewerHeader}>
            <Text style={styles.viewerTitle} numberOfLines={1}>
              {selectedPhoto?.title}
            </Text>
            {/* Close button: 48dp touch target with proper icon */}
            <Pressable
              style={styles.viewerCloseBtn}
              onPress={handleCloseViewer}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.viewerCloseText}>✕</Text>
            </Pressable>
          </View>

          {/* Animated image container */}
          <Animated.View style={[styles.viewerImageContainer, viewerAnimStyle]}>
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
          </Animated.View>

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
    width: '100%',
    marginVertical: scale(8),
  },
  cardSurface: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.lg,
    borderWidth: theme.borders.subtle,
    borderColor: theme.colors.border,
    padding: scale(18),
    ...theme.shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    backgroundColor: theme.colors.surfaceBlush, // #FFF0ED
    borderWidth: theme.borders.subtle,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.full,
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
  },
  titleText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(11),
    color: theme.colors.text, // #3E2723
  },
  viewAllBtn: {
    paddingVertical: scale(4),
    paddingHorizontal: scale(8),
  },
  viewAllText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(12),
    color: theme.colors.primary, // #E53935
  },
  photosRow: {
    paddingVertical: scale(6),
    gap: scale(12),
  },
  polaroidFrame: {
    backgroundColor: '#FFFFFF',
    borderWidth: theme.borders.subtle,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.lg,
    padding: scale(6),
    ...theme.shadows.hardSm,
  },
  polaroidImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: theme.roundness.md,
    backgroundColor: theme.colors.surfaceBlush,
  },
  polaroidCaption: {
    fontFamily: theme.typography.families.body,
    fontSize: scale(11),
    color: theme.colors.text, // #3E2723
    textAlign: 'center',
    marginTop: scale(5),
  },
  addPolaroidSlot: {
    justifyContent: 'center',
    alignItems: 'center',
    height: scale(122),
    borderStyle: 'dashed',
    borderColor: theme.colors.rose, // #F48FB1
    backgroundColor: theme.colors.surfaceBlush, // #FFF0ED
    gap: 4,
  },
  addText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(11),
    color: theme.colors.primary, // #E53935
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
    color: theme.colors.textInverse,
    flex: 1,
    marginRight: 12,
  },
  viewerCloseBtn: {
    width: scale(48),
    height: scale(48),
    borderRadius: theme.roundness.full,
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
    backgroundColor: theme.colors.sunset,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
  },
  reactionEmoji: {
    fontSize: 22,
  },
  openMemoriesBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness.full,
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

