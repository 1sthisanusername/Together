import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useHomePhoto, useUpdateHomePhoto } from '@/features/home';
import { Button, ErrorState, SwipeTabWrapper } from '@/shared/ui';
import { triggerHaptic } from '@/shared/theme';

export default function CameraScreen() {
  const router = useRouter();
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
      triggerHaptic('success');
      router.replace('/(tabs)/home');
    } catch {
      // Handled by error state
    }
  };

  const previewUri = selectedUri || homePhotoUrl;

  return (
    <SafeAreaView style={styles.safeArea}>
      <SwipeTabWrapper currentTab="camera">
        <View style={styles.header}>
        <Text style={styles.title}>Home Cover Photo</Text>
        <Text style={styles.subtitle}>
          Take or choose a photo that will appear on your shared home screen for both of you.
        </Text>
      </View>

      <View style={styles.content}>
        {error ? (
          <ErrorState
            title="Upload Failed"
            message={error.message}
            onRetry={reset}
            retryTitle="Try Again"
          />
        ) : null}

        {/* Photo Preview Frame */}
        <View style={styles.previewCard}>
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="cover" />
          ) : (
            <View style={styles.emptyPlaceholder}>
              <Text style={styles.emptyIcon}>📷</Text>
              <Text style={styles.emptyText}>No home photo set yet</Text>
              <Text style={styles.emptySubtext}>Choose or capture one below!</Text>
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
            title="Set as Home Cover Photo ✨"
            variant="primary"
            size="lg"
            loading={isPending}
            onPress={handleSave}
            style={styles.saveBtn}
          />
        ) : (
          <Button
            title="Go to Home Screen →"
            variant="outline"
            size="md"
            onPress={() => router.replace('/(tabs)/home')}
            style={styles.saveBtn}
          />
        )}
      </View>
      </SwipeTabWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF4E3',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#2B2118',
    backgroundColor: '#FFF8EE',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2B2118',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#7A6B5D',
    lineHeight: 18,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  previewCard: {
    width: '100%',
    height: 240,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: '#2B2118',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#2B2118',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
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
    padding: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2B2118',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
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
    backgroundColor: '#FFFFFF',
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
    fontSize: 14,
    fontWeight: '800',
    color: '#2B2118',
  },
  saveBtn: {
    width: '100%',
    marginTop: 8,
  },
});
