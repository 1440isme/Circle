'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  Trash2,
  Users,
  MessageSquare,
  Calendar,
  BarChart2,
  PhoneMissed,
  Info,
  Loader2,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { getNotificationText, getCircleNotificationDestination } from '@circle/shared';
import { NotificationEntity, NotificationType } from '@circle/types';
import { apiRequest } from '@/lib/api';
import type { CircleListItem } from '@/hooks/use-circle-queries';
import { useCircleStore } from '@/stores/circle.store';
import { getSocket } from '@/lib/socket';
import { useLanguageStore } from '@/stores/language.store';
import { useThemeStore } from '@/stores/theme.store';

interface NotificationCenterPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
  onUnreadCountChange: (count: number) => void;
}

export function NotificationCenterPopover({
  isOpen,
  onClose,
  unreadCount,
  onUnreadCountChange,
}: NotificationCenterPopoverProps) {
  const router = useRouter();
  const { locale, t: { notificationsCenter: t } } = useLanguageStore();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<NotificationEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [navigationError, setNavigationError] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Fetch notifications from server
  const fetchNotifications = useCallback(
    async (cursor?: string | null, isInitial = false) => {
      setLoadFailed(false);
      if (isInitial) setIsLoading(true);
      else setIsLoadingMore(true);

      try {
        const params = new URLSearchParams();
        params.set('limit', '15');
        if (filter === 'unread') {
          params.set('unreadOnly', 'true');
        }
        if (cursor) {
          params.set('cursor', cursor);
        }

        const res = await apiRequest<NotificationEntity[]>(`/notifications?${params.toString()}`);
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

  // Initial load and filter change
  useEffect(() => {
    if (isOpen) {
      fetchNotifications(null, true);
    }
  }, [isOpen, filter, fetchNotifications]);

  // Realtime Socket.IO Listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewNotification = (payload: {
      notification: NotificationEntity;
      unreadCount: number;
    }) => {
      onUnreadCountChange(payload.unreadCount);
      setNotifications((prev) => {
        // Prevent duplicate prepend
        if (prev.some((n) => n.id === payload.notification.id)) return prev;
        if (filter === 'unread' && payload.notification.isRead) return prev;
        return [payload.notification, ...prev];
      });
    };

    const handleUnreadCount = (payload: { unreadCount: number }) => {
      onUnreadCountChange(payload.unreadCount);
    };

    socket.on('notification:new', handleNewNotification);
    socket.on('notification:unread_count', handleUnreadCount);

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:unread_count', handleUnreadCount);
    };
  }, [filter, onUnreadCountChange]);

  // Mark single notification as read
  const handleMarkAsRead = async (item: NotificationEntity, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (item.isRead) return;

    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
    );
    onUnreadCountChange(Math.max(0, unreadCount - 1));

    try {
      await apiRequest(`/notifications/${item.id}/read`, { method: 'PATCH' });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (isMarkingAll || unreadCount === 0) return;
    setIsMarkingAll(true);

    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    onUnreadCountChange(0);

    try {
      await apiRequest('/notifications/read-all', { method: 'POST' });
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Delete notification
  const handleDeleteNotification = async (item: NotificationEntity, e: React.MouseEvent) => {
    e.stopPropagation();

    // Optimistic remove
    setNotifications((prev) => prev.filter((n) => n.id !== item.id));
    if (!item.isRead) {
      onUnreadCountChange(Math.max(0, unreadCount - 1));
    }

    try {
      await apiRequest(`/notifications/${item.id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  // Click handler: mark read and deep link
  const handleNotificationClick = async (item: NotificationEntity) => {
    setNavigationError(false);
    const target = getCircleNotificationDestination(item);
    if (target) {
      try {
        const { data } = await apiRequest<CircleListItem[]>('/circles');
        const circle = data.find((entry) => entry.id === target.circleId);
        if (!circle) {
          setNavigationError(true);
          return;
        }
        const store = useCircleStore.getState();
        store.setActiveCircle(circle);
        if (target.channelId) store.setActiveChannelId(target.channelId);
        store.setNotificationMessageId(item.targetType === 'message' ? target.targetId ?? null : null);
        if (target.joinRequests) store.setManageModalOpen(true, 'members');
        if (target.screen === 'calendar' && target.eventStart) {
          store.setTargetCalendarEvent(target.eventStart, target.targetId);
        }
        if (target.screen === 'polls') store.setNotificationPollId(target.targetId ?? null);
        router.push(`/${target.screen}`);
      } catch {
        setNavigationError(true);
        return;
      }
    } else if (item.deepLink && /^\/[a-z]/i.test(item.deepLink)) {
      router.push(item.deepLink);
    }
    if (!item.isRead) void handleMarkAsRead(item);
    onClose();
  };

  // Format relative time helper
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

  // Helper to get type icon
  const renderTypeIcon = (type: string) => {
    switch (type) {
      case NotificationType.CIRCLE_JOIN_REQUEST:
      case NotificationType.CIRCLE_INVITE:
        return <Users className="h-4 w-4 text-circle-primary" />;
      case NotificationType.CHAT_MESSAGE:
        return <MessageSquare className="h-4 w-4 text-circle-sage" />;
      case NotificationType.CALENDAR_EVENT:
      case NotificationType.CALENDAR_CHANGED:
      case NotificationType.CALENDAR_CANCELLED:
      case NotificationType.CALENDAR_REMINDER:
        return <Calendar className="h-4 w-4 text-circle-coral" />;
      case NotificationType.POLL_CLOSED:
      case NotificationType.POLL_NEW:
        return <BarChart2 className="h-4 w-4 text-circle-primary" />;
      case NotificationType.CALL_MISSED:
        return <PhoneMissed className="h-4 w-4 text-circle-coral" />;
      default:
        return <Info className="h-4 w-4 text-circle-slate dark:text-circle-dark-muted" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl p-2 animate-fadeIn z-50 flex flex-col max-h-[82vh] overflow-hidden backdrop-blur-md bg-white/95 dark:bg-circle-dark-surface/95 border border-circle-hairline dark:border-circle-dark-hairline shadow-lg"
    >
      {navigationError && (
        <p role="status" className="px-4 py-2 text-xs text-circle-slate dark:text-circle-dark-muted">
          {t.targetNotFound}
        </p>
      )}
      {/* Popover Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-circle-hairline/60 dark:border-circle-dark-hairline/60">
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text tracking-tight">
            {t.title}
          </p>
          {unreadCount > 0 && (
            <span className="flex items-center justify-center h-4.5 min-w-[18px] px-1 rounded-full bg-circle-coral text-white text-[10px] font-bold leading-none shadow-xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAll}
            title={t.markAllAsRead}
            className="flex items-center gap-1 text-[11px] font-semibold text-circle-primary hover:text-circle-primary-hover dark:text-circle-primary transition-colors disabled:opacity-50"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            <span>{t.markAllAsRead}</span>
          </button>
        )}
      </div>

      {/* Filter Tabs (All / Unread) */}
      <div className="flex gap-1.5 p-1.5 border-b border-circle-hairline/40 dark:border-circle-dark-hairline/40">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-semibold transition-all text-center ${
            filter === 'all'
              ? 'bg-circle-wash dark:bg-circle-dark-elevated text-circle-charcoal dark:text-circle-dark-text shadow-xs'
              : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text'
          }`}
        >
          {t.filterAll}
        </button>
        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-semibold transition-all text-center flex items-center justify-center gap-1.5 ${
            filter === 'unread'
              ? 'bg-circle-wash dark:bg-circle-dark-elevated text-circle-charcoal dark:text-circle-dark-text shadow-xs'
              : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text'
          }`}
        >
          <span>{t.filterUnread}</span>
          {unreadCount > 0 && (
            <span className="h-1.5 w-1.5 rounded-full bg-circle-coral" />
          )}
        </button>
      </div>

      {/* Notifications Scroll List */}
      <div className="flex-1 overflow-y-auto divide-y divide-circle-hairline/40 dark:divide-circle-dark-hairline/40 overscroll-contain">
        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-circle-primary" />
            <span className="text-xs text-circle-slate dark:text-circle-dark-muted">
              {t.loading}
            </span>
          </div>
        ) : loadFailed && notifications.length === 0 ? (
          <div role="status" className="px-4 py-8 text-center text-xs">
            <p>{t.errorLoading}</p>
            <button type="button" className="mt-2 text-circle-primary" onClick={() => fetchNotifications(null, true)}>
              {t.retry}
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-8 text-center space-y-2">
            <CheckCircle2 className="h-7 w-7 mx-auto text-circle-sage dark:text-circle-primary opacity-80" />
            <p className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text">
              {filter === 'unread' ? t.emptyUnreadTitle : t.emptyAllTitle}
            </p>
            <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted leading-relaxed">
              {filter === 'unread' ? t.emptyUnreadDesc : t.emptyAllDesc}
            </p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => handleNotificationClick(item)}
              onKeyDown={(event) => {
                if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault();
                  void handleNotificationClick(item);
                }
              }}
              className={`group flex items-start gap-2.5 p-2.5 transition-colors cursor-pointer rounded-xl ${
                item.isRead
                  ? 'hover:bg-circle-wash/60 dark:hover:bg-circle-dark-elevated/60'
                  : 'bg-circle-primary/5 dark:bg-circle-primary/10 hover:bg-circle-primary/10 dark:hover:bg-circle-primary/15'
              }`}
            >
              {/* Icon Container (Bare Icon without artificial box container) */}
              <div className="pt-0.5 shrink-0">{renderTypeIcon(item.type)}</div>

              {/* Content Body */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p
                    className={`text-xs font-bold truncate ${
                      item.isRead
                        ? 'text-circle-charcoal/90 dark:text-circle-dark-text/90'
                        : 'text-circle-charcoal dark:text-circle-dark-text'
                    }`}
                  >
                    {(item.metadata?.circleId ? getNotificationText(item.type, item.metadata, locale)?.title : null) ?? item.title}
                  </p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-circle-slate dark:text-circle-dark-muted">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                    {!item.isRead && (
                      <span className="h-1.5 w-1.5 rounded-full bg-circle-coral shrink-0" />
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-0.5 line-clamp-2 leading-relaxed">
                  {(item.metadata?.circleId ? getNotificationText(item.type, item.metadata, locale)?.content : null) ?? item.content}
                </p>
              </div>

              {/* Actions on hover (Delete) */}
              <button
                type="button"
                onClick={(e) => handleDeleteNotification(item, e)}
                title={t.deleteNotification}
                className="opacity-0 group-hover:opacity-100 p-1 text-circle-slate hover:text-circle-coral dark:text-circle-dark-muted dark:hover:text-circle-coral transition-all rounded-md"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="p-2 text-center">
            <button
              type="button"
              onClick={() => fetchNotifications(nextCursor)}
              disabled={isLoadingMore}
              className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-circle-primary hover:bg-circle-wash dark:hover:bg-circle-dark-elevated transition-colors flex items-center justify-center gap-1.5"
            >
              {isLoadingMore ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <span>{t.loadMore}</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
