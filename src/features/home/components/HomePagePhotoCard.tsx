import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useHomePhoto } from '../hooks/useHomePhoto';
import { SetHomePhotoModal } from './SetHomePhotoModal';
import { CameraIcon, HeartIcon } from '@/shared/ui';
import { theme, scale, useResponsiveLayout, triggerHaptic, motion } from '@/shared/theme';

export interface HomePagePhotoCardProps {
  partnerName: string;
}

export const HomePagePhotoCard: React.FC<HomePagePhotoCardProps> = ({ partnerName }) => {
  const { homePhotoUrl, isSetByMe } = useHomePhoto();
  const [modalVisible, setModalVisible] = useState(false);
  const { mediaAspectRatio } = useResponsiveLayout();

  const scaleAnim = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const handlePress = () => {
    triggerHaptic('light');
    setModalVisible(true);
  };

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => {
          scaleAnim.value = withSpring(0.985, motion.spring);
        }}
        onPressOut={() => {
          scaleAnim.value = withSpring(1, motion.spring);
        }}
        accessibilityRole="button"
        accessibilityLabel="Shared home photo card"
      >
        <Animated.View style={[styles.cardSurface, animStyle]}>
          {homePhotoUrl ? (
            <View style={[styles.photoContainer, { aspectRatio: mediaAspectRatio }]}>
              <Image source={{ uri: homePhotoUrl }} style={styles.photo} resizeMode="cover" />
              <View style={styles.badgeRow}>
                <View style={styles.attributionPill}>
                  <HeartIcon color={theme.colors.rose} size={scale(12)} filled />
                  <Text style={styles.attributionText}>
                    {isSetByMe ? 'Shared by you' : `Shared by ${partnerName}`}
                  </Text>
                </View>
                <View style={styles.cameraIconPill}>
                  <CameraIcon color={theme.colors.textInverse} size={scale(13)} />
                  <Text style={styles.cameraIconText}>Change</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <View style={styles.placeholderIconWrapper}>
                <CameraIcon color={theme.colors.textInverse} size={scale(28)} />
              </View>
              <Text style={styles.placeholderTitle}>Set your shared home photo</Text>
              <Text style={styles.placeholderSub}>
                A special photo for both of you to wake up to every day
              </Text>
              <View style={styles.setButtonPill}>
                <Text style={styles.setButtonText}>+ Add Photo</Text>
              </View>
            </View>
          )}
        </Animated.View>
      </Pressable>

      <SetHomePhotoModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginVertical: scale(8),
  },
  cardSurface: {
    backgroundColor: theme.colors.surface,
    borderWidth: theme.borders.subtle,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.lg,
    overflow: 'hidden',
    padding: scale(8),
    ...theme.shadows.elevated,
  },
  photoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: theme.roundness.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: theme.colors.surfaceBlush,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  badgeRow: {
    position: 'absolute',
    bottom: scale(12),
    left: scale(12),
    right: scale(12),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attributionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(62, 39, 35, 0.85)',
    paddingVertical: scale(6),
    paddingHorizontal: scale(14),
    borderRadius: theme.roundness.full,
    ...theme.shadows.tiny,
  },
  attributionText: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(11),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cameraIconPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(5),
    backgroundColor: theme.colors.kintsugi,
    paddingVertical: scale(6),
    paddingHorizontal: scale(14),
    borderRadius: theme.roundness.full,
    ...theme.shadows.tiny,
  },
  cameraIconText: {
    fontFamily: theme.typography.fontFamilies.bold,
    fontSize: scale(11),
    fontWeight: '700',
    color: theme.colors.textInverse,
  },
  placeholderContainer: {
    alignItems: 'center',
    paddingVertical: scale(32),
    paddingHorizontal: scale(20),
    backgroundColor: theme.colors.surfaceBlush,
    borderRadius: theme.roundness.md,
    borderWidth: theme.borders.subtle,
    borderStyle: 'dashed',
    borderColor: theme.colors.rose,
  },
  placeholderIconWrapper: {
    width: scale(60),
    height: scale(60),
    borderRadius: theme.roundness.full,
    backgroundColor: theme.colors.rose,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(14),
    ...theme.shadows.soft,
  },
  placeholderTitle: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(17),
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: scale(6),
    textAlign: 'center',
  },
  placeholderSub: {
    fontFamily: theme.typography.fontFamilies.sans,
    fontSize: scale(13),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: scale(18),
    lineHeight: scale(18),
    paddingHorizontal: scale(16),
  },
  setButtonPill: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness.full,
    paddingVertical: scale(10),
    paddingHorizontal: scale(24),
    ...theme.shadows.hardSm,
  },
  setButtonText: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(13),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});