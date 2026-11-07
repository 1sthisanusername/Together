import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '@/shared/theme';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary, // #b69788
        tabBarInactiveTintColor: theme.colors.secondary, // #a8917f
        tabBarStyle: {
          backgroundColor: theme.colors.surface, // #ffffff
          borderTopColor: theme.colors.border, // #d2ccc4
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
          shadowColor: theme.colors.text,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.03,
          shadowRadius: 8,
          elevation: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('nav.home'),
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="play"
        options={{
          title: t('nav.play'),
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>✨</Text>,
        }}
      />
      <Tabs.Screen
        name="dates"
        options={{
          title: t('nav.dates'),
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🕯️</Text>,
        }}
      />
      <Tabs.Screen
        name="memories"
        options={{
          title: t('nav.memories'),
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🎞️</Text>,
        }}
      />
      <Tabs.Screen
        name="us"
        options={{
          title: t('nav.us'),
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🤍</Text>,
        }}
      />
    </Tabs>
  );
}
