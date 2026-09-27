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

  // Reusable tab item button with full slot-height active pill capsule
  const renderTabButton = (props: any) => {
    const focused = props.accessibilityState?.selected;
    return (
      <TouchableOpacity
        {...props}
        activeOpacity={0.7}
        style={[
          styles.tabButton,
          focused && (isDark ? styles.tabButtonActiveDark : styles.tabButtonActiveLight),
        ]}
      >
        {props.children}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: isDark
            ? 'rgba(255, 255, 255, 0.45)'
            : 'rgba(30, 41, 35, 0.50)',
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            letterSpacing: -0.2,
            marginTop: 2,
            marginBottom: Platform.OS === 'ios' ? 2 : 4,
          },
          tabBarStyle: {
            position: 'absolute',
            bottom: Platform.OS === 'ios' ? 24 : 16,
            left: 14,
            right: 14,
            height: 70,
            borderRadius: 38,
            backgroundColor: 'transparent',
            borderWidth: 1.2,
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.16)'
              : 'rgba(255, 255, 255, 0.85)',
            // Floating Liquid Glass Ambient Shadow
            shadowColor: isDark ? '#000000' : colors.primary,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: isDark ? 0.45 : 0.12,
            shadowRadius: 20,
            elevation: 16,
            overflow: 'hidden',
            paddingHorizontal: 6,
            alignItems: 'center',
          },
          tabBarBackground: () => (
            <View style={StyleSheet.absoluteFill}>
              <BlurView
                intensity={Platform.OS === 'ios' ? 85 : 100}
                tint={isDark ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
              {/* Liquid glass optical tint */}
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: isDark
                      ? 'rgba(20, 24, 22, 0.72)'
                      : 'rgba(255, 255, 255, 0.74)',
                  },
                ]}
              />
            </View>
          ),
        }}
      >
        {/* 1. Trang chủ (Home) */}
        <Tabs.Screen
          name="index"
          options={{
            title: t.common.appName || 'CIRCLE',
            tabBarIcon: ({ color }) => <Home size={22} color={color} strokeWidth={2} />,
            tabBarButton: renderTabButton,
          }}
        />

        {/* 2. Vòng tròn (Circles) */}
        <Tabs.Screen
          name="circles"
          options={{
            title: t.nav.yourCircles || 'Vòng tròn',
            tabBarIcon: ({ color }) => <Users size={22} color={color} strokeWidth={2} />,
            tabBarButton: renderTabButton,
          }}
        />

        {/* 3. Nút Tạo mới / Đăng khoảnh khắc (+) */}
        <Tabs.Screen
          name="create"
          options={{
            tabBarLabel: () => null,
            tabBarButton: () => (
              <View style={styles.centerButtonWrapper}>
                <TouchableOpacity
                  onPress={() => setCreateModalVisible(true)}
                  style={[styles.centerButton, { backgroundColor: colors.primary }]}
                  activeOpacity={0.85}
                >
                  <Plus size={26} color="#FFFFFF" strokeWidth={2.6} />
                </TouchableOpacity>
              </View>
            ),
          }}
        />

        {/* 4. Tin nhắn (Messages) */}
        <Tabs.Screen
          name="messages"
          options={{
            title: t.nav.chatChannels || 'Tin nhắn',
            tabBarIcon: ({ color }) => (
              <MessageSquare size={22} color={color} strokeWidth={2} />
            ),
            tabBarButton: renderTabButton,
          }}
        />

        {/* 5. Hồ sơ (Profile) */}
        <Tabs.Screen
          name="profile"
          options={{
            title: t.auth.profile || 'Hồ sơ',
            tabBarIcon: ({ color }) => <User size={22} color={color} strokeWidth={2} />,
            tabBarButton: renderTabButton,
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
  tabButton: {
    flex: 1,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 27,
    marginHorizontal: 2,
    marginVertical: 8,
  },
  tabButtonActiveLight: {
    backgroundColor: 'rgba(59, 122, 87, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59, 122, 87, 0.20)',
  },
  tabButtonActiveDark: {
    backgroundColor: 'rgba(107, 189, 142, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(107, 189, 142, 0.30)',
  },
  centerButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    height: 70,
  },
  centerButton: {
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
