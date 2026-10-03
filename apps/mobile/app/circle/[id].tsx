import React, { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react-native';
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
} from '../../src/hooks/use-circle-queries';
import { CircleManagementModal } from '../../src/components/circle/CircleManagementModal';
import { LocketMomentsView } from '../../src/components/moment/LocketMomentsView';

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
            msg.sender?.email === currentUserEmail)),
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
  showTimestamp: boolean;
  hasReactions: boolean;
  colors: any;
  onToggleTimestamp: () => void;
  onLongPress: () => void;
  onSwipeReply: () => void;
}

function MobileSwipeMessageBubble({
  msg,
  allMessages,
  isSenderMe,
  isFirst,
  isLast,
  isSingle,
  showTimestamp,
  hasReactions,
  colors,
  onToggleTimestamp,
  onLongPress,
  onSwipeReply,
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
        return gestureState.dx > 15 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
      },
      onPanResponderTerminationRequest: () => false,
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
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.surface, borderColor: colors.hairline },
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

            <Text
              style={[
                styles.messageText,
                { color: isSenderMe ? colors.onPrimary : colors.text },
              ]}
            >
              {msg.content}
            </Text>

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

      {/* Sent Timestamp */}
      {showTimestamp && (
        <Text
          style={[
            styles.timestampText,
            {
              color: colors.subtle,
              marginTop: 2,
              marginHorizontal: 4,
              alignSelf: isSenderMe ? 'flex-end' : 'flex-start',
            },
          ]}
        >
          {new Date(msg.sentAt || msg.createdAt || Date.now()).toLocaleTimeString(
            [],
            { hour: '2-digit', minute: '2-digit' },
          )}
        </Text>
      )}
    </View>
  );
}

export default function CircleWorkspaceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const circleId = id || '';

  const { colors, resolvedTheme } = useThemeStore();
  const t = useLanguageStore((s) => s.t);
  const user = useAuthStore((s) => s.user);
  const isDark = resolvedTheme === 'dark';

  const setActiveCircle = useCircleStore((s) => s.setActiveCircle);
  const setManageModalVisible = useCircleStore((s) => s.setManageModalVisible);

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('chat');
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [replyingMessage, setReplyingMessage] = useState<any | null>(null);
  const [activeActionMessage, setActiveActionMessage] = useState<any | null>(null);
  const [activeTimestampMessageId, setActiveTimestampMessageId] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);

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

  const { data: messagesData, isLoading: isLoadingMessages } =
    useChannelMessagesQuery(currentChannelId);
  const sendMessageMutation = useSendMessageMutation(currentChannelId);
  const reactMessageMutation = useReactMessageMutation(currentChannelId);
  const pinMessageMutation = usePinMessageMutation(currentChannelId);

  const messages = messagesData?.messages || (messagesData as any)?.items || [];

  const clusters = buildMobileClusters(messages, user?.id, user?.email);

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

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 60);
    }
  }, [messages.length, currentChannelId]);

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

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !currentChannelId) return;
    const content = messageInput;
    const replyToId = replyingMessage?.id;
    setMessageInput('');
    setReplyingMessage(null);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 50);
    try {
      await sendMessageMutation.mutateAsync({ content, replyToId });
    } catch (err: any) {
      Alert.alert(t.common.appName, err?.message || t.common.unknownError);
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

          <View style={[styles.miniAvatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.miniAvatarText, { color: colors.onPrimary }]}>
              {getInitials(circle.name)}
            </Text>
          </View>

          <View style={styles.headerTitleBlock}>
            <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.text }]}>
              {circle.name}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={handleShareInviteCode}
            style={[styles.iconButton, { backgroundColor: colors.wash }]}
          >
            <Share2 size={18} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleOpenSettings}
            style={[styles.iconButton, { backgroundColor: colors.wash }]}
          >
            <Settings size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

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
            onContentSizeChange={() => {
              scrollViewRef.current?.scrollToEnd({ animated: false });
            }}
          >
            {isLoadingMessages ? (
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
              clusters.map((cluster, clusterIdx) => {
                const isSenderMe = cluster.isSenderMe;

                if (isSenderMe) {
                  return (
                    <View
                      key={`mobile-cluster-me-${clusterIdx}`}
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
                            key={msg.id}
                            msg={msg}
                            allMessages={messages}
                            isSenderMe={true}
                            isFirst={isFirst}
                            isLast={isLast}
                            isSingle={isSingle}
                            showTimestamp={showTimestamp}
                            hasReactions={hasReactions}
                            colors={colors}
                            onToggleTimestamp={() =>
                              setActiveTimestampMessageId((prev) => (prev === msg.id ? null : msg.id))
                            }
                            onLongPress={() => setActiveActionMessage(msg)}
                            onSwipeReply={() => setReplyingMessage(msg)}
                          />
                        );
                      })}
                    </View>
                  );
                }

                // Other user's cluster
                return (
                  <View
                    key={`mobile-cluster-other-${clusterIdx}`}
                    style={styles.clusterContainerOther}
                  >
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
                            key={msg.id}
                            msg={msg}
                            allMessages={messages}
                            isSenderMe={false}
                            isFirst={isFirst}
                            isLast={isLast}
                            isSingle={isSingle}
                            showTimestamp={showTimestamp}
                            hasReactions={hasReactions}
                            colors={colors}
                            onToggleTimestamp={() =>
                              setActiveTimestampMessageId((prev) => (prev === msg.id ? null : msg.id))
                            }
                            onLongPress={() => setActiveActionMessage(msg)}
                            onSwipeReply={() => setReplyingMessage(msg)}
                          />
                        );
                      })}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Floating Rounded Composer Area */}
          <View
            style={[
              styles.composerFloatingContainer,
              { paddingBottom: isKeyboardVisible ? 6 : (insets.bottom > 0 ? insets.bottom + 2 : 10) },
            ]}
          >
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
              <TextInput
                value={messageInput}
                onChangeText={setMessageInput}
                placeholder={t.chat.composerPlaceholder.replace('#{channel}', currentChannel?.name || 'chat')}
                placeholderTextColor={colors.subtle}
                style={[styles.composerInput, { color: colors.text }]}
                multiline
              />
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSendMessage}
                disabled={!messageInput.trim() || sendMessageMutation.isPending}
                style={[
                  styles.sendBtn,
                  {
                    backgroundColor:
                      messageInput.trim() && !sendMessageMutation.isPending
                        ? colors.primary
                        : colors.wash,
                  },
                ]}
              >
                {sendMessageMutation.isPending ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <Send
                    size={17}
                    color={messageInput.trim() ? colors.onPrimary : colors.subtle}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* TAB 2: KHOẢNH KHẮC THƯỜNG NGÀY (AUTHENTIC LOCKET VIEW) */}
      {activeTab === 'moments' && (
        <LocketMomentsView circleId={circleId} circleName={circle.name} />
      )}

      {/* TAB 3: TIỆN ÍCH NHÓM */}
      {activeTab === 'tools' && (
        <ScrollView contentContainerStyle={styles.toolsContainer} showsVerticalScrollIndicator={false}>
          {/* Tool 1: Realtime Voice Stage */}
          <View style={[styles.toolCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
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
          </View>

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
});
