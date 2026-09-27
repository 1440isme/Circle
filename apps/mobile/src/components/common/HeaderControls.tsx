import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Sun, Moon, Laptop, Globe } from 'lucide-react-native';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';

export const HeaderControls: React.FC = () => {
  const { colors, theme, resolvedTheme, setTheme } = useThemeStore();
  const { locale, setLocale } = useLanguageStore();

  const isDark = resolvedTheme === 'dark';

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
      return <Laptop size={16} color={colors.subtle} />;
    }
    return isDark ? (
      <Moon size={16} color={colors.primary} />
    ) : (
      <Sun size={16} color={colors.peach} />
    );
  };

  return (
    <View style={styles.container}>
      {/* Theme cycle button */}
      <TouchableOpacity
        onPress={cycleTheme}
        activeOpacity={0.7}
        style={[
          styles.circleBtn,
          {
            backgroundColor: colors.wash,
            borderColor: colors.hairline,
          },
        ]}
      >
        {renderThemeIcon()}
      </TouchableOpacity>

      {/* Language toggle button */}
      <TouchableOpacity
        onPress={toggleLocale}
        activeOpacity={0.7}
        style={[
          styles.circleBtn,
          {
            backgroundColor: colors.wash,
            borderColor: colors.hairline,
          },
        ]}
      >
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
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
