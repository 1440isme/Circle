import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Sun, Moon, Laptop, Globe } from 'lucide-react-native';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';

export const HeaderControls: React.FC = () => {
  const { colors, theme, resolvedTheme, setTheme } = useThemeStore();
  const { locale, setLocale } = useLanguageStore();

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const toggleLocale = () => {
    setLocale(locale === 'vi' ? 'en' : 'vi');
  };

  const renderThemeIcon = () => {
    if (theme === 'system') {
      return <Laptop size={15} color={colors.subtle} />;
    }
    return resolvedTheme === 'dark' ? (
      <Moon size={15} color={colors.primary} />
    ) : (
      <Sun size={15} color="#E89D71" />
    );
  };

  return (
    <View style={styles.container}>
      {/* Theme cycle button */}
      <TouchableOpacity
        onPress={cycleTheme}
        style={[
          styles.pillButton,
          {
            backgroundColor: colors.surface,
            borderColor: colors.hairline,
          },
        ]}
      >
        {renderThemeIcon()}
      </TouchableOpacity>

      {/* Language toggle button */}
      <TouchableOpacity
        onPress={toggleLocale}
        style={[
          styles.pillButton,
          {
            backgroundColor: colors.surface,
            borderColor: colors.hairline,
          },
        ]}
      >
        <Globe size={13} color={colors.subtle} />
        <Text style={[styles.langText, { color: colors.text }]}>
          {locale.toUpperCase()}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  langText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
