import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image as RNImage,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  Share,
  KeyboardAvoidingView,
  Alert,
  Modal,
  PanResponder,
  Animated,
  Vibration,
  Keyboard,
} from 'react-native';
import { BlurView } from 'expo-blur';

const triggerHapticFeedback = () => {
  try {
    Vibration.vibrate(1);
    if (Platform.OS === 'ios') {
      setTimeout(() => {
        try {
          Vibration.cancel();
        } catch {}
      }, 20);
    }
  } catch {}
};
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  Crown,
  ShieldCheck,
  Globe,
  Lock,
  Share2,
  Send,
  Radio,
  Image as ImageIcon,
  Calendar,
  Sparkles,
  Heart,
  Flame,
  ThumbsUp,
  Smile,
  Edit2,
  KeyRound,
  FileSpreadsheet,
  Plus,
  X,
  Pin,
  Reply,
  Check,
  Clock,
  AlertCircle,
  WifiOff,
  ArrowUpCircle,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useThemeStore } from '../../src/stores/theme.store';
import { useLanguageStore } from '../../src/stores/language.store';
import { useAuthStore } from '../../src/stores/auth.store';
import { useCircleStore } from '../../src/stores/circle.store';
import {
  useCircleDetailQuery,
  useCircleMembersQuery,
  useChannelMessagesQuery,
  useSendMessageMutation,
  useReactMessageMutation,
  usePinMessageMutation,
  useMobileChannelTyping,
} from '../../src/hooks/use-circle-queries';
import { uploadMobileMedia } from '../../src/services/storage-upload.service';
import { subscribeSocketConnection, sendMobileMessageRead } from '../../src/services/socket';
import { getStorageItem } from '../../src/services/storage';
import { useQueryClient, InfiniteData } from '@tanstack/react-query';
import { MessageType, CursorPaginatedMessages } from '@circle/types';
import { CircleManagementModal } from '../../src/components/circle/CircleManagementModal';
import { MomentsView } from '../../src/components/moment/MomentsView';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type WorkspaceTab = 'chat' | 'moments' | 'tools';

interface MobileMessageCluster {
  senderUserId: string;
  senderName: string;
  senderAvatarUrl?: string | null;
  senderRole?: string;
  isSenderMe: boolean;
  messages: any[];
}

function buildMobileClusters(
  items: any[],
  currentUserId?: string,
  currentUserEmail?: string,
): MobileMessageCluster[] {
  const clusters: MobileMessageCluster[] = [];
  let currentCluster: MobileMessageCluster | null = null;

  items.forEach((msg) => {
    const senderUserId =
      msg.sender?.user?.id || msg.sender?.userId || msg.memberId || msg.senderId || '';
    const isSenderMe = Boolean(
      (currentUserId &&
        (senderUserId === currentUserId ||
          msg.memberId === currentUserId ||
          msg.sender?.userId === currentUserId ||
          msg.senderId === currentUserId)) ||
        (currentUserEmail &&
          (msg.sender?.user?.email === currentUserEmail ||
            msg.sender?.email === currentUserEmail)) ||
        msg.memberId === 'optimistic_me' ||
        msg.status === 'SENDING' ||
        msg.tempId,
    );
    const senderName =
      msg.sender?.nickname ||
      msg.sender?.user?.profile?.displayName ||
      msg.sender?.profile?.displayName ||
      msg.sender?.user?.email?.split('@')[0] ||
      msg.sender?.email?.split('@')[0] ||
      'User';
    const senderAvatarUrl = msg.sender?.user?.profile?.avatarUrl;
    const senderRole = msg.sender?.role;

    const msgTime = new Date(msg.sentAt || msg.createdAt || Date.now()).getTime();
    const lastMsg = currentCluster?.messages[currentCluster.messages.length - 1];
    const lastMsgTime = lastMsg
      ? new Date(lastMsg.sentAt || lastMsg.createdAt || Date.now()).getTime()
      : 0;
    const isWithin3Min = msgTime - lastMsgTime < 3 * 60 * 1000;

    if (
      currentCluster &&
      currentCluster.senderUserId === senderUserId &&
      currentCluster.isSenderMe === isSenderMe &&
      isWithin3Min
    ) {
      currentCluster.messages.push(msg);
    } else {
      if (currentCluster) {
        clusters.push(currentCluster);
      }
      currentCluster = {
        senderUserId,
        senderName,
        senderAvatarUrl,
        senderRole,
        isSenderMe,
        messages: [msg],
      };
    }
  });

  if (currentCluster) {
    clusters.push(currentCluster);
  }

  return clusters;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '🎉'];

interface MobileSwipeMessageBubbleProps {
  msg: any;
  allMessages?: any[];
  isSenderMe: boolean;
  isFirst: boolean;
  isLast: boolean;
  isSingle: boolean;
  isLatestSentByMe?: boolean;
  isLatestMessage?: boolean;
  showTimestamp: boolean;
  hasReactions: boolean;
  colors: any;
  t: any;
  onToggleTimestamp: () => void;
  onLongPress: () => void;
  onSwipeReply: () => void;
  onRetry?: (msg: any) => void;
  onPreviewImage?: (url: string) => void;
}

