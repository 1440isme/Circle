import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AppState,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Image as RNImage,
} from 'react-native';
import {
  Plus,
  Search,
  X,
  Bell,
  Calendar,
  Users,
  MessageSquare,
  Camera,
  Vote,
  Sparkles,
  KeyRound,
  ChevronRight,
  Clock,
  MapPin,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../src/stores/theme.store';
import { getGlassTheme } from '../../src/constants/glass-theme';
import { useLanguageStore } from '../../src/stores/language.store';
import { useAuthStore } from '../../src/stores/auth.store';
import { useCircleStore } from '../../src/stores/circle.store';
import { useMyCirclesQuery, CircleListItem } from '../../src/hooks/use-circle-queries';
import { useRouter } from 'expo-router';
import { MobileNotificationCenterModal } from '../../src/components/notifications/MobileNotificationCenterModal';
import { CreateCircleModal } from '../../src/components/circle/CreateCircleModal';
import { JoinCircleModal } from '../../src/components/circle/JoinCircleModal';
import { getUnreadCountApi } from '../../src/services/notifications.service';
import { getMobileSocket } from '../../src/services/socket';
import { getUpcomingCalendarEventsApi } from '../../src/services/circle-tools.service';
import { CalendarEventEntity } from '@circle/types';
import * as Haptics from 'expo-haptics';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatEventTime(dateStr: string, locale: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  const time = d.toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  if (isToday) return locale === 'vi' ? `Hôm nay, ${time}` : `Today, ${time}`;
  if (isTomorrow) return locale === 'vi' ? `Ngày mai, ${time}` : `Tomorrow, ${time}`;

  const dayMonth = d.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    day: 'numeric',
    month: 'short',
  });
  return `${dayMonth}, ${time}`;
}

