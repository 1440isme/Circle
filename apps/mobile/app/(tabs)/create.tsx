import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../../src/stores/theme.store';
import { useLanguageStore } from '../../src/stores/language.store';

export default function CreateScreen() {
  const { colors } = useThemeStore();
  const t = useLanguageStore((s) => s.t);

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      <Text style={[styles.text, { color: colors.text }]}>
        {t.home.composerPlaceholder}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  text: {
    fontSize: 15,
    textAlign: 'center',
  },
});