function MobileSwipeMessageBubble({
  msg,
  allMessages,
  isSenderMe,
  isFirst,
  isLast,
  isSingle,
  isLatestSentByMe = false,
  isLatestMessage = false,
  showTimestamp,
  hasReactions,
  colors,
  t,
  onToggleTimestamp,
  onLongPress,
  onSwipeReply,
  onRetry,
  onPreviewImage,
}: MobileSwipeMessageBubbleProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const hasVibratedOnSwipe = useRef(false);

  const rawReplyId = typeof msg.replyTo === 'string' ? msg.replyTo : (msg.replyTo?.id || msg.replyToId);
  const replyTarget =
    (typeof msg.replyTo === 'object' &&
    msg.replyTo !== null &&
    (msg.replyTo.content || msg.replyTo.text || msg.replyTo.fileName || msg.replyTo.fileUrl)
      ? msg.replyTo
      : null) ||
    (allMessages && rawReplyId ? allMessages.find((m: any) => m.id === rawReplyId) : null);

  const hasValidReply = Boolean(
    replyTarget &&
      (replyTarget.content ||
        replyTarget.text ||
        replyTarget.message ||
        replyTarget.fileName ||
        replyTarget.fileUrl),
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dx > 25 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2;
      },
      onPanResponderTerminationRequest: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0) {
          const cappedDx = Math.min(gestureState.dx, 65);
          translateX.setValue(cappedDx);
          if (gestureState.dx > 35 && !hasVibratedOnSwipe.current) {
            hasVibratedOnSwipe.current = true;
            triggerHapticFeedback();
          } else if (gestureState.dx <= 35) {
            hasVibratedOnSwipe.current = false;
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        hasVibratedOnSwipe.current = false;
        if (gestureState.dx > 35) {
          onSwipeReply();
        }
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 6,
        }).start();
      },
      onPanResponderTerminate: () => {
        hasVibratedOnSwipe.current = false;
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  const swipeIconOpacity = translateX.interpolate({
    inputRange: [0, 15, 35],
    outputRange: [0, 0.4, 1],
    extrapolate: 'clamp',
  });
  const swipeIconScale = translateX.interpolate({
    inputRange: [0, 20, 35],
    outputRange: [0.6, 0.9, 1.1],
    extrapolate: 'clamp',
  });

  return (
    <View style={{ width: '100%', alignItems: isSenderMe ? 'flex-end' : 'flex-start' }}>
      {/* Timestamp ON TOP (ONLY on tap) */}
      {showTimestamp && (
        <Text
          style={[
            styles.timestampTopText,
            {
              color: colors.subtle,
              alignSelf: isSenderMe ? 'flex-end' : 'flex-start',
              marginBottom: 3,
              marginHorizontal: 6,
            },
          ]}
        >
          {new Date(msg.sentAt || msg.createdAt || Date.now()).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      )}

      <View
        style={[styles.swipeContainer, { alignItems: isSenderMe ? 'flex-end' : 'flex-start' }]}
        {...panResponder.panHandlers}
      >
        {/* Animated Swipe Reply Indicator Icon */}
        <Animated.View
          style={[
            styles.swipeReplyIconBox,
            {
              opacity: swipeIconOpacity,
              transform: [{ scale: swipeIconScale }],
            },
          ]}
          pointerEvents="none"
        >
          <View style={{ transform: [{ scaleX: -1 }] }}>
            <Reply size={15} color={colors.primary} />
          </View>
        </Animated.View>

        <Animated.View
          style={{
            transform: [{ translateX }],
            maxWidth: '100%',
            alignSelf: isSenderMe ? 'flex-end' : 'flex-start',
          }}
        >
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={onToggleTimestamp}
            onLongPress={() => {
              triggerHapticFeedback();
              onLongPress();
            }}
            delayLongPress={280}
            style={[
              styles.messageBubble,
              isSenderMe
                ? isSingle
                  ? styles.singleBubbleMe
                  : isFirst
                  ? styles.firstBubbleMe
                  : isLast
                  ? styles.lastBubbleMe
                  : styles.middleBubbleMe
                : isSingle
                ? styles.singleBubbleOther
                : isFirst
                ? styles.firstBubbleOther
                : isLast
                ? styles.lastBubbleOther
                : styles.middleBubbleOther,
              isSenderMe
                ? { backgroundColor: colors.primary, alignSelf: 'flex-end' }
                : { backgroundColor: colors.surface, borderColor: colors.hairline, alignSelf: 'flex-start' },
            ]}
          >
            {/* Reply Quote Banner - Beautiful horizontal inline pill matching Web */}
            {hasValidReply && replyTarget && (
              <View
                style={[
                  styles.replyQuoteBox,
                  {
                    backgroundColor: isSenderMe
                      ? 'rgba(0, 0, 0, 0.15)'
                      : colors.wash,
                  },
                ]}
              >
                <View style={{ transform: [{ scaleX: -1 }], marginRight: 4 }}>
                  <Reply
                    size={11}
                    color={isSenderMe ? colors.onPrimary : colors.primary}
                    style={{ opacity: 0.85 }}
                  />
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.replyQuoteAuthor,
                    { color: isSenderMe ? colors.onPrimary : colors.primary },
                  ]}
                >
                  {(
                    replyTarget.sender?.nickname ||
                    replyTarget.sender?.user?.profile?.displayName ||
                    replyTarget.sender?.profile?.displayName ||
                    replyTarget.sender?.displayName ||
                    replyTarget.sender?.name ||
                    replyTarget.sender?.user?.email?.split('@')[0] ||
                    replyTarget.sender?.email?.split('@')[0] ||
                    'User'
                  ) + ':'}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.replyQuoteText,
                    { color: isSenderMe ? colors.onPrimary : colors.subtle },
                  ]}
                >
                  {replyTarget.content ||
                    replyTarget.text ||
                    replyTarget.message ||
                    (replyTarget.fileName ? `📎 ${replyTarget.fileName}` : '') ||
                    (replyTarget.fileUrl ? '📷 [Hình ảnh/Tệp tin]' : '') ||
                    'Tin nhắn'}
                </Text>
              </View>
            )}

            {/* Image Attachment */}
            {Boolean(msg.fileUrl) && (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => onPreviewImage?.(msg.fileUrl)}
                style={styles.bubbleImageWrapper}
              >
                <RNImage
                  source={{ uri: msg.fileUrl }}
                  style={styles.bubbleImageContent}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}

            {/* Message Text Content */}
            {Boolean(msg.content && msg.content.trim()) && (
              <Text
                style={[
                  styles.messageText,
                  { color: isSenderMe ? colors.onPrimary : colors.text },
                ]}
              >
                {msg.content}
              </Text>
            )}

            {/* Overlapping Reaction Badge */}
            {hasReactions && (
              <View
                style={[
                  styles.reactionsBadgePill,
                  { backgroundColor: colors.surface, borderColor: colors.hairline },
                ]}
              >
                {Object.keys(msg.reactionCounts).map((emoji) => (
                  <Text key={emoji} style={styles.reactionEmojiText}>
                    {emoji}
                  </Text>
                ))}
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Sibling Below Bubble: Seen info & status */}
      {isLatestMessage ? (
        isSenderMe ? (
          /* Latest Message sent by ME: ALWAYS show who has seen with mini avatar stack on the RIGHT */
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-end',
              alignSelf: 'flex-end',
              marginTop: 3,
              marginRight: 4,
              gap: 4,
            }}
          >
            {/* Status if sender is me and sending/failed */}
            {(msg.status === 'SENDING' || msg.status === 'FAILED') && (
              <View style={styles.statusBox}>
                {msg.status === 'SENDING' ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.primary}
                    style={{ transform: [{ scale: 0.6 }], marginRight: 1 }}
                  />
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => onRetry?.(msg)}
                    style={styles.retryBtnRow}
                  >
                    <AlertCircle size={12} color={colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Mini avatar stack of readers on the right */}
            {msg.readers && msg.readers.length > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {msg.readers.slice(0, 5).map((reader: any, rIdx: number) => (
                  <View
                    key={reader.userId || rIdx}
                    style={[
                      styles.miniReaderAvatar,
                      {
                        borderColor: colors.surface,
                        backgroundColor: colors.wash,
                        marginLeft: rIdx > 0 ? -5 : 0,
                      },
                    ]}
                  >
                    {reader.avatarUrl ? (
                      <RNImage source={{ uri: reader.avatarUrl }} style={styles.miniReaderAvatarImg} />
                    ) : (
                      <Text style={[styles.miniReaderAvatarText, { color: colors.text }]}>
                        {((reader.displayName || reader.nickname || 'U')).charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              msg.status !== 'SENDING' && msg.status !== 'FAILED' && (
                <Check size={12} color={colors.primary} />
              )
            )}
          </View>
        ) : null
      ) : (
        /* Older messages: Seen by info as TEXT below ONLY when tapped, NO eye icon */
        showTimestamp && msg.readers && msg.readers.length > 0 ? (
          <Text
            numberOfLines={1}
            style={[
              styles.seenByTextBelow,
              {
                color: colors.subtle,
                alignSelf: isSenderMe ? 'flex-end' : 'flex-start',
                marginTop: 2,
                marginHorizontal: 6,
              },
            ]}
          >
            {(() => {
              const names = msg.readers
                .map((r: any) => r.displayName || r.nickname || r.name || 'Member')
                .join(', ');
              if (msg.readers.length <= 2) {
                const tmpl = t.chat?.seenBy || 'Đã xem bởi {names}';
                return tmpl.includes('{names}') ? tmpl.replace('{names}', names) : `${tmpl} ${names}`;
              }
              const countTmpl = t.chat?.seenByCount || 'Đã xem bởi {count} người';
              return countTmpl.includes('{count}')
                ? countTmpl.replace('{count}', String(msg.readers.length))
                : `${countTmpl}: ${msg.readers.length} người`;
            })()}
          </Text>
        ) : isSenderMe && (msg.status === 'SENDING' || msg.status === 'FAILED') ? (
          <View
            style={[
              styles.statusBox,
              { alignSelf: 'flex-end', marginTop: 2, marginHorizontal: 4 },
            ]}
          >
            {msg.status === 'SENDING' ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ transform: [{ scale: 0.6 }], marginRight: 1 }}
              />
            ) : (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onRetry?.(msg)}
                style={styles.retryBtnRow}
              >
                <AlertCircle size={12} color={colors.danger} />
              </TouchableOpacity>
            )}
          </View>
        ) : null
      )}
    </View>
  );
}

