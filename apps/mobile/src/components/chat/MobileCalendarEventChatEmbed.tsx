import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Calendar, Clock, MapPin, Check, HelpCircle, X, Users, MessageSquareShare } from 'lucide-react-native';
import { getSocket } from '../../services/socket';
import { useAuthStore } from '../../stores/auth.store';
import { respondCalendarEventRsvpApi } from '../../services/circle-tools.service';
import { EventRsvpStatus } from '@circle/types';

interface CalendarEmbedData {
  id?: string;
  eventId?: string;
  title?: string;
  eventTitle?: string;
  startTime: string;
  endTime?: string;
  location?: string;
  description?: string;
  rsvps?: Array<{
    id?: string;
    userId: string;
    status: EventRsvpStatus;
    user?: {
      id?: string;
      email?: string;
      profile?: {
        displayName?: string;
        avatarUrl?: string | null;
      };
    };
  }>;
}

interface MobileCalendarEventChatEmbedProps {
  content: string;
  circleId: string;
  currentUserId?: string;
  isSenderMe?: boolean;
  senderTextColor?: string;
  colors: {
    primary: string;
    wash: string;
    subtle: string;
    text: string;
    card?: string;
    border?: string;
  };
  onOpenCalendar?: () => void;
}

export const MobileCalendarEventChatEmbed: React.FC<MobileCalendarEventChatEmbedProps> = ({
  content,
  circleId,
  currentUserId,
  isSenderMe = false,
  senderTextColor = '#FFFFFF',
  colors,
  onOpenCalendar,
}) => {
  const authUserId = useAuthStore((s) => s.user?.id);
  const effectiveUserId = currentUserId || authUserId;
  const [data, setData] = useState<CalendarEmbedData | null>(() => {
    try {
      const jsonStr = content.startsWith('[CALENDAR_EVENT]:')
        ? content.replace('[CALENDAR_EVENT]:', '').trim()
        : content;
      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const eventId = data?.eventId || data?.id;
  const eventTitle = data?.eventTitle || data?.title || 'Sự kiện Vòng tròn';

  // Listen to realtime RSVP updates
  useEffect(() => {
    if (!eventId) return;

    const handleRsvpUpdated = (payload: any) => {
      if (payload.circleId === circleId && payload.eventId === eventId) {
        setData((prev) => {
          if (!prev) return null;
          const currentRsvps = prev.rsvps || [];
          const existingIdx = currentRsvps.findIndex((r) => r.userId === payload.userId);
          let newRsvps = [...currentRsvps];
          if (existingIdx >= 0) {
            newRsvps[existingIdx] = {
              ...newRsvps[existingIdx],
              status: payload.status,
              user: payload.user || newRsvps[existingIdx]?.user,
            };
          } else {
            newRsvps.push({
              id: payload.rsvpId || `rsvp-${Date.now()}`,
              userId: payload.userId,
              status: payload.status,
              user: payload.user,
            });
          }
          return { ...prev, rsvps: newRsvps };
        });
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
  }, [circleId, eventId]);

  if (!data || !eventId) {
    return null;
  }

  const rsvps = data.rsvps || [];
  const yesRsvps = rsvps.filter((r) => r.status === EventRsvpStatus.YES);
  const maybeRsvps = rsvps.filter((r) => r.status === EventRsvpStatus.MAYBE);
  const noRsvps = rsvps.filter((r) => r.status === EventRsvpStatus.NO);

  const myRsvp = rsvps.find((r) => r.userId === effectiveUserId)?.status;

  const handleRsvp = async (status: EventRsvpStatus) => {
    if (!eventId || isSubmitting) return;
    setIsSubmitting(true);
    Haptics.selectionAsync();

    // Optimistic update
    setData((prev) => {
      if (!prev) return null;
      const prevRsvps = prev.rsvps || [];
      const filtered = prevRsvps.filter((r) => r.userId !== effectiveUserId);
      filtered.push({
        id: `rsvp-${Date.now()}`,
        userId: effectiveUserId || '',
        status,
      });
      return { ...prev, rsvps: filtered };
    });

    try {
      await respondCalendarEventRsvpApi(circleId, eventId, { status });
    } catch {
      // Revert if error
    } finally {
      setIsSubmitting(false);
    }
  };

  const startTimeObj = new Date(data.startTime);
  const timeFormatted = `${startTimeObj.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })} · ${startTimeObj.toLocaleDateString([], { day: '2-digit', month: '2-digit' })}`;

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: isSenderMe ? 'rgba(0,0,0,0.18)' : '#FFFFFF',
          borderColor: isSenderMe ? 'rgba(255,255,255,0.2)' : '#E2E8F0',
        },
      ]}
    >
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View
          style={[
            styles.iconBadge,
            { backgroundColor: isSenderMe ? 'rgba(255,255,255,0.2)' : '#CCFBF1' },
          ]}
        >
          <Calendar size={18} color={isSenderMe ? senderTextColor : '#0D9488'} />
        </View>
        <View style={styles.titleCol}>
          <Text
            style={[
              styles.subtitleText,
              { color: isSenderMe ? 'rgba(255,255,255,0.75)' : '#0D9488' },
            ]}
          >
            LỊCH HẸN VÒNG TRÒN
          </Text>
          <Text
            numberOfLines={1}
            style={[
              styles.titleText,
              { color: isSenderMe ? senderTextColor : '#0F172A' },
            ]}
          >
            {eventTitle}
          </Text>
        </View>
      </View>

      {/* Meta Info */}
      <View
        style={[
          styles.metaContainer,
          { backgroundColor: isSenderMe ? 'rgba(0,0,0,0.12)' : '#F8FAFC' },
        ]}
      >
        <View style={styles.metaRow}>
          <Clock size={12} color={isSenderMe ? senderTextColor : '#64748B'} />
          <Text
            style={[
              styles.metaText,
              { color: isSenderMe ? senderTextColor : '#475569' },
            ]}
          >
            {timeFormatted}
          </Text>
        </View>
        {data.location ? (
          <View style={styles.metaRow}>
            <MapPin size={12} color={isSenderMe ? senderTextColor : '#64748B'} />
            <Text
              numberOfLines={1}
              style={[
                styles.metaText,
                { color: isSenderMe ? senderTextColor : '#475569', flex: 1 },
              ]}
            >
              {data.location}
            </Text>
          </View>
        ) : null}
      </View>

      {/* RSVP Counts & Avatars summary */}
      <View style={styles.attendeesRow}>
        <View style={styles.countsRow}>
          <View style={[styles.countBadge, { backgroundColor: '#DCFCE7' }]}>
            <Text style={[styles.countBadgeText, { color: '#15803D' }]}>
              {yesRsvps.length} Tham gia
            </Text>
          </View>
          {maybeRsvps.length > 0 && (
            <View style={[styles.countBadge, { backgroundColor: '#FEF9C3' }]}>
              <Text style={[styles.countBadgeText, { color: '#A16207' }]}>
                {maybeRsvps.length} Chưa chắc
              </Text>
            </View>
          )}
          {noRsvps.length > 0 && (
            <View style={[styles.countBadge, { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.countBadgeText, { color: '#B91C1C' }]}>
                {noRsvps.length} Bận
              </Text>
            </View>
          )}
        </View>

        {/* Small Avatar stack */}
        {yesRsvps.length > 0 && (
          <View style={styles.avatarStack}>
            {yesRsvps.slice(0, 3).map((r, idx) => (
              <View
                key={r.userId || idx}
                style={[styles.miniAvatarWrap, { marginLeft: idx === 0 ? 0 : -6 }]}
              >
                {r.user?.profile?.avatarUrl ? (
                  <Image
                    source={{ uri: r.user.profile.avatarUrl }}
                    style={styles.miniAvatarImg}
                  />
                ) : (
                  <View style={styles.miniAvatarFallback}>
                    <Text style={styles.miniAvatarInitial}>
                      {(r.user?.profile?.displayName || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            ))}
            {yesRsvps.length > 3 && (
              <View style={[styles.miniAvatarWrap, styles.miniAvatarMore]}>
                <Text style={styles.miniAvatarMoreText}>+{yesRsvps.length - 3}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* 3 RSVP Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            myRsvp === EventRsvpStatus.YES
              ? styles.actionBtnActiveYes
              : isSenderMe
              ? styles.actionBtnSenderMe
              : styles.actionBtnNormal,
          ]}
          activeOpacity={0.7}
          disabled={isSubmitting}
          onPress={() => handleRsvp(EventRsvpStatus.YES)}
        >
          <Check
            size={13}
            color={
              myRsvp === EventRsvpStatus.YES
                ? '#FFFFFF'
                : isSenderMe
                ? senderTextColor
                : '#15803D'
            }
          />
          <Text
            style={[
              styles.actionBtnText,
              myRsvp === EventRsvpStatus.YES
                ? { color: '#FFFFFF', fontWeight: '700' }
                : { color: isSenderMe ? senderTextColor : '#15803D' },
            ]}
          >
            Tham gia
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionBtn,
            myRsvp === EventRsvpStatus.MAYBE
              ? styles.actionBtnActiveMaybe
              : isSenderMe
              ? styles.actionBtnSenderMe
              : styles.actionBtnNormal,
          ]}
          activeOpacity={0.7}
          disabled={isSubmitting}
          onPress={() => handleRsvp(EventRsvpStatus.MAYBE)}
        >
          <HelpCircle
            size={13}
            color={
              myRsvp === EventRsvpStatus.MAYBE
                ? '#FFFFFF'
                : isSenderMe
                ? senderTextColor
                : '#A16207'
            }
          />
          <Text
            style={[
              styles.actionBtnText,
              myRsvp === EventRsvpStatus.MAYBE
                ? { color: '#FFFFFF', fontWeight: '700' }
                : { color: isSenderMe ? senderTextColor : '#A16207' },
            ]}
          >
            Chưa chắc
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionBtn,
            myRsvp === EventRsvpStatus.NO
              ? styles.actionBtnActiveNo
              : isSenderMe
              ? styles.actionBtnSenderMe
              : styles.actionBtnNormal,
          ]}
          activeOpacity={0.7}
          disabled={isSubmitting}
          onPress={() => handleRsvp(EventRsvpStatus.NO)}
        >
          <X
            size={13}
            color={
              myRsvp === EventRsvpStatus.NO
                ? '#FFFFFF'
                : isSenderMe
                ? senderTextColor
                : '#B91C1C'
            }
          />
          <Text
            style={[
              styles.actionBtnText,
              myRsvp === EventRsvpStatus.NO
                ? { color: '#FFFFFF', fontWeight: '700' }
                : { color: isSenderMe ? senderTextColor : '#B91C1C' },
            ]}
          >
            Bận
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    minWidth: 260,
    maxWidth: 320,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
  },
  subtitleText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  metaContainer: {
    borderRadius: 8,
    padding: 8,
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
  },
  attendeesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  countsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
  },
  miniAvatarWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  miniAvatarImg: {
    width: '100%',
    height: '100%',
  },
  miniAvatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarInitial: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  miniAvatarMore: {
    backgroundColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
  },
  miniAvatarMoreText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnNormal: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  actionBtnSenderMe: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  actionBtnActiveYes: {
    backgroundColor: '#16A34A',
    borderColor: '#15803D',
  },
  actionBtnActiveMaybe: {
    backgroundColor: '#CA8A04',
    borderColor: '#A16207',
  },
  actionBtnActiveNo: {
    backgroundColor: '#DC2626',
    borderColor: '#B91C1C',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
