import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
        headerTintColor: '#6366F1',
        headerTitleStyle: {
          fontWeight: '700',
          color: '#0F172A',
        },
        contentStyle: {
          backgroundColor: '#FFFFFF',
        },
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: 'Log In',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          title: 'Create Account',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="reset-password"
        options={{
          title: 'Reset Password',
          headerShown: true,
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

