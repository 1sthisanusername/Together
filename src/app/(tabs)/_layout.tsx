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
        animation: 'shift',
        tabBarActiveTintColor: theme.colors.primary, // Amour Red #E53935
        tabBarInactiveTintColor: theme.colors.textInactive, // rgba(62, 39, 35, 0.5)
        tabBarStyle: {
          backgroundColor: theme.colors.background, // Warm off-white #FFFDFB
          borderTopColor: theme.colors.border, // Subtle #FBE9E7
          borderTopWidth: 1,
          height: scale(72) + bottomInset,
          paddingBottom: bottomInset > 0 ? bottomInset + scale(6) : scale(10),
          paddingTop: scale(6),
          ...theme.shadows.hardSm,
        },
        tabBarItemStyle: {
          paddingBottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarLabelStyle: {
          fontFamily: theme.typography.fontFamilies.display,
          fontSize: scale(11),
          fontWeight: '700',
          letterSpacing: -0.1,
          lineHeight: scale(14),
          marginTop: scale(2),
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('nav.home'),
          tabBarIcon: ({ color, focused }) => (
            <HomeIcon color={color} focused={focused} size={scale(22)} />
          ),
        }}
      />
      <Tabs.Screen
        name="play"
        options={{
          title: t('nav.play'),
          tabBarIcon: ({ color, focused }) => (
            <PlayIcon color={color} focused={focused} size={scale(22)} />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: t('nav.camera', 'Camera'),
          tabBarIcon: ({ color, focused }) => (
            <CameraIcon color={color} focused={focused} size={scale(28)} />
          ),
        }}
      />
      <Tabs.Screen
        name="memories"
        options={{
          title: t('nav.memories'),
          tabBarIcon: ({ color, focused }) => (
            <MemoriesIcon color={color} focused={focused} size={scale(22)} />
          ),
        }}
      />
      <Tabs.Screen
        name="us"
        options={{
          title: t('nav.us'),
          tabBarIcon: ({ color, focused }) => (
            <UsIcon color={color} focused={focused} size={scale(22)} />
          ),
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
