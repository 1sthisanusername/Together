import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useHomePhoto, useUpdateHomePhoto } from '@/features/home';
import {
  Button,
  ErrorState,
  SwipeTabWrapper,
  ResponsiveContainer,
  CameraIcon,
  GalleryIcon,
  ThemedAlert,
} from '@/shared/ui';
import { theme, scale, useResponsiveLayout, triggerHaptic } from '@/shared/theme';

export default function CameraScreen() {
  const router = useRouter();
  const { homePhotoUrl } = useHomePhoto();
  const { mutateAsync: updateHomePhoto, isPending, error, reset } = useUpdateHomePhoto();
  const [selectedUri, setSelectedUri] = useState<string | null>(null);
  const { horizontalGutter, mediaAspectRatio, s } = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  let tabBarHeight = 56;
  try {
    tabBarHeight = useBottomTabBarHeight();
  } catch {
    tabBarHeight = 56;
  }
  const bottomPadding = tabBarHeight + insets.bottom + scale(16);

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
          <ResponsiveContainer style={{ paddingHorizontal: horizontalGutter }}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { fontSize: s(24) }]}>Home Cover Photo</Text>
              <View style={styles.titleDot} />
            </View>
            <Text style={styles.subtitle}>
              Take or choose a photo that will appear on your shared home screen for both of you.
            </Text>
          </ResponsiveContainer>
        </View>

        <ScrollView
          style={styles.scrollFlex}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: horizontalGutter, paddingBottom: bottomPadding },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <ResponsiveContainer>
            {error ? (
              <ErrorState
                title="Upload Failed"
                message={error.message}
                onRetry={reset}
                retryTitle="Try Again"
              />
            ) : null}

            {/* Photo Preview Frame */}
            <View style={[styles.previewCard, { aspectRatio: mediaAspectRatio }]}>
              {previewUri ? (
                <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="cover" />
              ) : (
                <View style={styles.emptyPlaceholder}>
                  <View style={styles.emptyIconCircle}>
                    <CameraIcon color={theme.colors.primary} size={scale(28)} />
                  </View>
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
                activeOpacity={0.85} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Take a photo for home cover"
              >
                <CameraIcon color={theme.colors.primary} size={scale(20)} />
                <Text style={styles.choiceTitle}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.choiceBtn}
                onPress={handlePickFromGallery}
                activeOpacity={0.85}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Pick a photo from gallery for home cover"
              >
                <GalleryIcon color={theme.colors.coral} size={scale(20)} />
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
          </ResponsiveContainer>
        </ScrollView>
      </SwipeTabWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: scale(14),
    paddingBottom: scale(14),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border, // #FBE9E7
    backgroundColor: theme.colors.surfaceSubtle, // #FFF0ED
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(5),
    marginBottom: scale(4),
  },
  title: {
    fontFamily: theme.typography.fontFamilies.display,
    fontSize: scale(24),
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  titleDot: {
    width: scale(7),
    height: scale(7),
    borderRadius: 9999,
    backgroundColor: theme.colors.primary,
    marginTop: scale(4),
  },
  subtitle: {
    fontFamily: theme.typography.families.body,
    fontSize: scale(13),
    color: theme.colors.textSecondary,
    lineHeight: scale(18),
  },
  scrollFlex: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: scale(16),
  },
  previewCard: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
    marginBottom: scale(20),
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
    padding: scale(20),
  },
  emptyIconCircle: {
    width: scale(60),
    height: scale(60),
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(12),
    ...theme.shadows.hardSm,
  },
  emptyText: {
    fontSize: scale(16),
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: scale(4),
  },
  emptySubtext: {
    fontSize: scale(12),
    color: theme.colors.textSecondary,
  },
  btnRow: {
    flexDirection: 'row',
    gap: scale(12),
    marginBottom: scale(16),
  },
  choiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    paddingVertical: scale(14),
    borderRadius: theme.roundness.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.hardSm,
  },
  choiceTitle: {
    fontSize: scale(14),
    fontWeight: '700',
    color: theme.colors.text,
  },
  saveBtn: {
    width: '100%',
    marginTop: scale(8),
  },
});
