import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';
import { useAuthStore } from '../../stores/auth.store';
import { getPollsApi, votePollApi } from '../../services/circle-tools.service';
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

  useEffect(() => {
    let isMounted = true;
    let sockInstance: any = null;
    let onVotedHandler: ((updatedPoll: GroupPollEntity) => void) | null = null;
    let onClosedHandler: ((updatedPoll: GroupPollEntity) => void) | null = null;
    let onDeletedHandler: ((payload: { pollId?: string }) => void) | null = null;

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

    getMobileSocket().then((sock) => {
      if (!isMounted || !sock) return;
      sockInstance = sock;

      onVotedHandler = (updatedPoll: GroupPollEntity) => {
        if (updatedPoll?.id === pollId && isMounted) {
          setPoll(updatedPoll);
        }
      };

      onClosedHandler = (updatedPoll: GroupPollEntity) => {
        if (updatedPoll?.id === pollId && isMounted) {
          setPoll(updatedPoll);
        }
      };

      onDeletedHandler = (payload: { pollId?: string }) => {
        if (payload?.pollId === pollId && isMounted) {
          setIsDeleted(true);
        }
      };

      sock.on('circle:poll-voted', onVotedHandler);
      sock.on('circle:poll-closed', onClosedHandler);
      sock.on('circle:poll-deleted', onDeletedHandler);
    });

    return () => {
      isMounted = false;
      if (sockInstance) {
        if (onVotedHandler) sockInstance.off('circle:poll-voted', onVotedHandler);
        if (onClosedHandler) sockInstance.off('circle:poll-closed', onClosedHandler);
        if (onDeletedHandler) sockInstance.off('circle:poll-deleted', onDeletedHandler);
      }
    };
  }, [circleId, pollId]);

  if (isDeleted) {
    return (
      <View style={styles.deletedWrap}>
        <Text style={[styles.deletedText, { color: colors.subtle }]}>
          {t.chat.pollDeletedOrNotFound}
        </Text>
      </View>
    );
  }

  const question = poll?.question || initialQuestion || t.collab.pollTitle;
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

  const isHexColorLight = (hex: string): boolean => {
    const clean = hex.replace('#', '');
    if (clean.length !== 6 && clean.length !== 3) return isDark;
    const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return isDark;
    // Relative luminance threshold for dark-vs-light check icon on solid textColor fill
    return (0.299 * r + 0.587 * g + 0.114 * b) > 150;
  };

  const textColor = isSenderMe ? senderTextColor || colors.text : colors.text;
  const subtleColor = isSenderMe ? (senderTextColor || colors.text) : colors.subtle;
  const senderCheckIconColor = isSenderMe
    ? (isHexColorLight(textColor) ? colors.canvas : '#FFFFFF')
    : colors.onPrimary;

  return (
    <View style={styles.container}>
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
  deletedWrap: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  deletedText: {
    fontSize: 12,
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
});
