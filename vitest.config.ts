import { defineConfig } from 'vitest/config';
import * as path from 'path';

export default defineConfig({
  define: {
    __DEV__: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'react-native': path.resolve(__dirname, './tests/mocks/react-native.ts'),
      'react-native-safe-area-context': path.resolve(__dirname, './tests/mocks/react-native-safe-area-context.ts'),
      'react-native-keyboard-controller': path.resolve(__dirname, './tests/mocks/react-native-keyboard-controller.ts'),
      'expo-secure-store': path.resolve(__dirname, './tests/mocks/expo-secure-store.ts'),
      'expo-web-browser': path.resolve(__dirname, './tests/mocks/expo-web-browser.ts'),
      'expo-linking': path.resolve(__dirname, './tests/mocks/expo-linking.ts'),
      'expo': path.resolve(__dirname, './tests/mocks/expo.ts'),
      'expo-constants': path.resolve(__dirname, './tests/mocks/expo-constants.ts'),
      '@react-native-community/datetimepicker': path.resolve(__dirname, './tests/mocks/datetimepicker.ts'),
      'expo-image': path.resolve(__dirname, './tests/mocks/expo-image.ts'),
      'expo-image-picker': path.resolve(__dirname, './tests/mocks/expo-image-picker.ts'),
      'expo-file-system/legacy': path.resolve(__dirname, './tests/mocks/expo-file-system.ts'),
      'expo-file-system': path.resolve(__dirname, './tests/mocks/expo-file-system.ts'),
      'expo-audio': path.resolve(__dirname, './tests/mocks/expo-audio.ts'),
      'expo-image-manipulator': path.resolve(__dirname, './tests/mocks/expo-image-manipulator.ts'),
      'expo-haptics': path.resolve(__dirname, './tests/mocks/expo-haptics.ts'),
      'react-native-reanimated': path.resolve(__dirname, './tests/mocks/react-native-reanimated.ts'),
      'react-native-svg': path.resolve(__dirname, './tests/mocks/react-native-svg.ts'),
      '@expo-google-fonts/bricolage-grotesque': path.resolve(__dirname, './tests/mocks/expo-google-fonts.ts'),
      '@expo-google-fonts/figtree': path.resolve(__dirname, './tests/mocks/expo-google-fonts.ts'),
      '@expo-google-fonts/caveat': path.resolve(__dirname, './tests/mocks/expo-google-fonts.ts'),
      '@react-native-google-signin/google-signin': path.resolve(__dirname, './tests/mocks/google-signin.ts'),
      'react-native-url-polyfill/auto': path.resolve(__dirname, './tests/mocks/empty.ts'),
      'react-native-url-polyfill': path.resolve(__dirname, './tests/mocks/empty.ts'),
    },
  },
  test: {
    environment: 'node',
  },
});
