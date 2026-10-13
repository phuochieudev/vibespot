import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useAuth } from '@/stores/auth-store';
import { colors } from '@/theme';

// Màn hình khởi động phải là tab chính. Nếu không khai báo, Stack lấy màn hình đầu tiên
// trong danh sách bên dưới (place/[id]) làm màn hình mở app.
export const unstable_settings = { initialRouteName: '(tabs)' };

export default function RootLayout() {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1 } } }));

  // Khôi phục phiên đăng nhập từ refresh token đã lưu (nếu có).
  useEffect(() => {
    void useAuth.getState().init();
  }, []);

  return (
    <QueryClientProvider client={client}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="place/[id]" />
        <Stack.Screen
          name="admin"
          options={{ headerShown: true, title: 'Duyệt nội dung', headerBackTitle: 'Quay lại', headerTintColor: colors.primary }}
        />
        <Stack.Screen name="add-place" options={{ presentation: 'modal' }} />
        <Stack.Screen name="login" options={{ presentation: 'modal' }} />
        <Stack.Screen name="register" options={{ presentation: 'modal' }} />
      </Stack>
    </QueryClientProvider>
  );
}
