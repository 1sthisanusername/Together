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
import { triggerHaptic } from '@/shared/theme';

export interface HomePagePhotoCardProps {
  partnerName: string;
}

export const HomePagePhotoCard: React.FC<HomePagePhotoCardProps> = ({ partnerName }) => {
  const { homePhotoUrl, isSetByMe } = useHomePhoto();
  const [modalVisible, setModalVisible] = useState(false);

  const handlePress = () => {
    triggerHaptic('light');
    setModalVisible(true);
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.88}>
        <View style={styles.cardShadow} />
        <View style={styles.cardSurface}>
          {homePhotoUrl ? (
            <View style={styles.photoContainer}>
              <Image source={{ uri: homePhotoUrl }} style={styles.photo} resizeMode="cover" />
              <View style={styles.badgeRow}>
                <View style={styles.attributionPill}>
                  <Text style={styles.attributionText}>
                    {isSetByMe ? 'Shared by you ❤️' : `Shared by ${partnerName} ❤️`}
                  </Text>
                </View>
                <View style={styles.cameraIconPill}>
                  <Text style={styles.cameraIconText}>📷 Change</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <View style={styles.placeholderIconWrapper}>
                <Text style={styles.placeholderIcon}>📸</Text>
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
    paddingHorizontal: 18,
    marginVertical: 10,
  },
  cardShadow: {
    position: 'absolute',
    top: 4,
    left: 22,
    right: 14,
    bottom: -4,
    backgroundColor: '#2B2118',
    borderRadius: 18,
  },
  cardSurface: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2B2118',
    borderRadius: 18,
    overflow: 'hidden',
    padding: 8,
  },
  photoContainer: {
    width: '100%',
    height: 190,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#FFF4E3',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  badgeRow: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attributionPill: {
    backgroundColor: 'rgba(43, 33, 24, 0.75)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  attributionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cameraIconPill: {
    backgroundColor: '#FFC93C',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#2B2118',
  },
  cameraIconText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2B2118',
  },
  placeholderContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#FFF8EE',
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D2CCC4',
  },
  placeholderIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF8FB1',
    borderWidth: 2,
    borderColor: '#2B2118',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#2B2118',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  placeholderIcon: {
    fontSize: 24,
  },
  placeholderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2B2118',
    marginBottom: 4,
  },
  placeholderSub: {
    fontSize: 12,
    color: '#7A6B5D',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 16,
    paddingHorizontal: 12,
  },
  setButtonPill: {
    backgroundColor: '#2EC4B6',
    borderWidth: 2,
    borderColor: '#2B2118',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
    shadowColor: '#2B2118',
    shadowOffset: { width: 1.5, height: 1.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  setButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

