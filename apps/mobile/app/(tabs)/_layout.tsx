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
      name: 'circles',
      label: t.nav.yourCircles || 'Vòng tròn',
      Icon: Users,
    },
    {
      isCenter: true,
    },
    {
      name: 'messages',
      label: t.nav.chatChannels || 'Tin nhắn',
      Icon: MessageSquare,
    },
    {
      name: 'profile',
      label: t.auth.profile || 'Hồ sơ',
      Icon: User,
    },
  ];

  return (
    <View style={styles.floatingContainer} pointerEvents="box-none">
      <View
        style={[
          styles.floatingBar,
          {
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.16)'
              : 'rgba(255, 255, 255, 0.85)',
            shadowColor: isDark ? '#000000' : colors.primary,
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
              backgroundColor: isDark
                ? 'rgba(20, 24, 22, 0.72)'
                : 'rgba(255, 255, 255, 0.75)',
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
                    style={[styles.centerCircleButton, { backgroundColor: colors.primary }]}
                  >
                    <Plus size={24} color="#FFFFFF" strokeWidth={2.8} />
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

            const iconColor = isFocused
              ? colors.primary
              : isDark
              ? 'rgba(255, 255, 255, 0.45)'
              : 'rgba(30, 41, 35, 0.50)';

            return (
              <View key={tab.name} style={styles.tabSlot}>
                <TouchableOpacity
                  onPress={onPress}
                  activeOpacity={0.75}
                  style={[
                    styles.tabButton,
                    isFocused &&
                      (isDark ? styles.tabActiveDark : styles.tabActiveLight),
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
        <Tabs.Screen name="circles" />
        <Tabs.Screen name="messages" />
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
                backgroundColor: isDark ? 'rgba(26, 32, 29, 0.94)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.90)',
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle */}
            <View style={[styles.sheetHandle, { backgroundColor: colors.subtle + '40' }]} />

            {/* Title & Close */}
            <View style={styles.sheetHeader}>
              <View>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>
                  Chia sẻ & Kết nối
                </Text>
                <Text style={[styles.sheetSubtitle, { color: colors.subtle }]}>
                  Chọn nội dung bạn muốn chia sẻ cùng Vòng tròn
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
                    'Đăng Khoảnh khắc',
                    'Tính năng chụp & đăng khoảnh khắc kỷ niệm (Moment) sẽ mở khi bạn tham gia vào một Vòng tròn!',
                  )
                }
              >
                <View style={[styles.optionIconBox, { backgroundColor: `${colors.primary}20` }]}>
                  <Camera size={22} color={colors.primary} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    Khoảnh khắc nhanh (Moment)
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.subtle }]}>
                    Chụp hoặc tải ảnh kỷ niệm tức thì cho nhóm
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option 2: Điều muốn nói */}
              <TouchableOpacity
                style={[styles.optionItem, { backgroundColor: colors.wash, borderColor: colors.hairline }]}
                activeOpacity={0.8}
                onPress={() =>
                  handleCreateOption(
                    'Hộp thư Điều muốn nói',
                    'Tính năng gửi tâm sự ẩn danh hoặc lời nhắn ấm áp sẽ sẵn sàng trong Module 3!',
                  )
                }
              >
                <View style={[styles.optionIconBox, { backgroundColor: `${colors.coral}20` }]}>
                  <HeartHandshake size={22} color={colors.coral} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    Điều muốn nói (Reflection)
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.subtle }]}>
                    Gửi tâm sự, lời nhắn nhủ ấm áp ẩn danh
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option 3: Tạo Vòng tròn mới */}
              <TouchableOpacity
                style={[styles.optionItem, { backgroundColor: colors.wash, borderColor: colors.hairline }]}
                activeOpacity={0.8}
                onPress={() =>
                  handleCreateOption(
                    'Tạo Vòng tròn',
                    t.home.createCirclePrompt || 'Tính năng tạo Vòng tròn mới sẽ mở trong bản phát hành Module 3.',
                  )
                }
              >
                <View style={[styles.optionIconBox, { backgroundColor: `${colors.peach}40` }]}>
                  <Sparkles size={22} color="#D97706" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    Tạo Vòng tròn mới (New Circle)
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.subtle }]}>
                    Khởi tạo không gian kết nối nhóm riêng tư
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option 4: Lịch hẹn & Sự kiện */}
              <TouchableOpacity
                style={[styles.optionItem, { backgroundColor: colors.wash, borderColor: colors.hairline }]}
                activeOpacity={0.8}
                onPress={() =>
                  handleCreateOption(
                    'Lịch hẹn nhóm',
                    'Lên lịch hẹn và bình chọn thời gian gặp gỡ sẽ mở trong Module Tiện ích Nhóm!',
                  )
                }
              >
                <View style={[styles.optionIconBox, { backgroundColor: `${colors.primary}20` }]}>
                  <Calendar size={22} color={colors.primary} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    Lịch hẹn & Sự kiện
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.subtle }]}>
                    Lên kế hoạch gặp gỡ hoặc sự kiện chung
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 14,
    right: 14,
    alignItems: 'center',
  },
  floatingBar: {
    width: '100%',
    height: 68,
    borderRadius: 36,
    borderWidth: 1.2,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 16,
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  tabSlot: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButton: {
    width: '92%',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    paddingVertical: 2,
    gap: 3,
  },
  tabActiveLight: {
    backgroundColor: 'rgba(59, 122, 87, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59, 122, 87, 0.20)',
  },
  tabActiveDark: {
    backgroundColor: 'rgba(107, 189, 142, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(107, 189, 142, 0.28)',
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: -0.2,
  },
  centerCircleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B7A57',
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
