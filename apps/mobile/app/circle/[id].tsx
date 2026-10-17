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
  Keyboard,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const triggerLightHaptic = () => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
};

const triggerSelectionHaptic = () => {
  try {
    Haptics.selectionAsync();
  } catch {}
};

const triggerHapticFeedback = triggerLightHaptic;
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
  UserPlus,
  X,
  Pin,
  Reply,
  Check,
  Clock,
  AlertCircle,
  WifiOff,
  ArrowUpCircle,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Mic,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useThemeStore, MessageBubbleThemes, MessageTheme } from '../../src/stores/theme.store';
import { getGlassTheme } from '../../src/constants/glass-theme';
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
  usePinnedMessagesQuery,
  useMobileChannelTyping,
  useMyCirclesQuery,
} from '../../src/hooks/use-circle-queries';
import { useEdgeSwipeDismiss } from '../../src/hooks/use-edge-swipe';
import { uploadMobileMedia } from '../../src/services/storage-upload.service';
import { subscribeSocketConnection, sendMobileMessageRead } from '../../src/services/socket';
import { getStorageItem } from '../../src/services/storage';
import { useQueryClient, InfiniteData } from '@tanstack/react-query';
import { MessageType, CursorPaginatedMessages } from '@circle/types';
import { CircleManagementModal } from '../../src/components/circle/CircleManagementModal';
import { MomentsView, parseMomentPhotos, MomentFeedPipView, formatMomentRelativeTime } from '../../src/components/moment/MomentsView';
import { CreateCircleModal } from '../../src/components/circle/CreateCircleModal';
import { JoinCircleModal } from '../../src/components/circle/JoinCircleModal';
import { PinnedMessagesModal } from '../../src/components/chat/PinnedMessagesModal';
import { Emoji } from '../../src/components/ui/Emoji';
import { FullEmojiPickerModal } from '../../src/components/ui/FullEmojiPickerModal';
import { PROMINENT_QUICK_EMOJIS } from '@circle/shared';

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

interface MomentReplyMetadata {
  type: string;
  momentId?: string;
  authorName?: string;
  authorAvatar?: string | null;
  caption?: string | null;
  createdAt?: string;
  fallbackTitle?: string;
}

function parseMomentReplyMetadata(fileName?: string | null): MomentReplyMetadata | null {
  if (!fileName) return null;
  if (fileName.startsWith('{') && fileName.includes('"MOMENT_REPLY"')) {
    try {
      const parsed = JSON.parse(fileName);
      if (parsed.type === 'MOMENT_REPLY') {
        return parsed;
      }
    } catch {}
  }
  if (fileName.startsWith('Khoảnh khắc: ') || fileName.startsWith('Khoảnh khắc của ')) {
    let caption: string | null = null;
    let authorName: string | null = null;
    if (fileName.startsWith('Khoảnh khắc: "')) {
      const match = fileName.match(/Khoảnh khắc: "(.*)"/);
      caption = match ? match[1] : null;
    } else {
      authorName = fileName.replace('Khoảnh khắc của ', '').trim();
    }
    return {
      type: 'MOMENT_REPLY',
      authorName: authorName || 'Thành viên',
      caption,
      fallbackTitle: fileName,
    };
  }
  return null;
}

