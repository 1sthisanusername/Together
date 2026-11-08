import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="login"
        options={{
          title: 'Welcome',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="pair"
        options={{
          title: 'Connect Partner',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
