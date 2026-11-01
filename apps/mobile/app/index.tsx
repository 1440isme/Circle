import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useThemeStore } from '../src/stores/theme.store';

export default function EntryScreen() {
  const { colors } = useThemeStore();
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="small" color={colors.primary} />
    </View>
  );
}

