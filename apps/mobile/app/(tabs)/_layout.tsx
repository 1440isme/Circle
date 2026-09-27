import React from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Home, Users, MessageSquare, User } from 'lucide-react-native';
import { useThemeStore } from '../../src/stores/theme.store';
import { useLanguageStore } from '../../src/stores/language.store';

export default function TabsLayout() {
  const { colors, resolvedTheme } = useThemeStore();
  const t = useLanguageStore((s) => s.t);

  const isDark = resolvedTheme === 'dark';

  const renderTabIcon = (
    IconComponent: any,
    color: any,
    focused: boolean,
    size: number = 21,
  ) => {
    return (
      <View style={[styles.iconContainer, focused && (isDark ? styles.iconActiveDark : styles.iconActiveLight)]}>
        <IconComponent
          size={size}
          color={color}
          strokeWidth={focused ? 2.3 : 1.8}
        />
        {focused ? (
          <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
        ) : null}
      </View>
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(30, 41, 35, 0.45)',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: -0.2,
          marginTop: -2,
          marginBottom: Platform.OS === 'ios' ? 4 : 6,
        },
        tabBarItemStyle: {
          height: 56,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 4,
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 26 : 18,
          left: 18,
          right: 18,
          height: 66,
          borderRadius: 36,
          backgroundColor: 'transparent',
          borderWidth: 1.2,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.85)',
          // Floating Liquid Glass Ambient Shadow
          shadowColor: isDark ? '#000000' : colors.primary,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: isDark ? 0.48 : 0.12,
          shadowRadius: 20,
          elevation: 16,
          overflow: 'hidden',
          paddingHorizontal: 8,
          alignItems: 'center',
        },
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <BlurView
              intensity={Platform.OS === 'ios' ? 85 : 100}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            {/* Liquid glass optical wash */}
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isDark
                    ? 'rgba(20, 24, 22, 0.70)'
                    : 'rgba(255, 255, 255, 0.72)',
                },
              ]}
            />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.common.appName || 'CIRCLE',
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon(Home, color, focused, 21),
        }}
      />
      <Tabs.Screen
        name="circles"
        options={{
          title: t.nav.yourCircles || 'Vòng tròn',
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon(Users, color, focused, 21),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t.nav.chatChannels || 'Tin nhắn',
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon(MessageSquare, color, focused, 21),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.auth.profile || 'Hồ sơ',
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon(User, color, focused, 21),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 18,
    position: 'relative',
  },
  iconActiveLight: {
    backgroundColor: 'rgba(59, 122, 87, 0.08)',
  },
  iconActiveDark: {
    backgroundColor: 'rgba(107, 189, 142, 0.12)',
  },
  activeDot: {
    position: 'absolute',
    bottom: -3,
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
  },
});
