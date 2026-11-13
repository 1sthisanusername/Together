import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme, wp } from '@/shared/theme';

export default function IndexScreen() {
  // Plain background with the app logo only — seamless continuation of the native splash screen
  // Route decisions are managed exclusively by RootRouteGuard at the app root.
  const logoSize = Math.round(Math.min(wp(36), 180));

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={require('../../assets/splash-icon.png')}
        style={{ width: logoSize, aspectRatio: 1 }}
        resizeMode="contain"
        accessibilityLabel="Together"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
