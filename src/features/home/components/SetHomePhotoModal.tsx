import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Sheet, Button, ErrorState } from '@/shared/ui';
import { useHomePhoto, useUpdateHomePhoto } from '../hooks/useHomePhoto';
import { triggerHaptic } from '@/shared/theme';

export interface SetHomePhotoModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SetHomePhotoModal: React.FC<SetHomePhotoModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { homePhotoUrl } = useHomePhoto();
  const { mutateAsync: updateHomePhoto, isPending, error, reset } = useUpdateHomePhoto();
  const [selectedUri, setSelectedUri] = useState<string | null>(null);

  const handlePickFromGallery = async () => {
    triggerHaptic('light');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.85,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setSelectedUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Permission Error', 'Please enable photo library access in settings.');
    }
  };

  const handleTakePhoto = async () => {
    triggerHaptic('light');
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Needed', 'Camera access is required to take a home photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.85,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setSelectedUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Camera Error', 'Could not open camera.');
    }
  };

  const handleSave = async () => {
    if (!selectedUri) return;
    try {
      await updateHomePhoto(selectedUri);
      setSelectedUri(null);
      onSuccess?.();
      onClose();
    } catch {
      // Handled by error state
    }
  };

  const previewUri = selectedUri || homePhotoUrl;

  return (
    <Sheet visible={visible} onClose={onClose} title="Home Page Photo">
      <View style={styles.container}>
        {error ? (
          <ErrorState
            title="Upload Failed"
            message={error.message}
            onRetry={reset}
            retryTitle="Try Again"
          />
        ) : null}

        <Text style={styles.subtitle}>
          This photo appears on your shared home screen for both of you to see every day.
        </Text>

        {/* Photo Preview Frame */}
        <View style={styles.previewCard}>
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="cover" />
          ) : (
            <View style={styles.emptyPlaceholder}>
              <Text style={styles.emptyIcon}>📷</Text>
              <Text style={styles.emptyText}>No home photo set yet</Text>
            </View>
          )}
        </View>

        {/* Action Buttons: Camera & Gallery */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.choiceBtn}
            onPress={handleTakePhoto}
            activeOpacity={0.8}
          >
            <Text style={styles.choiceIcon}>📸</Text>
            <Text style={styles.choiceTitle}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.choiceBtn}
            onPress={handlePickFromGallery}
            activeOpacity={0.8}
          >
            <Text style={styles.choiceIcon}>🖼️</Text>
            <Text style={styles.choiceTitle}>From Gallery</Text>
          </TouchableOpacity>
        </View>

        {selectedUri ? (
          <Button
            title="Set as Home Photo ✨"
            variant="primary"
            size="lg"
            loading={isPending}
            onPress={handleSave}
            style={styles.saveBtn}
          />
        ) : null}
      </View>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  subtitle: {
    fontSize: 13,
    color: '#7A6B5D',
    marginBottom: 16,
    lineHeight: 18,
  },
  previewCard: {
    width: '100%',
    height: 190,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#2B2118',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#2B2118',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  emptyPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8EE',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7A6B5D',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  choiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#2B2118',
    backgroundColor: '#FFF4E3',
    shadowColor: '#2B2118',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  choiceIcon: {
    fontSize: 20,
  },
  choiceTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2B2118',
  },
  saveBtn: {
    marginTop: 4,
  },
});
