import React from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { theme, scale } from '@/shared/theme';
import { HomeIcon, PlayIcon, DatesIcon, MemoriesIcon, UsIcon } from '@/shared/ui';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary, // Tomato #FF5A3C
        tabBarInactiveTintColor: theme.colors.textSecondary, // Ink Muted #7A6E63
        tabBarStyle: {
          backgroundColor: theme.colors.background, // Paper #FFF4E3
          borderTopColor: theme.colors.border, // Ink #2B2118
          borderTopWidth: 2,
          height: scale(62),
          paddingBottom: scale(10),
          paddingTop: scale(8),
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontFamily: theme.typography.fontFamilies.display,
          fontSize: scale(11),
          fontWeight: '800',
          letterSpacing: -0.1,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('nav.home'),
          tabBarIcon: ({ color }) => <HomeIcon color={color} size={scale(20)} />,
        }}
      />
      <Tabs.Screen
        name="play"
        options={{
          title: t('nav.play'),
          tabBarIcon: ({ color }) => <PlayIcon color={color} size={scale(20)} />,
        }}
      />
      <Tabs.Screen
        name="dates"
        options={{
          title: t('nav.dates'),
          tabBarIcon: ({ color }) => <DatesIcon color={color} size={scale(20)} />,
        }}
      />
      <Tabs.Screen
        name="memories"
        options={{
          title: t('nav.memories'),
          tabBarIcon: ({ color }) => <MemoriesIcon color={color} size={scale(20)} />,
        }}
      />
      <Tabs.Screen
        name="us"
        options={{
          title: t('nav.us'),
          tabBarIcon: ({ color }) => <UsIcon color={color} size={scale(20)} />,
        }}
      />
    </Tabs>
  );
}
