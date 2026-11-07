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
      'expo-secure-store': path.resolve(__dirname, './tests/mocks/expo-secure-store.ts'),
      'expo-web-browser': path.resolve(__dirname, './tests/mocks/expo-web-browser.ts'),
      'expo-linking': path.resolve(__dirname, './tests/mocks/expo-linking.ts'),
      'expo': path.resolve(__dirname, './tests/mocks/expo.ts'),
    },
  },
  test: {
    environment: 'node',
  },
});
