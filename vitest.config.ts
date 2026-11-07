import { defineConfig } from 'vitest/config';
import * as path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'react-native': path.resolve(__dirname, './tests/mocks/react-native.ts'),
      'expo-secure-store': path.resolve(__dirname, './tests/mocks/expo-secure-store.ts'),
    },
  },
  test: {
    environment: 'node',
  },
});
