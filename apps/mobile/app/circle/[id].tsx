import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Image as RNImage,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Modal,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  BackHandler,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Settings,
  Phone,
  Video,
  Users,
  MessageSquare,
  Camera,
  Layers,
  Sparkles,
  MoreVertical,
  ChevronRight,
  Radio,
  Image as ImageIcon,
  Calendar,
  Vote,
  HeartHandshake,
  FileSpreadsheet,
  Navigation,
  Crown,
  Plus,
} from 'lucide-react-native';
import { useThemeStore } from '../../src/stores/theme.store';
import { getGlassTheme } from '../../src/constants/glass-theme';
import { useLanguageStore } from '../../src/stores/language.store';
import { useAuthStore } from '../../src/stores/auth.store';
import { useCircleStore } from '../../src/stores/circle.store';
import {
  useCircleDetailQuery,
  useCircleMembersQuery,
  useChannelMessagesQuery,
  useMyCirclesQuery,
} from '../../src/hooks/use-circle-queries';
import {
  useActiveCallQuery,
  useInitiateCallMutation,
  useJoinCallMutation,
} from '../../src/hooks/use-call-queries';
import { useEdgeSwipeDismiss } from '../../src/hooks/use-edge-swipe';
import { triggerSelectionHaptic, triggerSuccessHaptic } from '../../src/services/sound.service';
import { subscribeSocketConnection, getMobileSocket } from '../../src/services/socket';
import { CallType, CallSessionDetailEntity } from '@circle/types';

import { CircleChatFullscreenView } from '../../src/components/chat/CircleChatFullscreenView';
import { CircleActivityHubView, ToolKey } from '../../src/components/circle/CircleActivityHubView';
import { MomentsView } from '../../src/components/moment/MomentsView';
import { CircleManagementModal } from '../../src/components/circle/CircleManagementModal';
import { CreateCircleModal } from '../../src/components/circle/CreateCircleModal';
import { JoinCircleModal } from '../../src/components/circle/JoinCircleModal';
import { MobileCallStageModal } from '../../src/components/call/MobileCallStageModal';

import { MobileAlbumsView } from '../../src/components/tools/MobileAlbumsView';
import { MobileCalendarView } from '../../src/components/tools/MobileCalendarView';
import { MobileWheelView } from '../../src/components/tools/MobileWheelView';
import { MobileAnonymousView } from '../../src/components/tools/MobileAnonymousView';
import { MobilePlanningView } from '../../src/components/tools/MobilePlanningView';
import { MobileLocationView } from '../../src/components/tools/MobileLocationView';
import { MobilePollView } from '../../src/components/tools/MobilePollView';

