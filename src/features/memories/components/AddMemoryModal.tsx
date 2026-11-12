import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useTranslation } from 'react-i18next';
import { FormSheet, Input, ErrorState, DatePickerField } from '@/shared/ui';
import { useCreateMemory, type MemoryPhotoItem } from '../hooks/useMemories';
import { theme, scale } from '@/shared/theme';

export interface AddMemoryModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddMemoryModal: React.FC<AddMemoryModalProps> = ({
  visible,
  onClose,
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [photos, setPhotos] = useState<MemoryPhotoItem[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { mutateAsync: createMemory, error, reset } = useCreateMemory();

  // Reset all fields
  const handleClose = () => {
    if (isSubmitting) return;
    setTitle('');
    setNote('');
    setDate(new Date().toISOString().split('T')[0]);
    setPhotos([]);
    setUploadProgress(null);
    setLocalError(null);
    reset();
    onClose();
  };

  /**
   * Resizes photo to about 1600px on the longest side and compresses to JPEG 0.7 quality.
   * Rejects files over 5 MB.
   */
  const processAndValidateAsset = async (
    asset: ImagePicker.ImagePickerAsset
  ): Promise<MemoryPhotoItem | null> => {
    try {
      const actions: ImageManipulator.Action[] = [];
      const width = asset.width || 0;
      const height = asset.height || 0;

      if (width > 1600 || height > 1600) {
        if (width >= height) {
          actions.push({ resize: { width: 1600 } });
        } else {
          actions.push({ resize: { height: 1600 } });
        }
      }

      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        actions,
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      const fileInfo = await FileSystem.getInfoAsync(manipulated.uri);
      if (fileInfo.exists && (fileInfo as any).size > 5 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Photos must be under 5 MB each.');
        return null;
      }

      return {
        uri: manipulated.uri,
        mimeType: asset.mimeType || 'image/jpeg',
      };
    } catch (err) {
      console.warn('Failed to process image, falling back to original:', err);
      return {
        uri: asset.uri,
        mimeType: asset.mimeType || 'image/jpeg',
      };
    }
  };

  const handlePickFromGallery = async () => {
    setLocalError(null);
    if (photos.length >= 5) {
      Alert.alert('Photo Limit', 'You can attach up to 5 photos per memory.');
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Photo library access is needed to select memory photos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 5 - photos.length,
        quality: 0.7,
      });

      if (!result.canceled && result.assets) {
        const processedItems: MemoryPhotoItem[] = [];
        for (const asset of result.assets) {
          const processed = await processAndValidateAsset(asset);
          if (processed) {
            processedItems.push(processed);
          }
        }
        setPhotos((prev) => [...prev, ...processedItems].slice(0, 5));
      }
    } catch (err: any) {
      console.warn('[ImagePicker] Gallery error:', err);
      setLocalError('Unable to open photo library.');
    }
  };

  const handleTakePhoto = async () => {
    setLocalError(null);
    if (photos.length >= 5) {
      Alert.alert('Photo Limit', 'You can attach up to 5 photos per memory.');
      return;
    }

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera access is needed to take a memory photo.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.[0]) {
        const processed = await processAndValidateAsset(result.assets[0]);
        if (processed) {
          setPhotos((prev) => [...prev, processed].slice(0, 5));
        }
      }
    } catch (err: any) {
      console.warn('[ImagePicker] Camera error:', err);
      setLocalError('Unable to open camera.');
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSave = async () => {
    // Prevent double tap creation
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setLocalError(null);
    setUploadProgress(photos.length > 0 ? 0 : null);

    try {
      await createMemory({
        title: title.trim(),
        note: note.trim() || undefined,
        memoryDate: date.trim() || undefined,
        photos,
        onProgress: (pct) => setUploadProgress(pct),
      });

      handleClose();
    } catch (err: any) {
      setLocalError(err.message || 'Failed to save memory. Please retry.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  const isFormValid = !!title.trim() && !isSubmitting;
  const disabledReason = !title.trim() ? 'Please enter a title for your memory' : null;

  return (
    <FormSheet
      visible={visible}
      onClose={handleClose}
      title={t('memories.addMemory')}
      primaryLabel={isSubmitting ? 'Saving Memory...' : t('memories.saveMemory')}
      onPrimary={handleSave}
      primaryDisabled={!isFormValid}
      primaryLoading={isSubmitting}
      disabledReason={disabledReason}
    >
      <View style={styles.container}>
        {error || localError ? (
          <ErrorState
            title={t('common.errorTitle')}
            message={localError || error?.message || 'Error saving memory'}
            onRetry={() => {
              setLocalError(null);
              reset();
            }}
            retryTitle={t('common.retry')}
          />
        ) : null}

        <Input
          label={t('memories.memoryTitleLabel')}
          placeholder={t('memories.memoryTitlePlaceholder')}
          value={title}
          onChangeText={setTitle}
        />

        <Input
          label={t('memories.memoryNoteLabel')}
          placeholder={t('memories.memoryNotePlaceholder')}
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={4}
          style={styles.noteInput}
        />

        <DatePickerField
          label={t('memories.memoryDateLabel')}
          placeholder="Select memory date"
          value={date}
          onChange={setDate}
        />

        {/* Photos Section */}
        <View style={styles.photoSection}>
          <Text style={styles.photoSectionLabel}>Photos (up to 5)</Text>

          {/* Action buttons */}
          <View style={styles.photoActionsRow}>
            <TouchableOpacity
              style={[styles.photoActionBtn, photos.length >= 5 && styles.actionBtnDisabled]}
              onPress={handlePickFromGallery}
              disabled={photos.length >= 5 || isSubmitting}
              activeOpacity={0.7}
            >
              <Text style={styles.photoActionIcon}>🖼️</Text>
              <Text style={styles.photoActionText}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.photoActionBtn, photos.length >= 5 && styles.actionBtnDisabled]}
              onPress={handleTakePhoto}
              disabled={photos.length >= 5 || isSubmitting}
              activeOpacity={0.7}
            >
              <Text style={styles.photoActionIcon}>📸</Text>
              <Text style={styles.photoActionText}>Camera</Text>
            </TouchableOpacity>
          </View>

          {/* Thumbnails preview with remove button */}
          {photos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailList}>
              {photos.map((item, index) => (
                <View key={`${item.uri}_${index}`} style={styles.thumbnailWrapper}>
                  <Image source={{ uri: item.uri }} style={styles.thumbnailImage} contentFit="cover" />
                  <TouchableOpacity
                    style={styles.removePhotoBtn}
                    onPress={() => handleRemovePhoto(index)}
                    disabled={isSubmitting}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text style={styles.removePhotoText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Upload progress indicator */}
          {uploadProgress !== null && (
            <View style={styles.progressContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.progressText}>Uploading photos ({uploadProgress}%)...</Text>
            </View>
          )}
        </View>
      </View>
    </FormSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: scale(12),
  },
  noteInput: {
    height: scale(90),
  },
  photoSection: {
    marginBottom: scale(20),
  },
  photoSectionLabel: {
    fontSize: scale(14),
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: scale(8),
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: scale(12),
    marginBottom: scale(10),
  },
  photoActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.roundness.full,
    paddingVertical: scale(10),
    gap: scale(6),
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  photoActionIcon: {
    fontSize: scale(16),
  },
  photoActionText: {
    fontSize: scale(14),
    fontWeight: '600',
    color: theme.colors.text,
  },
  thumbnailList: {
    flexDirection: 'row',
    marginTop: scale(6),
  },
  thumbnailWrapper: {
    position: 'relative',
    marginRight: scale(10),
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: scale(72),
    aspectRatio: 1,
    borderRadius: scale(12),
  },
  removePhotoBtn: {
    position: 'absolute',
    top: scale(4),
    right: scale(4),
    backgroundColor: 'rgba(62, 39, 35, 0.7)',
    width: scale(22),
    height: scale(22),
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: {
    color: '#ffffff',
    fontSize: scale(10),
    fontWeight: 'bold',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scale(10),
    gap: scale(8),
  },
  progressText: {
    fontSize: scale(13),
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  saveBtn: {
    marginTop: scale(10),
  },
});
