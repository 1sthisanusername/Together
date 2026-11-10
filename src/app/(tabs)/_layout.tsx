import React from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme, scale } from '@/shared/theme';
import { HomeIcon, PlayIcon, CameraIcon, MemoriesIcon, UsIcon } from '@/shared/ui';

export default function TabLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 0);

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
          height: scale(64) + bottomInset,
          paddingBottom: bottomInset > 0 ? bottomInset + scale(4) : scale(8),
          paddingTop: scale(8),
          elevation: 0,
        },
        tabBarItemStyle: {
          paddingBottom: scale(2),
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarLabelStyle: {
          fontFamily: theme.typography.fontFamilies.display,
          fontSize: scale(11),
          fontWeight: '800',
          letterSpacing: -0.1,
          marginBottom: scale(2),
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
        name="camera"
        options={{
          title: t('nav.camera', 'Camera'),
          tabBarIcon: ({ color }) => <CameraIcon color={color} size={scale(20)} />,
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
      <Tabs.Screen
        name="dates"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
