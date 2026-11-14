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
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
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
      bg: '#3B1A06',
      border: '#78350F',
      text: '#FEF3C7',
      tagBg: 'rgba(251, 191, 36, 0.25)',
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
      bg: '#08283E',
      border: '#0369A1',
      text: '#E0F2FE',
      tagBg: 'rgba(56, 189, 248, 0.25)',
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
      bg: '#2E094F',
      border: '#6B21A8',
      text: '#F3E8FF',
      tagBg: 'rgba(192, 132, 252, 0.25)',
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
      bg: '#3E0818',
      border: '#9F1239',
      text: '#FFE4E6',
      tagBg: 'rgba(251, 113, 133, 0.25)',
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
      bg: '#03261D',
      border: '#047857',
      text: '#D1FAE5',
      tagBg: 'rgba(52, 211, 153, 0.25)',
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
      return t.chat?.anonymousThemeSunset || 'Hoàng hôn';
    case 'ocean':
      return t.chat?.anonymousThemeOcean || 'Đại dương';
    case 'lavender':
      return t.chat?.anonymousThemeLavender || 'Oải hương';
    case 'rose':
      return t.chat?.anonymousThemeRose || 'Hoa hồng';
    case 'mint':
      return t.chat?.anonymousThemeMint || 'Bạc hà';
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

export const MobileAnonymousView: React.FC<MobileAnonymousViewProps> = ({ circleId }) => {
  const { colors, resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const { t } = useLanguageStore();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [posts, setPosts] = useState<AnonymousPostEntity[]>([]);

  useEffect(() => {
    let activeSocket: any = null;
    const handleReactionUpdated = (data: any) => {
      if (data.circleId === circleId) {
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id !== data.postId) return p;
            return {
              ...p,
              reactions: data.reactions,
            };
          }),
        );
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

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const curReactions = p.reactions ? [...p.reactions] : [];
        const existing = curReactions.find((r) => r.emoji === emoji);
        let nextReactions: any[];
        if (existing) {
          if (existing.userReacted) {
            nextReactions = curReactions
              .map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1, userReacted: false } : r))
              .filter((r) => r.count > 0);
          } else {
            nextReactions = curReactions.map((r) =>
              r.emoji === emoji ? { ...r, count: r.count + 1, userReacted: true } : r,
            );
          }
        } else {
          nextReactions = [...curReactions, { emoji, count: 1, userReacted: true }];
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

  // Full emoji picker
  const [fullEmojiTargetPostId, setFullEmojiTargetPostId] = useState<string | null>(null);

  // Compose modal
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const [content, setContent] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('sunset');

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
            Alert.alert(t.common.error, err.message || 'Không thể gỡ bài viết');
          }
        },
      },
    ]);
  };

  const insets = useSafeAreaInsets();
  const topClearance = Math.max(insets.top + 8, 16) + 38 + 14;
  const bottomClearance = Math.max(insets.bottom + 88, 96);

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
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
          <ActivityIndicator size="large" color="#475569" style={{ marginTop: 40 }} />
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

                  {/* Reactions Bar */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 10 }}>
                    {(post.reactions || []).map((rx) => (
                      <TouchableOpacity
                        key={rx.emoji}
                        activeOpacity={0.7}
                        onPress={() => handleToggleReaction(post.id, rx.emoji)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 16,
                          backgroundColor: rx.userReacted
                            ? (isDark ? 'rgba(13, 148, 136, 0.28)' : 'rgba(13, 148, 136, 0.18)')
                            : (isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.75)'),
                          borderWidth: 1,
                          borderColor: rx.userReacted
                            ? '#0D9488'
                            : (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'),
                        }}
                      >
                        <Text style={{ fontSize: 13 }}>{rx.emoji}</Text>
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
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.75)',
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                        paddingHorizontal: 4,
                        paddingVertical: 1,
                      }}
                    >
                      {PROMINENT_QUICK_EMOJIS.slice(0, 4).map((em) => (
                        <TouchableOpacity
                          key={em}
                          activeOpacity={0.6}
                          onPress={() => handleToggleReaction(post.id, em)}
                          style={{ paddingHorizontal: 4, paddingVertical: 2 }}
                        >
                          <Text style={{ fontSize: 13 }}>{em}</Text>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity
                        activeOpacity={0.6}
                        onPress={() => setFullEmojiTargetPostId(post.id)}
                        style={{ paddingHorizontal: 4, paddingVertical: 2 }}
                        accessibilityLabel={t.emoji.addOtherEmoji}
                      >
                        <Smile size={13} color={isDark ? '#94A3B8' : '#64748B'} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={[styles.cardFooter, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Sparkles size={11} color={isDark ? '#94A3B8' : '#64748B'} />
                      <Text style={[styles.footerText, { color: isDark ? '#94A3B8' : '#64748B' }]}>{t.collab.anonymousCardTag}</Text>
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

      {/* Compose Modal */}
      <Modal visible={isComposeModalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderTopColor: colors.hairline }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t.collab.anonymousComposeTitle}</Text>
              <TouchableOpacity onPress={() => setIsComposeModalOpen(false)}>
                <X size={20} color={colors.subtle} />
              </TouchableOpacity>
            </View>

            {/* Theme Picker */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.subtle }]}>{t.collab.anonymousThemeLabel}</Text>
              <View style={styles.themesRow}>
                {THEME_IDS.map((id) => {
                  const th = getMobileTheme(id, isDark);
                  const isSelected = selectedTheme === id;
                  return (
                    <TouchableOpacity
                      key={id}
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

            <View style={styles.formGroup}>
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
                numberOfLines={4}
                maxLength={1000}
                value={content}
                onChangeText={setContent}
              />
              <Text style={[styles.charCount, { color: colors.subtle }]}>
                {t.collab.anonymousCharCount.replace('{count}', String(content.length))}
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsComposeModalOpen(false)}
              >
                <Text style={[styles.cancelText, { color: colors.subtle }]}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handleCreatePost}>
                <Send size={14} color="#FFFFFF" />
                <Text style={styles.submitText}>{t.collab.anonymousComposeSubmit}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    borderBottomColor: '#E2E8F0',
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.subtle,
    marginBottom: 6,
  },
  themesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  themeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
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
    fontSize: 13,
    color: colors.text,
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 10,
    color: colors.subtle,
    textAlign: 'right',
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 13,
    color: colors.subtle,
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  reactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  reactionBtnActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0D9488',
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  reactionCountActive: {
    color: '#0D9488',
    fontWeight: '700',
  },
});