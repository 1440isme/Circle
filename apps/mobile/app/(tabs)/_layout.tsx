import React, { useState } from 'react';
import {
  StyleSheet,
  Platform,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import {
  Home,
  Users,
  MessageSquare,
  User,
  Plus,
  Camera,
  HeartHandshake,
  Calendar,
  X,
  Sparkles,
} from 'lucide-react-native';
import { useThemeStore } from '../../src/stores/theme.store';
import { useLanguageStore } from '../../src/stores/language.store';
import { useCircleStore } from '../../src/stores/circle.store';
import { CreateCircleModal } from '../../src/components/circle/CreateCircleModal';
import { JoinCircleModal } from '../../src/components/circle/JoinCircleModal';
import { CircleManagementModal } from '../../src/components/circle/CircleManagementModal';

interface CustomTabBarProps {
  state: any;
  navigation: any;
  onPressCreate: () => void;
  isDark: boolean;
  colors: any;
  t: any;
}

function CustomLiquidTabBar({
  state,
  navigation,
  onPressCreate,
  isDark,
  colors,
  t,
}: CustomTabBarProps) {
  const tabs = [
    {
      name: 'index',
      label: t.common.appName || 'CIRCLE',
      Icon: Home,
    },
    {
      isCenter: true,
    },
    {
      name: 'profile',
      label: t.auth.profile,
      Icon: User,
    },
  ];

  return (
    <View style={styles.floatingContainer} pointerEvents="box-none">
      <View
        style={[
          styles.floatingBar,
          {
            borderColor: colors.glassBorder,
            shadowColor: colors.primary,
          },
        ]}
      >
        {/* BlurView Backdrop */}
        <BlurView
          intensity={Platform.OS === 'ios' ? 85 : 100}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />

        {/* Liquid Glass Translucent Tint */}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: colors.glass,
            },
          ]}
        />

        {/* Row of 5 Equal Slots */}
        <View style={styles.tabsRow}>
          {tabs.map((tab, idx) => {
            if (tab.isCenter) {
              return (
                <View key="center-plus" style={styles.tabSlot}>
                  <TouchableOpacity
                    onPress={onPressCreate}
                    activeOpacity={0.82}
                    style={[styles.centerCircleButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                  >
                    <Plus size={24} color={colors.onPrimary} strokeWidth={2.8} />
                  </TouchableOpacity>
                </View>
              );
            }

            const routeIndex = state.routes.findIndex((r: any) => r.name === tab.name);
            const isFocused = state.index === routeIndex;
            const Icon = tab.Icon!;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: state.routes[routeIndex]?.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(tab.name);
              }
            };

            const iconColor = isFocused ? colors.primary : colors.subtle;

            return (
              <View key={tab.name} style={styles.tabSlot}>
                <TouchableOpacity
                  onPress={onPress}
                  activeOpacity={0.75}
                  style={[
                    styles.tabButton,
                    isFocused && {
                      backgroundColor: `${colors.primary}18`,
                      borderWidth: 1,
                      borderColor: `${colors.primary}30`,
                    },
                  ]}
                >
                  <Icon
                    size={20}
                    color={iconColor}
                    strokeWidth={isFocused ? 2.3 : 1.8}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.tabLabel,
                      {
                        color: iconColor,
                        fontWeight: isFocused ? '700' : '500',
                      },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { colors, resolvedTheme } = useThemeStore();
  const t = useLanguageStore((s) => s.t);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const setCircleCreateModalVisible = useCircleStore((s) => s.setCreateModalVisible);

  const isDark = resolvedTheme === 'dark';

  const handleCreateOption = (title: string, msg: string) => {
    setCreateModalVisible(false);
    setTimeout(() => {
      Alert.alert(title, msg);
    }, 250);
  };

  return (
    <>
      <Tabs
        tabBar={(props) => (
          <CustomLiquidTabBar
            {...props}
            onPressCreate={() => setCreateModalVisible(true)}
            isDark={isDark}
            colors={colors}
            t={t}
          />
        )}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen
          name="circles"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen name="profile" />
        <Tabs.Screen
          name="create"
          options={{
            href: null, // Hide from default drawer/routing lists
          }}
        />
      </Tabs>

      {/* iOS 26 Liquid Glass Creation ActionSheet Modal */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setCreateModalVisible(false)}
        >
          <BlurView
            intensity={Platform.OS === 'ios' ? 40 : 80}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />

          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.sheetContainer,
              {
                backgroundColor: colors.sheetBg,
                borderColor: colors.glassBorder,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle */}
            <View style={[styles.sheetHandle, { backgroundColor: colors.hairline }]} />

            {/* Title & Close */}
            <View style={styles.sheetHeader}>
              <View>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>
                  {t.composer.sheetTitle}
                </Text>
                <Text style={[styles.sheetSubtitle, { color: colors.subtle }]}>
                  {t.composer.sheetSubtitle}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setCreateModalVisible(false)}
                style={[styles.closeBtn, { backgroundColor: colors.wash }]}
              >
                <X size={18} color={colors.subtle} />
              </TouchableOpacity>
            </View>

            {/* Action Grid */}
            <View style={styles.optionsList}>
              {/* Option 1: Khoảnh khắc */}
              <TouchableOpacity
                style={[styles.optionItem, { backgroundColor: colors.wash, borderColor: colors.hairline }]}
                activeOpacity={0.8}
                onPress={() =>
                  handleCreateOption(
                    t.composer.momentAlertTitle,
                    t.composer.momentAlertDesc,
                  )
                }
              >
                <View style={[styles.optionIconBox, { backgroundColor: `${colors.primary}20` }]}>
                  <Camera size={22} color={colors.primary} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {t.composer.momentTitle}
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.subtle }]}>
                    {t.composer.momentDesc}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option 2: Điều muốn nói */}
              <TouchableOpacity
                style={[styles.optionItem, { backgroundColor: colors.wash, borderColor: colors.hairline }]}
                activeOpacity={0.8}
                onPress={() =>
                  handleCreateOption(
                    t.composer.reflectionAlertTitle,
                    t.composer.reflectionAlertDesc,
                  )
                }
              >
                <View style={[styles.optionIconBox, { backgroundColor: `${colors.coral}20` }]}>
                  <HeartHandshake size={22} color={colors.coral} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {t.composer.reflectionTitle}
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.subtle }]}>
                    {t.composer.reflectionDesc}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option 3: Tạo Vòng tròn mới */}
              <TouchableOpacity
                style={[styles.optionItem, { backgroundColor: colors.wash, borderColor: colors.hairline }]}
                activeOpacity={0.8}
                onPress={() => {
                  setCreateModalVisible(false);
                  setCircleCreateModalVisible(true);
                }}
              >
                <View style={[styles.optionIconBox, { backgroundColor: `${colors.peach}40` }]}>
                  <Sparkles size={22} color={colors.warning} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {t.composer.newCircleTitle}
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.subtle }]}>
                    {t.composer.newCircleDesc}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option 4: Lịch hẹn & Sự kiện */}
              <TouchableOpacity
                style={[styles.optionItem, { backgroundColor: colors.wash, borderColor: colors.hairline }]}
                activeOpacity={0.8}
                onPress={() =>
                  handleCreateOption(
                    t.composer.eventAlertTitle,
                    t.composer.eventAlertDesc,
                  )
                }
              >
                <View style={[styles.optionIconBox, { backgroundColor: `${colors.primary}20` }]}>
                  <Calendar size={22} color={colors.primary} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {t.composer.eventTitle}
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.subtle }]}>
                    {t.composer.eventDesc}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Circle Core & Governance Modals */}
      <CreateCircleModal />
      <JoinCircleModal />
      <CircleManagementModal />
    </>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingBar: {
    width: 228,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.2,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 14,
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  tabSlot: {
    width: 64,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButton: {
    width: 58,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingVertical: 2,
    gap: 2,
  },
  tabLabel: {
    fontSize: 9.5,
    letterSpacing: -0.2,
  },
  centerCircleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  sheetContainer: {
    borderRadius: 32,
    padding: 22,
    borderWidth: 1.2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsList: {
    gap: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
  },
  optionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  optionDesc: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
});