export default function CircleWorkspaceScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const circleId = id || '';

  const { colors, resolvedTheme } = useThemeStore();
  const { t, locale } = useLanguageStore();
  const user = useAuthStore((s) => s.user);
  const isDark = resolvedTheme === 'dark';

  const setActiveCircle = useCircleStore((s) => s.setActiveCircle);
  const setManageModalVisible = useCircleStore((s) => s.setManageModalVisible);

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('chat');
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [previewingImageUrl, setPreviewingImageUrl] = useState<string | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(true);
  const [replyingMessage, setReplyingMessage] = useState<any | null>(null);
  const [activeActionMessage, setActiveActionMessage] = useState<any | null>(null);
  const [activeTimestampMessageId, setActiveTimestampMessageId] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    return subscribeSocketConnection((connected) => {
      setIsSocketConnected(connected);
    });
  }, []);

  // Queries & Mutations
  const { data: circle, isLoading: isLoadingCircle } = useCircleDetailQuery(circleId);
  const { data: members = [] } = useCircleMembersQuery(circleId);

  // Active channel resolution
  const channels = circle?.channels || [];
  const currentChannel =
    channels.find((c) => c.id === selectedChannelId) ||
    channels.find((c) => c.name === 'general') ||
    channels[0] ||
    null;

  const currentChannelId = currentChannel?.id || null;

  const {
    messages = [],
    isLoading: isLoadingMessages,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useChannelMessagesQuery(currentChannelId);
  const sendMessageMutation = useSendMessageMutation(currentChannelId);
  const reactMessageMutation = useReactMessageMutation(currentChannelId);
  const pinMessageMutation = usePinMessageMutation(currentChannelId);
  const { typingUsers, reportTyping } = useMobileChannelTyping(currentChannelId);

  // Mark message as read when channel is viewed or new messages arrive
  useEffect(() => {
    if (!currentChannelId || !circleId || messages.length === 0 || !user?.id) return;

    (async () => {
      try {
        const stored = await getStorageItem(`circle_${circleId}_read_receipts`);
        if (stored === 'false') return;
      } catch {}

      const unreadMessages = messages.filter((m: any) => {
        const senderUserId = m.sender?.user?.id || m.sender?.userId;
        if (senderUserId === user.id || m.memberId === 'optimistic_me') return false;
        const alreadyRead = (m.readers || []).some((r: any) => r.userId === user.id);
        return !alreadyRead;
      });

      if (unreadMessages.length > 0) {
        const latestUnread = unreadMessages[unreadMessages.length - 1];
        sendMobileMessageRead(currentChannelId, latestUnread.id);

        const currentReader = {
          userId: user.id,
          displayName: (user as any).displayName || (user as any).profile?.displayName || user.email?.split('@')[0] || 'Me',
          avatarUrl: (user as any).avatarUrl || (user as any).profile?.avatarUrl || null,
          readAt: new Date().toISOString(),
        };

        queryClient.setQueryData<InfiniteData<CursorPaginatedMessages>>(
          ['messages', 'channel', currentChannelId],
          (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                messages: page.messages.map((m: any) => {
                  if (m.id !== latestUnread.id) return m;
                  const existing = m.readers || [];
                  if (existing.some((r: any) => r.userId === user.id)) return m;
                  return {
                    ...m,
                    readers: [...existing, currentReader],
                  };
                }),
              })),
            };
          },
        );
      }
    })();
  }, [currentChannelId, circleId, messages, user?.id, queryClient]);

  const handleToggleTimestamp = (msgId: string) => {
    setActiveTimestampMessageId((prev) => (prev === msgId ? null : msgId));
    if (currentChannelId && circleId && user?.id) {
      (async () => {
        try {
          const stored = await getStorageItem(`circle_${circleId}_read_receipts`);
          if (stored === 'false') return;
        } catch {}
        sendMobileMessageRead(currentChannelId, msgId);
      })();
    }
  };

  // Format date separator label matching Web exactly
  const getDateLabel = (dateStr: string) => {
    const msgDate = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (msgDate.toDateString() === today.toDateString()) {
      return t.chat.today;
    }
    if (msgDate.toDateString() === yesterday.toDateString()) {
      return t.chat.yesterday;
    }

    return msgDate.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  interface MobileDateSection {
    date: string;
    clusters: MobileMessageCluster[];
  }

  // Group messages by date first, then cluster consecutive messages within each date
  const dateMap = new Map<string, any[]>();
  messages.forEach((msg) => {
    const dateLabel = getDateLabel(msg.sentAt || new Date().toISOString());
    if (!dateMap.has(dateLabel)) {
      dateMap.set(dateLabel, []);
    }
    dateMap.get(dateLabel)!.push(msg);
  });

  const dateSections: MobileDateSection[] = [];
  dateMap.forEach((msgsInDate, dateLabel) => {
    dateSections.push({
      date: dateLabel,
      clusters: buildMobileClusters(msgsInDate, user?.id, user?.email),
    });
  });

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 60);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : null;
  const lastMessageByMeId = useMemo(() => {
    return [...messages]
      .reverse()
      .find((m) => {
        const senderUserId =
          m.sender?.user?.id || m.sender?.userId || m.memberId || '';
        return Boolean(
          (user?.id &&
            (senderUserId === user.id ||
              m.memberId === user.id ||
              m.sender?.userId === user.id)) ||
            (user?.email && m.sender?.user?.email === user.email) ||
            m.memberId === 'optimistic_me' ||
            m.status === 'SENDING' ||
            m.tempId,
        );
      })?.id;
  }, [messages, user?.id, user?.email]);
  const prevLastMessageIdRef = useRef<string | null>(null);
  const isFirstLoadRef = useRef(true);
  const isNearBottomRef = useRef(true);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 160;
    isNearBottomRef.current =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
  };

  useEffect(() => {
    isFirstLoadRef.current = true;
    prevLastMessageIdRef.current = null;
  }, [currentChannelId]);

  useEffect(() => {
    if (messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];
    const isSenderMe = Boolean(
      (user?.id &&
        (lastMsg?.sender?.user?.id === user.id ||
          lastMsg?.sender?.userId === user.id ||
          lastMsg?.memberId === user.id)) ||
        lastMsg?.memberId === 'optimistic_me' ||
        lastMsg?.status === 'SENDING' ||
        lastMsg?.tempId,
    );

    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      prevLastMessageIdRef.current = lastMessageId;
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 60);
    } else if (lastMessageId && lastMessageId !== prevLastMessageIdRef.current) {
      prevLastMessageIdRef.current = lastMessageId;
      if (isSenderMe || isNearBottomRef.current) {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 50);
      }
    }
  }, [messages.length, lastMessageId, currentChannelId, user?.id]);

  const handleShareInviteCode = async () => {
    if (!circle?.inviteCode) return;
    try {
      await Share.share({
        message: `${t.circle.inviteLinkCardDesc}: ${circle.inviteCode}`,
      });
    } catch {
      // User cancelled
    }
  };

  const handleOpenSettings = () => {
    if (circle) {
      setActiveCircle(circle);
      setManageModalVisible(true, 'menu');
    }
  };

  const handleCallComingSoon = (type: 'audio' | 'video') => {
    triggerHapticFeedback();
    const title = type === 'video'
      ? (locale === 'vi' ? 'Cuộc gọi Video' : 'Video Call')
      : (locale === 'vi' ? 'Cuộc gọi Thoại' : 'Voice Call');
    const message = locale === 'vi'
      ? 'Tính năng gọi thoại & video đang phát triển cho Mobile (Coming Soon).\n\nBạn có thể trải nghiệm gọi trực tiếp ngay bây giờ trên phiên bản Web (Next.js) hoặc ứng dụng Android!'
      : 'Voice & Video Calling is coming soon for Mobile.\n\nYou can currently enjoy realtime calling directly on the Web (Next.js) platform or Android app!';

    Alert.alert(title, message, [{ text: 'OK', style: 'default' }]);
  };

  const handlePickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setSelectedImageUri(res.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert(t.common.appName, err?.message || t.storage.uploadFailed);
    }
  };

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && !selectedImageUri) || !currentChannelId) return;
    const content = messageInput.trim();
    const replyToId = replyingMessage?.id;
    const imageToUpload = selectedImageUri;

    setMessageInput('');
    setSelectedImageUri(null);
    setReplyingMessage(null);
    reportTyping(false, user?.profile?.displayName || user?.email);
    isNearBottomRef.current = true;

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 50);

    try {
      if (imageToUpload) {
        setIsUploadingMedia(true);
        const uploaded = await uploadMobileMedia({
          folder: 'attachments',
          uri: imageToUpload,
        });
        setIsUploadingMedia(false);

        await sendMessageMutation.mutateAsync({
          content: content || undefined,
          type: MessageType.FILE,
          fileUrl: uploaded.publicUrl,
          replyToId,
        });
      } else {
        await sendMessageMutation.mutateAsync({
          content,
          type: MessageType.TEXT,
          replyToId,
        });
      }
    } catch (err: any) {
      setIsUploadingMedia(false);
      Alert.alert(t.common.appName, t.chat.sendFailedAlert);
    }
  };

  const handleRetry = async (msg: any) => {
    try {
      await sendMessageMutation.mutateAsync({
        content: msg.content,
        type: msg.type || MessageType.TEXT,
        fileUrl: msg.fileUrl,
        replyToId: msg.replyToId,
        tempId: msg.tempId || msg.id,
      });
    } catch {
      Alert.alert(t.common.appName, t.chat.sendFailedAlert);
    }
  };

  const handleReact = (messageId: string, emoji: string) => {
    reactMessageMutation.mutate({ messageId, emoji });
    setActiveActionMessage(null);
  };

  const handleTogglePin = (messageId: string, isPinned: boolean) => {
    pinMessageMutation.mutate({ messageId, isPinned });
    setActiveActionMessage(null);
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
          onPress={() => router.back()}
          style={[styles.backBtnPill, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.backBtnText, { color: colors.onPrimary }]}>
            {t.home.backToHome}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.canvas }]}
    >
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.iconButton, { backgroundColor: colors.wash }]}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleOpenSettings}
            style={[styles.miniAvatar, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.miniAvatarText, { color: colors.onPrimary }]}>
              {getInitials(circle.name)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleOpenSettings}
            style={styles.headerTitleBlock}
          >
            <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.text }]}>
              {circle.name}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => handleCallComingSoon('audio')}
            style={[styles.iconButton, { backgroundColor: colors.wash }]}
            accessibilityLabel="Voice Call"
          >
            <Phone size={18} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleCallComingSoon('video')}
            style={[styles.iconButton, { backgroundColor: colors.wash }]}
            accessibilityLabel="Video Call"
          >
            <Video size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Network Reconnection Banner */}
      {!isSocketConnected && (
        <View style={[styles.reconnectBanner, { backgroundColor: colors.wash, borderColor: colors.hairline }]}>
          <WifiOff size={13} color={colors.subtle} style={{ marginRight: 6 }} />
          <Text style={[styles.reconnectText, { color: colors.subtle }]}>
            {t.chat.reconnecting}
          </Text>
        </View>
      )}

      {/* Internal Navigation Tabs: 3 Tabs (Icons Only) */}
      <View style={[styles.segmentedBar, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setActiveTab('chat')}
          style={[
            styles.segmentItem,
            activeTab === 'chat' && [styles.activeSegmentItem, { borderBottomColor: colors.primary }],
          ]}
        >
          <MessageSquare
            size={20}
            color={activeTab === 'chat' ? colors.primary : colors.subtle}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setActiveTab('moments')}
          style={[
            styles.segmentItem,
            activeTab === 'moments' && [styles.activeSegmentItem, { borderBottomColor: colors.primary }],
          ]}
        >
          <Camera
            size={20}
            color={activeTab === 'moments' ? colors.primary : colors.subtle}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setActiveTab('tools')}
          style={[
            styles.segmentItem,
            activeTab === 'tools' && [styles.activeSegmentItem, { borderBottomColor: colors.primary }],
          ]}
        >
          <Layers
            size={20}
            color={activeTab === 'tools' ? colors.primary : colors.subtle}
          />
        </TouchableOpacity>
      </View>

      {/* TAB 1: TRÒ CHUYỆN TRỰC TIẾP TRONG CIRCLE */}
      {activeTab === 'chat' && (
        <View style={styles.chatContainer}>
          {/* Messages list */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesScrollContent}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onContentSizeChange={() => {
              if (isFirstLoadRef.current || isNearBottomRef.current) {
                scrollViewRef.current?.scrollToEnd({ animated: !isFirstLoadRef.current });
              }
            }}
          >
            {/* Load Earlier Messages Button */}
            {hasNextPage && (
              <View style={styles.loadEarlierContainer}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  style={[
                    styles.loadEarlierBtn,
                    { backgroundColor: colors.surface, borderColor: colors.hairline },
                  ]}
                >
                  {isFetchingNextPage ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <ArrowUpCircle size={15} color={colors.subtle} style={{ marginRight: 6 }} />
                      <Text style={[styles.loadEarlierText, { color: colors.subtle }]}>
                        {t.chat.loadEarlierMessages}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {isLoadingMessages && messages.length === 0 ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
            ) : messages.length === 0 ? (
              <View style={[styles.emptyChatBox, { backgroundColor: colors.wash }]}>
                <MessageSquare size={32} color={colors.primary} style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyChatTitle, { color: colors.text }]}>
                  {t.chat.noMessagesYet}
                </Text>
                <Text style={[styles.emptyChatText, { color: colors.subtle }]}>
                  {t.chat.firstMessageHint}
                </Text>
              </View>
            ) : (
              dateSections.map((section, sectionIdx) => (
                <View key={`date-section-${section.date}-${sectionIdx}`}>
                  {/* Date Divider Pill (Today, Yesterday, or Formatted Date) */}
                  <View style={styles.dateSeparatorRow}>
                    <View style={[styles.dateSeparatorLine, { backgroundColor: colors.hairline }]} />
                    <View
                      style={[
                        styles.dateSeparatorPill,
                        { backgroundColor: colors.surface, borderColor: colors.hairline },
                      ]}
                    >
                      <Text style={[styles.dateSeparatorText, { color: colors.subtle }]}>
                        {section.date}
                      </Text>
                    </View>
                  </View>

                  {/* Message Clusters in this Date Section */}
                  {section.clusters.map((cluster, clusterIdx) => {
                    const isSenderMe = cluster.isSenderMe;

                    if (isSenderMe) {
                      return (
                        <View
                          key={`mobile-cluster-me-${sectionIdx}-${clusterIdx}`}
                          style={[styles.clusterContainerMe]}
                        >
                          {cluster.messages.map((msg, msgIdx) => {
                            const isFirst = msgIdx === 0;
                            const isLast = msgIdx === cluster.messages.length - 1;
                            const isSingle = cluster.messages.length === 1;
                            const showTimestamp = activeTimestampMessageId === msg.id;
                            const hasReactions =
                              msg.reactionCounts && Object.keys(msg.reactionCounts).length > 0;

                            return (
                              <MobileSwipeMessageBubble
                                key={msg.id ? `bubble-me-${msg.id}` : `bubble-temp-${msg.tempId || msgIdx}`}
                                msg={msg}
                                allMessages={messages}
                                isSenderMe={true}
                                isFirst={isFirst}
                                isLast={isLast}
                                isSingle={isSingle}
                                isLatestSentByMe={Boolean(lastMessageByMeId && msg.id === lastMessageByMeId)}
                                isLatestMessage={Boolean(lastMessageId && msg.id === lastMessageId)}
                                showTimestamp={showTimestamp}
                                hasReactions={hasReactions}
                                colors={colors}
                                t={t}
                                onToggleTimestamp={() => handleToggleTimestamp(msg.id)}
                                onLongPress={() => setActiveActionMessage(msg)}
                                onSwipeReply={() => setReplyingMessage(msg)}
                                onRetry={handleRetry}
                                onPreviewImage={(url) => setPreviewingImageUrl(url)}
                              />
                            );
                          })}
                        </View>
                      );
                    }

                    // Other user's cluster
                    const isLatestCluster = Boolean(
                      lastMessageId && cluster.messages.some((m) => m.id === lastMessageId),
                    );
                    const lastMsgInChat = messages.length > 0 ? messages[messages.length - 1] : null;

                    return (
                      <View
                        key={`mobile-cluster-other-${sectionIdx}-${clusterIdx}`}
                        style={{ width: '100%', marginVertical: 3 }}
                      >
                        <View style={styles.clusterContainerOther}>
                          {/* Avatar aligned with the bottom of the cluster */}
                          <View style={[styles.senderAvatarBottom, { backgroundColor: `${colors.primary}18` }]}>
                            {cluster.senderAvatarUrl ? (
                              <RNImage
                                source={{ uri: cluster.senderAvatarUrl }}
                                style={styles.senderAvatarImg}
                              />
                            ) : (
                              <Text style={[styles.senderAvatarText, { color: colors.primary }]}>
                                {cluster.senderName.slice(0, 2).toUpperCase()}
                              </Text>
                            )}
                          </View>

                          {/* Messages Stack */}
                          <View style={styles.clusterMessagesCol}>
                            {/* Sender Name once at the top of cluster */}
                            <View style={styles.senderHeaderRow}>
                              <Text
                                numberOfLines={1}
                                style={[styles.senderName, { color: colors.text }]}
                              >
                                {cluster.senderName}
                              </Text>
                            </View>

                            {cluster.messages.map((msg, msgIdx) => {
                              const isFirst = msgIdx === 0;
                              const isLast = msgIdx === cluster.messages.length - 1;
                              const isSingle = cluster.messages.length === 1;
                              const showTimestamp = activeTimestampMessageId === msg.id;
                              const hasReactions =
                                msg.reactionCounts && Object.keys(msg.reactionCounts).length > 0;

                              return (
                                <MobileSwipeMessageBubble
                                  key={msg.id ? `bubble-other-${msg.id}` : `bubble-temp-${msg.tempId || msgIdx}`}
                                  msg={msg}
                                  allMessages={messages}
                                  isSenderMe={false}
                                  isFirst={isFirst}
                                  isLast={isLast}
                                  isSingle={isSingle}
                                  isLatestMessage={Boolean(lastMessageId && msg.id === lastMessageId)}
                                  showTimestamp={showTimestamp}
                                  hasReactions={hasReactions}
                                  colors={colors}
                                  t={t}
                                  onToggleTimestamp={() => handleToggleTimestamp(msg.id)}
                                  onLongPress={() => setActiveActionMessage(msg)}
                                  onSwipeReply={() => setReplyingMessage(msg)}
                                  onRetry={handleRetry}
                                  onPreviewImage={(url) => setPreviewingImageUrl(url)}
                                />
                              );
                            })}
                          </View>
                        </View>

                        {/* Latest message read receipts for other's message: ALWAYS aligned to bottom right corner */}
                        {isLatestCluster && lastMsgInChat?.readers && lastMsgInChat.readers.length > 0 && (
                          <View
                            style={{
                              width: '100%',
                              flexDirection: 'row',
                              justifyContent: 'flex-end',
                              alignItems: 'center',
                              marginTop: 2,
                              paddingRight: 6,
                            }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              {lastMsgInChat.readers.slice(0, 5).map((reader: any, rIdx: number) => (
                                <View
                                  key={reader.userId || rIdx}
                                  style={[
                                    styles.miniReaderAvatar,
                                    {
                                      borderColor: colors.surface,
                                      backgroundColor: colors.wash,
                                      marginLeft: rIdx > 0 ? -5 : 0,
                                    },
                                  ]}
                                >
                                  {reader.avatarUrl ? (
                                    <RNImage
                                      source={{ uri: reader.avatarUrl }}
                                      style={styles.miniReaderAvatarImg}
                                    />
                                  ) : (
                                    <Text style={[styles.miniReaderAvatarText, { color: colors.text }]}>
                                      {((reader.displayName || reader.nickname || 'U')).charAt(0).toUpperCase()}
                                    </Text>
                                  )}
                                </View>
                              ))}
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              ))
            )}
          </ScrollView>

          {/* Floating Rounded Composer Area */}
          <View
            style={[
              styles.composerFloatingContainer,
              { paddingBottom: isKeyboardVisible ? 6 : (insets.bottom > 0 ? insets.bottom + 2 : 10) },
            ]}
          >
            {/* Realtime Typing Indicator Bar */}
            {typingUsers.length > 0 && (
              <View
                style={[
                  styles.typingBar,
                  { backgroundColor: colors.surface, borderColor: colors.hairline },
                ]}
              >
                <Text numberOfLines={1} style={[styles.typingText, { color: colors.subtle }]}>
                  {t.chat.typingIndicator.replace(
                    '{names}',
                    typingUsers.map((u) => u.userName).join(', '),
                  )}
                </Text>
              </View>
            )}

            {/* Selected Image Attachment Preview Bar */}
            {selectedImageUri && (
              <View
                style={[
                  styles.attachmentPreviewBar,
                  { backgroundColor: colors.surface, borderColor: colors.hairline },
                ]}
              >
                <View style={styles.attachmentImgBox}>
                  <RNImage source={{ uri: selectedImageUri }} style={styles.attachmentThumb} resizeMode="cover" />
                  {isUploadingMedia && (
                    <View style={[styles.uploadingOverlay, { backgroundColor: colors.canvas }]}>
                      <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text numberOfLines={1} style={[styles.attachmentTitle, { color: colors.text }]}>
                    {t.chat.imageAttachment}
                  </Text>
                  <Text numberOfLines={1} style={[styles.attachmentSub, { color: colors.subtle }]}>
                    {isUploadingMedia ? t.common.loading : t.chat.attachImage}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedImageUri(null)}
                  disabled={isUploadingMedia}
                  style={[styles.removeAttachmentBtn, { backgroundColor: colors.wash }]}
                >
                  <X size={14} color={colors.subtle} />
                </TouchableOpacity>
              </View>
            )}

            {/* Reply Quote Preview Floating Pill */}
            {replyingMessage && (
              <View
                style={[
                  styles.replyPreviewBar,
                  { backgroundColor: colors.surface, borderColor: colors.hairline },
                ]}
              >
                <View style={styles.replyPreviewLeft}>
                  <View style={{ transform: [{ scaleX: -1 }], marginRight: 2 }}>
                    <Reply size={15} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.replyPreviewAuthor, { color: colors.primary }]}>
                      {t.chat.replyingTo.replace(
                        '{name}',
                        replyingMessage.sender?.nickname ||
                          replyingMessage.sender?.user?.profile?.displayName ||
                          replyingMessage.sender?.profile?.displayName ||
                          replyingMessage.sender?.user?.email?.split('@')[0] ||
                          'User',
                      )}
                    </Text>
                    <Text numberOfLines={1} style={[styles.replyPreviewContent, { color: colors.subtle }]}>
                      {replyingMessage.content ||
                        (replyingMessage.fileName ? `📎 ${replyingMessage.fileName}` : '') ||
                        (replyingMessage.fileUrl ? '📷 [Hình ảnh/Tệp tin]' : 'Tin nhắn')}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setReplyingMessage(null)}
                  style={[styles.cancelReplyBtn, { backgroundColor: colors.wash }]}
                >
                  <X size={14} color={colors.subtle} />
                </TouchableOpacity>
              </View>
            )}

            {/* Rounded Floating Composer Bar with embedded Send Button */}
            <View
              style={[
                styles.composerBar,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.hairline,
                },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handlePickImage}
                disabled={isUploadingMedia || sendMessageMutation.isPending}
                style={[styles.imagePickBtn, { backgroundColor: colors.wash }]}
              >
                <ImageIcon size={18} color={colors.primary} />
              </TouchableOpacity>

              <TextInput
                value={messageInput}
                onChangeText={(text) => {
                  setMessageInput(text);
                  if (circleId) {
                    getStorageItem(`circle_${circleId}_typing_indicator`).then((v) => {
                      if (v === 'false') return;
                      reportTyping(text.length > 0, user?.profile?.displayName || user?.email);
                    });
                  } else {
                    reportTyping(text.length > 0, user?.profile?.displayName || user?.email);
                  }
                }}
                placeholder={t.chat.composerPlaceholder.replace('#{channel}', currentChannel?.name || 'chat')}
                placeholderTextColor={colors.subtle}
                style={[styles.composerInput, { color: colors.text }]}
                multiline
              />
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSendMessage}
                disabled={(!messageInput.trim() && !selectedImageUri) || sendMessageMutation.isPending || isUploadingMedia}
                style={[
                  styles.sendBtn,
                  {
                    backgroundColor:
                      (messageInput.trim() || selectedImageUri) && !sendMessageMutation.isPending && !isUploadingMedia
                        ? colors.primary
                        : colors.wash,
                  },
                ]}
              >
                {sendMessageMutation.isPending || isUploadingMedia ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <Send
                    size={17}
                    color={(messageInput.trim() || selectedImageUri) ? colors.onPrimary : colors.subtle}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* TAB 2: KHOẢNH KHẮC THƯỜNG NGÀY (AUTHENTIC MOMENTS VIEW) */}
      {activeTab === 'moments' && (
        <MomentsView circleId={circleId} circleName={circle.name} />
      )}

      {/* TAB 3: TIỆN ÍCH NHÓM */}
      {activeTab === 'tools' && (
        <ScrollView contentContainerStyle={styles.toolsContainer} showsVerticalScrollIndicator={false}>
          {/* Tool 1: Realtime Voice Stage */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleCallComingSoon('audio')}
            style={[styles.toolCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
          >
            <View style={[styles.toolIcon, { backgroundColor: `${colors.primary}20` }]}>
              <Radio size={24} color={colors.primary} />
            </View>
            <View style={styles.toolInfo}>
              <Text style={[styles.toolTitle, { color: colors.text }]}>
                {t.nav.groupCall}
              </Text>
              <Text style={[styles.toolDesc, { color: colors.subtle }]}>
                {t.home.noVoiceStageOpen}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Tool 2: Photo Album */}
          <View style={[styles.toolCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
            <View style={[styles.toolIcon, { backgroundColor: `${colors.warning}20` }]}>
              <ImageIcon size={24} color={colors.warning} />
            </View>
            <View style={styles.toolInfo}>
              <Text style={[styles.toolTitle, { color: colors.text }]}>
                {t.nav.photoAlbum}
              </Text>
              <Text style={[styles.toolDesc, { color: colors.subtle }]}>
                {t.home.circleFeedSubtitle}
              </Text>
            </View>
          </View>

          {/* Tool 3: Calendar Events */}
          <View style={[styles.toolCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
            <View style={[styles.toolIcon, { backgroundColor: `${colors.info}20` }]}>
              <Calendar size={24} color={colors.info} />
            </View>
            <View style={styles.toolInfo}>
              <Text style={[styles.toolTitle, { color: colors.text }]}>
                {t.nav.calendarEvents}
              </Text>
              <Text style={[styles.toolDesc, { color: colors.subtle }]}>
                {t.home.upcomingEventsEmpty}
              </Text>
            </View>
          </View>

          {/* Tool 4: Planning Sheet */}
          <View style={[styles.toolCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
            <View style={[styles.toolIcon, { backgroundColor: `${colors.success}20` }]}>
              <FileSpreadsheet size={24} color={colors.success} />
            </View>
            <View style={styles.toolInfo}>
              <Text style={[styles.toolTitle, { color: colors.text }]}>
                {t.nav.planningSheet}
              </Text>
              <Text style={[styles.toolDesc, { color: colors.subtle }]}>
                {t.nav.planningSheet}
              </Text>
            </View>
          </View>

          {/* Tool 5: Lucky Wheel */}
          <View style={[styles.toolCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
            <View style={[styles.toolIcon, { backgroundColor: `${colors.peach}40` }]}>
              <Sparkles size={24} color={colors.warning} />
            </View>
            <View style={styles.toolInfo}>
              <Text style={[styles.toolTitle, { color: colors.text }]}>
                {t.nav.luckyWheel}
              </Text>
              <Text style={[styles.toolDesc, { color: colors.subtle }]}>
                {t.nav.luckyWheel}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Floating Action Menu Modal on Long Press */}
      <Modal
        visible={Boolean(activeActionMessage)}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveActionMessage(null)}
      >
        <TouchableOpacity
          style={styles.actionModalBackdrop}
          activeOpacity={1}
          onPress={() => setActiveActionMessage(null)}
        >
          <BlurView
            intensity={Platform.OS === 'ios' ? 25 : 50}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              styles.actionMenuCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.hairline,
              },
            ]}
          >
            {/* Quick Emojis Row */}
            <View style={styles.actionEmojisRow}>
              {QUICK_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  activeOpacity={0.7}
                  onPress={() => handleReact(activeActionMessage.id, emoji)}
                  style={styles.actionEmojiBtn}
                >
                  <Text style={styles.actionEmojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.actionDivider, { backgroundColor: colors.hairline }]} />

            {/* Quick Actions (Reply, Pin) */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setReplyingMessage(activeActionMessage);
                  setActiveActionMessage(null);
                }}
                style={[styles.actionBtnItem, { backgroundColor: colors.wash }]}
              >
                <View style={{ transform: [{ scaleX: -1 }], marginRight: 2 }}>
                  <Reply size={16} color={colors.primary} />
                </View>
                <Text style={[styles.actionBtnItemText, { color: colors.text }]}>{t.chat.replyAction}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  handleTogglePin(activeActionMessage.id, !activeActionMessage.isPinned)
                }
                style={[styles.actionBtnItem, { backgroundColor: colors.wash }]}
              >
                <Pin
                  size={16}
                  color={activeActionMessage?.isPinned ? colors.warning : colors.subtle}
                  fill={activeActionMessage?.isPinned ? colors.warning : 'transparent'}
                />
                <Text style={[styles.actionBtnItemText, { color: colors.text }]}>
                  {activeActionMessage?.isPinned ? t.chat.unpinAction : t.chat.pinAction}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Lightbox / Full-screen Image Preview Modal */}
      <Modal
        visible={!!previewingImageUrl}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewingImageUrl(null)}
      >
        <View style={[styles.fullScreenModalBg, { backgroundColor: colors.canvas }]}>
          <TouchableOpacity
            style={[styles.closeFullImgBtn, { backgroundColor: colors.surface }]}
            onPress={() => setPreviewingImageUrl(null)}
          >
            <X size={20} color={colors.text} />
          </TouchableOpacity>
          {previewingImageUrl && (
            <RNImage
              source={{ uri: previewingImageUrl }}
              style={styles.fullScreenImg}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* Circle Management Modal */}
      <CircleManagementModal />
    </KeyboardAvoidingView>
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
    fontSize: 13,
    fontWeight: '500',
  },
  notFoundText: {
    fontSize: 16,
    fontWeight: '700',
  },
  backBtnPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 36,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatar: {
    width: 38,
    height: 38,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarText: {
    fontSize: 14,
    fontWeight: '800',
  },
  headerTitleBlock: {
    flex: 1,
    gap: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  segmentedBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    height: 48,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeSegmentItem: {},
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesScrollContent: {
    gap: 10,
    paddingVertical: 14,
  },
  emptyChatBox: {
    padding: 24,
    borderRadius: 18,
    alignItems: 'center',
  },
  emptyChatTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyChatText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  clusterContainerMe: {
    alignItems: 'flex-end',
    alignSelf: 'flex-end',
    maxWidth: '82%',
    gap: 2,
    marginVertical: 3,
  },
  clusterContainerOther: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    alignSelf: 'flex-start',
    maxWidth: '85%',
    gap: 8,
    marginVertical: 3,
  },
  senderAvatarBottom: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    overflow: 'hidden',
  },
  senderAvatarImg: {
    width: 32,
    height: 32,
    borderRadius: 12,
  },
  senderAvatarText: {
    fontSize: 11.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  senderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
    marginLeft: 2,
    flexWrap: 'wrap',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '700',
  },
  roleBadgeOwner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  roleBadgeOwnerText: {
    fontSize: 9,
    fontWeight: '700',
  },
  roleBadgeAdmin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    borderWidth: 1,
  },
  roleBadgeAdminText: {
    fontSize: 9,
    fontWeight: '700',
  },
  clusterMessagesCol: {
    flex: 1,
    gap: 2,
  },
  messageBubble: {
    position: 'relative',
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 4,
    maxWidth: '100%',
  },
  singleBubbleMe: {
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  firstBubbleMe: {
    borderRadius: 18,
    borderBottomRightRadius: 6,
  },
  middleBubbleMe: {
    borderRadius: 18,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  lastBubbleMe: {
    borderRadius: 18,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 4,
  },
  singleBubbleOther: {
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  firstBubbleOther: {
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
  },
  middleBubbleOther: {
    borderRadius: 18,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
  },
  lastBubbleOther: {
    borderRadius: 18,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 14.5,
    lineHeight: 20.5,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  timestampText: {
    fontSize: 10,
    opacity: 0.65,
  },
  timestampTopText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    opacity: 0.65,
  },
  seenByTextBelow: {
    fontSize: 10,
    opacity: 0.75,
    maxWidth: 240,
  },
  miniReaderAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniReaderAvatarImg: {
    width: '100%',
    height: '100%',
  },
  miniReaderAvatarText: {
    fontSize: 8,
    fontWeight: '700',
  },
  swipeContainer: {
    position: 'relative',
    width: '100%',
    justifyContent: 'center',
  },
  swipeReplyIconBox: {
    position: 'absolute',
    left: 4,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 28,
    zIndex: 1,
  },
  replyQuoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 10,
    marginBottom: 4,
    maxWidth: '100%',
    gap: 4,
  },
  replyQuoteAuthor: {
    fontSize: 11.5,
    fontWeight: '600',
    flexShrink: 0,
  },
  replyQuoteText: {
    fontSize: 11.5,
    fontWeight: '400',
    flexShrink: 1,
    opacity: 0.88,
  },
  reactionsBadgePill: {
    position: 'absolute',
    bottom: -6,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10,
    borderWidth: 1,
    elevation: 0,
    shadowOpacity: 0,
  },
  reactionEmojiText: {
    fontSize: 11,
    lineHeight: 13,
  },
  composerFloatingContainer: {
    paddingHorizontal: 14,
    paddingTop: 4,
    gap: 6,
  },
  replyPreviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  replyPreviewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  replyPreviewAuthor: {
    fontSize: 11,
    fontWeight: '700',
  },
  replyPreviewContent: {
    fontSize: 11,
  },
  cancelReplyBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  composerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    borderWidth: 1.2,
    paddingLeft: 14,
    paddingRight: 5,
    paddingVertical: 3,
    minHeight: 46,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    gap: 8,
  },
  composerInput: {
    flex: 1,
    maxHeight: 90,
    paddingVertical: 6,
    paddingRight: 6,
    fontSize: 14,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolsContainer: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
  },
  toolIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolInfo: {
    flex: 1,
    gap: 2,
  },
  toolTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  toolDesc: {
    fontSize: 12,
  },
  actionModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  actionMenuCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 10,
  },
  actionEmojisRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionEmojiBtn: {
    padding: 6,
    borderRadius: 16,
  },
  actionEmojiText: {
    fontSize: 24,
  },
  actionDivider: {
    height: 1,
    width: '100%',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtnItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 14,
  },
  actionBtnItemText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bubbleImageWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 4,
    width: 220,
    height: 160,
  },
  bubbleImageContent: {
    width: '100%',
    height: '100%',
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendingStatusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  retryBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  retryBtnText: {
    fontSize: 10,
    fontWeight: '600',
  },
  reconnectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  reconnectText: {
    fontSize: 11,
    fontWeight: '500',
  },
  typingBar: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  typingText: {
    fontSize: 11.5,
    fontStyle: 'italic',
  },
  attachmentPreviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  attachmentImgBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  attachmentThumb: {
    width: '100%',
    height: '100%',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
  },
  attachmentTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  attachmentSub: {
    fontSize: 11,
  },
  removeAttachmentBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenModalBg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeFullImgBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenImg: {
    width: '100%',
    height: '80%',
  },
  loadEarlierContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  loadEarlierBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  loadEarlierText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateSeparatorRow: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  dateSeparatorLine: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 1,
  },
  dateSeparatorPill: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateSeparatorText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
