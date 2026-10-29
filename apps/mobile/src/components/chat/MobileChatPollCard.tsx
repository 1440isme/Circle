import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Vote, Check, CheckCircle2 } from 'lucide-react-native';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';
import { useAuthStore } from '../../stores/auth.store';
import { getPollsApi, votePollApi } from '../../services/circle-tools.service';
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
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchPoll = async () => {
      try {
        const polls = await getPollsApi(circleId);
        const found = polls.find((p) => p.id === pollId);
        if (found && isMounted) {
          setPoll(found);
        }
      } catch {}
    };
    fetchPoll();
    return () => {
      isMounted = false;
    };
  }, [circleId, pollId]);

  const question = poll?.question || initialQuestion || t.collab?.pollTitle || 'Thăm dò ý kiến';
  const isClosed = poll?.isClosed || false;
  const options = poll?.options || initialOptions.map((opt, idx) => ({
    id: `opt-${idx}`,
    pollId,
    optionText: opt,
    orderIndex: idx,
    votes: [],
  }));

  const totalVotes = options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
  const myVote = options.find((opt) =>
    opt.votes?.some((v: any) => v.member?.userId === user?.id || (v as any).memberId === user?.id),
  );

  const handleVote = async (optionId: string) => {
    if (isClosed || isVoting) return;
    try {
      setIsVoting(true);
      Haptics.selectionAsync();
      const updated = await votePollApi(circleId, pollId, { optionId });
      setPoll(updated);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsVoting(false);
    }
  };

  const textColor = isSenderMe ? senderTextColor || '#FFFFFF' : colors.text;
  const subtleColor = isSenderMe ? (senderTextColor || '#FFFFFF') : colors.subtle;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.headerRow, { borderBottomColor: isSenderMe ? 'rgba(255,255,255,0.15)' : colors.hairline }]}>
        <View style={styles.headerTitleWrap}>
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: isSenderMe ? 'rgba(0,0,0,0.15)' : colors.wash,
              },
            ]}
          >
            <Vote size={14} color={isSenderMe ? textColor : colors.primary} />
          </View>
          <Text
            style={[
              styles.headerLabel,
              {
                color: textColor,
                opacity: isSenderMe ? 0.9 : 0.8,
              },
            ]}
          >
            {t.collab?.pollCardHeader || 'Bình chọn nhóm'}
          </Text>
        </View>

        <View
          style={[
            styles.badgeBox,
            {
              backgroundColor: isClosed
                ? 'rgba(239, 68, 68, 0.15)'
                : 'rgba(16, 185, 129, 0.15)',
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: isClosed ? '#EF4444' : '#10B981' },
            ]}
          >
            {isClosed
              ? (t.collab?.pollClosedBadge || 'Đã kết thúc')
              : (t.collab?.pollOpenBadge || 'Đang diễn ra')}
          </Text>
        </View>
      </View>

      {/* Question */}
      <Text style={[styles.questionText, { color: textColor }]}>
        {question}
      </Text>

      {/* Options List */}
      <View style={styles.optionsList}>
        {options.map((option: any) => {
          const voteCount = option.votes?.length || 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isSelected = myVote?.id === option.id;

          return (
            <TouchableOpacity
              key={option.id}
              activeOpacity={0.8}
              disabled={isClosed || isVoting}
              onPress={() => handleVote(option.id)}
              style={[
                styles.optionBtn,
                {
                  borderColor: isSelected
                    ? isSenderMe
                      ? 'rgba(255,255,255,0.45)'
                      : colors.primary
                    : isSenderMe
                    ? 'rgba(255,255,255,0.15)'
                    : colors.hairline,
                  backgroundColor: isSelected
                    ? isSenderMe
                      ? 'rgba(255,255,255,0.18)'
                      : colors.wash
                    : isSenderMe
                    ? 'rgba(0,0,0,0.1)'
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
                        ? 'rgba(255,255,255,0.18)'
                        : 'rgba(59, 130, 246, 0.18)'
                      : isSenderMe
                      ? 'rgba(0,0,0,0.08)'
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
                            : colors.primary
                          : isSenderMe
                          ? 'rgba(255,255,255,0.4)'
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
                        color={isSenderMe ? '#000000' : '#FFFFFF'}
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

      {/* Footer Info */}
      <View style={styles.footerRow}>
        <Text style={[styles.footerText, { color: subtleColor, opacity: 0.8 }]}>
          {totalVotes > 0
            ? (t.collab?.pollTotalVotes || '{count} lượt bình chọn').replace('{count}', String(totalVotes))
            : (t.collab?.pollEmptyVotes || 'Chưa có lượt bình chọn')}
        </Text>
        {myVote && (
          <View style={styles.votedBadgeRow}>
            <CheckCircle2 size={12} color="#10B981" />
            <Text style={styles.votedBadgeText}>
              {t.collab?.pollVotedBadge || 'Đã bình chọn'}
            </Text>
          </View>
        )}
      </View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgeBox: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
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
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  footerText: {
    fontSize: 10,
    fontWeight: '500',
  },
  votedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  votedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
});