function MomentCardChatEmbed({
  fileUrl,
  metadata,
  fallbackCreatedAt,
  onPress,
  colors,
}: {
  fileUrl: string;
  metadata: MomentReplyMetadata | null;
  fallbackCreatedAt?: string | null;
  onPress?: () => void;
  colors: any;
}) {
  const { mainUrl, pipUrl, cornerIndex } = parseMomentPhotos(fileUrl);
  const [isSwapped, setIsSwapped] = useState(false);
  const locale = useLanguageStore((s) => s.locale);

  const displayMain = isSwapped ? (pipUrl || mainUrl) : mainUrl;
  const displayPip = isSwapped ? mainUrl : pipUrl;

  const authorName = metadata?.authorName || 'Thành viên';
  const authorAvatar = metadata?.authorAvatar;
  const caption = metadata?.caption;
  const targetDate = metadata?.createdAt || fallbackCreatedAt;
  const timeFormatted = targetDate ? formatMomentRelativeTime(targetDate, locale) : null;

  // PIP offset positioning in 220x220 square card
  const pipCoords = useMemo(() => {
    const margin = 8;
    switch (cornerIndex % 4) {
      case 0:
        return { top: margin, left: margin };
      case 1:
        return { top: margin, right: margin };
      case 2:
        return { bottom: margin, right: margin };
      case 3:
        return { bottom: margin, left: margin };
      default:
        return { top: margin, left: margin };
    }
  }, [cornerIndex]);



  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.momentCardPhotoFrame}
    >
      {displayMain ? (
        <RNImage
          source={{ uri: displayMain }}
          style={styles.momentCardPhotoMain}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.momentCardPhotoEmpty}>
          <ImageIcon size={32} color="rgba(255, 255, 255, 0.5)" />
        </View>
      )}

      {/* Author Name & Time Overlay directly on top of photo */}
      <View style={styles.momentCardTopOverlay} pointerEvents="none">
        {authorAvatar ? (
          <RNImage source={{ uri: authorAvatar }} style={styles.momentCardOverlayAvatar} />
        ) : (
          <View style={[styles.momentCardOverlayAvatarPlaceholder, { backgroundColor: colors.primary }]}>
            <Text style={styles.momentCardOverlayAvatarText}>
              {getInitials(authorName)}
            </Text>
          </View>
        )}
        <View style={{ maxWidth: 110 }}>
          <Text numberOfLines={1} style={styles.momentCardOverlayAuthorName}>
            {authorName}
          </Text>
          {timeFormatted ? (
            <Text style={styles.momentCardOverlayTimeText}>
              {timeFormatted}
            </Text>
          ) : null}
        </View>
      </View>

      {/* PIP Floating Mini Thumbnail */}
      {displayPip ? (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            triggerHapticFeedback();
            setIsSwapped((prev) => !prev);
          }}
          style={[
            styles.momentCardPipBox,
            pipCoords,
            { borderColor: colors.primary },
          ]}
        >
          <RNImage
            source={{ uri: displayPip }}
            style={styles.momentCardPipImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      ) : null}

      {/* Moment Caption Overlay */}
      {caption ? (
        <View style={styles.momentCardCaptionContainer} pointerEvents="none">
          <View style={styles.momentCardCaptionPill}>
            <Text numberOfLines={2} ellipsizeMode="tail" style={styles.momentCardCaptionText}>
              {caption}
            </Text>
          </View>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

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
  isHighlighted?: boolean;
  colors: any;
  t: any;
  circleTheme?: string | null;
  onToggleTimestamp: () => void;
  onLongPress: () => void;
  onSwipeReply: () => void;
  onRetry?: (msg: any) => void;
  onPreviewImage?: (url: string) => void;
  onJumpToMessage?: (messageId: string) => void;
}

const MobileSwipeMessageBubble = React.memo(function MobileSwipeMessageBubble({
  msg,
  allMessages,
  isSenderMe,
  isFirst,
  isLast,
  isSingle,
  isLatestSentByMe = false,
  isLatestMessage = false,
  isHighlighted = false,
  showTimestamp,
  hasReactions,
  colors,
  t,
  circleTheme,
  onToggleTimestamp,
  onLongPress,
  onSwipeReply,
  onRetry,
  onPreviewImage,
  onJumpToMessage,
}: MobileSwipeMessageBubbleProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const hasVibratedOnSwipe = useRef(false);

  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';
  const themeKey = ((circleTheme as MessageTheme) || 'sage') as MessageTheme;
  const bubbleThemeConfig = MessageBubbleThemes[themeKey] || MessageBubbleThemes.sage;
  const activeBubbleTheme = isDark ? bubbleThemeConfig.dark : bubbleThemeConfig.light;
  const senderBubbleBg = activeBubbleTheme.bg;
  const senderTextColor = activeBubbleTheme.text;
  const otherBubbleBg = activeBubbleTheme.otherBg || colors.surface;
  const otherBorderColor = activeBubbleTheme.otherBorder || colors.hairline;
  const otherTextColor = activeBubbleTheme.otherText || colors.text;
  const otherAccentColor = activeBubbleTheme.otherAccent || colors.primary;
  const otherReplyBg = activeBubbleTheme.otherReplyBg || colors.wash;

  const renderMobileContentWithMentions = (content: string) => {
    const parts = content.split(/(@[a-zA-Z0-9_\.\u00C0-\u024F\u1EA0-\u1EF9]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@') && part.length > 1) {
        return (
          <Text
            key={index}
            style={{
              fontWeight: '700',
              color: isSenderMe ? senderTextColor : otherAccentColor,
              textDecorationLine: isSenderMe ? 'underline' : 'none',
            }}
          >
            {part}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });
  };

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

  const hasText = Boolean(msg.content && msg.content.trim());
  const hasImage = Boolean(msg.fileUrl);
  const isMediaOnly = hasImage && !hasText && !hasValidReply;

  let callSummaryData: { callType?: 'AUDIO' | 'VIDEO'; durationSeconds?: number } | null = null;
  const isCallSummary = Boolean(
    msg.content &&
      (typeof msg.content === 'string' &&
        (msg.content.startsWith('[CALL_SUMMARY]:') || msg.content.includes('"callType"'))),
  );

  if (isCallSummary && msg.content) {
    try {
      const rawJson = typeof msg.content === 'string'
        ? msg.content.replace('[CALL_SUMMARY]:', '').trim()
        : msg.content;
      callSummaryData = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
    } catch {
      callSummaryData = null;
    }
  }

  const formatDurationText = (sec = 0) => {
    if (sec <= 0) return t.calls?.callEnded || 'Đã kết thúc';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s} giây`;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dx > 25 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2;
      },
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderTerminationRequest: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0) {
          const cappedDx = Math.min(gestureState.dx, 65);
          translateX.setValue(cappedDx);
          if (gestureState.dx > 35 && !hasVibratedOnSwipe.current) {
            hasVibratedOnSwipe.current = true;
            triggerSelectionHaptic();
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
          <View
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
                ? { backgroundColor: senderBubbleBg, alignSelf: 'flex-end' }
                : {
                    backgroundColor: otherBubbleBg,
                    borderColor: otherBorderColor,
                    borderWidth: 1,
                    alignSelf: 'flex-start',
                  },
              isMediaOnly && {
                backgroundColor: 'transparent',
                borderColor: 'transparent',
                borderWidth: 0,
                paddingHorizontal: 0,
                paddingVertical: 0,
              },
              hasImage && hasText && {
                paddingHorizontal: 6,
                paddingTop: 6,
                paddingBottom: 8,
              },
              isHighlighted && {
                borderWidth: 2,
                borderColor: colors.primary,
                transform: [{ scale: 1.02 }],
              },
            ]}
          >
            {/* Reply Quote Banner - Separate Touchable to prevent double-tap gesture collision */}
            {hasValidReply && replyTarget && (
              <TouchableOpacity
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => {
                  const targetId =
                    rawReplyId ||
                    (replyTarget as any)?.id ||
                    msg.replyToId ||
                    (typeof msg.replyTo === 'object' ? (msg.replyTo as any)?.id : msg.replyTo);
                  if (targetId && onJumpToMessage) {
                    onJumpToMessage(targetId);
                  }
                }}
                style={[
                  styles.replyQuoteBox,
                  {
                    backgroundColor: isSenderMe
                      ? (activeBubbleTheme.replyBg || 'rgba(0, 0, 0, 0.15)')
                      : otherReplyBg,
                  },
                ]}
              >
                <View style={{ transform: [{ scaleX: -1 }], marginRight: 4 }}>
                  <Reply
                    size={11}
                    color={isSenderMe ? senderTextColor : otherAccentColor}
                    style={{ opacity: 0.85 }}
                  />
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.replyQuoteAuthor,
                    { color: isSenderMe ? senderTextColor : otherAccentColor },
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
                    { color: isSenderMe ? senderTextColor : colors.subtle, opacity: isSenderMe ? 0.85 : 1 },
                  ]}
                >
                  {replyTarget.content ||
                    replyTarget.text ||
                    replyTarget.message ||
                    (() => {
                      const meta = parseMomentReplyMetadata(replyTarget.fileName);
                      if (meta) {
                        return meta.caption ? `📸 "${meta.caption}"` : `📸 Khoảnh khắc của ${meta.authorName}`;
                      }
                      return replyTarget.fileName ? `📎 ${replyTarget.fileName}` : '';
                    })() ||
                    (replyTarget.fileUrl ? '📷 [Hình ảnh/Tệp tin]' : '') ||
                    'Tin nhắn'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={onToggleTimestamp}
              onLongPress={() => {
                triggerLightHaptic();
                onLongPress();
              }}
              delayLongPress={280}
            >
              {/* Image / Moment Card Attachment */}
              {Boolean(msg.fileUrl) && (() => {
                const momentMeta = parseMomentReplyMetadata(msg.fileName);
                const isMomentReply = Boolean(momentMeta || (msg.fileUrl && msg.fileUrl.includes('#pip=')));
                if (isMomentReply) {
                  return (
                    <MomentCardChatEmbed
                      fileUrl={msg.fileUrl}
                      metadata={momentMeta}
                      fallbackCreatedAt={msg.sentAt || msg.createdAt}
                      onPress={() => onPreviewImage?.(msg.fileUrl)}
                      colors={colors}
                    />
                  );
                }
                return (
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
                );
              })()}

              {/* Message Content: Call Summary vs Standard Text */}
              {callSummaryData ? (
                <View style={styles.callNotificationRow}>
                  {callSummaryData.callType === 'VIDEO' ? (
                    <Video
                      size={20}
                      color={isSenderMe ? senderTextColor : colors.text}
                    />
                  ) : (
                    <Phone
                      size={20}
                      color={isSenderMe ? senderTextColor : colors.text}
                    />
                  )}
                  <View style={{ flexShrink: 1 }}>
                    <Text
                      style={[
                        styles.callNotificationTitle,
                        { color: isSenderMe ? senderTextColor : colors.text },
                      ]}
                    >
                      {callSummaryData.callType === 'VIDEO'
                        ? (t.calls?.videoCallEnded || 'Cuộc gọi video kết thúc')
                        : (t.calls?.audioCallEnded || 'Cuộc gọi thoại kết thúc')}
                    </Text>
                    <Text
                      style={[
                        styles.callNotificationDuration,
                        { color: isSenderMe ? senderTextColor : colors.subtle, opacity: isSenderMe ? 0.85 : 1 },
                      ]}
                    >
                      {formatDurationText(callSummaryData.durationSeconds || 0)}
                    </Text>
                  </View>
                </View>
              ) : Boolean(msg.content && msg.content.trim()) ? (
                <Text
                  style={[
                    styles.messageText,
                    { color: isSenderMe ? senderTextColor : otherTextColor },
                    hasImage && { paddingHorizontal: 6, paddingTop: 4 },
                  ]}
                >
                  {renderMobileContentWithMentions(msg.content)}
                </Text>
              ) : null}


            {/* Pinned Bubble Indicator */}
            {Boolean(msg.isPinned) && (
              <View
                style={[
                  styles.pinnedBubblePill,
                  { backgroundColor: isSenderMe ? 'rgba(0,0,0,0.2)' : colors.wash },
                ]}
              >
                <Pin size={10} color={isSenderMe ? senderTextColor : colors.warning} fill={isSenderMe ? senderTextColor : colors.warning} />
              </View>
            )}

            </TouchableOpacity>

            {/* Overlapping Reaction Badge: Anchored cleanly to bubble bottom corner */}
            {hasReactions && (
              <View
                style={[
                  styles.reactionsBadgePill,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.hairline,
                    ...(isSenderMe ? { right: 8 } : { left: 8 }),
                  },
                ]}
              >
                {Object.entries(msg.reactionCounts).map(([emoji, count]: [string, any]) => (
                  <View key={emoji} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Emoji emoji={emoji} size={13} />
                    {Number(count) > 1 && (
                      <Text style={{ fontSize: 10, fontWeight: '700', color: colors.text }}>
                        {count}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
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
});

export default function CircleWorkspaceScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const circleId = id || '';

  const { colors, resolvedTheme, uiStyle } = useThemeStore();
  const { t, locale } = useLanguageStore();
  const user = useAuthStore((s) => s.user);
  const isDark = resolvedTheme === 'dark';
  const isGlass = uiStyle === 'glass';
  const glassTheme = getGlassTheme(isDark, uiStyle);

  const setActiveCircle = useCircleStore((s) => s.setActiveCircle);
  const setManageModalVisible = useCircleStore((s) => s.setManageModalVisible);
  const setCreateModalVisible = useCircleStore((s) => s.setCreateModalVisible);
  const setJoinModalVisible = useCircleStore((s) => s.setJoinModalVisible);

  const { width: screenWidth } = useWindowDimensions();
  const horizontalPagerRef = useRef<ScrollView>(null);
  const TAB_ORDER: WorkspaceTab[] = useMemo(() => ['chat', 'moments', 'tools'], []);

  const [circleSwitcherVisible, setCircleSwitcherVisible] = useState(false);

  const { data: myCircles = [] } = useMyCirclesQuery();

  const handleTabSelect = (tab: WorkspaceTab) => {
    setActiveTab(tab);
    const index = TAB_ORDER.indexOf(tab);
    if (index !== -1) {
      horizontalPagerRef.current?.scrollTo({ x: index * screenWidth, animated: true });
    }
  };

  const handleHorizontalScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / screenWidth);
    const nextTab = TAB_ORDER[pageIndex];
    if (nextTab && nextTab !== activeTab) {
      setActiveTab(nextTab);
    }
  };

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('chat');
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [previewingImageUrl, setPreviewingImageUrl] = useState<string | null>(null);
  const [previewSwapped, setPreviewSwapped] = useState(false);
  const [previewCorner, setPreviewCorner] = useState<number>(0);

  const previewParsed = useMemo(() => {
    if (!previewingImageUrl) return null;
    return parseMomentPhotos(previewingImageUrl);
  }, [previewingImageUrl]);

  const dualPreviewSize = useMemo(() => Math.min(screenWidth - 32, 420), [screenWidth]);

  const handleOpenImagePreview = (url: string) => {
    const parsed = parseMomentPhotos(url);
    setPreviewCorner(parsed.cornerIndex || 0);
    setPreviewSwapped(false);
    setPreviewingImageUrl(url);
  };
  const [isSocketConnected, setIsSocketConnected] = useState(true);
  const [replyingMessage, setReplyingMessage] = useState<any | null>(null);
  const [activeActionMessage, setActiveActionMessage] = useState<any | null>(null);
  const [activeTimestampMessageId, setActiveTimestampMessageId] = useState<string | null>(null);
  const [isPinnedModalVisible, setIsPinnedModalVisible] = useState(false);
  const [isFullEmojiModalVisible, setIsFullEmojiModalVisible] = useState(false);
  const [targetReactMessageId, setTargetReactMessageId] = useState<string | null>(null);
  const [momentsMemberFilter, setMomentsMemberFilter] = useState<string | 'all'>('all');
  const [isMomentsFilterOpen, setIsMomentsFilterOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(Platform.OS === 'ios' ? 128 : 112);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    return subscribeSocketConnection((connected) => {
      setIsSocketConnected(connected);
    });
  }, []);

  // Queries & Mutations
  const { data: circle, isLoading: isLoadingCircle } = useCircleDetailQuery(circleId);
  const { data: members = [] } = useCircleMembersQuery(circleId);

  // Synchronized Circle Theme Color (Pastel)
  const currentCircleTheme = (((circle as any)?.themeColor || 'sage') as MessageTheme);
  const circleThemeConfig = MessageBubbleThemes[currentCircleTheme] || MessageBubbleThemes.sage;
  const activeCircleBubbleTheme = isDark ? circleThemeConfig.dark : circleThemeConfig.light;

  // Mention State & Candidates
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null);

  const mentionCandidates = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    const list: string[] = [];
    if ('all'.includes(q) || 'mọi người'.includes(q)) {
      list.push('all');
    }
    const memberNames: string[] = [];
    members.forEach((m: any) => {
      const name = m.nickname || m.user?.profile?.displayName || m.user?.email?.split('@')[0];
      if (name && !memberNames.includes(name)) {
        memberNames.push(name);
      }
    });
    const filtered = memberNames.filter((name) => name.toLowerCase().includes(q));
    return [...list, ...filtered].slice(0, 8);
  }, [mentionQuery, members]);

  const handleSelectMention = (name: string) => {
    if (mentionStartIndex === null) return;
    const before = messageInput.slice(0, mentionStartIndex);
    const after = messageInput.slice(mentionStartIndex + 1 + (mentionQuery?.length || 0));
    const newText = `${before}@${name} ${after}`;
    setMessageInput(newText);
    setMentionQuery(null);
    setMentionStartIndex(null);
  };

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
  const { data: pinnedMessages = [] } = usePinnedMessagesQuery(currentChannelId);
  const edgePan = useEdgeSwipeDismiss({ onDismiss: () => router.back() });
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
  const messageRefs = useRef<Record<string, View | null>>({});
  const chatContainerRef = useRef<View | null>(null);
  const messagesContentRef = useRef<View | null>(null);
  const currentScrollYRef = useRef(0);
  const scrollViewPageYRef = useRef<number | undefined>(undefined);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    currentScrollYRef.current = contentOffset.y;
    const paddingToBottom = 160;
    isNearBottomRef.current =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
  };

  const handleJumpToMessage = (targetMessageId: string) => {
    if (!targetMessageId) return;
    const targetNode = messageRefs.current[targetMessageId];
    if (!targetNode || !scrollViewRef.current) return;

    Keyboard.dismiss();

    const triggerHighlight = () => {
      setHighlightedMessageId(targetMessageId);
      setTimeout(() => {
        setHighlightedMessageId((curr) => (curr === targetMessageId ? null : curr));
      }, 1800);
    };

    const performScroll = (targetY: number) => {
      const scrollTarget = Math.max(0, targetY - 60);
      scrollViewRef.current?.scrollTo({ y: scrollTarget, animated: true });
      triggerHighlight();
      // Second attempt ensures position settles after keyboard dismissal or layout adjustments
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: scrollTarget, animated: true });
      }, 120);
    };

    const fallbackMeasure = () => {
      if (chatContainerRef.current?.measureInWindow && (targetNode as any)?.measureInWindow) {
        chatContainerRef.current.measureInWindow((_cx: number, containerY: number) => {
          (targetNode as any).measureInWindow((_tx: number, targetNodeY: number) => {
            const messageContentY = currentScrollYRef.current + (targetNodeY - containerY);
            performScroll(messageContentY);
          });
        });
      } else {
        triggerHighlight();
      }
    };

    try {
      if (messagesContentRef.current && (targetNode as any)?.measureLayout) {
        (targetNode as any).measureLayout(
          messagesContentRef.current,
          (_left: number, top: number) => {
            performScroll(top);
          },
          () => {
            fallbackMeasure();
          }
        );
      } else {
        fallbackMeasure();
      }
    } catch {
      fallbackMeasure();
    }
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
    setMentionQuery(null);
    setMentionStartIndex(null);
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
    const target = messages.find((m: any) => m.id === messageId);
    const isCall = Boolean(
      target?.content &&
        (typeof target.content === 'string' &&
          (target.content.startsWith('[CALL_SUMMARY]:') || target.content.includes('"callType"'))),
    );
    if (isCall) {
      setActiveActionMessage(null);
      return;
    }
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
      {...edgePan.panHandlers}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.canvas }]}
    >
      {/* Unlimited Floating Frosted Header Bar (Row 1: Symmetrical Nav + Row 2: Centered Sub-header Title) */}
      <View
        style={styles.floatingHeaderWrapper}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0 && Math.abs(h - headerHeight) > 2) {
            setHeaderHeight(h);
          }
        }}
        pointerEvents="box-none"
      >
        {/* Header Background Layer: Dynamic Frosted Glass in Glass Mode vs Clean Solid Surface in Flat Mode */}
        {isGlass ? (
          <BlurView
            intensity={isDark ? 55 : 45}
            tint={glassTheme.blur.tint}
            style={[
              StyleSheet.absoluteFill,
              styles.floatingHeaderBlur,
              {
                backgroundColor: isDark ? 'rgba(15,15,20,0.72)' : 'rgba(255,255,255,0.78)',
              },
            ]}
            pointerEvents="none"
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: colors.surface,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: colors.hairline,
              },
            ]}
            pointerEvents="none"
          />
        )}

        {/* Row 1: Symmetrical Floating Navigation Anchors (Back, 3-Tab Capsule, Circle Switcher) */}
        <View style={styles.floatingNavRow} pointerEvents="box-none">
          {/* Left Anchor: Round Back Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={[
              styles.floatingNavBtn,
              {
                backgroundColor: isGlass
                  ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')
                  : colors.wash,
                borderColor: isGlass
                  ? (isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.06)')
                  : colors.hairline,
              },
            ]}
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={18} color={colors.text} />
          </TouchableOpacity>

          {/* Center Anchor: Symmetrical 3-Tab Segmented Capsule (Chat | Moments | Tools) */}
          <View style={styles.floatingCenterTabs} pointerEvents="box-none">
            {isGlass ? (
              <BlurView
                intensity={glassTheme.blur.intensity}
                tint={glassTheme.blur.tint}
                style={[
                  styles.tabSliderTrack,
                  {
                    backgroundColor: glassTheme.colors.glassBg,
                    borderColor: glassTheme.colors.glassBorder,
                  },
                ]}
                pointerEvents="auto"
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleTabSelect('chat')}
                  style={[
                    styles.tabSliderItem,
                    activeTab === 'chat'
                      ? [styles.tabSliderItemActive, { backgroundColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.08)' }]
                      : styles.tabSliderItemFaded,
                  ]}
                >
                  <MessageSquare
                    size={16}
                    color={activeTab === 'chat' ? colors.primary : colors.subtle}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleTabSelect('moments')}
                  style={[
                    styles.tabSliderItem,
                    activeTab === 'moments'
                      ? [styles.tabSliderItemActive, { backgroundColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.08)' }]
                      : styles.tabSliderItemFaded,
                  ]}
                >
                  <Camera
                    size={16}
                    color={activeTab === 'moments' ? colors.primary : colors.subtle}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleTabSelect('tools')}
                  style={[
                    styles.tabSliderItem,
                    activeTab === 'tools'
                      ? [styles.tabSliderItemActive, { backgroundColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.08)' }]
                      : styles.tabSliderItemFaded,
                  ]}
                >
                  <Layers
                    size={16}
                    color={activeTab === 'tools' ? colors.primary : colors.subtle}
                  />
                </TouchableOpacity>
              </BlurView>
            ) : (
              <View
                style={[
                  styles.tabSliderTrack,
                  {
                    backgroundColor: colors.wash,
                    borderColor: colors.hairline,
                    shadowOpacity: 0,
                    elevation: 0,
                  },
                ]}
                pointerEvents="auto"
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleTabSelect('chat')}
                  style={[
                    styles.tabSliderItem,
                    activeTab === 'chat'
                      ? [styles.tabSliderItemActive, { backgroundColor: colors.surface }]
                      : styles.tabSliderItemFaded,
                  ]}
                >
                  <MessageSquare
                    size={16}
                    color={activeTab === 'chat' ? colors.primary : colors.subtle}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleTabSelect('moments')}
                  style={[
                    styles.tabSliderItem,
                    activeTab === 'moments'
                      ? [styles.tabSliderItemActive, { backgroundColor: colors.surface }]
                      : styles.tabSliderItemFaded,
                  ]}
                >
                  <Camera
                    size={16}
                    color={activeTab === 'moments' ? colors.primary : colors.subtle}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleTabSelect('tools')}
                  style={[
                    styles.tabSliderItem,
                    activeTab === 'tools'
                      ? [styles.tabSliderItemActive, { backgroundColor: colors.surface }]
                      : styles.tabSliderItemFaded,
                  ]}
                >
                  <Layers
                    size={16}
                    color={activeTab === 'tools' ? colors.primary : colors.subtle}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Right Anchor: Circular Active Circle Avatar Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setCircleSwitcherVisible(true)}
            style={[styles.floatingCircleAvatarBtn, { backgroundColor: colors.primary }]}
            accessibilityLabel="Circle Switcher"
          >
            <Text style={[styles.floatingCircleAvatarText, { color: colors.onPrimary }]}>
              {getInitials(circle.name)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Row 2: Unified Sub-header Centered Title Pill across all 3 tabs */}
        <View style={styles.floatingSubHeaderRow} pointerEvents="box-none">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (activeTab === 'moments') {
                setIsMomentsFilterOpen(!isMomentsFilterOpen);
              } else {
                handleOpenSettings();
              }
            }}
            style={[
              styles.floatingTitlePill,
              {
                backgroundColor: isGlass
                  ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')
                  : colors.surface,
                borderColor: isGlass
                  ? (isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.07)')
                  : colors.hairline,
                shadowOpacity: isGlass ? 0.05 : 0,
                elevation: isGlass ? 2 : 0,
              },
            ]}
            accessibilityLabel={activeTab === 'moments' ? 'Lọc bạn bè' : 'Circle Settings'}
          >
            {activeTab === 'moments' ? (
              <>
                <Users size={13} color={colors.subtle} style={{ marginRight: 5 }} />
                <Text numberOfLines={1} style={[styles.floatingTitleText, { color: colors.text }]}>
                  {momentsMemberFilter === 'all'
                    ? (members.length > 0 ? `${members.length} bạn bè` : 'Bạn bè')
                    : (members.find((m: any) => (m.userId || m.id) === momentsMemberFilter)?.nickname ||
                       members.find((m: any) => (m.userId || m.id) === momentsMemberFilter)?.user?.profile?.displayName ||
                       'Bạn bè')}
                </Text>
                <ChevronDown size={13} color={colors.subtle} style={{ marginLeft: 3 }} />
              </>
            ) : (
              <>
                <Text numberOfLines={1} style={[styles.floatingTitleText, { color: colors.text }]}>
                  {circle.name}
                </Text>
                <ChevronDown size={13} color={colors.subtle} style={{ marginLeft: 3 }} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Network Reconnection Notice */}
        {!isSocketConnected && (
          <View style={[styles.reconnectBanner, { backgroundColor: colors.wash, borderColor: colors.hairline }]}>
            <WifiOff size={13} color={colors.subtle} style={{ marginRight: 6 }} />
            <Text style={[styles.reconnectText, { color: colors.subtle }]}>
              {t.chat.reconnecting}
            </Text>
          </View>
        )}
      </View>

      {/* Horizontal Pager for Chat / Moments / Tools (Instagram-style smooth swipe) */}
      <ScrollView
        ref={horizontalPagerRef}
        horizontal
        pagingEnabled
        directionalLockEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleHorizontalScrollEnd}
        keyboardShouldPersistTaps="always"
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* TAB 1: TRÒ CHUYỆN TRỰC TIẾP TRONG CIRCLE */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <View
            ref={chatContainerRef}
            collapsable={false}
            style={styles.chatContainer}
            onLayout={() => {
              chatContainerRef.current?.measureInWindow((_x, y) => {
                if (typeof y === 'number' && !isNaN(y)) {
                  scrollViewPageYRef.current = y;
                }
              });
            }}
          >
          {/* Messages list with top padding clearing the floating header */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesList}
            contentContainerStyle={[
              styles.messagesScrollContent,
              { paddingTop: headerHeight + (pinnedMessages.length > 0 ? 46 : 8) },
            ]}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={32}
            removeClippedSubviews={Platform.OS === 'android'}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled={true}
            onContentSizeChange={() => {
              if (isFirstLoadRef.current || isNearBottomRef.current) {
                scrollViewRef.current?.scrollToEnd({ animated: !isFirstLoadRef.current });
              }
            }}
          >
            <View ref={messagesContentRef} collapsable={false} style={{ width: '100%' }}>
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
                              <View
                                key={msg.id ? `bubble-me-${msg.id}` : `bubble-temp-${msg.tempId || msgIdx}`}
                                collapsable={false}
                                ref={(node) => {
                                  if (msg.id) messageRefs.current[msg.id] = node;
                                }}
                                style={{ width: '100%', alignItems: 'flex-end' }}
                              >
                                <MobileSwipeMessageBubble
                                  msg={msg}
                                  allMessages={messages}
                                  isSenderMe={true}
                                  isFirst={isFirst}
                                  isLast={isLast}
                                  isSingle={isSingle}
                                  isLatestSentByMe={Boolean(lastMessageByMeId && msg.id === lastMessageByMeId)}
                                  isLatestMessage={Boolean(lastMessageId && msg.id === lastMessageId)}
                                  isHighlighted={highlightedMessageId === msg.id}
                                  showTimestamp={showTimestamp}
                                  hasReactions={hasReactions}
                                  colors={colors}
                                  t={t}
                                  circleTheme={currentCircleTheme}
                                  onToggleTimestamp={() => handleToggleTimestamp(msg.id)}
                                  onLongPress={() => setActiveActionMessage(msg)}
                                  onSwipeReply={() => setReplyingMessage(msg)}
                                  onRetry={handleRetry}
                                  onPreviewImage={handleOpenImagePreview}
                                  onJumpToMessage={handleJumpToMessage}
                                />
                              </View>
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
                                <View
                                  key={msg.id ? `bubble-other-${msg.id}` : `bubble-temp-${msg.tempId || msgIdx}`}
                                  collapsable={false}
                                  ref={(node) => {
                                    if (msg.id) messageRefs.current[msg.id] = node;
                                  }}
                                  style={{ width: '100%', alignItems: 'flex-start' }}
                                >
                                  <MobileSwipeMessageBubble
                                    msg={msg}
                                    allMessages={messages}
                                    isSenderMe={false}
                                    isFirst={isFirst}
                                    isLast={isLast}
                                    isSingle={isSingle}
                                    isLatestMessage={Boolean(lastMessageId && msg.id === lastMessageId)}
                                    isHighlighted={highlightedMessageId === msg.id}
                                    showTimestamp={showTimestamp}
                                    hasReactions={hasReactions}
                                    colors={colors}
                                    t={t}
                                    circleTheme={currentCircleTheme}
                                    onToggleTimestamp={() => handleToggleTimestamp(msg.id)}
                                    onLongPress={() => setActiveActionMessage(msg)}
                                    onSwipeReply={() => setReplyingMessage(msg)}
                                    onRetry={handleRetry}
                                    onPreviewImage={handleOpenImagePreview}
                                    onJumpToMessage={handleJumpToMessage}
                                  />
                                </View>
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
            </View>
          </ScrollView>

          {/* Floating Pinned Message Pill (Tab 1 Chat Only, strictly below 2-layer Header) */}
          {pinnedMessages.length > 0 && (
            <View
              style={[
                styles.floatingPinnedBannerWrapper,
                { top: headerHeight + 6 },
              ]}
              pointerEvents="box-none"
            >
              <View
                style={[
                  styles.pinnedBanner,
                  {
                    backgroundColor: isGlass
                      ? (isDark ? 'rgba(30, 30, 35, 0.88)' : 'rgba(255, 255, 255, 0.92)')
                      : colors.surface,
                    borderColor: isGlass
                      ? (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)')
                      : colors.hairline,
                  },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    const latestPin = pinnedMessages[pinnedMessages.length - 1];
                    if (latestPin?.id) handleJumpToMessage(latestPin.id);
                  }}
                  style={styles.pinnedBannerLeft}
                >
                  <Pin size={12} color={colors.primary} />
                  <Text numberOfLines={1} style={[styles.pinnedBannerText, { color: colors.subtle }]}>
                    {pinnedMessages[pinnedMessages.length - 1]?.content || t.chat.pinnedBadge}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setIsPinnedModalVisible(true)}
                  style={[
                    styles.pinnedCountBadge,
                    { backgroundColor: colors.wash, borderColor: colors.hairline, borderWidth: StyleSheet.hairlineWidth },
                  ]}
                >
                  <Text style={[styles.pinnedCountText, { color: colors.primary }]}>
                    {pinnedMessages.length} {t.chat.pinnedBadge}
                  </Text>
                  <ChevronRight size={11} color={colors.primary} style={{ marginLeft: 2 }} />
                </TouchableOpacity>
              </View>
            </View>
          )}

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
                  {
                    backgroundColor: activeCircleBubbleTheme.composerReplyBg,
                    borderColor: activeCircleBubbleTheme.border || colors.hairline,
                  },
                ]}
              >
                <View style={styles.replyPreviewLeft}>
                  <View style={{ transform: [{ scaleX: -1 }], marginRight: 2 }}>
                    <Reply size={15} color={activeCircleBubbleTheme.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.replyPreviewAuthor, { color: activeCircleBubbleTheme.text }]}>
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

            {/* Mention Suggestions Horizontal Bar (Minimalism: Name only) */}
            {mentionCandidates.length > 0 && (
              <View
                style={[
                  styles.mentionContainer,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.hairline,
                  },
                ]}
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.mentionScrollContent}
                  keyboardShouldPersistTaps="always"
                >
                  {mentionCandidates.map((name) => (
                    <TouchableOpacity
                      key={name}
                      activeOpacity={0.7}
                      onPress={() => handleSelectMention(name)}
                      style={[styles.mentionPill, { backgroundColor: colors.wash, borderColor: colors.hairline }]}
                    >
                      <Text style={[styles.mentionPillText, { color: colors.primary }]}>@{name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Apple-Style Separated Input Bar: Left Input Capsule + Right Standalone Action Button */}
            <View style={styles.composerRow}>
              {/* Left Input Capsule: (+) icon, Image icon, Text field, and Sticker/Emoji on far right */}
              <View
                style={[
                  styles.composerInputCapsule,
                  {
                    backgroundColor: isGlass
                      ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.85)')
                      : colors.surface,
                    borderColor: isGlass
                      ? (isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)')
                      : colors.hairline,
                  },
                ]}
              >
                {/* Action 1: (+) Outline Neutral Plus Button */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handlePickImage}
                  style={[styles.plusOutlineCircle, { borderColor: colors.subtle }]}
                  accessibilityLabel="Add attachment"
                >
                  <Plus size={13} color={colors.subtle} strokeWidth={2.2} />
                </TouchableOpacity>

                {/* Action 2: Image / Photo Icon */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handlePickImage}
                  disabled={isUploadingMedia || sendMessageMutation.isPending}
                  style={styles.capsuleIconBtn}
                  accessibilityLabel="Attach Photo"
                >
                  <ImageIcon size={19} color={colors.subtle} />
                </TouchableOpacity>

                {/* Text Input Field (Flex-1) */}
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

                    const lastAtIndex = text.lastIndexOf('@');
                    if (lastAtIndex !== -1) {
                      const queryAfterAt = text.slice(lastAtIndex + 1);
                      const charBeforeAt = lastAtIndex > 0 ? text[lastAtIndex - 1] : ' ';
                      const isValidPrefix = charBeforeAt === ' ' || charBeforeAt === '\n' || lastAtIndex === 0;
                      if (isValidPrefix && !/\s/.test(queryAfterAt) && queryAfterAt.length <= 25) {
                        setMentionQuery(queryAfterAt);
                        setMentionStartIndex(lastAtIndex);
                      } else {
                        setMentionQuery(null);
                        setMentionStartIndex(null);
                      }
                    } else {
                      setMentionQuery(null);
                      setMentionStartIndex(null);
                    }
                  }}
                  placeholder={t.chat.composerPlaceholder.replace('#{channel}', currentChannel?.name || 'chat')}
                  placeholderTextColor={colors.subtle}
                  style={[styles.composerInput, { color: colors.text }]}
                  multiline
                />

                {/* Action 3: Emoji / Sticker Button (Far right inside capsule) */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setTargetReactMessageId(null);
                    setIsFullEmojiModalVisible(true);
                  }}
                  style={styles.capsuleIconBtn}
                  accessibilityLabel="Choose Emoji"
                >
                  <Smile size={19} color={colors.subtle} />
                </TouchableOpacity>
              </View>

              {/* Right Standalone Action Button: Mic (when empty) vs Send (when typing) */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={
                  (messageInput.trim() || selectedImageUri)
                    ? handleSendMessage
                    : () => {
                        triggerLightHaptic();
                        Alert.alert(
                          'Tin nhắn thoại',
                          'Tính năng ghi âm tin nhắn thoại (Voice Message) đang sẵn sàng trong bản cập nhật kế tiếp.',
                        );
                      }
                }
                disabled={Boolean((messageInput.trim() || selectedImageUri) && (sendMessageMutation.isPending || isUploadingMedia))}
                style={[
                  styles.standaloneActionBtn,
                  (messageInput.trim() || selectedImageUri)
                    ? { backgroundColor: activeCircleBubbleTheme.sendBtnBg }
                    : {
                        backgroundColor: isGlass
                          ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.85)')
                          : colors.surface,
                        borderColor: isGlass
                          ? (isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)')
                          : colors.hairline,
                        borderWidth: 1.2,
                      },
                ]}
                accessibilityLabel={(messageInput.trim() || selectedImageUri) ? 'Send Message' : 'Record Voice Message'}
              >
                {(messageInput.trim() || selectedImageUri) ? (
                  sendMessageMutation.isPending || isUploadingMedia ? (
                    <ActivityIndicator size="small" color={activeCircleBubbleTheme.sendBtnText} />
                  ) : (
                    <Send size={18} color={activeCircleBubbleTheme.sendBtnText} />
                  )
                ) : (
                  <Mic size={20} color={colors.subtle} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

        {/* TAB 2: KHOẢNH KHẮC THƯỜNG NGÀY (AUTHENTIC MOMENTS VIEW) */}
        <View style={{ width: screenWidth, flex: 1, paddingTop: headerHeight }}>
          <MomentsView
            circleId={circleId}
            circleName={circle.name}
            isActive={activeTab === 'moments'}
            selectedMemberId={momentsMemberFilter}
            onSelectMemberId={setMomentsMemberFilter}
          />
        </View>

        {/* TAB 3: TIỆN ÍCH NHÓM */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <ScrollView contentContainerStyle={[styles.toolsContainer, { paddingTop: headerHeight + 12 }]} showsVerticalScrollIndicator={false}>
            <View style={[styles.toolsCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
              {/* Tool 1: Realtime Voice Stage */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleCallComingSoon('audio')}
                style={[styles.toolRow, { borderBottomColor: colors.hairline }]}
              >
                <Radio size={20} color={colors.text} />
                <View style={styles.toolInfo}>
                  <Text style={[styles.toolTitle, { color: colors.text }]}>
                    {t.nav.groupCall}
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.subtle} />
              </TouchableOpacity>

              {/* Tool 2: Photo Album */}
              <View style={[styles.toolRow, { borderBottomColor: colors.hairline }]}>
                <ImageIcon size={20} color={colors.text} />
                <View style={styles.toolInfo}>
                  <Text style={[styles.toolTitle, { color: colors.text }]}>
                    {t.nav.photoAlbum}
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.subtle} />
              </View>

              {/* Tool 3: Calendar Events */}
              <View style={[styles.toolRow, { borderBottomColor: colors.hairline }]}>
                <Calendar size={20} color={colors.text} />
                <View style={styles.toolInfo}>
                  <Text style={[styles.toolTitle, { color: colors.text }]}>
                    {t.nav.calendarEvents}
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.subtle} />
              </View>

              {/* Tool 4: Planning Sheet */}
              <View style={[styles.toolRow, { borderBottomColor: colors.hairline }]}>
                <FileSpreadsheet size={20} color={colors.text} />
                <View style={styles.toolInfo}>
                  <Text style={[styles.toolTitle, { color: colors.text }]}>
                    {t.nav.planningSheet}
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.subtle} />
              </View>

              {/* Tool 5: Lucky Wheel */}
              <View style={[styles.toolRow, { borderBottomColor: 'transparent', borderBottomWidth: 0 }]}>
                <Sparkles size={20} color={colors.text} />
                <View style={styles.toolInfo}>
                  <Text style={[styles.toolTitle, { color: colors.text }]}>
                    {t.nav.luckyWheel}
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.subtle} />
              </View>
            </View>
          </ScrollView>
        </View>
      </ScrollView>

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
            intensity={glassTheme.blur.intensity + 10}
            tint={glassTheme.blur.tint}
            style={[
              styles.actionMenuCard,
              {
                backgroundColor: glassTheme.colors.glassBgSheet,
                borderColor: glassTheme.colors.glassBorder,
              },
            ]}
          >
            {/* Quick Emojis Row: 3 prominent emojis + Full Emoji Picker toggle */}
            <View style={styles.actionEmojisRow}>
              {PROMINENT_QUICK_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  activeOpacity={0.7}
                  onPress={() => handleReact(activeActionMessage.id, emoji)}
                  style={styles.actionEmojiBtn}
                >
                  <Emoji emoji={emoji} size={24} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setTargetReactMessageId(activeActionMessage.id);
                  setActiveActionMessage(null);
                  setIsFullEmojiModalVisible(true);
                }}
                style={[styles.actionEmojiMoreBtn, { backgroundColor: colors.wash, borderColor: colors.hairline }]}
                accessibilityLabel="More Emojis"
              >
                <Smile size={18} color={colors.text} />
              </TouchableOpacity>
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

              {!activeActionMessage?.content?.startsWith?.('[CALL_SUMMARY]:') &&
                !activeActionMessage?.content?.includes?.('"callType"') && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      handleTogglePin(activeActionMessage.id, Boolean(activeActionMessage.isPinned))
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
                )}
            </View>
          </BlurView>
        </TouchableOpacity>
      </Modal>

      {/* Lightbox / Full-screen Image Preview Modal */}
      <Modal
        visible={!!previewingImageUrl}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewingImageUrl(null)}
      >
        <View style={[styles.fullScreenModalBg, { backgroundColor: 'rgba(0, 0, 0, 0.95)' }]}>
          {/* Top Header Bar */}
          <View style={styles.fullScreenHeaderRow}>
            <View />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {Boolean(previewParsed?.pipUrl) && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.fullScreenActionBtn, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
                  onPress={() => {
                    triggerHapticFeedback();
                    setPreviewSwapped((prev) => !prev);
                  }}
                >
                  <RefreshCw size={18} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.fullScreenActionBtn, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
                onPress={() => setPreviewingImageUrl(null)}
              >
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Content: Dual Photo or Standard Image */}
          {previewingImageUrl && (() => {
            if (previewParsed?.pipUrl) {
              const displayMain = previewSwapped ? previewParsed.pipUrl : previewParsed.mainUrl;
              const displayPip = previewSwapped ? previewParsed.mainUrl : previewParsed.pipUrl;
              return (
                <View style={styles.dualPreviewWrapper}>
                  <View
                    style={[
                      styles.dualPreviewContainer,
                      {
                        width: dualPreviewSize,
                        height: dualPreviewSize,
                      },
                    ]}
                  >
                    <RNImage
                      source={{ uri: displayMain }}
                      style={styles.dualPreviewMainImg}
                      resizeMode="cover"
                    />

                    {/* Draggable & Tappable PIP View with Physics */}
                    <MomentFeedPipView
                      pipUrl={displayPip}
                      initialCornerIndex={previewCorner}
                      momentSize={dualPreviewSize}
                      primaryColor={colors.primary}
                      onSwap={() => {
                        triggerHapticFeedback();
                        setPreviewSwapped((prev) => !prev);
                      }}
                      onCornerChange={(newCorner) => setPreviewCorner(newCorner)}
                    />
                  </View>
                </View>
              );
            }

            return (
              <View style={styles.dualPreviewWrapper}>
                <View
                  style={[
                    styles.dualPreviewContainer,
                    {
                      width: dualPreviewSize,
                      height: dualPreviewSize,
                    },
                  ]}
                >
                  <RNImage
                    source={{ uri: previewingImageUrl }}
                    style={styles.dualPreviewMainImg}
                    resizeMode="cover"
                  />
                </View>
              </View>
            );
          })()}
        </View>
      </Modal>

      {/* Circle Switcher Sheet Modal (same as homepage) */}
      <Modal
        visible={circleSwitcherVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCircleSwitcherVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setCircleSwitcherVisible(false)}
        >
          <BlurView
            intensity={glassTheme.blur.intensity + 20}
            tint={glassTheme.blur.tint}
            style={[
              styles.switcherSheet,
              {
                backgroundColor: glassTheme.colors.glassBg,
                borderColor: glassTheme.colors.glassBorder,
              },
            ]}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.hairline }]} />
            <View style={styles.switcherHeader}>
              <Text style={[styles.switcherTitle, { color: colors.text }]}>
                {t.nav.yourCircles}
              </Text>
              <TouchableOpacity
                onPress={() => setCircleSwitcherVisible(false)}
                style={[styles.closeBtn, { backgroundColor: colors.wash }]}
              >
                <Text style={{ color: colors.subtle, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              {myCircles.map((c: any) => {
                const isSelected = c.id === circleId;
                return (
                  <TouchableOpacity
                    key={c.id}
                    activeOpacity={0.75}
                    onPress={() => {
                      setActiveCircle(c);
                      setCircleSwitcherVisible(false);
                      if (c.id !== circleId) {
                        router.replace({
                          pathname: '/circle/[id]' as any,
                          params: { id: c.id },
                        });
                      }
                    }}
                    style={[
                      styles.circleSwitcherItem,
                      {
                        backgroundColor: isSelected ? `${colors.primary}15` : colors.wash,
                        borderColor: isSelected ? colors.primary : colors.hairline,
                      },
                    ]}
                  >
                    <View style={[styles.switcherAvatar, { backgroundColor: colors.primary }]}>
                      <Text style={[styles.switcherAvatarText, { color: colors.onPrimary }]}>
                        {getInitials(c.name)}
                      </Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        numberOfLines={1}
                        style={[styles.switcherCircleName, { color: colors.text }]}
                      >
                        {c.name}
                      </Text>
                      {c.description ? (
                        <Text
                          numberOfLines={1}
                          style={[styles.switcherCircleHandle, { color: colors.subtle }]}
                        >
                          {c.description}
                        </Text>
                      ) : null}
                    </View>
                    {isSelected && (
                      <View style={[styles.checkDot, { backgroundColor: colors.primary }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.switcherActions}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setCircleSwitcherVisible(false);
                  setCreateModalVisible(true);
                }}
                style={[styles.switcherActionBtn, { backgroundColor: colors.primary }]}
              >
                <Plus size={16} color={colors.onPrimary} strokeWidth={2.4} />
                <Text style={[styles.switcherActionBtnText, { color: colors.onPrimary }]}>
                  {t.home.createCircleBtn}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setCircleSwitcherVisible(false);
                  setJoinModalVisible(true);
                }}
                style={[
                  styles.switcherActionBtnSecondary,
                  { borderColor: colors.hairline, backgroundColor: colors.wash },
                ]}
              >
                <KeyRound size={15} color={colors.text} />
                <Text
                  style={[styles.switcherActionBtnSecondaryText, { color: colors.text }]}
                >
                  {t.home.joinWithCodeBtn}
                </Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </TouchableOpacity>
      </Modal>

      {/* Create & Join Circle Modals */}
      <CreateCircleModal />
      <JoinCircleModal />

      {/* Circle Management Modal */}
      <CircleManagementModal />

      {/* Pinned Messages Modal */}
      <PinnedMessagesModal
        visible={isPinnedModalVisible}
        onClose={() => setIsPinnedModalVisible(false)}
        pinnedMessages={pinnedMessages}
        onJumpToMessage={handleJumpToMessage}
        onTogglePin={handleTogglePin}
        colors={colors}
        t={t}
      />

      {/* Full Comprehensive Emoji Picker Modal */}
      <FullEmojiPickerModal
        visible={isFullEmojiModalVisible}
        onClose={() => setIsFullEmojiModalVisible(false)}
        onSelectEmoji={(emoji) => {
          if (targetReactMessageId) {
            handleReact(targetReactMessageId, emoji);
          } else {
            setMessageInput((prev) => prev + emoji);
          }
        }}
      />

      {/* Inline Member Filter Dropdown for Moments Tab */}
      {isMomentsFilterOpen && activeTab === 'moments' && (
        <View style={styles.momentsFilterDropdownOverlay}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setIsMomentsFilterOpen(false)}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              styles.momentsFilterDropdownMenu,
              {
                top: headerHeight + 4,
                backgroundColor: isGlass
                  ? (isDark ? 'rgba(30,30,35,0.96)' : 'rgba(255,255,255,0.96)')
                  : colors.surface,
                borderColor: isGlass
                  ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)')
                  : colors.hairline,
              },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 240 }}>
              {/* Option: Mọi người */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => {
                  setMomentsMemberFilter('all');
                  setIsMomentsFilterOpen(false);
                }}
                style={[
                  styles.dropdownFilterItem,
                  {
                    backgroundColor: momentsMemberFilter === 'all' ? `${colors.primary}18` : 'transparent',
                    borderBottomColor: colors.hairline,
                  },
                ]}
              >
                <View style={[styles.dropdownFilterAvatar, { backgroundColor: `${colors.primary}20` }]}>
                  <Users size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dropdownFilterTitle, { color: colors.text }]}>Mọi người</Text>
                  <Text style={[styles.dropdownFilterSub, { color: colors.subtle }]}>
                    Tất cả khoảnh khắc của nhóm
                  </Text>
                </View>
                {momentsMemberFilter === 'all' && <Check size={16} color={colors.primary} />}
              </TouchableOpacity>

              {/* Members */}
              {members.map((m: any) => {
                const mId = m.userId || m.id || m.user?.id;
                const mName = m.nickname || m.user?.profile?.displayName || m.user?.email?.split('@')[0] || 'Thành viên';
                const avatar = m.user?.profile?.avatarUrl || m.profile?.avatarUrl;
                const isSelected = momentsMemberFilter === mId;
                return (
                  <TouchableOpacity
                    key={mId}
                    activeOpacity={0.75}
                    onPress={() => {
                      setMomentsMemberFilter(mId);
                      setIsMomentsFilterOpen(false);
                    }}
                    style={[
                      styles.dropdownFilterItem,
                      {
                        backgroundColor: isSelected ? `${colors.primary}18` : 'transparent',
                        borderBottomColor: colors.hairline,
                      },
                    ]}
                  >
                    <View style={[styles.dropdownFilterAvatar, { backgroundColor: colors.wash }]}>
                      {avatar ? (
                        <RNImage source={{ uri: avatar }} style={{ width: 28, height: 28, borderRadius: 14 }} />
                      ) : (
                        <Text style={[styles.dropdownFilterAvatarText, { color: colors.text }]}>
                          {mName.substring(0, 2).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={[styles.dropdownFilterTitle, { color: colors.text }]}>{mName}</Text>
                      <Text style={[styles.dropdownFilterSub, { color: colors.subtle }]}>
                        {m.role === 'OWNER' ? 'Trưởng nhóm' : m.role === 'ADMIN' ? 'Quản trị viên' : 'Thành viên'}
                      </Text>
                    </View>
                    {isSelected && <Check size={16} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      )}
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
  floatingHeaderWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: 6,
    overflow: 'hidden',
  },
  floatingHeaderBlur: {
    borderBottomWidth: 0,
  },
  floatingNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 44,
  },
  floatingNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  floatingCenterTabs: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSliderTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  tabSliderItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  tabSliderItemActive: {
    opacity: 1,
    transform: [{ scale: 1.05 }],
  },
  tabSliderItemFaded: {
    opacity: 0.45,
    transform: [{ scale: 0.95 }],
  },
  floatingCircleAvatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  floatingCircleAvatarText: {
    fontSize: 12,
    fontWeight: '800',
  },
  floatingSubHeaderRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    paddingBottom: 4,
  },
  floatingTitlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 18,
    maxWidth: '75%',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  floatingTitleText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  floatingPinnedBannerWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 35,
  },
  pinnedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  momentsFilterDropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 60,
    alignItems: 'center',
  },
  momentsFilterDropdownMenu: {
    position: 'absolute',
    width: 270,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  dropdownFilterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dropdownFilterAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dropdownFilterAvatarText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dropdownFilterTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  dropdownFilterSub: {
    fontSize: 11,
  },
  pinnedBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    paddingRight: 8,
  },
  pinnedBannerText: {
    fontSize: 12,
    fontWeight: '400',
  },
  pinnedCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pinnedCountText: {
    fontSize: 11,
    fontWeight: '600',
  },
  callNotificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  callNotificationTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  callNotificationDuration: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  pinnedBubblePill: {
    position: 'absolute',
    top: -6,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolsCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
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
    borderRadius: 20,
    borderBottomRightRadius: 6,
  },
  firstBubbleMe: {
    borderRadius: 20,
    borderBottomRightRadius: 6,
  },
  middleBubbleMe: {
    borderRadius: 20,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  lastBubbleMe: {
    borderRadius: 20,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  singleBubbleOther: {
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
  },
  firstBubbleOther: {
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
  },
  middleBubbleOther: {
    borderRadius: 20,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
  },
  lastBubbleOther: {
    borderRadius: 20,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
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
    bottom: -9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
  },
  actionEmojiMoreBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
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
  mentionContainer: {
    marginBottom: 4,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  mentionScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mentionPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  mentionPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  composerInputCapsule: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 26,
    borderWidth: 1.2,
    paddingLeft: 8,
    paddingRight: 10,
    paddingVertical: 3,
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    gap: 6,
  },
  plusOutlineCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capsuleIconBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  standaloneActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
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
    paddingRight: 4,
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
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
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
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 4,
    width: 220,
    height: 160,
  },
  bubbleImageContent: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  momentCardContainer: {
    width: 230,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 6,
    padding: 8,
    gap: 6,
  },
  momentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  momentCardAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },
  momentCardAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  momentCardAvatarPlaceholder: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  momentCardAvatarText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  momentCardAuthorName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  momentBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  momentBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  momentCardTimeText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 9.5,
    fontWeight: '500',
  },
  momentCardPhotoFrame: {
    width: 220,
    height: 220,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  momentCardTopOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 12,
    zIndex: 5,
  },
  momentCardOverlayAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  momentCardOverlayAvatarPlaceholder: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  momentCardOverlayAvatarText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  momentCardOverlayAuthorName: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  momentCardOverlayTimeText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 8.5,
    fontWeight: '500',
  },
  momentCardPhotoMain: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  momentCardPhotoEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  momentCardPipBox: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 14,
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
    zIndex: 5,
  },
  momentCardPipImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  momentCardCaptionContainer: {
    position: 'absolute',
    bottom: 6,
    left: 8,
    right: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
    elevation: 8,
  },
  momentCardCaptionPill: {
    maxWidth: '90%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  momentCardCaptionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
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
  fullScreenHeaderRow: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fullScreenActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dualBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  dualBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  dualPreviewWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dualPreviewContainer: {
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  dualPreviewMainImg: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  dualPreviewHintText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 18,
    textAlign: 'center',
  },
  fullScreenImg: {
    width: '100%',
    height: '80%',
    borderRadius: 28,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  switcherSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingHorizontal: 16,
    maxHeight: '80%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  switcherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  switcherTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleSwitcherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  switcherAvatar: {
    width: 38,
    height: 38,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switcherAvatarText: {
    fontSize: 13,
    fontWeight: '800',
  },
  switcherCircleName: {
    fontSize: 14,
    fontWeight: '700',
  },
  switcherCircleHandle: {
    fontSize: 11,
    marginTop: 1,
  },
  checkDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  switcherActions: {
    gap: 8,
    marginTop: 8,
  },
  switcherActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 23,
    gap: 8,
  },
  switcherActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  switcherActionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    gap: 8,
  },
  switcherActionBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
