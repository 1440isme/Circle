import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/auth.store';
import { useThemeStore } from '../src/stores/theme.store';

export default function EntryScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const { colors } = useThemeStore();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="small" color={colors.primary} />
    </View>
  );
}

