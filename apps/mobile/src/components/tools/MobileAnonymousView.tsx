import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Heart,
  Plus,
  Trash2,
  X,
  Send,
  Sparkles,
  Smile,
} from 'lucide-react-native';
import {
  getAnonymousPostsApi,
  createAnonymousPostApi,
  deleteAnonymousPostApi,
  reactAnonymousPostApi,
} from '../../services/circle-tools.service';
import { AnonymousPostEntity } from '@circle/types';
import { getSocket } from '../../services/socket';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';
import { FullEmojiPickerModal } from '../ui/FullEmojiPickerModal';
import { PROMINENT_QUICK_EMOJIS } from '@circle/shared';

interface MobileAnonymousViewProps {
  circleId: string;
  onBack?: () => void;
  onRegisterBack?: (handler: (() => boolean) | null) => void;
}

interface MobileThemeColors {
  bg: string;
  border: string;
  text: string;
  tagBg: string;
  tagText: string;
}

const THEME_PRESETS: Record<string, { light: MobileThemeColors; dark: MobileThemeColors }> = {
  sunset: {
    light: {
      bg: '#FEF3C7',
      border: '#FDE68A',
      text: '#78350F',
      tagBg: '#FDE68A',
      tagText: '#92400E',
    },
    dark: {
      bg: '#2A1B12',
      border: 'rgba(245, 158, 11, 0.35)',
      text: '#FEF3C7',
      tagBg: 'rgba(245, 158, 11, 0.20)',
      tagText: '#FDE68A',
    },
  },
  ocean: {
    light: {
      bg: '#E0F2FE',
      border: '#BAE6FD',
      text: '#0C4A6E',
      tagBg: '#BAE6FD',
      tagText: '#0369A1',
    },
    dark: {
      bg: '#0E2333',
      border: 'rgba(14, 165, 233, 0.35)',
      text: '#E0F2FE',
      tagBg: 'rgba(14, 165, 233, 0.20)',
      tagText: '#BAE6FD',
    },
  },
  lavender: {
    light: {
      bg: '#F3E8FF',
      border: '#E9D5FF',
      text: '#581C87',
      tagBg: '#E9D5FF',
      tagText: '#7E22CE',
    },
    dark: {
      bg: '#231533',
      border: 'rgba(168, 85, 247, 0.35)',
      text: '#F3E8FF',
      tagBg: 'rgba(168, 85, 247, 0.20)',
      tagText: '#E9D5FF',
    },
  },
  rose: {
    light: {
      bg: '#FFE4E6',
      border: '#FECDD3',
      text: '#881337',
      tagBg: '#FECDD3',
      tagText: '#BE123C',
    },
    dark: {
      bg: '#2E141E',
      border: 'rgba(244, 63, 94, 0.35)',
      text: '#FFE4E6',
      tagBg: 'rgba(244, 63, 94, 0.20)',
      tagText: '#FECDD3',
    },
  },
  mint: {
    light: {
      bg: '#D1FAE5',
      border: '#A7F3D0',
      text: '#064E3B',
      tagBg: '#A7F3D0',
      tagText: '#047857',
    },
    dark: {
      bg: '#0E261E',
      border: 'rgba(16, 185, 129, 0.35)',
      text: '#D1FAE5',
      tagBg: 'rgba(16, 185, 129, 0.20)',
      tagText: '#A7F3D0',
    },
  },
};

const THEME_IDS = ['sunset', 'ocean', 'lavender', 'rose', 'mint'];

const getMobileTheme = (id?: string | null, isDark?: boolean): MobileThemeColors => {
  const preset = THEME_PRESETS[id || 'sunset'] || THEME_PRESETS.sunset!;
  return isDark ? preset.dark : preset.light;
};

const getThemeName = (id: string, t: any): string => {
  switch (id) {
    case 'sunset':
      return t.collab?.anonymousThemeSunset || 'Hoàng hôn';
    case 'ocean':
      return t.collab?.anonymousThemeOcean || 'Đại dương';
    case 'lavender':
      return t.collab?.anonymousThemeLavender || 'Oải hương';
    case 'rose':
      return t.collab?.anonymousThemeRose || 'Hoa hồng';
    case 'mint':
      return t.collab?.anonymousThemeMint || 'Bạc hà';
    default:
      return id;
  }
};

