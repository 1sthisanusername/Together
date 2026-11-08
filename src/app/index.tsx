import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { theme } from '@/shared/theme';

export default function IndexScreen() {
  // Plain background with the app logo only — seamless continuation of the native splash screen
  // Route decisions are managed exclusively by RootRouteGuard at the app root.
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/splash-icon.png')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="Together"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 140,
    height: 140,
  },
});
