import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { openMobileNotification } from '../../services/notification-navigation';
import {
  X,
  CheckCheck,
  Trash2,
  Users,
  MessageSquare,
  Calendar,
  BarChart2,
  PhoneMissed,
  Info,
  CheckCircle2,
} from 'lucide-react-native';
import { getNotificationText } from '@circle/shared';
import { NotificationEntity, NotificationType } from '@circle/types';
import { useLanguageStore } from '../../stores/language.store';
import { useThemeStore } from '../../stores/theme.store';
import {
  getNotificationsApi,
  markNotificationAsReadApi,
  markAllNotificationsAsReadApi,
  deleteNotificationApi,
} from '../../services/notifications.service';
import { getMobileSocket } from '../../services/socket';

interface MobileNotificationCenterModalProps {
  visible: boolean;
  onClose: () => void;
  unreadCount: number;
  onUnreadCountChange: (count: number) => void;
}

export function MobileNotificationCenterModal({
  visible,
  onClose,
  unreadCount,
  onUnreadCountChange,
}: MobileNotificationCenterModalProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { locale, t: { notificationsCenter: t } } = useLanguageStore();
  const { colors, resolvedTheme, uiStyle } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<NotificationEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Fetch notifications
  const loadNotifications = useCallback(
    async (cursor?: string | null, isInitial = false) => {
      setLoadFailed(false);
      if (isInitial) setIsLoading(true);
      else setIsLoadingMore(true);

      try {
        const res = await getNotificationsApi(cursor, filter === 'unread');
        if (res.success && res.data) {
          if (cursor) {
            setNotifications((prev) => [...prev, ...res.data.filter((item) => !prev.some((old) => old.id === item.id))]);
          } else {
            setNotifications(res.data);
          }
          setNextCursor((res as any).nextCursor || null);
          setHasMore(Boolean((res as any).hasMore));
        }
      } catch {
        setLoadFailed(true);
      } finally {
        if (isInitial) setIsLoading(false);
        else setIsLoadingMore(false);
      }
    },
    [filter],
  );

  useEffect(() => {
    if (visible) {
      loadNotifications(null, true);
    }
  }, [visible, filter, loadNotifications]);

  // Realtime Socket listener
  useEffect(() => {
    let isMounted = true;
    let detach: (() => void) | undefined;

    getMobileSocket().then((socket) => {
      if (!isMounted || !socket) return;

      const handleNewNotif = (payload: {
        notification: NotificationEntity;
        unreadCount: number;
      }) => {
        if (!isMounted) return;
        onUnreadCountChange(payload.unreadCount);
        setNotifications((prev) => {
          if (prev.some((n) => n.id === payload.notification.id)) return prev;
          if (filter === 'unread' && payload.notification.isRead) return prev;
          return [payload.notification, ...prev];
        });
      };

      const handleCount = (payload: { unreadCount: number }) => {
        if (!isMounted) return;
        onUnreadCountChange(payload.unreadCount);
      };

      socket.on('notification:new', handleNewNotif);
      socket.on('notification:unread_count', handleCount);
      detach = () => {
        socket.off('notification:new', handleNewNotif);
        socket.off('notification:unread_count', handleCount);
      };
    });

    return () => {
      isMounted = false;
      detach?.();
    };
  }, [filter, onUnreadCountChange]);

  // Mark single read
  const handleMarkAsRead = async (item: NotificationEntity) => {
    if (item.isRead) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
    );
    onUnreadCountChange(Math.max(0, unreadCount - 1));

    try {
      await markNotificationAsReadApi(item.id);
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  // Mark all read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    onUnreadCountChange(0);

    try {
      await markAllNotificationsAsReadApi();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Delete notification
  const handleDelete = async (item: NotificationEntity) => {
    setNotifications((prev) => prev.filter((n) => n.id !== item.id));
    if (!item.isRead) {
      onUnreadCountChange(Math.max(0, unreadCount - 1));
    }

    try {
      await deleteNotificationApi(item.id);
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Tap handler: read and navigate
  const handleItemPress = (item: NotificationEntity) => {
    if (!item.isRead) {
      void handleMarkAsRead(item);
    }
    onClose();

    openMobileNotification(router, item);
  };

  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return t.justNow;
    if (minutes < 60) return t.minutesAgo.replace('{count}', String(minutes));
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t.hoursAgo.replace('{count}', String(hours));
    const days = Math.floor(hours / 24);
    return t.daysAgo.replace('{count}', String(days));
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case NotificationType.CIRCLE_JOIN_REQUEST:
      case NotificationType.CIRCLE_INVITE:
        return <Users size={18} color={colors.primary} />;
      case NotificationType.CHAT_MESSAGE:
        return <MessageSquare size={18} color={colors.sage} />;
      case NotificationType.CALENDAR_EVENT:
      case NotificationType.CALENDAR_CHANGED:
      case NotificationType.CALENDAR_CANCELLED:
      case NotificationType.CALENDAR_REMINDER:
        return <Calendar size={18} color={colors.coral} />;
      case NotificationType.POLL_CLOSED:
      case NotificationType.POLL_NEW:
        return <BarChart2 size={18} color={colors.primary} />;
      case NotificationType.CALL_MISSED:
        return <PhoneMissed size={18} color={colors.coral} />;
      default:
        return <Info size={18} color={colors.subtle} />;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)' }]}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              borderColor: colors.hairline,
              paddingTop: insets.top + 10,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Top Floating Glass Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {t.title}
              </Text>
              {unreadCount > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: colors.coral }]}>
                  <Text style={styles.unreadBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <TouchableOpacity
                  onPress={handleMarkAllAsRead}
                  style={styles.markAllButton}
                  activeOpacity={0.7}
                >
                  <CheckCheck size={16} color={colors.primary} />
                  <Text style={[styles.markAllText, { color: colors.primary }]}>
                    {t.markAllAsRead}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={onClose}
                style={[styles.closeButton, { backgroundColor: colors.wash }]}
                activeOpacity={0.7}
              >
                <X size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Filter Segmented Control Tabs */}
          <View style={[styles.tabsRow, { backgroundColor: colors.wash }]}>
            <TouchableOpacity
              onPress={() => setFilter('all')}
              style={[
                styles.tabItem,
                filter === 'all' && [
                  styles.tabItemActive,
                  { backgroundColor: colors.surface },
                ],
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: filter === 'all' ? colors.text : colors.subtle },
                  filter === 'all' && styles.tabTextActive,
                ]}
              >
                {t.filterAll}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilter('unread')}
              style={[
                styles.tabItem,
                filter === 'unread' && [
                  styles.tabItemActive,
                  { backgroundColor: colors.surface },
                ],
              ]}
              activeOpacity={0.8}
            >
              <View style={styles.tabUnreadGroup}>
                <Text
                  style={[
                    styles.tabText,
                    { color: filter === 'unread' ? colors.text : colors.subtle },
                    filter === 'unread' && styles.tabTextActive,
                  ]}
                >
                  {t.filterUnread}
                </Text>
                {unreadCount > 0 && <View style={[styles.tabCoralDot, { backgroundColor: colors.coral }]} />}
              </View>
            </TouchableOpacity>
          </View>

          {/* Scroll-under Content List */}
          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.subtle }]}>
                  {t.loading}
                </Text>
              </View>
            ) : loadFailed && notifications.length === 0 ? (
              <View style={styles.centerContainer}>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.errorLoading}</Text>
                <TouchableOpacity onPress={() => loadNotifications(null, true)} accessibilityRole="button">
                  <Text style={{ color: colors.primary }}>{t.retry}</Text>
                </TouchableOpacity>
              </View>
            ) : notifications.length === 0 ? (
              <View style={styles.centerContainer}>
                <CheckCircle2 size={32} color={colors.primary} opacity={0.8} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {filter === 'unread' ? t.emptyUnreadTitle : t.emptyAllTitle}
                </Text>
                <Text style={[styles.emptyDesc, { color: colors.subtle }]}>
                  {filter === 'unread' ? t.emptyUnreadDesc : t.emptyAllDesc}
                </Text>
              </View>
            ) : (
              notifications.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleItemPress(item)}
                  style={[
                    styles.notifCard,
                    {
                      backgroundColor: item.isRead
                        ? isDark
                          ? 'rgba(255,255,255,0.03)'
                          : 'rgba(0,0,0,0.02)'
                        : isDark
                        ? `${colors.primary}18`
                        : `${colors.primary}0D`,
                      borderColor: item.isRead
                        ? 'transparent'
                        : `${colors.primary}30`,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  {/* Bare Icon Container */}
                  <View style={styles.iconColumn}>{renderIcon(item.type)}</View>

                  {/* Body Content */}
                  <View style={styles.contentColumn}>
                    <View style={styles.titleRow}>
                      <Text
                        style={[
                          styles.notifTitle,
                          { color: colors.text },
                          !item.isRead && styles.notifTitleUnread,
                        ]}
                        numberOfLines={1}
                      >
                        {(item.metadata?.circleId ? getNotificationText(item.type, item.metadata, locale)?.title : null) ?? item.title}
                      </Text>
                      <View style={styles.metaRow}>
                        <Text style={[styles.timeText, { color: colors.subtle }]}>
                          {formatRelativeTime(item.createdAt)}
                        </Text>
                        {!item.isRead && <View style={[styles.coralDot, { backgroundColor: colors.coral }]} />}
                      </View>
                    </View>

                    <Text
                      style={[styles.notifBody, { color: colors.subtle }]}
                      numberOfLines={2}
                    >
                      {(item.metadata?.circleId ? getNotificationText(item.type, item.metadata, locale)?.content : null) ?? item.content}
                    </Text>
                  </View>

                  {/* Delete Action Button */}
                  <TouchableOpacity
                    onPress={() => handleDelete(item)}
                    style={styles.deleteButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Trash2 size={15} color={colors.subtle} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}

            {hasMore && (
              <TouchableOpacity
                onPress={() => loadNotifications(nextCursor)}
                disabled={isLoadingMore}
                style={[styles.loadMoreButton, { backgroundColor: colors.wash }]}
              >
                {isLoadingMore ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={[styles.loadMoreText, { color: colors.primary }]}>
                    {t.loadMore}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    height: '88%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  unreadBadge: {
    backgroundColor: '#E07A5F',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 3,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  tabItemActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
  },
  tabTextActive: {
    fontWeight: '700',
  },
  tabUnreadGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabCoralDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E07A5F',
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 8,
  },
  centerContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    marginTop: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 6,
  },
  emptyDesc: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 18,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  iconColumn: {
    paddingTop: 2,
  },
  contentColumn: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 2,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  notifTitleUnread: {
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 11,
  },
  coralDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E07A5F',
  },
  notifBody: {
    fontSize: 12,
    lineHeight: 16,
  },
  deleteButton: {
    padding: 4,
  },
  loadMoreButton: {
    marginVertical: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
