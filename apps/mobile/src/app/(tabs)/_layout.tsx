import { Ionicons } from '@expo/vector-icons';
import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { colors } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

const icon = (filled: IconName, outline: IconName) =>
  function TabIcon({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) {
    return <Ionicons name={focused ? filled : outline} color={color} size={size} />;
  };

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: { borderTopColor: colors.border, backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Bản đồ', tabBarIcon: icon('map', 'map-outline') }} />
      <Tabs.Screen name="list" options={{ title: 'Danh sách', tabBarIcon: icon('list', 'list-outline') }} />
      <Tabs.Screen name="profile" options={{ title: 'Tôi', tabBarIcon: icon('person', 'person-outline') }} />
    </Tabs>
  );
}
