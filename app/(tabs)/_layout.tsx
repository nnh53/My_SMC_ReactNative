import { Tabs } from 'expo-router';
import React from 'react';
import { Stack } from 'expo-router';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack>
    <Stack.Screen name="index" options={{ headerShown: false }} />
  </Stack>
  );
}