function formatRelativeTime(dateStr: string, locale: string): string {
  const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diffSec < 60) return locale === 'vi' ? 'Vừa xong' : 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} ${locale === 'vi' ? 'phút trước' : 'm ago'}`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} ${locale === 'vi' ? 'giờ trước' : 'h ago'}`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} ${locale === 'vi' ? 'ngày trước' : 'd ago'}`;
  return new Date(dateStr).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    day: 'numeric',
    month: 'short',
  });
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, resolvedTheme, uiStyle } = useThemeStore();
  const t = useLanguageStore((s) => s.t);
  const locale = useLanguageStore((s) => s.locale);
  const { user } = useAuthStore();

  const isDark = resolvedTheme === 'dark';
  const isGlass = uiStyle === 'glass';
  const glassTheme = getGlassTheme(isDark, uiStyle);
  const displayName = user?.profile?.displayName || user?.email?.split('@')[0] || t.auth.guest;

  const {
    data: myCircles = [],
    isLoading: isLoadingCircles,
    isRefetching,
    refetch,
  } = useMyCirclesQuery();

  const setCreateModalVisible = useCircleStore((s) => s.setCreateModalVisible);
  const setJoinModalVisible = useCircleStore((s) => s.setJoinModalVisible);
  const setActiveCircle = useCircleStore((s) => s.setActiveCircle);

  // Search state
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Notifications state
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Multi-circle upcoming events
  const [upcomingEvents, setUpcomingEvents] = useState<
    Array<CalendarEventEntity & { circleName?: string; circleId: string }>
  >([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  // Fetch upcoming events across user's circles
  const fetchUpcomingEvents = useCallback(async () => {
    if (!myCircles || myCircles.length === 0) {
      setUpcomingEvents([]);
      return;
    }
    setIsLoadingEvents(true);
    try {
      const topCircles = myCircles.slice(0, 8);
      const results = await Promise.allSettled(
        topCircles.map((c) => getUpcomingCalendarEventsApi(c.id)),
      );
      const collected: Array<CalendarEventEntity & { circleName?: string; circleId: string }> = [];
      results.forEach((res, idx) => {
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
          const c = topCircles[idx];
          res.value.forEach((ev) => {
            collected.push({
              ...ev,
              circleId: ev.circleId || c.id,
              circleName: c.name,
            });
          });
        }
      });
      collected.sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );
      setUpcomingEvents(collected.slice(0, 6));
    } catch {
      setUpcomingEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [myCircles]);

  useEffect(() => {
    fetchUpcomingEvents();
  }, [fetchUpcomingEvents]);

  // Notifications socket & initial count
  useEffect(() => {
    let isMounted = true;
    const refreshUnreadCount = () => {
      getUnreadCountApi()
        .then((res) => {
          if (isMounted && res.success && res.data) {
            setUnreadCount(res.data.unreadCount);
          }
        })
        .catch(() => {});
    };
    refreshUnreadCount();
    const foreground = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshUnreadCount();
    });

    let detach: (() => void) | undefined;
    getMobileSocket().then((socket) => {
      if (!isMounted || !socket) return;

      const handleUnread = (payload: { unreadCount: number }) => {
        if (isMounted && typeof payload?.unreadCount === 'number') {
          setUnreadCount(payload.unreadCount);
        }
      };
      socket.on('notification:unread_count', handleUnread);
      socket.on('notification:new', handleUnread);
      socket.on('connect', refreshUnreadCount);
      detach = () => {
        socket.off('notification:unread_count', handleUnread);
        socket.off('notification:new', handleUnread);
        socket.off('connect', refreshUnreadCount);
      };
    });

    return () => {
      isMounted = false;
      detach?.();
      foreground.remove();
    };
  }, []);

  // Filtered and sorted circles
  const filteredCircles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = [...myCircles];
    if (q) {
      const cleanQ = q.replace(/^@/, '');
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.handle && c.handle.toLowerCase().includes(cleanQ)),
      );
    }
    // Sort by most recent activity (updatedAt desc)
    list.sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
    return list;
  }, [myCircles, searchQuery]);

  // Open Circle Workspace: always enters at Home hub per Brief Mục 4.3 & 9
  const handleOpenCircle = (circle: CircleListItem) => {
    Haptics.selectionAsync();
    setActiveCircle(circle);
    router.push({
      pathname: '/circle/[id]' as any,
      params: { id: circle.id, tab: 'home' },
    });
  };

  // Open Event context directly in circle calendar
  const handleOpenEventContext = (circleId: string, eventId: string) => {
    Haptics.selectionAsync();
    const target = myCircles.find((c) => c.id === circleId);
    if (target) {
      setActiveCircle(target);
    }
    router.push({
      pathname: '/circle/[id]' as any,
      params: { id: circleId, tab: 'tools', tool: 'calendar', eventId },
    });
  };

  const onRefresh = async () => {
    Haptics.selectionAsync();
    await Promise.allSettled([refetch(), fetchUpcomingEvents()]);
  };

  const topClearance = Math.max(insets.top + 8, Platform.OS === 'ios' ? 52 : 36);

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      {/* 4.2 Header: Brand, Search, New Group, Notifications */}
      <View style={[styles.headerBar, { paddingTop: topClearance }]} pointerEvents="box-none">
        <View
          style={[
            styles.brandCapsule,
            {
              backgroundColor: isGlass ? glassTheme.colors.glassBg : colors.surface,
              borderColor: isGlass ? glassTheme.colors.glassBorder : colors.hairline,
            },
          ]}
          pointerEvents="auto"
        >
          <View style={[styles.logoPill, { backgroundColor: colors.primary }]}>
            <Text style={[styles.logoText, { color: colors.onPrimary }]}>C</Text>
          </View>
          <View>
            <Text style={[styles.brandText, { color: colors.text }]}>{t.common.appName}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.subBrandText, { color: colors.subtle }]}>
                {displayName}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Controls: Search, New Circle, Notifications */}
        <View style={styles.headerRightGroup} pointerEvents="auto">
          {/* Search Toggle */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Haptics.selectionAsync();
              setIsSearchActive((prev) => !prev);
              if (isSearchActive) setSearchQuery('');
            }}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            style={[
              styles.headerActionBtn,
              {
                backgroundColor: isSearchActive
                  ? `${colors.primary}20`
                  : isGlass
                  ? glassTheme.colors.glassBg
                  : colors.surface,
                borderColor: isSearchActive ? colors.primary : isGlass ? glassTheme.colors.glassBorder : colors.hairline,
              },
            ]}
            accessibilityLabel={t.common.search}
          >
            <Search size={17} color={isSearchActive ? colors.sage : colors.text} />
          </TouchableOpacity>

          {/* Create Circle Entry on Home Header (Brief Mục 4.2 & 4.4) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Haptics.selectionAsync();
              setCreateModalVisible(true);
            }}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            style={[
              styles.headerActionBtn,
              {
                backgroundColor: isGlass ? glassTheme.colors.glassBg : colors.surface,
                borderColor: isGlass ? glassTheme.colors.glassBorder : colors.hairline,
              },
            ]}
            accessibilityLabel={t.home.createCircleBtn}
          >
            <Plus size={18} color={colors.text} strokeWidth={2.4} />
          </TouchableOpacity>

          {/* Notifications Bell with Unread Coral Dot */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Haptics.selectionAsync();
              setNotificationModalVisible(true);
            }}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            style={[
              styles.headerActionBtn,
              {
                backgroundColor: isGlass ? glassTheme.colors.glassBg : colors.surface,
                borderColor: isGlass ? glassTheme.colors.glassBorder : colors.hairline,
              },
            ]}
            accessibilityLabel={t.nav.notifications}
          >
            <Bell size={17} color={colors.text} />
            {unreadCount > 0 && (
              <View style={[styles.headerCoralDot, { backgroundColor: colors.coral }]} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topClearance + 62 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.sage}
          />
        }
      >
        {/* Search Bar when expanded */}
        {isSearchActive && (
          <View
            style={[
              styles.searchBarContainer,
              {
                backgroundColor: isGlass ? glassTheme.colors.glassBg : colors.surface,
                borderColor: colors.hairline,
              },
            ]}
          >
            <Search size={16} color={colors.subtle} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t.home.searchCirclesPlaceholder || 'Tìm kiếm nhóm...'}
              placeholderTextColor={colors.subtle}
              autoFocus
              style={[styles.searchInput, { color: colors.text }]}
            />
            {Boolean(searchQuery) && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <X size={15} color={colors.subtle} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 4.2 Khu vực sự kiện sắp diễn ra (LIÊN NHÓM, ẨN HOÀN TOÀN KHI RỖNG) */}
        {upcomingEvents.length > 0 && (
          <View style={styles.upcomingSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleWithIcon}>
                <Calendar size={15} color={colors.sage} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t.home.upcomingSectionTitle || 'Sự kiện sắp diễn ra'}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push('/(tabs)/calendar' as any);
                }}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.sage }}>
                  {locale === 'vi' ? 'Lịch chung' : 'All Events'} ›
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.upcomingCardsRail}
            >
              {upcomingEvents.map((ev) => {
                const timeStr = formatEventTime(ev.startTime, locale);
                const rsvpCount = ev.rsvps?.length || 0;
                return (
                  <TouchableOpacity
                    key={ev.id}
                    activeOpacity={0.82}
                    onPress={() => handleOpenEventContext(ev.circleId, ev.id)}
                    style={[
                      styles.upcomingCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.hairline,
                      },
                    ]}
                  >
                    <View style={styles.upcomingCardTop}>
                      <View
                        style={[
                          styles.upcomingTimePill,
                          {
                            backgroundColor: `${colors.primary}18`,
                            borderColor: `${colors.primary}35`,
                          },
                        ]}
                      >
                        <Clock size={11} color={colors.sage} />
                        <Text style={[styles.upcomingTimeText, { color: colors.sage }]}>
                          {timeStr}
                        </Text>
                      </View>

                      {ev.circleName ? (
                        <View style={[styles.eventCircleTag, { backgroundColor: colors.wash }]}>
                          <Text
                            style={[styles.eventCircleTagText, { color: colors.subtle }]}
                            numberOfLines={1}
                          >
                            {ev.circleName}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={[styles.upcomingCardTitle, { color: colors.text }]} numberOfLines={2}>
                      {(ev as any).title || ev.eventTitle}
                    </Text>

                    <View style={styles.upcomingCardFooter}>
                      {ev.location ? (
                        <View style={styles.eventFooterItem}>
                          <MapPin size={11} color={colors.subtle} />
                          <Text
                            style={[styles.eventFooterText, { color: colors.subtle }]}
                            numberOfLines={1}
                          >
                            {ev.location}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.eventFooterItem}>
                          <Users size={11} color={colors.subtle} />
                          <Text style={[styles.eventFooterText, { color: colors.subtle }]}>
                            {rsvpCount} {locale === 'vi' ? 'người tham gia' : 'participants'}
                          </Text>
                        </View>
                      )}
                      <ChevronRight size={13} color={colors.subtle} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* 4.3 Danh sách nhóm (Thẻ nhóm & Tóm tắt hoạt động gộp) */}
        <View style={styles.circlesSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t.home.myCirclesHeading || 'Nhóm của bạn'}
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                Haptics.selectionAsync();
                setCreateModalVisible(true);
              }}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.sage }}>
                {locale === 'vi' ? 'Tạo nhóm' : 'New Circle'} ›
              </Text>
            </TouchableOpacity>
          </View>

          {isLoadingCircles ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.sage} />
            </View>
          ) : filteredCircles.length === 0 ? (
            /* Trạng thái trống khi chưa có nhóm hoặc không tìm thấy */
            <View
              style={[
                styles.emptyCirclesCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.hairline,
                },
              ]}
            >
              <View
                style={[
                  styles.emptyIconContainer,
                  { backgroundColor: `${colors.primary}15` },
                ]}
              >
                <Users size={32} color={colors.sage} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {searchQuery
                  ? locale === 'vi'
                    ? 'Không tìm thấy nhóm phù hợp'
                    : 'No matching groups found'
                  : locale === 'vi'
                  ? 'Chưa tham gia nhóm nào'
                  : 'No circles joined yet'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.subtle }]}>
                {searchQuery
                  ? locale === 'vi'
                    ? 'Thử tìm kiếm với tên hoặc handle khác'
                    : 'Try searching with another name or handle'
                  : locale === 'vi'
                  ? 'Tạo không gian kết nối riêng tư cho nhóm bạn hoặc gia đình ngay hôm nay.'
                  : 'Create a private space for your friends or family today.'}
              </Text>

              {!searchQuery && (
                <View style={styles.emptyActionRow}>
                  <TouchableOpacity
                    activeOpacity={0.82}
                    onPress={() => setCreateModalVisible(true)}
                    style={[styles.emptyCreateBtn, { backgroundColor: colors.primary }]}
                  >
                    <Plus size={16} color={colors.onPrimary} strokeWidth={2.4} />
                    <Text style={[styles.emptyCreateBtnText, { color: colors.onPrimary }]}>
                      {t.home.createCircleBtn}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.82}
                    onPress={() => setJoinModalVisible(true)}
                    style={[
                      styles.emptyJoinBtn,
                      { backgroundColor: colors.wash, borderColor: colors.hairline },
                    ]}
                  >
                    <KeyRound size={15} color={colors.text} />
                    <Text style={[styles.emptyJoinBtnText, { color: colors.text }]}>
                      {t.home.joinWithCodeBtn}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            /* Danh sách các nhóm với hoạt động tổng hợp */
            <View style={styles.circlesListStack}>
              {filteredCircles.map((circle) => {
                const memberCount = circle.memberCount || (circle as any)._count?.members || 1;
                const activityTime = formatRelativeTime(
                  circle.updatedAt || circle.createdAt || new Date().toISOString(),
                  locale,
                );

                return (
                  <TouchableOpacity
                    key={circle.id}
                    activeOpacity={0.85}
                    onPress={() => handleOpenCircle(circle)}
                    style={[
                      styles.circleCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.hairline,
                      },
                    ]}
                  >
                    <View style={styles.circleCardTopRow}>
                      {/* Avatar nhóm */}
                      {circle.avatarUrl ? (
                        <RNImage
                          source={{ uri: circle.avatarUrl }}
                          style={styles.circleAvatarImg}
                        />
                      ) : (
                        <View
                          style={[
                            styles.circleAvatarFallback,
                            { backgroundColor: colors.primary },
                          ]}
                        >
                          <Text style={[styles.circleAvatarInitial, { color: colors.onPrimary }]}>
                            {getInitials(circle.name)}
                          </Text>
                        </View>
                      )}

                      {/* Tên nhóm & Thông tin thành viên */}
                      <View style={styles.circleMainInfo}>
                        <View style={styles.circleNameLine}>
                          <Text
                            style={[styles.circleNameText, { color: colors.text }]}
                            numberOfLines={1}
                          >
                            {circle.name}
                          </Text>
                        </View>

                        <Text style={[styles.circleSubText, { color: colors.subtle }]}>
                          {t.home.membersCountShort
                            ? t.home.membersCountShort.replace('{count}', String(memberCount))
                            : `${memberCount} ${locale === 'vi' ? 'thành viên' : 'members'}`}{' '}
                          · {activityTime}
                        </Text>
                      </View>

                      {/* Mũi tên điều hướng */}
                      <ChevronRight size={17} color={colors.subtle} style={{ opacity: 0.6 }} />
                    </View>

                    {/* Tóm tắt hoạt động mới nhất của nhóm (Brief Mục 4.3 - Interactive Action Chips) */}
                    <View style={[styles.activityPillsRow, { borderColor: colors.hairline }]}>
                      {/* Pill Khoảnh khắc */}
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={(e) => {
                          e.stopPropagation();
                          Haptics.selectionAsync();
                          setActiveCircle(circle);
                          router.push({
                            pathname: '/circle/[id]' as any,
                            params: { id: circle.id, tab: 'moments' },
                          });
                        }}
                        style={[styles.activityPill, { backgroundColor: colors.wash }]}
                      >
                        <Camera size={12} color={colors.sage} />
                        <Text style={[styles.activityPillText, { color: colors.text }]}>
                          {locale === 'vi' ? 'Khoảnh khắc' : 'Moments'}
                        </Text>
                      </TouchableOpacity>

                      {/* Pill Trò chuyện */}
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={(e) => {
                          e.stopPropagation();
                          Haptics.selectionAsync();
                          setActiveCircle(circle);
                          router.push({
                            pathname: '/circle/[id]' as any,
                            params: { id: circle.id, tab: 'chat' },
                          });
                        }}
                        style={[styles.activityPill, { backgroundColor: colors.wash }]}
                      >
                        <MessageSquare size={12} color={colors.sage} />
                        <Text style={[styles.activityPillText, { color: colors.text }]}>
                          {locale === 'vi' ? 'Trò chuyện' : 'Chat'}
                        </Text>
                      </TouchableOpacity>

                      {/* Pill Tiện ích */}
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={(e) => {
                          e.stopPropagation();
                          Haptics.selectionAsync();
                          setActiveCircle(circle);
                          router.push({
                            pathname: '/circle/[id]' as any,
                            params: { id: circle.id, tab: 'tools' },
                          });
                        }}
                        style={[styles.activityPill, { backgroundColor: colors.wash }]}
                      >
                        <Sparkles size={12} color={colors.warning} />
                        <Text style={[styles.activityPillText, { color: colors.text }]}>
                          {locale === 'vi' ? 'Tiện ích' : 'Tools'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Glass Notification Center Modal */}
      <MobileNotificationCenterModal
        visible={notificationModalVisible}
        onClose={() => setNotificationModalVisible(false)}
        unreadCount={unreadCount}
        onUnreadCountChange={setUnreadCount}
      />

      {/* Modals tạo nhóm và tham gia nhóm */}
      <CreateCircleModal />
      <JoinCircleModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 4,
    paddingRight: 14,
    paddingVertical: 4,
    borderRadius: 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  logoPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 16,
    fontWeight: '800',
  },
  brandText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  subBrandText: {
    fontSize: 11,
    fontWeight: '500',
    maxWidth: 120,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  headerCoralDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    gap: 20,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    marginBottom: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  upcomingSection: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionCountBadge: {
    fontSize: 13,
    fontWeight: '600',
  },
  upcomingCardsRail: {
    gap: 12,
    paddingVertical: 2,
  },
  upcomingCard: {
    width: 230,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  upcomingCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  upcomingTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  upcomingTimeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  eventCircleTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    maxWidth: 90,
  },
  eventCircleTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  upcomingCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    minHeight: 36,
  },
  upcomingCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  eventFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  eventFooterText: {
    fontSize: 11,
    fontWeight: '500',
  },
  circlesSection: {
    gap: 12,
  },
  loadingContainer: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  circlesListStack: {
    gap: 12,
  },
  circleCard: {
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    gap: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  circleCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  circleAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  circleAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleAvatarInitial: {
    fontSize: 17,
    fontWeight: '800',
  },
  circleMainInfo: {
    flex: 1,
    gap: 2,
  },
  circleNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  circleNameText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  circleSubText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activityPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  activityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activityPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyCirclesCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
    marginBottom: 12,
  },
  emptyActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  emptyCreateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyCreateBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyJoinBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyJoinBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
