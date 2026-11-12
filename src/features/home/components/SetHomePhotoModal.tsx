import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { FormSheet, Button, ErrorState, CameraIcon, GalleryIcon, ThemedAlert } from '@/shared/ui';
import { useHomePhoto, useUpdateHomePhoto } from '../hooks/useHomePhoto';
import { theme, triggerHaptic } from '@/shared/theme';

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
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.85,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setSelectedUri(result.assets[0].uri);
      }
    } catch {
      ThemedAlert.show({
        title: 'Permission Error',
        message: 'Please enable photo library access in settings.',
      });
    }
  };

  const handleTakePhoto = async () => {
    triggerHaptic('light');
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        ThemedAlert.show({
          title: 'Permission Needed',
          message: 'Camera access is required to take a home photo.',
        });
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
      ThemedAlert.show({
        title: 'Camera Error',
        message: 'Could not open camera.',
      });
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
    <FormSheet
      visible={visible}
      onClose={onClose}
      title="Home Page Photo"
      primaryLabel={selectedUri ? 'Set as Home Photo ✨' : undefined}
      onPrimary={handleSave}
      primaryLoading={isPending}
      disabledReason={!selectedUri ? 'Choose or take a photo first' : null}
    >
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
              <CameraIcon color={theme.colors.primary} size={32} />
              <Text style={styles.emptyText}>No home photo set yet</Text>
            </View>
          )}
        </View>

        {/* Action Buttons: Camera & Gallery */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.choiceBtn}
            onPress={handleTakePhoto}
            activeOpacity={0.85}
          >
            <CameraIcon color={theme.colors.primary} size={20} />
            <Text style={styles.choiceTitle}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.choiceBtn}
            onPress={handlePickFromGallery}
            activeOpacity={0.85}
          >
            <GalleryIcon color={theme.colors.coral} size={20} />
            <Text style={styles.choiceTitle}>From Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>
    </FormSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  previewCard: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
    marginBottom: 16,
    ...theme.shadows.card,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  emptyPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceBlush,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
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
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceBlush,
    ...theme.shadows.hardSm,
  },
  choiceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
  },
  saveBtn: {
    marginTop: 4,
  },
});

