import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  Share,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
} from 'lucide-react-native';
import { useThemeStore } from '../../src/stores/theme.store';
import { useLanguageStore } from '../../src/stores/language.store';
import { useAuthStore } from '../../src/stores/auth.store';
import { useCircleStore } from '../../src/stores/circle.store';
import {
  useCircleDetailQuery,
  useCircleMembersQuery,
  useCircleMomentsQuery,
  useChannelMessagesQuery,
  useSendMessageMutation,
  useReactMomentMutation,
} from '../../src/hooks/use-circle-queries';
import { CircleManagementModal } from '../../src/components/circle/CircleManagementModal';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type WorkspaceTab = 'chat' | 'moments' | 'tools';

export default function CircleWorkspaceScreen() {
  const router = useRouter();
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

  // Queries
  const { data: circle, isLoading: isLoadingCircle } = useCircleDetailQuery(circleId);
  const { data: members = [] } = useCircleMembersQuery(circleId);
  const { data: moments = [], isLoading: isLoadingMoments } = useCircleMomentsQuery(circleId);

  // Active channel resolution
  const channels = circle?.channels || [];
  const currentChannel =
    channels.find((c) => c.id === selectedChannelId) ||
    channels.find((c) => c.name === 'general') ||
    channels[0] ||
    null;

  const currentChannelId = currentChannel?.id || null;

  // Chat queries
  const { data: messagesData, isLoading: isLoadingMessages } =
    useChannelMessagesQuery(currentChannelId);
  const sendMessageMutation = useSendMessageMutation(currentChannelId);
  const reactMomentMutation = useReactMomentMutation(circleId);

  const messages = messagesData?.items || [];

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
    setMessageInput('');
    try {
      await sendMessageMutation.mutateAsync(content);
    } catch (err: any) {
      Alert.alert(t.common.appName, err?.message || t.common.unknownError);
    }
  };

  const handleReactMoment = (momentId: string, emoji: string) => {
    reactMomentMutation.mutate({ momentId, emoji });
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

  const isOwner = circle.role === 'OWNER';
  const isAdmin = circle.role === 'ADMIN';

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

      {/* TAB 1: CHAT CHANNELS */}
      {activeTab === 'chat' && (
        <View style={styles.chatContainer}>
          {/* Channel selector strip */}
          <View style={[styles.channelStrip, { backgroundColor: colors.canvas }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.channelScroll}>
              {channels.map((chan) => {
                const isCurrent = (chan.id === currentChannelId) || (chan.name === 'general' && !currentChannelId);
                return (
                  <TouchableOpacity
                    key={chan.id}
                    onPress={() => setSelectedChannelId(chan.id)}
                    style={[
                      styles.channelPill,
                      {
                        backgroundColor: isCurrent ? colors.primary : colors.surface,
                        borderColor: isCurrent ? colors.primary : colors.hairline,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.channelPillText,
                        { color: isCurrent ? colors.onPrimary : colors.text },
                      ]}
                    >
                      # {chan.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Messages list */}
          <ScrollView
            style={styles.messagesList}
            contentContainerStyle={styles.messagesScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Channel introduction banner */}
            <View style={[styles.channelIntroCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
              <View style={[styles.hashBox, { backgroundColor: colors.wash }]}>
                <Text style={[styles.hashText, { color: colors.primary }]}>#</Text>
              </View>
              <Text style={[styles.channelIntroTitle, { color: colors.text }]}>
                {t.home.welcomeTitle.replace('{name}', `#${currentChannel?.name || 'general'}`)}
              </Text>
              <Text style={[styles.channelIntroDesc, { color: colors.subtle }]}>
                {currentChannel?.topic || t.circle.generalChannelTopic}
              </Text>
            </View>

            {isLoadingMessages ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
            ) : messages.length === 0 ? (
              <View style={[styles.emptyChatBox, { backgroundColor: colors.wash }]}>
                <Text style={[styles.emptyChatText, { color: colors.subtle }]}>
                  {t.home.feedEmptyDesc}
                </Text>
              </View>
            ) : (
              messages.map((msg: any) => {
                const isMyMsg = msg.senderId === user?.id;
                const senderName = msg.sender?.profile?.displayName || msg.sender?.email || 'User';

                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.messageRow,
                      isMyMsg ? styles.myMessageRow : styles.otherMessageRow,
                    ]}
                  >
                    {!isMyMsg && (
                      <View style={[styles.senderAvatar, { backgroundColor: colors.wash }]}>
                        <Text style={[styles.senderAvatarText, { color: colors.primary }]}>
                          {getInitials(senderName)}
                        </Text>
                      </View>
                    )}
                    <View
                      style={[
                        styles.messageBubble,
                        isMyMsg
                          ? [styles.myBubble, { backgroundColor: colors.primary }]
                          : [styles.otherBubble, { backgroundColor: colors.surface, borderColor: colors.hairline }],
                      ]}
                    >
                      {!isMyMsg && (
                        <Text style={[styles.senderName, { color: colors.primary }]}>
                          {senderName}
                        </Text>
                      )}
                      <Text
                        style={[
                          styles.messageText,
                          { color: isMyMsg ? colors.onPrimary : colors.text },
                        ]}
                      >
                        {msg.content}
                      </Text>
                      <Text
                        style={[
                          styles.timestampText,
                          { color: isMyMsg ? 'rgba(255,255,255,0.7)' : colors.subtle },
                        ]}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Chat Composer */}
          <View style={[styles.composerBar, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
            <TextInput
              value={messageInput}
              onChangeText={setMessageInput}
              placeholder={`${t.home.composerPlaceholder}`}
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
                  size={18}
                  color={messageInput.trim() ? colors.onPrimary : colors.subtle}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* TAB 2: KHOẢNH KHẮC THƯỜNG NGÀY (DAILY MOMENTS / LOCKET) */}
      {activeTab === 'moments' && (
        <ScrollView contentContainerStyle={styles.momentsContainer} showsVerticalScrollIndicator={false}>
          {/* Header banner with camera prompt */}
          <View style={[styles.momentPromptCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
            <View style={styles.momentPromptLeft}>
              <View style={[styles.cameraIconBox, { backgroundColor: `${colors.primary}20` }]}>
                <Camera size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.momentPromptTitle, { color: colors.text }]}>
                  {t.moments.title} · {circle.name}
                </Text>
                <Text style={[styles.momentPromptDesc, { color: colors.subtle }]}>
                  {t.moments.subtitle}
                </Text>
              </View>
            </View>
          </View>

          {isLoadingMoments ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 30 }} />
          ) : moments.length === 0 ? (
            <View style={[styles.emptyMomentsBox, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
              <ImageIcon size={40} color={colors.subtle} />
              <Text style={[styles.emptyMomentsTitle, { color: colors.text }]}>
                {t.moments.emptyCircleTitle}
              </Text>
              <Text style={[styles.emptyMomentsDesc, { color: colors.subtle }]}>
                {t.moments.emptyFeedDesc}
              </Text>
            </View>
          ) : (
            moments.map((m: any) => {
              const authorName = m.user?.profile?.displayName || m.user?.email || 'User';
              return (
                <View
                  key={m.id}
                  style={[styles.momentCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
                >
                  <View style={styles.momentCardHeader}>
                    <View style={styles.momentAuthorRow}>
                      <View style={[styles.avatarSmall, { backgroundColor: colors.wash }]}>
                        <Text style={[styles.avatarSmallText, { color: colors.primary }]}>
                          {getInitials(authorName)}
                        </Text>
                      </View>
                      <View>
                        <Text style={[styles.momentAuthorName, { color: colors.text }]}>
                          {authorName}
                        </Text>
                        <Text style={[styles.momentTime, { color: colors.subtle }]}>
                          {new Date(m.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Caption & Content */}
                  {m.caption ? (
                    <Text style={[styles.momentCaption, { color: colors.text }]}>
                      {m.caption}
                    </Text>
                  ) : null}

                  {/* Reaction bar */}
                  <View style={[styles.reactionRow, { borderTopColor: colors.hairline }]}>
                    {['❤️', '🔥', '👏', '🥰'].map((emoji) => (
                      <TouchableOpacity
                        key={emoji}
                        onPress={() => handleReactMoment(m.id, emoji)}
                        style={[styles.reactionPill, { backgroundColor: colors.wash }]}
                      >
                        <Text style={styles.reactionEmoji}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
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

      {/* Circle Management Modal mounted globally for this workspace */}
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
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
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
  channelStrip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  channelScroll: {
    gap: 8,
  },
  channelPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  channelPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesScrollContent: {
    gap: 12,
    paddingVertical: 14,
  },
  channelIntroCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  hashBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  hashText: {
    fontSize: 22,
    fontWeight: '800',
  },
  channelIntroTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  channelIntroDesc: {
    fontSize: 12,
    textAlign: 'center',
  },
  emptyChatBox: {
    padding: 24,
    borderRadius: 18,
    alignItems: 'center',
  },
  emptyChatText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 2,
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  senderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  senderAvatarText: {
    fontSize: 11,
    fontWeight: '700',
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    gap: 4,
  },
  myBubble: {
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '700',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 19,
  },
  timestampText: {
    fontSize: 10,
    alignSelf: 'flex-end',
  },
  composerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  composerInput: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  momentsContainer: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  momentPromptCard: {
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
  },
  momentPromptLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cameraIconBox: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  momentPromptTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  momentPromptDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyMomentsBox: {
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: 8,
  },
  emptyMomentsTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyMomentsDesc: {
    fontSize: 12,
    textAlign: 'center',
  },
  momentCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  momentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  momentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmallText: {
    fontSize: 12,
    fontWeight: '700',
  },
  momentAuthorName: {
    fontSize: 13,
    fontWeight: '700',
  },
  momentTime: {
    fontSize: 11,
  },
  momentCaption: {
    fontSize: 14,
    lineHeight: 20,
  },
  reactionRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  reactionPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reactionEmoji: {
    fontSize: 16,
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
});
