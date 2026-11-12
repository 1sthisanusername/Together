import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useHomePhoto } from '../hooks/useHomePhoto';
import { SetHomePhotoModal } from './SetHomePhotoModal';
import { CameraIcon, HeartIcon } from '@/shared/ui';
import { theme, scale, useResponsiveLayout, triggerHaptic } from '@/shared/theme';

export interface HomePagePhotoCardProps {
  partnerName: string;
}

export const HomePagePhotoCard: React.FC<HomePagePhotoCardProps> = ({ partnerName }) => {
  const { homePhotoUrl, isSetByMe } = useHomePhoto();
  const [modalVisible, setModalVisible] = useState(false);
  const { mediaAspectRatio } = useResponsiveLayout();

  const handlePress = () => {
    triggerHaptic('light');
    setModalVisible(true);
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
        <View style={styles.cardSurface}>
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
                  <CameraIcon color={theme.colors.text} size={scale(13)} />
                  <Text style={styles.cameraIconText}>Change</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <View style={styles.placeholderIconWrapper}>
                <CameraIcon color="#FFFFFF" size={scale(24)} />
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
        </View>
      </TouchableOpacity>

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
    marginVertical: scale(7),
  },
  cardSurface: {
    backgroundColor: theme.colors.surface, // #FFFFFF
    borderWidth: 1,
    borderColor: theme.colors.border, // #FBE9E7
    borderRadius: 20,
    overflow: 'hidden',
    padding: scale(8),
    ...theme.shadows.card,
  },
  photoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 14,
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
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attributionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(62, 39, 35, 0.78)',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 9999,
  },
  attributionText: {
    fontFamily: theme.typography.families.sans,
    fontSize: scale(11),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cameraIconPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(5),
    backgroundColor: theme.colors.sunset,
    paddingVertical: scale(5),
    paddingHorizontal: scale(12),
    borderRadius: 9999,
  },
  cameraIconText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(11),
    fontWeight: '700',
    color: theme.colors.text,
  },
  placeholderContainer: {
    alignItems: 'center',
    paddingVertical: scale(24),
    paddingHorizontal: scale(16),
    backgroundColor: theme.colors.surfaceBlush,
    borderRadius: scale(14),
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.rose,
  },
  placeholderIconWrapper: {
    width: scale(50),
    height: scale(50),
    borderRadius: 9999,
    backgroundColor: theme.colors.rose,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(10),
    ...theme.shadows.hardSm,
  },
  placeholderTitle: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(16),
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: scale(4),
  },
  placeholderSub: {
    fontFamily: theme.typography.families.body,
    fontSize: scale(12),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: scale(14),
    lineHeight: scale(16),
    paddingHorizontal: scale(12),
  },
  setButtonPill: {
    backgroundColor: theme.colors.primary,
    borderRadius: 9999,
    paddingVertical: scale(8),
    paddingHorizontal: scale(18),
    ...theme.shadows.hardSm,
  },
  setButtonText: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(12),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

