import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  CalendarDays,
  Clock,
  MapPin,
  MessageSquareShare,
  Check,
  HelpCircle,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import {
  getUpcomingCalendarEventsApi,
  shareCalendarEventToChatApi,
  respondCalendarEventRsvpApi,
} from '../../services/circle-tools.service';
import { getSocket } from '../../services/socket';
import { useAuthStore } from '../../stores/auth.store';
import { CalendarEventEntity, EventRsvpStatus } from '@circle/types';

interface MobileUpcomingEventsFeedProps {
  circleId: string;
  onSelectEvent: (event: CalendarEventEntity) => void;
}

export const MobileUpcomingEventsFeed: React.FC<MobileUpcomingEventsFeedProps> = ({
  circleId,
  onSelectEvent,
}) => {
  const user = useAuthStore((s) => s.user);
  const [events, setEvents] = useState<CalendarEventEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sharingEventId, setSharingEventId] = useState<string | null>(null);

  const fetchUpcoming = useCallback(async (isPull = false) => {
    try {
      if (isPull) setIsRefreshing(true);
      else setIsLoading(true);
      const data = await getUpcomingCalendarEventsApi(circleId);
      setEvents(data);
    } catch (err: any) {
      if (!isPull) {
        Alert.alert('Lỗi', err.message || 'Không thể tải kèo sắp tới');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [circleId]);

  useEffect(() => {
    fetchUpcoming();
  }, [fetchUpcoming]);

  // Realtime Socket listener
  useEffect(() => {
    const handleRsvpUpdated = (payload: any) => {
      if (payload.circleId === circleId) {
        setEvents((prev) =>
          prev.map((ev) => {
            if (ev.id !== payload.eventId) return ev;
            const curRsvps = ev.rsvps || [];
            const idx = curRsvps.findIndex((r) => r.userId === payload.userId);
            let nextRsvps = [...curRsvps];
            if (idx >= 0) {
              nextRsvps[idx] = {
                ...nextRsvps[idx],
                status: payload.status,
                user: payload.user || nextRsvps[idx]?.user,
              };
            } else {
              nextRsvps.push({
                id: payload.rsvpId || `rsvp-${Date.now()}`,
                eventId: payload.eventId,
                userId: payload.userId,
                status: payload.status,
                user: payload.user,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            }
            return { ...ev, rsvps: nextRsvps };
          }),
        );
      }
    };

    let activeSocket: any = null;
    getSocket().then((s) => {
      if (!s) return;
      activeSocket = s;
      s.on('circle:calendar-event-rsvp-updated', handleRsvpUpdated);
    });

    return () => {
      if (activeSocket) {
        activeSocket.off('circle:calendar-event-rsvp-updated', handleRsvpUpdated);
      }
    };
  }, [circleId]);

  const handleShareToChat = async (eventId: string) => {
    if (sharingEventId) return;
    setSharingEventId(eventId);
    Haptics.selectionAsync();

    try {
      await shareCalendarEventToChatApi(circleId, eventId);
      Alert.alert('Thành công', 'Đã chia sẻ thẻ sự kiện vào kênh Chat của Vòng tròn');
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể chia sẻ vào chat');
    } finally {
      setSharingEventId(null);
    }
  };

  const handleRsvp = async (eventId: string, status: EventRsvpStatus) => {
    Haptics.selectionAsync();
    setEvents((prev) =>
      prev.map((ev) => {
        if (ev.id !== eventId) return ev;
        const curRsvps = ev.rsvps || [];
        const filtered = curRsvps.filter((r) => r.userId !== user?.id);
        filtered.push({
          id: `rsvp-${Date.now()}`,
          eventId,
          userId: user?.id || '',
          status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        return { ...ev, rsvps: filtered };
      }),
    );

    try {
      await respondCalendarEventRsvpApi(circleId, eventId, { status });
    } catch {
      fetchUpcoming();
    }
  };

  const grouped = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toDateString();
    const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const sorted = [...events].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

    const res: {
      today: CalendarEventEntity[];
      tomorrow: CalendarEventEntity[];
      thisWeek: CalendarEventEntity[];
      upcoming: CalendarEventEntity[];
    } = {
      today: [],
      tomorrow: [],
      thisWeek: [],
      upcoming: [],
    };

    sorted.forEach((ev) => {
      const d = new Date(ev.startTime);
      const dStr = d.toDateString();
      if (dStr === todayStr) {
        res.today.push(ev);
      } else if (dStr === tomorrowStr) {
        res.tomorrow.push(ev);
      } else if (d <= oneWeekLater) {
        res.thisWeek.push(ev);
      } else {
        res.upcoming.push(ev);
      }
    });

    return res;
  }, [events]);

  const sections = [
    { key: 'today', label: 'Hôm nay', items: grouped.today },
    { key: 'tomorrow', label: 'Ngày mai', items: grouped.tomorrow },
    { key: 'thisWeek', label: 'Tuần này', items: grouped.thisWeek },
    { key: 'upcoming', label: 'Sắp diễn ra', items: grouped.upcoming },
  ];

  const isEmpty =
    grouped.today.length === 0 &&
    grouped.tomorrow.length === 0 &&
    grouped.thisWeek.length === 0 &&
    grouped.upcoming.length === 0;

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color="#0D9488" />
        <Text style={styles.loadingText}>Đang tải kèo sắp tới...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => fetchUpcoming(true)}
          tintColor="#0D9488"
        />
      }
    >
      {isEmpty ? (
        <View style={styles.emptyContainer}>
          <CalendarDays size={42} color="#94A3B8" />
          <Text style={styles.emptyTitle}>Chưa có kèo nào sắp diễn ra</Text>
          <Text style={styles.emptySubtitle}>
            Tạo sự kiện mới hoặc mời các thành viên cùng lên lịch nhé!
          </Text>
        </View>
      ) : (
        sections.map((sec) => {
          if (sec.items.length === 0) return null;
          return (
            <View key={sec.key} style={styles.sectionWrap}>
              <View style={styles.sectionHeaderRow}>
                <Sparkles size={14} color="#0D9488" />
                <Text style={styles.sectionHeaderTitle}>{sec.label}</Text>
                <Text style={styles.sectionHeaderCount}>({sec.items.length})</Text>
              </View>

              {sec.items.map((ev) => {
                const startTime = new Date(ev.startTime);
                const timeStr = `${startTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })} · ${startTime.toLocaleDateString([], {
                  day: '2-digit',
                  month: '2-digit',
                })}`;

                const rsvps = ev.rsvps || [];
                const yesList = rsvps.filter((r) => r.status === EventRsvpStatus.YES);
                const maybeList = rsvps.filter((r) => r.status === EventRsvpStatus.MAYBE);
                const noList = rsvps.filter((r) => r.status === EventRsvpStatus.NO);

                const myRsvp = rsvps.find((r) => r.userId === user?.id)?.status;

                return (
                  <TouchableOpacity
                    key={ev.id}
                    style={[styles.card, ev.isCancelled && styles.cardCancelled]}
                    activeOpacity={0.7}
                    onPress={() => onSelectEvent(ev)}
                  >
                    {/* Header */}
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={styles.cardTitle}>
                          {ev.eventTitle}
                        </Text>
                        {ev.isCancelled && (
                          <Text style={styles.cancelledBadge}>ĐÃ HỦY</Text>
                        )}
                      </View>

                      {/* Share to Chat button */}
                      <TouchableOpacity
                        style={styles.shareBtn}
                        disabled={sharingEventId === ev.id}
                        onPress={() => handleShareToChat(ev.id)}
                      >
                        {sharingEventId === ev.id ? (
                          <ActivityIndicator size="small" color="#0D9488" />
                        ) : (
                          <>
                            <MessageSquareShare size={13} color="#0D9488" />
                            <Text style={styles.shareBtnText}>Gửi chat</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>

                    {/* Meta */}
                    <View style={styles.metaRow}>
                      <Clock size={12} color="#0D9488" />
                      <Text style={styles.metaText}>{timeStr}</Text>
                    </View>

                    {ev.location ? (
                      <View style={styles.metaRow}>
                        <MapPin size={12} color="#64748B" />
                        <Text numberOfLines={1} style={styles.metaText}>
                          {ev.location}
                        </Text>
                      </View>
                    ) : null}

                    {/* RSVP Summary Pills & Avatars */}
                    <View style={styles.rsvpSummaryRow}>
                      <View style={styles.rsvpBadgesGroup}>
                        <View style={[styles.rsvpBadge, { backgroundColor: '#DCFCE7' }]}>
                          <Text style={[styles.rsvpBadgeText, { color: '#15803D' }]}>
                            {yesList.length} Tham gia
                          </Text>
                        </View>
                        {maybeList.length > 0 && (
                          <View style={[styles.rsvpBadge, { backgroundColor: '#FEF9C3' }]}>
                            <Text style={[styles.rsvpBadgeText, { color: '#A16207' }]}>
                              {maybeList.length} Chưa chắc
                            </Text>
                          </View>
                        )}
                        {noList.length > 0 && (
                          <View style={[styles.rsvpBadge, { backgroundColor: '#FEE2E2' }]}>
                            <Text style={[styles.rsvpBadgeText, { color: '#B91C1C' }]}>
                              {noList.length} Bận
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Avatars */}
                      {yesList.length > 0 && (
                        <View style={styles.avatarStack}>
                          {yesList.slice(0, 3).map((r, i) => (
                            <View
                              key={r.userId || i}
                              style={[styles.avatarWrap, { marginLeft: i === 0 ? 0 : -6 }]}
                            >
                              {r.user?.profile?.avatarUrl ? (
                                <Image
                                  source={{ uri: r.user.profile.avatarUrl }}
                                  style={styles.avatarImg}
                                />
                              ) : (
                                <View style={styles.avatarFallback}>
                                  <Text style={styles.avatarInitial}>
                                    {(r.user?.profile?.displayName || 'U').charAt(0).toUpperCase()}
                                  </Text>
                                </View>
                              )}
                            </View>
                          ))}
                        </View>
                      )}
                    </View>

                    {/* Quick RSVP buttons */}
                    <View style={styles.quickRsvpRow}>
                      <TouchableOpacity
                        style={[
                          styles.quickRsvpBtn,
                          myRsvp === EventRsvpStatus.YES && styles.quickRsvpBtnActiveYes,
                        ]}
                        onPress={() => handleRsvp(ev.id, EventRsvpStatus.YES)}
                      >
                        <Check
                          size={12}
                          color={myRsvp === EventRsvpStatus.YES ? '#FFFFFF' : '#15803D'}
                        />
                        <Text
                          style={[
                            styles.quickRsvpBtnText,
                            myRsvp === EventRsvpStatus.YES
                              ? { color: '#FFFFFF', fontWeight: '700' }
                              : { color: '#15803D' },
                          ]}
                        >
                          Tham gia
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.quickRsvpBtn,
                          myRsvp === EventRsvpStatus.MAYBE && styles.quickRsvpBtnActiveMaybe,
                        ]}
                        onPress={() => handleRsvp(ev.id, EventRsvpStatus.MAYBE)}
                      >
                        <HelpCircle
                          size={12}
                          color={myRsvp === EventRsvpStatus.MAYBE ? '#FFFFFF' : '#A16207'}
                        />
                        <Text
                          style={[
                            styles.quickRsvpBtnText,
                            myRsvp === EventRsvpStatus.MAYBE
                              ? { color: '#FFFFFF', fontWeight: '700' }
                              : { color: '#A16207' },
                          ]}
                        >
                          Chưa chắc
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.quickRsvpBtn,
                          myRsvp === EventRsvpStatus.NO && styles.quickRsvpBtnActiveNo,
                        ]}
                        onPress={() => handleRsvp(ev.id, EventRsvpStatus.NO)}
                      >
                        <X
                          size={12}
                          color={myRsvp === EventRsvpStatus.NO ? '#FFFFFF' : '#B91C1C'}
                        />
                        <Text
                          style={[
                            styles.quickRsvpBtnText,
                            myRsvp === EventRsvpStatus.NO
                              ? { color: '#FFFFFF', fontWeight: '700' }
                              : { color: '#B91C1C' },
                          ]}
                        >
                          Bận
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 260,
  },
  sectionWrap: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D9488',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeaderCount: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    gap: 8,
  },
  cardCancelled: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  cancelledBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
    marginTop: 2,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  shareBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0D9488',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
  },
  rsvpSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F1F5F9',
  },
  rsvpBadgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  rsvpBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rsvpBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quickRsvpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  quickRsvpBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickRsvpBtnActiveYes: {
    backgroundColor: '#16A34A',
    borderColor: '#15803D',
  },
  quickRsvpBtnActiveMaybe: {
    backgroundColor: '#CA8A04',
    borderColor: '#A16207',
  },
  quickRsvpBtnActiveNo: {
    backgroundColor: '#DC2626',
    borderColor: '#B91C1C',
  },
  quickRsvpBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