const formatPostDate = (isoString: string) => {
  const d = new Date(isoString);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${hours}:${minutes} ${day}/${month}/${year}`;
};

export const MobileAnonymousView: React.FC<MobileAnonymousViewProps> = ({ circleId, onBack, onRegisterBack }) => {
  const { colors, resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const { t } = useLanguageStore();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [posts, setPosts] = useState<AnonymousPostEntity[]>([]);

  useEffect(() => {
    let activeSocket: any = null;
    const handleReactionUpdated = (data: any) => {
      if (data.circleId === circleId) {
        loadPosts();
      }
    };

    getSocket().then((s) => {
      if (!s) return;
      activeSocket = s;
      s.on('circle:anonymous-post-reaction-updated', handleReactionUpdated);
    });

    return () => {
      if (activeSocket) {
        activeSocket.off('circle:anonymous-post-reaction-updated', handleReactionUpdated);
      }
    };
  }, [circleId]);

  const handleToggleReaction = async (postId: string, emoji: string) => {
    Haptics.selectionAsync();

    // Optimistic UI update: Rule 1 reaction per user
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const curReactions = p.reactions ? [...p.reactions] : [];
        const currentlyUserReacted = curReactions.find((r) => r.userReacted);

        let nextReactions: typeof curReactions = [];

        if (currentlyUserReacted && currentlyUserReacted.emoji === emoji) {
          // User unreacts their current emoji
          nextReactions = curReactions
            .map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1, userReacted: false } : r))
            .filter((r) => r.count > 0);
        } else {
          // Remove old reaction if exists
          const cleaned = curReactions
            .map((r) => (r.userReacted ? { ...r, count: r.count - 1, userReacted: false } : r))
            .filter((r) => r.count > 0);

          const existingTarget = cleaned.find((r) => r.emoji === emoji);
          if (existingTarget) {
            nextReactions = cleaned.map((r) =>
              r.emoji === emoji ? { ...r, count: r.count + 1, userReacted: true } : r,
            );
          } else {
            nextReactions = [...cleaned, { emoji, count: 1, userReacted: true }];
          }
        }

        return { ...p, reactions: nextReactions };
      }),
    );

    try {
      await reactAnonymousPostApi(circleId, postId, emoji);
    } catch {
      loadPosts();
    }
  };
  const [isLoading, setIsLoading] = useState(true);

  // Quick reaction popup & Full emoji picker
  const [activeQuickReactionPostId, setActiveQuickReactionPostId] = useState<string | null>(null);
  const [fullEmojiTargetPostId, setFullEmojiTargetPostId] = useState<string | null>(null);

  // Compose modal
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const [content, setContent] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('sunset');

  useEffect(() => {
    if (onRegisterBack) {
      if (isComposeModalOpen) {
        onRegisterBack(() => {
          setIsComposeModalOpen(false);
          return true;
        });
      } else {
        onRegisterBack(null);
      }
    }
    return () => onRegisterBack?.(null);
  }, [isComposeModalOpen, onRegisterBack]);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      const data = await getAnonymousPostsApi(circleId);
      setPosts(data);
    } catch (err: any) {
      Alert.alert(t.common.error, err.message || t.collab.loadNotesError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [circleId]);

  const handleCreatePost = async () => {
    if (!content.trim()) {
      Alert.alert(t.common.notice, t.collab.anonymousContentRequired || 'Vui lòng nhập nội dung tâm sự');
      return;
    }

    try {
      await createAnonymousPostApi(circleId, {
        content: content.trim(),
        cardTheme: selectedTheme,
      });

      setContent('');
      setIsComposeModalOpen(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadPosts();
    } catch (err: any) {
      Alert.alert(t.common.error, err.message || t.collab.sendNoteError);
    }
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert(t.collab.anonymousRemoveAction, t.collab.anonymousRemoveConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.collab.anonymousRemoveAction,
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAnonymousPostApi(circleId, postId);
            loadPosts();
          } catch (err: any) {
            Alert.alert(t.common.error, err.message || t.collab.anonymousRemoveError || 'Không thể gỡ bài viết');
          }
        },
      },
    ]);
  };

  const insets = useSafeAreaInsets();
  const topClearance = Math.max(insets.top + 8, 16) + 38 + 14;
  const bottomClearance = Math.max(insets.bottom + 40, 48);

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      {/* Floating Top Header (Bỏ khung, ghi tên Điều muốn nói như Lịch nhóm, không có text Tiện ích nhóm, bỏ nút X) */}
      <View
        style={{
          position: 'absolute',
          top: Math.max(insets.top + 8, 16),
          left: 16,
          right: 16,
          zIndex: 50,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          {/* Nút Quay lại (< icon only) */}
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => onBack?.()}
            style={[
              styles.headerIconBtn,
              { backgroundColor: isDark ? 'rgba(29, 29, 33, 0.92)' : 'rgba(255, 255, 255, 0.94)' },
            ]}
            accessibilityLabel={t.common.back}
          >
            <ArrowLeft size={16} color={colors.text} />
          </TouchableOpacity>

          {/* CHỮ ĐIỀU MUỐN NÓI BỎ KHUNG, GHI DẠNG LABEL NHƯ LỊCH NHÓM */}
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
              {t.collab.anonymousTitle || 'Điều muốn nói'}
            </Text>
          </View>
        </View>

        {/* Nút Tạo thiệp tròn góc phải */}
        <TouchableOpacity
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => setIsComposeModalOpen(true)}
          style={[
            styles.headerIconBtn,
            { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}
          accessibilityLabel={t.collab.createAnonymousNote}
        >
          <Plus size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Scroll-under Content Layer */}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: topClearance,
            paddingBottom: bottomClearance,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : posts.length > 0 ? (
          <View style={{ gap: 12 }}>
            {posts.map((post) => {
              const th = getMobileTheme(post.cardTheme, isDark);
              return (
                <View
                  key={post.id}
                  style={[
                    styles.postCard,
                    { backgroundColor: th.bg, borderColor: th.border },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.tag, { backgroundColor: th.tagBg }]}>
                      <Text style={[styles.tagText, { color: th.tagText }]}>
                        {t.nav.anonymousSender}
                      </Text>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleDeletePost(post.id)}
                      accessibilityLabel={t.collab.anonymousRemoveTooltip}
                    >
                      <Trash2 size={14} color={isDark ? '#94A3B8' : '#94A3B8'} />
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.cardContent, { color: th.text }]}>
                    {post.content}
                  </Text>

                  {/* Chân thiệp: Đẩy phần thả icon xuống góc trái (bỏ text Điều muốn nói), góc phải là ngày giờ */}
                  <View style={[styles.cardFooter, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, flex: 1 }}>
                      {(post.reactions || []).map((rx) => (
                        <TouchableOpacity
                          key={rx.emoji}
                          activeOpacity={0.7}
                          onPress={() => handleToggleReaction(post.id, rx.emoji)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 3,
                            paddingHorizontal: 7,
                            paddingVertical: 2,
                            borderRadius: 12,
                            backgroundColor: rx.userReacted
                              ? (isDark ? 'rgba(13, 148, 136, 0.28)' : 'rgba(13, 148, 136, 0.18)')
                              : (isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.75)'),
                            borderWidth: 1,
                            borderColor: rx.userReacted
                              ? '#0D9488'
                              : (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'),
                          }}
                        >
                          <Text style={{ fontSize: 12 }}>{rx.emoji}</Text>
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: '700',
                              color: rx.userReacted ? '#0D9488' : (isDark ? '#94A3B8' : '#64748B'),
                            }}
                          >
                            {rx.count}
                          </Text>
                        </TouchableOpacity>
                      ))}

                      {/* Nút Phản hồi: Thay thế icon đã chọn vào vị trí trái tim, Long Press = mở quick reaction sheet/popup */}
                      {(() => {
                        const myReaction = post.reactions?.find((r) => r.userReacted);
                        return (
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => handleToggleReaction(post.id, myReaction ? myReaction.emoji : '❤️')}
                            onLongPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                              setActiveQuickReactionPostId(post.id);
                            }}
                            delayLongPress={250}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 14,
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: myReaction
                                ? (isDark ? 'rgba(13, 148, 136, 0.28)' : 'rgba(13, 148, 136, 0.18)')
                                : (isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.75)'),
                              borderWidth: 1,
                              borderColor: myReaction
                                ? '#0D9488'
                                : (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)'),
                            }}
                            accessibilityLabel={
                              myReaction
                                ? `Đã thả ${myReaction.emoji} (Chạm để gỡ)`
                                : 'Thả tim (Nhấn giữ để chọn biểu cảm)'
                            }
                          >
                            {myReaction ? (
                              <Text style={{ fontSize: 14 }}>{myReaction.emoji}</Text>
                            ) : (
                              <Heart
                                size={13}
                                color={isDark ? '#94A3B8' : '#64748B'}
                              />
                            )}
                          </TouchableOpacity>
                        );
                      })()}
                    </View>

                    <Text style={[styles.footerText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                      {formatPostDate(post.postedAt)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={[styles.emptyContainer, { backgroundColor: colors.canvas }]}>
            <Heart size={48} color={isDark ? '#475569' : '#94A3B8'} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.collab.notesEmptyTitle}</Text>
            <Text style={[styles.emptySub, { color: colors.subtle }]}>
              {t.collab.notesEmptyDesc}
            </Text>
            <TouchableOpacity
              style={[styles.createEmptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => setIsComposeModalOpen(true)}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.createEmptyText}>{t.collab.createAnonymousNote}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Quick Reaction Popup Modal (Telegram/iMessage style) */}
      <Modal
        visible={Boolean(activeQuickReactionPostId)}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveQuickReactionPostId(null)}
      >
        <TouchableOpacity
          style={styles.quickReactionOverlay}
          activeOpacity={1}
          onPress={() => setActiveQuickReactionPostId(null)}
        >
          <View style={styles.quickReactionPill}>
            {PROMINENT_QUICK_EMOJIS.map((em) => (
              <TouchableOpacity
                key={em}
                activeOpacity={0.6}
                onPress={() => {
                  if (activeQuickReactionPostId) {
                    handleToggleReaction(activeQuickReactionPostId, em);
                    setActiveQuickReactionPostId(null);
                  }
                }}
                style={styles.quickReactionItem}
              >
                <Text style={{ fontSize: 22 }}>{em}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => {
                const targetId = activeQuickReactionPostId;
                setActiveQuickReactionPostId(null);
                setFullEmojiTargetPostId(targetId);
              }}
              style={[styles.quickReactionItem, { paddingHorizontal: 8 }]}
              accessibilityLabel={t.emoji.addOtherEmoji}
            >
              <Smile size={20} color={isDark ? '#94A3B8' : '#64748B'} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setIsComposeModalOpen(true)}
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            bottom: Math.max(insets.bottom + 16, 24),
            right: 18,
          },
        ]}
      >
        <Plus size={18} color="#FFF" />
        <Text style={styles.fabText}>{t.collab.anonymousComposeSubmit}</Text>
      </TouchableOpacity>

      {/* Compose Modal - Mở trượt lên chuẩn Apple Sheet như Tạo sự kiện */}
      <Modal
        visible={isComposeModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => {
          Keyboard.dismiss();
          setIsComposeModalOpen(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          {/* Vùng mờ phía trên để chạm đóng */}
          <TouchableOpacity
            style={styles.modalBackdropTouch}
            activeOpacity={1}
            onPress={() => {
              Keyboard.dismiss();
              setIsComposeModalOpen(false);
            }}
          />

          <View style={[styles.appleModalContent, { backgroundColor: isDark ? colors.canvas : '#F2F2F7' }]}>
            {/* Apple Navigation Bar */}
            <View style={[styles.appleNavBar, { backgroundColor: colors.surface, borderBottomColor: colors.hairline }]}>
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setIsComposeModalOpen(false);
                }}
                style={styles.appleNavBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[styles.appleCancelText, { color: colors.primary }]}>{t.common.cancel}</Text>
              </TouchableOpacity>

              <Text style={[styles.appleNavTitle, { color: colors.text }]} numberOfLines={1}>
                {t.collab.anonymousComposeTitle}
              </Text>

              <TouchableOpacity
                onPress={handleCreatePost}
                style={styles.appleNavBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[styles.appleAddText, { color: colors.primary }]}>
                  {t.collab.anonymousComposeSubmit}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={[styles.appleScrollView, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}
            >
              {/* Group 1: Theme Picker */}
              <View style={[styles.appleGroupCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                <Text style={[styles.label, { color: colors.subtle }]}>{t.collab.anonymousThemeLabel}</Text>
                <View style={styles.themesRow}>
                  {THEME_IDS.map((id) => {
                    const th = getMobileTheme(id, isDark);
                    const isSelected = selectedTheme === id;
                    return (
                      <TouchableOpacity
                        key={id}
                        activeOpacity={0.7}
                        style={[
                          styles.themeBtn,
                          { backgroundColor: th.bg, borderColor: th.border },
                          isSelected && {
                            borderWidth: 2,
                            borderColor: isDark ? '#FFFFFF' : '#0F172A',
                          },
                        ]}
                        onPress={() => setSelectedTheme(id)}
                      >
                        <Text style={[styles.themeBtnText, { color: th.text }]}>
                          {getThemeName(id, t)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Group 2: Content TextInput */}
              <View style={[styles.appleGroupCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                <Text style={[styles.label, { color: colors.subtle }]}>{t.collab.anonymousContentLabel}</Text>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: colors.canvas,
                      borderColor: colors.hairline,
                      color: colors.text,
                    },
                  ]}
                  placeholder={t.collab.anonymousContentExample}
                  placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                  multiline
                  numberOfLines={5}
                  maxLength={1000}
                  value={content}
                  onChangeText={setContent}
                />
                <Text style={[styles.charCount, { color: colors.subtle }]}>
                  {t.collab.anonymousCharCount.replace('{count}', String(content.length))}
                </Text>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Full Emoji Picker Modal */}
      <FullEmojiPickerModal
        visible={Boolean(fullEmojiTargetPostId)}
        onClose={() => setFullEmojiTargetPostId(null)}
        onSelectEmoji={(emoji) => {
          if (fullEmojiTargetPostId) {
            handleToggleReaction(fullEmojiTargetPostId, emoji);
            setFullEmojiTargetPostId(null);
          }
        }}
        title={t.emoji.title}
      />
    </View>
  );
};

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    backgroundColor: colors.surface,
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  screenSub: {
    fontSize: 11,
    color: colors.subtle,
    marginTop: 2,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 16,
  },
  fab: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 20,
  },
  fabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  postCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardContent: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
    flexShrink: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  footerText: {
    fontSize: 10,
    color: colors.subtle,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: colors.subtle,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  createEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 16,
  },
  createEmptyText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalBackdropTouch: {
    flex: 1,
  },
  appleModalContent: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    height: '92%',
    overflow: 'hidden',
  },
  appleNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  appleNavBtn: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    minWidth: 44,
  },
  appleNavTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  appleCancelText: {
    fontSize: 15,
    fontWeight: '400',
  },
  appleAddText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
  },
  appleScrollView: {
    padding: 16,
  },
  appleGroupCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.subtle,
    marginBottom: 8,
  },
  themesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  themeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  themeBtnSelected: {
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  themeBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textArea: {
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 10,
    color: colors.subtle,
    textAlign: 'right',
    marginTop: 6,
  },

  reactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
  },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: isDark ? colors.elevated : 'rgba(255,255,255,0.6)',
  },
  reactionBtnActive: {
    backgroundColor: isDark ? colors.surface : '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.subtle,
  },
  reactionCountActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  quickReactionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickReactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
  },
  quickReactionItem: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 16,
  },
});