export type WorkspaceSection = 'home' | 'moments' | 'tools';
const SECTION_ORDER: WorkspaceSection[] = ['home', 'moments', 'tools'];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function CircleWorkspaceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, tab, tool, openCall, action, channelId, messageId, eventStart, toolTargetId } = useLocalSearchParams<{
    id: string;
    tab?: string;
    tool?: string;
    openCall?: string;
    action?: string;
    channelId?: string;
    messageId?: string;
    eventStart?: string;
    toolTargetId?: string;
  }>();
  const circleId = id || '';

  const { colors, resolvedTheme, uiStyle } = useThemeStore();
  const { t, locale } = useLanguageStore();
  const user = useAuthStore((s) => s.user);
  const isDark = resolvedTheme === 'dark';
  const isGlass = uiStyle === 'glass';
  const glassTheme = getGlassTheme(isDark, uiStyle);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const setActiveCircleId = useCircleStore((s) => s.setActiveCircleId);
  const setActiveCircle = useCircleStore((s) => s.setActiveCircle);
  const setManageModalVisible = useCircleStore((s) => s.setManageModalVisible);
  const setCreateModalVisible = useCircleStore((s) => s.setCreateModalVisible);
  const setJoinModalVisible = useCircleStore((s) => s.setJoinModalVisible);

  // Queries
  const { data: circle, isLoading: isLoadingCircle } = useCircleDetailQuery(circleId);
  const { data: members = [] } = useCircleMembersQuery(circleId);
  const { data: userCircles = [] } = useMyCirclesQuery();
  const { data: activeCallSession } = useActiveCallQuery(circleId);
  const initiateCallMutation = useInitiateCallMutation();

  const currentChannelId = circle?.channels?.find((channel) => channel.id === channelId)?.id ?? circle?.channels?.[0]?.id ?? null;
  const { data: messagesData } = useChannelMessagesQuery(currentChannelId);
  const unreadCount = useMemo(() => {
    if (!messagesData?.pages || !user?.id) return 0;
    const all = messagesData.pages.flatMap((p: any) => p.messages || []);
    return all.filter((m: any) => {
      const senderId = m.sender?.user?.id || m.sender?.userId;
      if (senderId === user.id) return false;
      const read = (m.readers || []).some((r: any) => r.userId === user.id);
      return !read;
    }).length;
  }, [messagesData, user?.id]);

  // Section & Nav State
  const [activeSection, setActiveSection] = useState<WorkspaceSection>(() => {
    if (tab === 'moments') return 'moments';
    if (tab === 'tools') return 'tools';
    return 'home';
  });
  const [isChatOpen, setIsChatOpen] = useState(() => tab === 'chat');
  const [selectedTool, setSelectedTool] = useState<ToolKey | 'menu'>(() => (tool as ToolKey) || 'menu');
  useEffect(() => {
    if (action === 'joinRequests' && circle) {
      setActiveCircle(circle);
      setManageModalVisible(true, 'members');
    }
  }, [action, circle, setActiveCircle, setManageModalVisible]);

  const [circleSwitcherVisible, setCircleSwitcherVisible] = useState(false);
  const [activeCallStageSession, setActiveCallStageSession] = useState<CallSessionDetailEntity | null>(null);
  const [incomingCallAlert, setIncomingCallAlert] = useState<any | null>(null);
  const [headerHeight, setHeaderHeight] = useState(Platform.OS === 'ios' ? 104 : 96);

  // Moments filter state
  const [momentsMemberFilter, setMomentsMemberFilter] = useState<string | 'all'>('all');
  const [isMomentsHistoryActive, setIsMomentsHistoryActive] = useState(false);
  const [momentsHistoryViewMode, setMomentsHistoryViewMode] = useState<'month' | 'map'>('month');

  const horizontalPagerRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const toolSubLevelBackRef = useRef<(() => boolean) | null>(null);

  // Edge Swipe & Back Handlers
  const handleHierarchicalBack = useCallback(() => {
    if (selectedTool !== 'menu') {
      if (toolSubLevelBackRef.current && toolSubLevelBackRef.current()) {
        return;
      }
      setSelectedTool('menu');
      return;
    }
    if (isChatOpen) {
      setIsChatOpen(false);
      return;
    }
    if (activeSection !== 'home') {
      handleSectionSelect('home');
      return;
    }
    triggerSelectionHaptic();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }, [selectedTool, isChatOpen, activeSection, router]);

  const edgePan = useEdgeSwipeDismiss({ onDismiss: handleHierarchicalBack });
  const toolEdgePan = useEdgeSwipeDismiss({ onDismiss: handleHierarchicalBack });

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectedTool !== 'menu' || isChatOpen || activeSection !== 'home') {
        handleHierarchicalBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [handleHierarchicalBack, selectedTool, isChatOpen, activeSection]);

  // Section switcher
  const handleSectionSelect = useCallback(
    (section: WorkspaceSection) => {
      triggerSelectionHaptic();
      setActiveSection(section);
      const idx = SECTION_ORDER.indexOf(section);
      if (idx !== -1 && horizontalPagerRef.current) {
        horizontalPagerRef.current.scrollTo({ x: idx * screenWidth, animated: true });
      }
    },
    [screenWidth],
  );

  const handleHorizontalScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const idx = Math.round(offsetX / screenWidth);
      const target = SECTION_ORDER[idx];
      if (target && target !== activeSection) {
        triggerSelectionHaptic();
        setActiveSection(target);
      }
    },
    [screenWidth, activeSection],
  );

  // Synchronize route params on mount/change
  useEffect(() => {
    if (tab === 'chat') {
      setIsChatOpen(true);
      return;
    }
    const targetSection: WorkspaceSection =
      tab === 'moments' || action === 'capture' ? 'moments' : tab === 'tools' ? 'tools' : 'home';
    const idx = SECTION_ORDER.indexOf(targetSection);
    setActiveSection(targetSection);
    if (horizontalPagerRef.current && idx >= 0) {
      setTimeout(() => {
        horizontalPagerRef.current?.scrollTo({ x: idx * screenWidth, animated: false });
      }, 50);
    }
    if (action === 'capture') {
      setIsMomentsHistoryActive(false);
    }
  }, [tab, action, screenWidth]);

  useEffect(() => {
    if (tool && tool !== 'menu') {
      setSelectedTool(tool as ToolKey);
      handleSectionSelect('tools');
    }
  }, [tool, handleSectionSelect]);

  useEffect(() => {
    if (openCall === 'audio' || openCall === 'video') {
      handleStartCall(openCall);
    }
  }, [openCall]);

  // Active circle store sync
  useEffect(() => {
    if (circleId) {
      setActiveCircleId(circleId);
      if (circle) setActiveCircle(circle);
    }
  }, [circleId, circle, setActiveCircleId, setActiveCircle]);

  // Call session handling
  const handleStartCall = async (type: 'audio' | 'video') => {
    try {
      triggerSuccessHaptic();
      const callType = type === 'video' ? CallType.VIDEO : CallType.AUDIO;
      const res: any = await initiateCallMutation.mutateAsync({ circleId, callType });
      const session = res?.callSession || res;
      if (session && session.id) {
        setActiveCallStageSession(session);
      }
    } catch (err: any) {
      console.warn('Start call error:', err);
    }
  };

  if (isLoadingCircle) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.canvas }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.subtle }]}>
          {t.circle.loadingCircles}
        </Text>
      </View>
    );
  }

  if (!circle) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.canvas }]}>
        <Text style={[styles.notFoundText, { color: colors.text }]}>
          {t.circle.notFound}
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          style={[styles.backBtnPill, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.backBtnText, { color: colors.onPrimary }]}>
            {t.home.backToHome}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentCircleMember = members.find((m: any) => (m.user?.id || m.userId) === user?.id);

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]} {...edgePan.panHandlers}>
      <Stack.Screen options={{ gestureEnabled: false, headerShown: false }} />

      {/* =========================================================================
          WORKSPACE HEADER (1 SINGLE ROW: Back | Avatar + Name | Menu | Chat Button)
         ========================================================================= */}
      <View
        style={[
          styles.workspaceHeaderWrapper,
          {
            paddingTop: insets.top + (Platform.OS === 'ios' ? 6 : 8),
            paddingBottom: 10,
          },
        ]}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0 && Math.abs(h - headerHeight) > 2) {
            setHeaderHeight(h);
          }
        }}
        pointerEvents="box-none"
      >
        {isGlass ? (
          <BlurView
            intensity={glassTheme.blur.intensity}
            tint={glassTheme.blur.tint}
            style={[StyleSheet.absoluteFill, { backgroundColor: glassTheme.colors.glassBg }]}
            pointerEvents="none"
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: colors.surface,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: colors.hairline,
              },
            ]}
            pointerEvents="none"
          />
        )}

        <View style={styles.workspaceHeaderRow} pointerEvents="box-none">
          {/* Back to Tabs */}
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => {
              triggerSelectionHaptic();
              if (router.canGoBack()) router.back();
              else router.replace('/(tabs)');
            }}
            style={[
              styles.navCircleBtn,
              {
                backgroundColor: isGlass
                  ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')
                  : colors.surface,
                borderColor: isGlass
                  ? (isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.07)')
                  : colors.hairline,
              },
            ]}
            accessibilityLabel={t.common.back}
          >
            <ArrowLeft size={18} color={colors.text} />
          </TouchableOpacity>

          {/* Center: Circle Avatar & Title (Tapping opens Circle Switcher) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              triggerSelectionHaptic();
              setCircleSwitcherVisible(true);
            }}
            style={styles.headerCenterInfo}
          >
            {circle.avatarUrl ? (
              <RNImage source={{ uri: circle.avatarUrl }} style={styles.circleAvatarImg} />
            ) : (
              <View style={[styles.circleAvatarFallback, { backgroundColor: colors.wash }]}>
                <Text style={[styles.circleAvatarInitial, { color: colors.primary }]}>
                  {getInitials(circle.name)}
                </Text>
              </View>
            )}
            <View style={{ flexShrink: 1 }}>
              <Text style={[styles.circleNameText, { color: colors.text }]} numberOfLines={1}>
                {circle.name}
              </Text>
              <Text style={[styles.circleSubtitleText, { color: colors.subtle }]}>
                {members.length > 0 ? `${members.length} ${t.circle.membersCount || 'thành viên'}` : 'Circle'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Right: Menu & Chat Button */}
          <View style={styles.headerRightActions}>
            {/* Menu */}
            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              onPress={() => {
                triggerSelectionHaptic();
                setManageModalVisible(true);
              }}
              style={[
                styles.navCircleBtn,
                {
                  backgroundColor: isGlass
                    ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')
                    : colors.surface,
                  borderColor: isGlass
                    ? (isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.07)')
                    : colors.hairline,
                },
              ]}
              accessibilityLabel={t.nav.circleSettings}
            >
              <MoreVertical size={16} color={colors.text} />
            </TouchableOpacity>

            {/* Chat Button with unread badge */}
            <TouchableOpacity
              activeOpacity={0.85}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              onPress={() => {
                triggerSelectionHaptic();
                setIsChatOpen(true);
              }}
              style={[
                styles.navChatBtn,
                {
                  backgroundColor: isGlass ? colors.primary : colors.wash,
                  borderColor: isGlass ? 'transparent' : colors.hairline,
                },
              ]}
              accessibilityLabel={t.chat.title}
            >
              <MessageSquare size={16} color={isGlass ? colors.onPrimary : colors.primary} />
              {unreadCount > 0 && (
                <View style={[styles.chatUnreadBadge, { backgroundColor: colors.danger }]}>
                  <Text style={styles.chatUnreadBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Swipe Dot Indicator Hint [● ○ ○] */}
        <View style={styles.swipeDotRow} pointerEvents="box-none">
          {SECTION_ORDER.map((sec, idx) => {
            const isCur = sec === activeSection;
            return (
              <TouchableOpacity
                key={sec}
                activeOpacity={0.8}
                onPress={() => handleSectionSelect(sec)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <View
                  style={[
                    styles.swipeDot,
                    {
                      backgroundColor: isCur ? colors.primary : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'),
                      width: isCur ? 16 : 6,
                    },
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* =========================================================================
          3-SECTION HORIZONTAL PAGER: Page 0 (Home/Hub) · Page 1 (Khoảnh khắc) · Page 2 (Tiện ích)
         ========================================================================= */}
      <ScrollView
        ref={horizontalPagerRef}
        horizontal
        pagingEnabled
        directionalLockEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleHorizontalScrollEnd}
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* PAGE 0: HUB HOẠT ĐỘNG */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <CircleActivityHubView
            circleId={circleId}
            circleName={circle.name}
            defaultChannelId={currentChannelId}
            onOpenChat={() => setIsChatOpen(true)}
            onOpenMoments={() => handleSectionSelect('moments')}
            onOpenTool={(toolKey) => {
              setSelectedTool(toolKey);
              handleSectionSelect('tools');
            }}
            topPadding={headerHeight}
            bottomPadding={insets.bottom + 64}
          />
        </View>

        {/* PAGE 1: KHOẢNH KHẮC THƯỜNG NGÀY */}
        <View style={{ width: screenWidth, flex: 1, paddingTop: headerHeight }}>
          <MomentsView
            circleId={circleId}
            circleName={circle.name}
            isActive={activeSection === 'moments'}
            selectedMemberId={momentsMemberFilter}
            onSelectMemberId={setMomentsMemberFilter}
            isHistoryActive={isMomentsHistoryActive}
            onHistoryActiveChange={setIsMomentsHistoryActive}
            historyViewMode={momentsHistoryViewMode}
            onHistoryViewModeChange={setMomentsHistoryViewMode}
          />
        </View>

        {/* PAGE 2: TIỆN ÍCH NHÓM */}
        <View style={{ width: screenWidth, flex: 1, paddingTop: headerHeight }}>
          <ScrollView
            nestedScrollEnabled
            contentContainerStyle={[styles.toolsScrollContent, { paddingBottom: insets.bottom + 84 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.toolsCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
              {/* Tool 1: Realtime Voice Call */}
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={() => handleStartCall('audio')}
                style={[styles.toolRow, { borderBottomColor: colors.hairline }]}
              >
                <Radio size={20} color={colors.text} />
                <View style={styles.toolInfo}>
                  <Text style={[styles.toolTitle, { color: colors.text }]}>
                    {t.nav.groupCall}
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.subtle} />
              </TouchableOpacity>

              {/* Tool 2: Photo Album */}
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={() => setSelectedTool('album')}
                style={[styles.toolRow, { borderBottomColor: colors.hairline }]}
              >
                <ImageIcon size={20} color={colors.text} />
                <View style={styles.toolInfo}>
                  <Text style={[styles.toolTitle, { color: colors.text }]}>
                    {t.nav.photoAlbum}
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.subtle} />
              </TouchableOpacity>

              {/* Tool 3: Calendar */}
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={() => setSelectedTool('calendar')}
                style={[styles.toolRow, { borderBottomColor: colors.hairline }]}
              >
                <Calendar size={20} color={colors.text} />
                <View style={styles.toolInfo}>
                  <Text style={[styles.toolTitle, { color: colors.text }]}>
                    {locale === 'vi' ? 'Lịch hẹn' : 'Calendar'}
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.subtle} />
              </TouchableOpacity>

              {/* Tool 4: Planning Sheet */}
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={() => setSelectedTool('planning')}
                style={[styles.toolRow, { borderBottomColor: colors.hairline }]}
              >
                <FileSpreadsheet size={20} color={colors.text} />
                <View style={styles.toolInfo}>
                  <Text style={[styles.toolTitle, { color: colors.text }]}>
                    {locale === 'vi' ? 'Kế hoạch' : 'Planning'}
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.subtle} />
              </TouchableOpacity>

              {/* Tool 5: Live Location */}
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={() => setSelectedTool('location')}
                style={[styles.toolRow, { borderBottomColor: colors.hairline }]}
              >
                <Navigation size={20} color={colors.text} />
                <View style={styles.toolInfo}>
                  <Text style={[styles.toolTitle, { color: colors.text }]}>
                    {t.nav.liveLocation}
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.subtle} />
              </TouchableOpacity>

              {/* Tool 6: Group Poll */}
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={() => setSelectedTool('poll')}
                style={[styles.toolRow, { borderBottomColor: colors.hairline }]}
              >
                <Vote size={20} color={colors.text} />
                <View style={styles.toolInfo}>
                  <Text style={[styles.toolTitle, { color: colors.text }]}>
                    {t.nav.groupPoll}
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.subtle} />
              </TouchableOpacity>

              {/* Tool 7: Wheel */}
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={() => setSelectedTool('wheel')}
                style={[styles.toolRow, { borderBottomColor: colors.hairline }]}
              >
                <Sparkles size={20} color={colors.text} />
                <View style={styles.toolInfo}>
                  <Text style={[styles.toolTitle, { color: colors.text }]}>
                    {locale === 'vi' ? 'Vòng quay' : 'Wheel'}
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.subtle} />
              </TouchableOpacity>

              {/* Tool 8: Anonymous Mailbox */}
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={() => setSelectedTool('anonymous')}
                style={[styles.toolRow, { borderBottomWidth: 0 }]}
              >
                <HeartHandshake size={20} color={colors.coral} />
                <View style={styles.toolInfo}>
                  <Text style={[styles.toolTitle, { color: colors.text }]}>
                    {locale === 'vi' ? 'Lời nhắn' : 'Notes'}
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.subtle} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* =========================================================================
          FLOATING BOTTOM NAV PILL (Home · Khoảnh khắc · Tiện ích)
         ========================================================================= */}
      {!isChatOpen && selectedTool === 'menu' && (
        <View
          style={[
            styles.floatingBottomPillWrapper,
            { bottom: Math.max(insets.bottom + 8, 16) },
          ]}
          pointerEvents="box-none"
        >
          <View
            style={[
              styles.floatingBottomPill,
              {
                backgroundColor: isGlass ? glassTheme.colors.glassBg : colors.surface,
                borderColor: isGlass ? glassTheme.colors.glassBorder : colors.hairline,
              },
            ]}
          >
            {isGlass && (
              <BlurView
                intensity={glassTheme.blur.intensity}
                tint={glassTheme.blur.tint}
                style={[StyleSheet.absoluteFill, { borderRadius: 30 }]}
                pointerEvents="none"
              />
            )}

            {/* Pill 1: Home / Hub */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleSectionSelect('home')}
              style={[
                styles.bottomPillItem,
                activeSection === 'home' && { backgroundColor: isGlass ? `${colors.primary}25` : colors.wash },
              ]}
            >
              <Sparkles
                size={16}
                color={activeSection === 'home' ? colors.primary : colors.subtle}
              />
              <Text
                style={[
                  styles.bottomPillText,
                  { color: activeSection === 'home' ? colors.primary : colors.subtle },
                ]}
              >
                Home
              </Text>
            </TouchableOpacity>

            {/* Pill 2: Khoảnh khắc */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleSectionSelect('moments')}
              style={[
                styles.bottomPillItem,
                activeSection === 'moments' && { backgroundColor: isGlass ? `${colors.primary}25` : colors.wash },
              ]}
            >
              <Camera
                size={16}
                color={activeSection === 'moments' ? colors.primary : colors.subtle}
              />
              <Text
                style={[
                  styles.bottomPillText,
                  { color: activeSection === 'moments' ? colors.primary : colors.subtle },
                ]}
              >
                {locale === 'vi' ? 'Khoảnh khắc' : 'Moments'}
              </Text>
            </TouchableOpacity>

            {/* Pill 3: Tiện ích */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleSectionSelect('tools')}
              style={[
                styles.bottomPillItem,
                activeSection === 'tools' && { backgroundColor: isGlass ? `${colors.primary}25` : colors.wash },
              ]}
            >
              <Layers
                size={16}
                color={activeSection === 'tools' ? colors.primary : colors.subtle}
              />
              <Text
                style={[
                  styles.bottomPillText,
                  { color: activeSection === 'tools' ? colors.primary : colors.subtle },
                ]}
              >
                {locale === 'vi' ? 'Tiện ích' : 'Tools'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* =========================================================================
          FULL-SCREEN CHAT VIEW (EDGE-TO-EDGE OVERLAY OUTSIDE PAGER)
         ========================================================================= */}
      {isChatOpen && (
        <CircleChatFullscreenView
          circleId={circleId}
          circle={circle}
          channelId={currentChannelId}
          notificationMessageId={messageId}
          members={members}
          currentCircleMember={currentCircleMember}
          currentCircleTheme={(circle as any).theme || 'sage'}
          onClose={() => setIsChatOpen(false)}
          onOpenManageModal={() => setManageModalVisible(true)}
          onStartCall={handleStartCall}
          onOpenTool={(toolKey) => {
            setSelectedTool(toolKey as any);
            setIsChatOpen(false);
            handleSectionSelect('tools');
          }}
        />
      )}

      {/* =========================================================================
          FULL-SCREEN TOOL MODAL (EXPANDS EDGE-TO-EDGE WITH CONTEXTUAL BACK BUTTON)
         ========================================================================= */}
      <Modal
        visible={selectedTool !== 'menu'}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleHierarchicalBack}
      >
        <View style={{ flex: 1, backgroundColor: colors.canvas }} {...toolEdgePan.panHandlers}>
          {selectedTool !== 'album' && selectedTool !== 'calendar' &&
            selectedTool !== 'wheel' && selectedTool !== 'anonymous' && (
            <View
              pointerEvents="box-none"
              style={{
                position: 'absolute',
                top: Platform.OS === 'ios' ? 52 : 36,
                left: 16,
                zIndex: 100,
              }}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={handleHierarchicalBack}
                style={[
                  styles.navCircleBtn,
                  {
                    backgroundColor: isGlass
                      ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')
                      : colors.wash,
                    borderColor: isGlass
                      ? (isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.06)')
                      : colors.hairline,
                  },
                ]}
                accessibilityLabel={t.common.back}
              >
                <ArrowLeft size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
          )}

          <View style={{ flex: 1 }}>
            {selectedTool === 'album' ? (
              <MobileAlbumsView
                circleId={circleId}
                onBack={handleHierarchicalBack}
                onRegisterBack={(handler) => {
                  toolSubLevelBackRef.current = handler;
                }}
              />
            ) : selectedTool === 'calendar' ? (
              <MobileCalendarView
                circleId={circleId}
                notificationEventId={tool === 'calendar' ? toolTargetId : undefined}
                notificationEventStart={eventStart}
                onBack={handleHierarchicalBack}
                onRegisterBack={(handler) => {
                  toolSubLevelBackRef.current = handler;
                }}
              />
            ) : selectedTool === 'planning' ? (
              <MobilePlanningView
                circleId={circleId}
                onRegisterBack={(handler) => {
                  toolSubLevelBackRef.current = handler;
                }}
              />
            ) : selectedTool === 'location' ? (
              <MobileLocationView circleId={circleId} />
            ) : selectedTool === 'poll' ? (
              <MobilePollView
                circleId={circleId}
                notificationPollId={tool === 'poll' ? toolTargetId : undefined}
                onRegisterBack={(handler) => {
                  toolSubLevelBackRef.current = handler;
                }}
              />
            ) : selectedTool === 'wheel' ? (
              <MobileWheelView
                circleId={circleId}
                onBack={handleHierarchicalBack}
                onRegisterBack={(handler) => {
                  toolSubLevelBackRef.current = handler;
                }}
              />
            ) : selectedTool === 'anonymous' ? (
              <MobileAnonymousView
                circleId={circleId}
                onBack={handleHierarchicalBack}
                onRegisterBack={(handler) => {
                  toolSubLevelBackRef.current = handler;
                }}
              />
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Circle Switcher Modal */}
      <Modal
        visible={circleSwitcherVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCircleSwitcherVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCircleSwitcherVisible(false)}
        >
          <View
            style={[
              styles.switcherSheet,
              {
                backgroundColor: isGlass ? glassTheme.colors.glassBg : colors.surface,
                borderColor: isGlass ? glassTheme.colors.glassBorder : colors.hairline,
              },
            ]}
          >
            <Text style={[styles.switcherTitle, { color: colors.text }]}>
              {locale === 'vi' ? 'Nhóm của bạn' : 'Your Circles'}
            </Text>
            <ScrollView style={{ maxHeight: screenHeight * 0.4 }}>
              {userCircles.map((c: any) => {
                const isSelected = c.id === circleId;
                return (
                  <TouchableOpacity
                    key={c.id}
                    activeOpacity={0.7}
                    onPress={() => {
                      triggerSelectionHaptic();
                      setCircleSwitcherVisible(false);
                      if (c.id !== circleId) {
                        router.replace(`/circle/${c.id}`);
                      }
                    }}
                    style={[
                      styles.switcherItem,
                      isSelected && { backgroundColor: `${colors.primary}18` },
                    ]}
                  >
                    {c.avatarUrl ? (
                      <RNImage source={{ uri: c.avatarUrl }} style={styles.switcherAvatar} />
                    ) : (
                      <View style={[styles.switcherAvatarFallback, { backgroundColor: colors.wash }]}>
                        <Text style={[styles.switcherInitial, { color: colors.primary }]}>
                          {getInitials(c.name)}
                        </Text>
                      </View>
                    )}
                    <Text
                      style={[
                        styles.switcherCircleName,
                        { color: isSelected ? colors.primary : colors.text },
                      ]}
                      numberOfLines={1}
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Circle Management & Creation Modals */}
      <CircleManagementModal />
      <CreateCircleModal />
      <JoinCircleModal />
      <MobileCallStageModal
        visible={Boolean(activeCallStageSession)}
        callSession={activeCallStageSession}
        onClose={() => setActiveCallStageSession(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  notFoundText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  backBtnPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Workspace Header
  workspaceHeaderWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  workspaceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  navCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenterInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circleAvatarImg: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  circleAvatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleAvatarInitial: {
    fontSize: 13,
    fontWeight: '700',
  },
  circleNameText: {
    fontSize: 15,
    fontWeight: '700',
  },
  circleSubtitleText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navChatBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  chatUnreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatUnreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },

  // Swipe Dot Row
  swipeDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 6,
  },
  swipeDot: {
    height: 4,
    borderRadius: 2,
  },

  // Tools Page
  toolsScrollContent: {
    padding: 16,
  },
  toolsCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  toolInfo: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 14.5,
    fontWeight: '600',
  },

  // Bottom Pill Nav
  floatingBottomPillWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 60,
  },
  floatingBottomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 30,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomPillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 24,
  },
  bottomPillText: {
    fontSize: 12.5,
    fontWeight: '700',
  },

  // Switcher Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  switcherSheet: {
    width: '100%',
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
  },
  switcherTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  switcherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 4,
  },
  switcherAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  switcherAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switcherInitial: {
    fontSize: 12,
    fontWeight: '700',
  },
  switcherCircleName: {
    fontSize: 14.5,
    fontWeight: '600',
    flex: 1,
  },
});
