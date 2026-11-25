import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image as RNImage,
  Platform,
} from 'react-native';
import {
  Calendar,
  Clock,
  MapPin,
  Check,
  HelpCircle,
  X,
  Camera,
  MessageSquare,
  Send,
  Vote,
  Sparkles,
  HeartHandshake,
  FileSpreadsheet,
  Navigation,
  ChevronRight,
  Users,
  Image as ImageIcon,
  Plus,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';
import { useAuthStore } from '../../stores/auth.store';
import {
  getUpcomingCalendarEventsApi,
  respondCalendarEventRsvpApi,
  getPollsApi,
  votePollApi,
} from '../../services/circle-tools.service';
import {
  useCircleMomentsQuery,
  useChannelMessagesQuery,
} from '../../hooks/use-circle-queries';
import { CalendarEventEntity, GroupPollEntity, EventRsvpStatus } from '@circle/types';

export type ToolKey =
  | 'album'
  | 'calendar'
  | 'planning'
  | 'location'
  | 'poll'
  | 'wheel'
  | 'anonymous';

interface CircleActivityHubViewProps {
  circleId: string;
  circleName: string;
  defaultChannelId?: string | null;
  onOpenChat: () => void;
  onOpenTool: (tool: ToolKey) => void;
  onOpenMoments: () => void;
  onOpenEventContext?: (eventId: string) => void;
  topPadding: number;
  bottomPadding: number;
}

export const CircleActivityHubView: React.FC<CircleActivityHubViewProps> = ({
  circleId,
  circleName,
  defaultChannelId,
  onOpenChat,
  onOpenTool,
  onOpenMoments,
  onOpenEventContext,
  topPadding,
  bottomPadding,
}) => {
  const { colors, resolvedTheme, uiStyle } = useThemeStore();
  const t = useLanguageStore((s) => s.t);
  const locale = useLanguageStore((s) => s.locale);
  const { user } = useAuthStore();
  const currentUserId = user?.id;

  // 1. Block: Upcoming Event State
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEventEntity[]>([]);
  const [isLoadingEvent, setIsLoadingEvent] = useState(false);
  const [userRsvpStatus, setUserRsvpStatus] = useState<string | null>(null);
  const [isRsvping, setIsRsvping] = useState(false);

  // 2. Block: Recent Moments Query
  const { data: moments = [], isLoading: isLoadingMoments } = useCircleMomentsQuery(circleId);

  // 3. Block: Chat Preview Query
  const { data: chatData, isLoading: isLoadingChat } = useChannelMessagesQuery(
    defaultChannelId || null,
  );
  const recentMessages = useMemo(() => {
    if (!chatData?.pages) return [];
    const all = chatData.pages.flatMap((page) => page.messages || []);
    // Take latest 2 messages
    return all.slice(0, 2);
  }, [chatData]);

  // 4. Block: Pending Polls State
  const [activePoll, setActivePoll] = useState<GroupPollEntity | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  // Load upcoming events
  const loadUpcomingEvents = useCallback(async () => {
    if (!circleId) return;
    try {
      setIsLoadingEvent(true);
      const data = await getUpcomingCalendarEventsApi(circleId);
      if (Array.isArray(data)) {
        setUpcomingEvents(data);
        if (data.length > 0 && currentUserId) {
          const myRsvp = data[0].rsvps?.find(
            (r: any) => r.userId === currentUserId || r.creator?.userId === currentUserId,
          );
          if (myRsvp) {
            setUserRsvpStatus(myRsvp.status);
          }
        }
      }
    } catch {
      setUpcomingEvents([]);
    } finally {
      setIsLoadingEvent(false);
    }
  }, [circleId, currentUserId]);

  // Load active polls
  const loadPolls = useCallback(async () => {
    if (!circleId) return;
    try {
      const data = await getPollsApi(circleId);
      if (Array.isArray(data)) {
        const openPoll = data.find((p) => !p.isClosed);
        setActivePoll(openPoll || null);
      }
    } catch {
      setActivePoll(null);
    }
  }, [circleId]);

  useEffect(() => {
    loadUpcomingEvents();
    loadPolls();
  }, [loadUpcomingEvents, loadPolls]);

  // Handle inline RSVP
  const handleRsvp = async (status: EventRsvpStatus) => {
    if (!upcomingEvents[0] || isRsvping) return;
    Haptics.selectionAsync();
    const eventId = upcomingEvents[0].id;
    const prevStatus = userRsvpStatus;
    setUserRsvpStatus(status);
    setIsRsvping(true);

    try {
      await respondCalendarEventRsvpApi(circleId, eventId, { status });
      await loadUpcomingEvents();
    } catch {
      setUserRsvpStatus(prevStatus);
    } finally {
      setIsRsvping(false);
    }
  };

  // Handle inline Vote
  const handleVote = async (optionId: string) => {
    if (!activePoll || isVoting) return;
    Haptics.selectionAsync();
    setIsVoting(true);
    try {
      const updated = await votePollApi(circleId, activePoll.id, { optionId });
      if (updated) {
        setActivePoll(updated);
      }
    } catch {
      // Re-fetch if error
      await loadPolls();
    } finally {
      setIsVoting(false);
    }
  };

  const nearestEvent = upcomingEvents[0] || null;

  const formatEventDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    if (isToday) return locale === 'vi' ? `Hôm nay, ${time}` : `Today, ${time}`;
    return `${d.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
      day: 'numeric',
      month: 'short',
    })}, ${time}`;
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContainer,
        {
          paddingTop: topPadding + 14,
          paddingBottom: bottomPadding + 88,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* =========================================================================
          BLOCK 1: SỰ KIỆN SẮP DIỄN RA (RSVP TẠI CHỖ — ẨN HOÀN TOÀN KHI RỖNG)
         ========================================================================= */}
      {nearestEvent && (
        <View
          style={[
            styles.hubBlockCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.hairline,
            },
          ]}
        >
          <View style={styles.blockHeaderRow}>
            <View style={styles.blockTitleWithIcon}>
              <View style={[styles.blockIconBubble, { backgroundColor: `${colors.primary}18` }]}>
                <Calendar size={15} color={colors.sage} />
              </View>
              <Text style={[styles.blockTitleText, { color: colors.text }]}>
                {t.home.upcomingSectionTitle || 'Sự kiện sắp diễn ra'}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onOpenTool('calendar')}
              style={styles.blockSeeAllBtn}
            >
              <Text style={[styles.blockSeeAllText, { color: colors.sage }]}>
                {locale === 'vi' ? 'Lịch nhóm' : 'Calendar'}
              </Text>
              <ChevronRight size={13} color={colors.sage} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onOpenTool('calendar')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Clock size={11} color={colors.sage} />
              <Text style={[styles.timePillText, { color: colors.sage }]}>
                {formatEventDate(nearestEvent.startTime)}
              </Text>
            </View>
            <Text style={[styles.eventHeadline, { color: colors.text }]}>
              {nearestEvent.eventTitle || (nearestEvent as any).title}
            </Text>

            {nearestEvent.location ? (
              <View style={styles.eventLocationRow}>
                <MapPin size={12} color={colors.subtle} />
                <Text style={[styles.eventLocationText, { color: colors.subtle }]} numberOfLines={1}>
                  {nearestEvent.location}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>

          {/* Interactive Inline RSVP Buttons (Thao tác ngay trên block) */}
          <View style={[styles.rsvpActionRow, { borderColor: colors.hairline }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleRsvp(EventRsvpStatus.YES)}
              style={[
                styles.rsvpBtn,
                userRsvpStatus === EventRsvpStatus.YES
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: colors.wash, borderColor: colors.hairline },
              ]}
            >
              <Check
                size={13}
                color={userRsvpStatus === EventRsvpStatus.YES ? colors.onPrimary : colors.text}
              />
              <Text
                style={[
                  styles.rsvpBtnText,
                  { color: userRsvpStatus === EventRsvpStatus.YES ? colors.onPrimary : colors.text },
                ]}
              >
                {locale === 'vi' ? 'Sẽ đi' : 'Going'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleRsvp(EventRsvpStatus.MAYBE)}
              style={[
                styles.rsvpBtn,
                userRsvpStatus === EventRsvpStatus.MAYBE
                  ? { backgroundColor: `${colors.warning}35`, borderColor: colors.warning }
                  : { backgroundColor: colors.wash, borderColor: colors.hairline },
              ]}
            >
              <HelpCircle
                size={13}
                color={userRsvpStatus === EventRsvpStatus.MAYBE ? colors.warning : colors.text}
              />
              <Text
                style={[
                  styles.rsvpBtnText,
                  { color: userRsvpStatus === EventRsvpStatus.MAYBE ? colors.warning : colors.text },
                ]}
              >
                {locale === 'vi' ? 'Chưa chắc' : 'Maybe'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleRsvp(EventRsvpStatus.NO)}
              style={[
                styles.rsvpBtn,
                userRsvpStatus === EventRsvpStatus.NO
                  ? { backgroundColor: `${colors.danger}25`, borderColor: colors.danger }
                  : { backgroundColor: colors.wash, borderColor: colors.hairline },
              ]}
            >
              <X
                size={13}
                color={userRsvpStatus === EventRsvpStatus.NO ? colors.danger : colors.text}
              />
              <Text
                style={[
                  styles.rsvpBtnText,
                  { color: userRsvpStatus === EventRsvpStatus.NO ? colors.danger : colors.text },
                ]}
              >
                {locale === 'vi' ? 'Bận' : 'Busy'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* =========================================================================
          BLOCK 2: KHOẢNH KHẮC MỚI (LƯỚI NGANG + NÚT CHỤP MỚI ĐẦU TIÊN)
         ========================================================================= */}
      <View
        style={[
          styles.hubBlockCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.hairline,
          },
        ]}
      >
        <View style={styles.blockHeaderRow}>
          <View style={styles.blockTitleWithIcon}>
            <View style={[styles.blockIconBubble, { backgroundColor: `${colors.primary}18` }]}>
              <Camera size={15} color={colors.sage} />
            </View>
            <Text style={[styles.blockTitleText, { color: colors.text }]}>
              {locale === 'vi' ? 'Khoảnh khắc mới' : 'Recent Moments'}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onOpenMoments}
            style={styles.blockSeeAllBtn}
          >
            <Text style={[styles.blockSeeAllText, { color: colors.sage }]}>
              {t.common.all || 'Xem tất cả'}
            </Text>
            <ChevronRight size={13} color={colors.sage} />
          </TouchableOpacity>
        </View>

        {/* Moments Preview Scroll with "+ Chụp mới" as First Card */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.momentsRail}>
          {/* Card 1: Chụp mới */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onOpenMoments}
            style={[
              styles.momentPreviewThumb,
              {
                backgroundColor: colors.wash,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1.5,
                borderStyle: 'dashed',
                borderColor: colors.sage,
              },
            ]}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: `${colors.sage}20`,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 6,
              }}
            >
              <Plus size={18} color={colors.sage} />
            </View>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.sage }}>
              {locale === 'vi' ? 'Chụp mới' : 'Add New'}
            </Text>
          </TouchableOpacity>

          {/* Subsequent Moment Thumbnails */}
          {moments.slice(0, 6).map((m: any, idx: number) => {
            const photoUrl = m.fileUrl || m.mediaUrl || m.previewUrl;
            return (
              <TouchableOpacity
                key={m.id || idx}
                activeOpacity={0.88}
                onPress={onOpenMoments}
                style={styles.momentPreviewThumb}
              >
                {photoUrl ? (
                  <RNImage source={{ uri: photoUrl }} style={styles.momentThumbImg} />
                ) : (
                  <View style={[styles.momentThumbImg, { backgroundColor: colors.wash }]}>
                    <Camera size={20} color={colors.subtle} />
                  </View>
                )}
                {m.author?.profile?.displayName ? (
                  <View style={styles.momentAuthorBadge}>
                    <Text style={styles.momentAuthorBadgeText} numberOfLines={1}>
                      {m.author.profile.displayName}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* =========================================================================
          BLOCK 3: TRÒ CHUYỆN (PREVIEW TIN NHẮN MỚI + Ô NHẬP LỐI TẮT → VÀO CHAT)
         ========================================================================= */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onOpenChat}
        style={[
          styles.hubBlockCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.hairline,
          },
        ]}
      >
        <View style={styles.blockHeaderRow}>
          <View style={styles.blockTitleWithIcon}>
            <View style={[styles.blockIconBubble, { backgroundColor: `${colors.primary}18` }]}>
              <MessageSquare size={15} color={colors.sage} />
            </View>
            <Text style={[styles.blockTitleText, { color: colors.text }]}>
              {t.chat.title || 'Trò chuyện'}
            </Text>
          </View>

          <View style={styles.blockSeeAllBtn}>
            <Text style={[styles.blockSeeAllText, { color: colors.sage }]}>
              {locale === 'vi' ? 'Vào phòng chat' : 'Open chat'}
            </Text>
            <ChevronRight size={13} color={colors.sage} />
          </View>
        </View>

        {/* Message preview bubbles */}
        {recentMessages.length > 0 ? (
          <View style={styles.chatPreviewStack}>
            {recentMessages.map((msg: any) => {
              const senderName =
                msg.sender?.user?.profile?.displayName ||
                msg.sender?.nickname ||
                msg.sender?.user?.email?.split('@')[0] ||
                'Thành viên';
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.miniChatBubble,
                    { backgroundColor: colors.wash, borderColor: colors.hairline },
                  ]}
                >
                  <Text style={[styles.miniChatAuthor, { color: colors.sage }]} numberOfLines={1}>
                    {senderName}:
                  </Text>
                  <Text style={[styles.miniChatContent, { color: colors.text }]} numberOfLines={1}>
                    {msg.content?.startsWith('[') ? '[Nội dung đặc biệt]' : msg.content || '[Tệp tin]'}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}

        {/* Quick Shortcut Input Bar */}
        <View
          style={[
            styles.chatShortcutInputRow,
            { backgroundColor: colors.wash, borderColor: colors.hairline },
          ]}
        >
          <Text style={[styles.chatShortcutPlaceholder, { color: colors.subtle }]}>
            {locale === 'vi' ? 'Nhắn tin cho nhóm...' : 'Type a message to group...'}
          </Text>
          <View style={[styles.sendIconPill, { backgroundColor: colors.primary }]}>
            <Send size={13} color={colors.onPrimary} />
          </View>
        </View>
      </TouchableOpacity>

      {/* =========================================================================
          BLOCK 4: BỎ PHIẾU ĐANG CHỜ (BẦU TRỰC TIẾP TẠI CHỖ — ẨN KHI RỖNG)
         ========================================================================= */}
      {activePoll && (
        <View
          style={[
            styles.hubBlockCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.hairline,
            },
          ]}
        >
          <View style={styles.blockHeaderRow}>
            <View style={styles.blockTitleWithIcon}>
              <View style={[styles.blockIconBubble, { backgroundColor: `${colors.primary}18` }]}>
                <Vote size={15} color={colors.sage} />
              </View>
              <Text style={[styles.blockTitleText, { color: colors.text }]}>
                {locale === 'vi' ? 'Bình chọn nhóm' : 'Group Poll'}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onOpenTool('poll')}
              style={styles.blockSeeAllBtn}
            >
              <Text style={[styles.blockSeeAllText, { color: colors.sage }]}>
                {t.common.all || 'Chi tiết'}
              </Text>
              <ChevronRight size={13} color={colors.sage} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.pollQuestionTitle, { color: colors.text }]}>
            {activePoll.question}
          </Text>

          {/* Inline Voting Options */}
          <View style={styles.pollOptionsContainer}>
            {activePoll.options?.slice(0, 3).map((opt: any, idx: number) => {
              const voteCount = opt.voteCount || (opt.votes ? opt.votes.length : 0);
              const totalVotes = activePoll.totalVotes || 1;
              const pct = Math.round((voteCount / totalVotes) * 100) || 0;
              const hasVotedThis =
                activePoll.userVotedOptionId === opt.id ||
                (activePoll.userVotedOptionIds && activePoll.userVotedOptionIds.includes(opt.id)) ||
                opt.hasVoted ||
                (opt.votes && opt.votes.some((v: any) => v.member?.userId === currentUserId || v.userId === currentUserId));

              return (
                <TouchableOpacity
                  key={opt.id || idx}
                  activeOpacity={0.8}
                  onPress={() => handleVote(opt.id)}
                  style={[
                    styles.pollOptionBtn,
                    {
                      backgroundColor: hasVotedThis ? `${colors.primary}20` : colors.wash,
                      borderColor: hasVotedThis ? colors.primary : colors.hairline,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.pollProgressFill,
                      {
                        width: `${pct}%`,
                        backgroundColor: `${colors.primary}25`,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.pollOptionLabel,
                      {
                        color: hasVotedThis ? colors.sage : colors.text,
                        fontWeight: hasVotedThis ? '700' : '500',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {opt.optionText || opt.text}
                  </Text>
                  <Text style={[styles.pollOptionPct, { color: colors.subtle }]}>
                    {pct}%
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* =========================================================================
          BLOCK 5: TIỆN ÍCH NHÓM (LƯỚI CÔNG CỤ HOẠT ĐỘNG)
         ========================================================================= */}
      <View
        style={[
          styles.hubBlockCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.hairline,
          },
        ]}
      >
        <View style={styles.blockHeaderRow}>
          <View style={styles.blockTitleWithIcon}>
            <View style={[styles.blockIconBubble, { backgroundColor: `${colors.primary}18` }]}>
              <Sparkles size={15} color={colors.warning} />
            </View>
            <Text style={[styles.blockTitleText, { color: colors.text }]}>
              {t.nav.groupTools || 'Tiện ích nhóm'}
            </Text>
          </View>
        </View>

        <View style={styles.toolsShortcutGrid}>
          {/* Lịch & Sự kiện */}
          <TouchableOpacity
            activeOpacity={0.78}
            onPress={() => onOpenTool('calendar')}
            style={[styles.toolGridItem, { backgroundColor: colors.wash, borderColor: colors.hairline }]}
          >
            <View style={[styles.toolIconFrame, { backgroundColor: `${colors.primary}18` }]}>
              <Calendar size={18} color={colors.sage} />
            </View>
            <Text style={[styles.toolGridLabel, { color: colors.text }]}>
              {locale === 'vi' ? 'Lịch hẹn' : 'Calendar'}
            </Text>
          </TouchableOpacity>

          {/* Bảng Kế hoạch */}
          <TouchableOpacity
            activeOpacity={0.78}
            onPress={() => onOpenTool('planning')}
            style={[styles.toolGridItem, { backgroundColor: colors.wash, borderColor: colors.hairline }]}
          >
            <View style={[styles.toolIconFrame, { backgroundColor: `${colors.primary}18` }]}>
              <FileSpreadsheet size={18} color={colors.sage} />
            </View>
            <Text style={[styles.toolGridLabel, { color: colors.text }]}>
              {locale === 'vi' ? 'Kế hoạch' : 'Planning'}
            </Text>
          </TouchableOpacity>

          {/* Bình chọn */}
          <TouchableOpacity
            activeOpacity={0.78}
            onPress={() => onOpenTool('poll')}
            style={[styles.toolGridItem, { backgroundColor: colors.wash, borderColor: colors.hairline }]}
          >
            <View style={[styles.toolIconFrame, { backgroundColor: `${colors.primary}18` }]}>
              <Vote size={18} color={colors.sage} />
            </View>
            <Text style={[styles.toolGridLabel, { color: colors.text }]}>
              {locale === 'vi' ? 'Bình chọn' : 'Polls'}
            </Text>
          </TouchableOpacity>

          {/* Vị trí */}
          <TouchableOpacity
            activeOpacity={0.78}
            onPress={() => onOpenTool('location')}
            style={[styles.toolGridItem, { backgroundColor: colors.wash, borderColor: colors.hairline }]}
          >
            <View style={[styles.toolIconFrame, { backgroundColor: `${colors.primary}18` }]}>
              <Navigation size={18} color={colors.sage} />
            </View>
            <Text style={[styles.toolGridLabel, { color: colors.text }]}>
              {locale === 'vi' ? 'Vị trí' : 'Location'}
            </Text>
          </TouchableOpacity>

          {/* Album */}
          <TouchableOpacity
            activeOpacity={0.78}
            onPress={() => onOpenTool('album')}
            style={[styles.toolGridItem, { backgroundColor: colors.wash, borderColor: colors.hairline }]}
          >
            <View style={[styles.toolIconFrame, { backgroundColor: `${colors.primary}18` }]}>
              <ImageIcon size={18} color={colors.sage} />
            </View>
            <Text style={[styles.toolGridLabel, { color: colors.text }]}>
              {locale === 'vi' ? 'Album' : 'Albums'}
            </Text>
          </TouchableOpacity>

          {/* Điều muốn nói */}
          <TouchableOpacity
            activeOpacity={0.78}
            onPress={() => onOpenTool('anonymous')}
            style={[styles.toolGridItem, { backgroundColor: colors.wash, borderColor: colors.hairline }]}
          >
            <View style={[styles.toolIconFrame, { backgroundColor: `${colors.coral}18` }]}>
              <HeartHandshake size={18} color={colors.coral} />
            </View>
            <Text style={[styles.toolGridLabel, { color: colors.text }]}>
              {locale === 'vi' ? 'Lời nhắn' : 'Notes'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  hubBlockCard: {
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    gap: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  blockHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blockTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blockIconBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockTitleText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  timePillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  timePillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  blockSeeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  blockSeeAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  eventHeadline: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  eventLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  eventLocationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  rsvpActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rsvpBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
  },
  rsvpBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  momentsRail: {
    gap: 10,
    paddingVertical: 2,
  },
  momentPreviewThumb: {
    width: 88,
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  momentThumbImg: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  momentAuthorBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  momentAuthorBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
  chatPreviewStack: {
    gap: 6,
  },
  miniChatBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  miniChatAuthor: {
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 90,
  },
  miniChatContent: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  chatShortcutInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  chatShortcutPlaceholder: {
    fontSize: 13,
    fontWeight: '500',
  },
  sendIconPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pollQuestionTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  pollOptionsContainer: {
    gap: 8,
  },
  pollOptionBtn: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pollProgressFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
  pollOptionLabel: {
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  pollOptionPct: {
    fontSize: 12,
    fontWeight: '700',
  },
  toolsShortcutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  toolGridItem: {
    width: '31%',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  toolIconFrame: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolGridLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
});
