import React, { useState } from 'react';
import {
  StyleSheet,
  Platform,
  View,
  Text,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Home,
  User,
  Plus,
  Camera,
  HeartHandshake,
  Calendar,
  X,
  Sparkles,
  AlertCircle,
} from 'lucide-react-native';
import { useThemeStore } from '../../src/stores/theme.store';
import { useLanguageStore } from '../../src/stores/language.store';
import { useCircleStore } from '../../src/stores/circle.store';
import { useMyCirclesQuery } from '../../src/hooks/use-circle-queries';
import { getGlassTheme } from '../../src/constants/glass-theme';
import { CreateCircleModal } from '../../src/components/circle/CreateCircleModal';
import { JoinCircleModal } from '../../src/components/circle/JoinCircleModal';
import { CircleManagementModal } from '../../src/components/circle/CircleManagementModal';

interface CustomTabBarProps {
  state?: any;
  navigation?: any;
  descriptors?: any;
  onPressCreate: () => void;
  isDark: boolean;
  isGlass: boolean;
  glassTheme: ReturnType<typeof getGlassTheme>;
  bottomInset: number;
  colors: any;
  t: any;
}

function CustomLiquidTabBar({
  state,
  navigation,
  onPressCreate,
  isGlass,
  glassTheme,
  bottomInset,
  colors,
  t,
}: CustomTabBarProps) {
  const router = useRouter();
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
    <View
      style={[
        styles.floatingContainer,
        { bottom: Math.max(bottomInset, Platform.OS === 'ios' ? 20 : 12) },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.floatingBar,
          {
            backgroundColor: isGlass ? 'transparent' : glassTheme.colors.glassBg,
            borderColor: isGlass ? glassTheme.colors.glassBorder : colors.hairline,
            shadowColor: isGlass ? colors.primary : '#000',
            shadowOpacity: isGlass ? 0.35 : 0.12,
          },
        ]}
      >
        {/* BlurView Backdrop (Strict Glass Mode Only) */}
        {isGlass ? (
          <>
            <BlurView
              intensity={glassTheme.blur.intensity}
              tint={glassTheme.blur.tint}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: glassTheme.colors.glassBg },
              ]}
            />
          </>
        ) : null}

        {/* Row of Slots */}
        <View style={styles.tabsRow}>
          {tabs.map((tab) => {
            if (tab.isCenter) {
              return (
                <View key="center-plus" style={styles.tabSlot}>
                  <TouchableOpacity
                    onPress={onPressCreate}
                    activeOpacity={0.82}
                    style={[
                      styles.centerCircleButton,
                      { backgroundColor: colors.primary, shadowColor: colors.primary },
                    ]}
                    accessibilityLabel={t.composer.sheetTitle}
                  >
                    <Plus size={24} color={colors.onPrimary} strokeWidth={2.8} />
                  </TouchableOpacity>
                </View>
              );
            }

            const routeIndex = state?.routes?.findIndex((r: any) => r.name === tab.name) ?? -1;
            const isFocused = state?.index === routeIndex;
            const Icon = tab.Icon!;

            const onPress = () => {
              if (navigation && typeof navigation.emit === 'function') {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: state?.routes?.[routeIndex]?.key,
                  canPreventDefault: true,
                });

                if (event?.defaultPrevented) return;
              }

              if (!isFocused) {
                if (navigation && typeof navigation.navigate === 'function') {
                  navigation.navigate(tab.name);
                } else {
                  router.push(tab.name === 'index' ? '/(tabs)' : (`/(tabs)/${tab.name}` as any));
                }
              }
            };

            const iconColor = isFocused ? colors.sage : colors.subtle;

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
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, resolvedTheme, uiStyle } = useThemeStore();
  const t = useLanguageStore((s) => s.t);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [sheetNotice, setSheetNotice] = useState<string | null>(null);
  const activeCircle = useCircleStore((s) => s.activeCircle);
  const setActiveCircle = useCircleStore((s) => s.setActiveCircle);
  const setCircleCreateModalVisible = useCircleStore((s) => s.setCreateModalVisible);
  const { data: myCircles = [] } = useMyCirclesQuery();

  const isDark = resolvedTheme === 'dark';
  const isGlass = uiStyle === 'glass';
  const glassTheme = getGlassTheme(isDark, uiStyle);
  const targetCircle = activeCircle || myCircles[0] || null;

  const handleOpenCircleAction = (
    tab: 'moments' | 'tools',
    tool?: 'anonymous' | 'calendar',
    fallbackNotice?: string,
  ) => {
    if (!targetCircle) {
      setSheetNotice(fallbackNotice || t.circle.noCircleJoinedYet);
      return;
    }
    setSheetNotice(null);
    setCreateModalVisible(false);
    setActiveCircle(targetCircle);
    router.push({
      pathname: '/circle/[id]' as any,
      params: tool ? { id: targetCircle.id, tab, tool } : { id: targetCircle.id, tab },
    });
  };

  return (
    <>
      <Tabs
        tabBar={(props) => (
          <CustomLiquidTabBar
            {...props}
            onPressCreate={() => {
              setSheetNotice(null);
              setCreateModalVisible(true);
            }}
            isDark={isDark}
            isGlass={isGlass}
            glassTheme={glassTheme}
            bottomInset={insets.bottom}
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

      {/* Creation ActionSheet Modal (Gated Glass vs Solid Flat) */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setSheetNotice(null);
          setCreateModalVisible(false);
        }}
      >
        <TouchableOpacity
          style={[
            styles.modalBackdrop,
            { paddingBottom: Math.max(insets.bottom + 12, 24) },
          ]}
          activeOpacity={1}
          onPress={() => {
            setSheetNotice(null);
            setCreateModalVisible(false);
          }}
        >
          {isGlass ? (
            <BlurView
              intensity={glassTheme.blur.intensity}
              tint={glassTheme.blur.tint}
              style={StyleSheet.absoluteFill}
            />
          ) : null}

          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.sheetContainer,
              {
                backgroundColor: isGlass
                  ? glassTheme.colors.glassBgSheet
                  : colors.surface,
                borderColor: isGlass ? glassTheme.colors.glassBorder : colors.hairline,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle */}
            <View style={[styles.sheetHandle, { backgroundColor: colors.hairline }]} />

            {/* Title & Close */}
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>
                  {t.composer.sheetTitle}
                </Text>
                <Text style={[styles.sheetSubtitle, { color: colors.subtle }]}>
                  {t.composer.sheetSubtitle}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setSheetNotice(null);
                  setCreateModalVisible(false);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[styles.closeBtn, { backgroundColor: colors.wash }]}
                accessibilityLabel={t.common.close}
              >
                <X size={18} color={colors.subtle} />
              </TouchableOpacity>
            </View>

            {/* Inline Info Notice when no Circle is joined */}
            {sheetNotice ? (
              <View
                style={[
                  styles.inlineNoticeBanner,
                  { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}35` },
                ]}
              >
                <AlertCircle size={16} color={colors.sage} />
                <Text style={[styles.inlineNoticeText, { color: colors.text }]}>
                  {sheetNotice}
                </Text>
              </View>
            ) : null}

            {/* Action Grid */}
            <View style={styles.optionsList}>
              {/* Option 1: Khoảnh khắc */}
              <TouchableOpacity
                style={[styles.optionItem, { backgroundColor: colors.wash, borderColor: colors.hairline }]}
                activeOpacity={0.8}
                onPress={() =>
                  handleOpenCircleAction('moments', undefined, t.composer.momentAlertDesc)
                }
              >
                <Camera size={24} color={colors.sage} />
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
                  handleOpenCircleAction('tools', 'anonymous', t.composer.reflectionAlertDesc)
                }
              >
                <HeartHandshake size={24} color={colors.coral} />
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
                  setSheetNotice(null);
                  setCreateModalVisible(false);
                  setCircleCreateModalVisible(true);
                }}
              >
                <Sparkles size={24} color={colors.warning} />
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
                  handleOpenCircleAction('tools', 'calendar', t.composer.eventAlertDesc)
                }
              >
                <Calendar size={24} color={colors.sage} />
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
  inlineNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  inlineNoticeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
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
