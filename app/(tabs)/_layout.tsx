import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';
import { HapticTab } from '@/components/haptic-tab';
import { Colors, Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={{
      width: 32, height: 32, borderRadius: 10,
      backgroundColor: focused ? Palette.primary + '30' : 'transparent',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <View style={{ transform: [{ scale: focused ? 1.1 : 1 }] }}>
        {/* Use text emoji as icon — works without extra icon font */}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Palette.primary,
        tabBarInactiveTintColor: Palette.dark.textMuted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: Palette.dark.surface,
          borderTopColor: Palette.dark.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <View style={{ opacity: focused ? 1 : 0.5 }}>
              {/* emoji handled by label */}
            </View>
          ),
          tabBarLabel: ({ focused }) =>
            focused ? '🏠 Home' : 'Home',
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Jadwal',
          tabBarLabel: ({ focused }) => focused ? '📅 Jadwal' : 'Jadwal',
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Analytics',
          tabBarLabel: ({ focused }) => focused ? '📊 Analytics' : 'Analytics',
        }}
      />
      <Tabs.Screen
        name="skill-tree"
        options={{
          title: 'Skill',
          tabBarLabel: ({ focused }) => focused ? '🎮 Skill' : 'Skill',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Eksplorasi',
          tabBarLabel: ({ focused }) => focused ? '🔍 Eksplorasi' : 'Eksplorasi',
        }}
      />
    </Tabs>
  );
}
