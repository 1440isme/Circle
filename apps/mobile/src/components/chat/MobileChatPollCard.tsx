import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Check, Lock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';
import { useAuthStore } from '../../stores/auth.store';
import { getPollApi, votePollApi } from '../../services/circle-tools.service';
import { ApiError } from '../../services/api';
import { getMobileSocket } from '../../services/socket';
import { GroupPollEntity } from '@circle/types';

interface MobileChatPollCardProps {
  circleId: string;
  pollId: string;
  initialQuestion?: string;
  initialOptions?: string[];
  isSenderMe?: boolean;
  senderTextColor?: string;
}

export const MobileChatPollCard: React.FC<MobileChatPollCardProps> = ({
  circleId,
  pollId,
  initialQuestion,
  initialOptions = [],
  isSenderMe = false,
  senderTextColor,
}) => {
  const { colors, resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const { t } = useLanguageStore();
  const user = useAuthStore((s) => s.user);

  const [poll, setPoll] = useState<GroupPollEntity | null>(null);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [isExpandedLogs, setIsExpandedLogs] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let requestId = 0;
    let socket: Awaited<ReturnType<typeof getMobileSocket>> = null;
    setPoll(null);
    setIsDeleted(false);
    setNotice(null);

    const fetchPoll = async () => {
      const currentRequest = ++requestId;
      try {
        const found = await getPollApi(circleId, pollId);
        if (isMounted && currentRequest === requestId) {
          setPoll(found);
          setNotice(null);
        }
      } catch (error) {
        if (!isMounted || currentRequest !== requestId) return;
        if (error instanceof ApiError && error.statusCode === 404) setIsDeleted(true);
        else setNotice(t.collab.loadPollsError);
      }
    };
    const onPollUpdated = (event: { id?: string; pollId?: string }) => {
      if ((event.pollId ?? event.id) === pollId) void fetchPoll();
    };
    const onPollDeleted = (event: { pollId: string }) => {
      if (event.pollId !== pollId) return;
      requestId++;
      setIsDeleted(true);
    };

    void fetchPoll();
    getMobileSocket().then((connectedSocket) => {
      if (!isMounted || !connectedSocket) return;
      socket = connectedSocket;
      socket.on('circle:poll-updated', onPollUpdated);
      socket.on('circle:poll-voted', onPollUpdated);
      socket.on('circle:poll-closed', onPollUpdated);
      socket.on('circle:poll-deleted', onPollDeleted);
    });

    return () => {
      isMounted = false;
      socket?.off('circle:poll-updated', onPollUpdated);
      socket?.off('circle:poll-voted', onPollUpdated);
      socket?.off('circle:poll-closed', onPollUpdated);
      socket?.off('circle:poll-deleted', onPollDeleted);
    };
  }, [circleId, pollId, t.collab.loadPollsError]);

  const question = poll?.question || initialQuestion || t.collab.pollTitle;
  const isClosed = Boolean(poll?.isClosed || (poll?.deadline && new Date(poll.deadline) <= new Date()));

  const options = poll?.options || initialOptions.map((opt, idx) => ({
    id: `opt-${idx}`,
    pollId,
    optionText: opt,
    orderIndex: idx,
    votes: [],
  }));

  const totalVotes = options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
  const myVotes = poll?.userVotedOptionIds ?? (poll?.userVotedOptionId ? [poll.userVotedOptionId] : []);
  const [draftVotes, setDraftVotes] = useState<string[]>([]);
  const ballot = draftVotes.filter((id) => options.some((option) => option.id === id));
  const canVote = Boolean(poll && !isClosed && myVotes.length === 0);
  const toggleOption = (id: string) => setDraftVotes(poll?.isMultipleChoice
    ? ballot.includes(id) ? ballot.filter((selected) => selected !== id) : [...ballot, id]
    : [id]);

  // Compute vote interaction logs
  const voteLogs = useMemo(() => {
    if (!poll?.options || poll.isAnonymous) return [];
    const logs: Array<{ id: string; text: string }> = [];
    poll.options.forEach((opt: any) => {
      (opt.votes || []).forEach((v: any) => {
        const isMe = v.member?.userId === user?.id || (v as any).memberId === user?.id;
        const actorName = isMe
          ? (t.collab.meLabel || 'Bạn')
          : (v.member?.user?.profile?.displayName || t.collab.memberDefault || 'Thành viên');
        const text = isMe
          ? (t.collab.pollVotedLogMe || 'Bạn đã bình chọn cho "{option}"').replace('{option}', opt.optionText)
          : (t.collab.pollVotedLog || '{actor} đã bình chọn cho "{option}"')
              .replace('{actor}', actorName)
              .replace('{option}', opt.optionText);
        logs.push({
          id: v.id || `${opt.id}-${v.memberId || Math.random()}`,
          text,
        });
      });
    });
    return logs;
  }, [poll?.options, poll?.isAnonymous, user?.id, t]);

  if (isDeleted) {
    return (
      <View
        style={[
          styles.deletedCard,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
            borderColor: colors.hairline,
          },
        ]}
      >
        <AlertCircle size={15} color={colors.subtle} style={{ marginTop: 1 }} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.deletedTitle, { color: colors.text }]} numberOfLines={1}>
            {question}
          </Text>
          <Text style={[styles.deletedText, { color: colors.subtle }]}>
            {t.chat.pollDeletedOrNotFound}
          </Text>
        </View>
      </View>
    );
  }

  const handleVote = async () => {
    if (!canVote || isVoting || !ballot.length) return;

    try {
      setNotice(null);
      setIsVoting(true);
      Haptics.selectionAsync();
      const updated = await votePollApi(circleId, pollId, { optionIds: ballot });
      setPoll(updated);
    } catch {
      setNotice(t.collab.votePollError);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsVoting(false);
    }
  };

  const isHexColorLight = (hex: string): boolean => {
    const clean = hex.replace('#', '');
    if (clean.length !== 6 && clean.length !== 3) return isDark;
    const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return isDark;
    return (0.299 * r + 0.587 * g + 0.114 * b) > 150;
  };

  const textColor = isSenderMe ? senderTextColor || colors.text : colors.text;
  const subtleColor = isSenderMe ? (senderTextColor || colors.text) : colors.subtle;
  const senderCheckIconColor = isSenderMe
    ? (isHexColorLight(textColor) ? colors.canvas : '#FFFFFF')
    : colors.onPrimary;

  return (
    <View style={styles.container}>
      {/* Badges */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
        {isClosed && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 3.5,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 6,
              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
            }}
          >
            <Lock size={10} color={colors.subtle} />
            <Text style={{ fontSize: 10, fontWeight: '700', color: colors.subtle }}>
              {t.collab.pollClosedBadge || 'Đã kết thúc'}
            </Text>
          </View>
        )}
        {(poll as any)?.isMultipleChoice && (
          <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: '#6366f120' }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#6366f1' }}>
              {t.collab.pollIsMultipleChoice || 'Nhiều lựa chọn'}
            </Text>
          </View>
        )}
        {(poll as any)?.isAnonymous && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: '#10b98120' }}>
            <Lock size={10} color="#10b981" />
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#10b981' }}>
              {t.collab.pollIsAnonymous || 'Ẩn danh'}
            </Text>
          </View>
        )}
      </View>

      {/* Question */}
      <Text style={[styles.questionText, { color: textColor }]}>
        {question}
      </Text>

      {notice && (
        <Text style={{ fontSize: 11, color: '#DC2626', fontWeight: '600', marginTop: -2 }}>
          {notice}
        </Text>
      )}

      {canVote && <Text style={{ color: textColor, fontSize: 11 }}>{t.collab.pollBallotFinal}</Text>}
      {/* Options List */}
      <View style={styles.optionsList}>
        {options.map((option: any) => {
          const voteCount = option.votes?.length || 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isSelected = (myVotes.length ? myVotes : ballot).includes(option.id);

          return (
            <TouchableOpacity
              key={option.id}
              activeOpacity={0.8}
              disabled={!canVote || isVoting}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled: !canVote || isVoting }}
              onPress={() => toggleOption(option.id)}
              style={[
                styles.optionBtn,
                {
                  opacity: isClosed ? 0.78 : 1,
                  borderColor: isSelected
                    ? isSenderMe
                      ? `${textColor}55`
                      : colors.sage
                    : isSenderMe
                    ? `${textColor}22`
                    : colors.hairline,
                  backgroundColor: isSelected
                    ? isSenderMe
                      ? `${textColor}16`
                      : `${colors.sage}14`
                    : isSenderMe
                    ? isDark
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(0,0,0,0.04)'
                    : colors.surface,
                },
              ]}
            >
              {/* Progress Bar Fill */}
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${percentage}%`,
                    backgroundColor: isSelected
                      ? isSenderMe
                        ? `${textColor}1C`
                        : `${colors.sage}22`
                      : isSenderMe
                      ? isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.06)'
                      : colors.wash,
                  },
                ]}
              />

              <View style={styles.optionContentRow}>
                <View style={styles.optionLeft}>
                  <View
                    style={[
                      styles.checkCircle,
                      {
                        borderColor: isSelected
                          ? isSenderMe
                            ? textColor
                            : colors.sage
                          : isSenderMe
                          ? `${textColor}55`
                          : colors.hairline,
                        backgroundColor: isSelected
                          ? isSenderMe
                            ? textColor
                            : colors.primary
                          : 'transparent',
                      },
                    ]}
                  >
                    {isSelected && (
                      <Check
                        size={10}
                        color={isSenderMe ? senderCheckIconColor : colors.onPrimary}
                        strokeWidth={3}
                      />
                    )}
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.optionLabel,
                      {
                        color: textColor,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {option.optionText}
                  </Text>
                </View>

                <View style={styles.optionRight}>
                  <Text style={[styles.percentageText, { color: textColor }]}>
                    {percentage}%
                  </Text>
                  <Text style={[styles.voteCountText, { color: subtleColor, opacity: 0.8 }]}>
                    ({voteCount})
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {canVote && (
        <TouchableOpacity accessibilityRole="button" disabled={!ballot.length || isVoting}
          onPress={handleVote}
          style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.primary, opacity: ballot.length && !isVoting ? 1 : 0.5 }}>
          <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>{t.collab.pollSubmitVote}</Text>
        </TouchableOpacity>
      )}

      {/* Inline Activity Logs for Votes */}
      {voteLogs.length > 0 && (
        <View style={styles.activityLogsContainer}>
          {voteLogs.length === 1 ? (
            <View style={styles.singleLogItem}>
              <View style={[styles.logDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.logText, { color: colors.subtle }]}>
                {voteLogs[0].text}
              </Text>
            </View>
          ) : (
            <View style={{ width: '100%', alignItems: 'center', gap: 4 }}>
              {(isExpandedLogs ? voteLogs : [voteLogs[voteLogs.length - 1]]).map((log) => (
                <View key={log.id} style={styles.singleLogItem}>
                  <View style={[styles.logDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.logText, { color: colors.subtle }]}>
                    {log.text}
                  </Text>
                </View>
              ))}

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.selectionAsync();
                  setIsExpandedLogs(!isExpandedLogs);
                }}
                style={[
                  styles.viewMoreBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    borderColor: colors.hairline,
                  },
                ]}
              >
                <Text style={[styles.viewMoreText, { color: colors.primary }]}>
                  {isExpandedLogs
                    ? (t.common.collapse || 'Thu gọn')
                    : (t.common.viewMoreCount?.replace('{count}', String(voteLogs.length)) || `Xem thêm (${voteLogs.length})`)}
                </Text>
                {isExpandedLogs ? (
                  <ChevronUp size={11} color={colors.primary} />
                ) : (
                  <ChevronDown size={11} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minWidth: 230,
    maxWidth: 290,
    paddingVertical: 2,
    gap: 8,
  },
  deletedCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 230,
  },
  deletedTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  deletedWrap: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  deletedText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  questionText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  optionsList: {
    gap: 6,
  },
  optionBtn: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
  optionContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  checkCircle: {
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: 12,
    flex: 1,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  percentageText: {
    fontSize: 11,
    fontWeight: '700',
  },
  voteCountText: {
    fontSize: 10,
  },
  activityLogsContainer: {
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150,150,150,0.2)',
    alignItems: 'center',
    width: '100%',
  },
  singleLogItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 1,
    maxWidth: '100%',
  },
  logDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.8,
  },
  logText: {
    fontSize: 10.5,
    fontWeight: '500',
    textAlign: 'center',
  },
  viewMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 3,
  },
  viewMoreText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
