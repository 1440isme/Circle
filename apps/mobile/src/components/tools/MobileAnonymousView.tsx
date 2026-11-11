import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Heart,
  Plus,
  Trash2,
  X,
  ShieldCheck,
  Send,
  Sparkles,
  Check,
} from 'lucide-react-native';
import {
  getAnonymousPostsApi,
  createAnonymousPostApi,
  deleteAnonymousPostApi,
} from '../../services/circle-tools.service';
import { AnonymousPostEntity } from '@circle/types';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';


interface MobileAnonymousViewProps {
  circleId: string;
}

interface MobileTheme {
  id: string;
  name: string;
  bg: string;
  border: string;
  text: string;
  mutedText: string;
  tagBg: string;
  tagText: string;
}

export const MobileAnonymousView: React.FC<MobileAnonymousViewProps> = ({ circleId }) => {
  const { colors, resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const { t, locale } = useLanguageStore();
  const insets = useSafeAreaInsets();
  const dateLocale = locale === 'vi' ? 'vi-VN' : 'en-US';
  const topClearance = Math.max(insets.top + 52, Platform.OS === 'ios' ? 74 : 64);
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const cardThemes: MobileTheme[] = useMemo(() => [
    {
      id: 'sunset',
      name: t.collab.anonymousThemeSunset,
      bg: '#FEF3C7',
      border: '#FDE68A',
      text: '#78350F',
      mutedText: '#92400E',
      tagBg: '#FDE68A',
      tagText: '#92400E',
    },
    {
      id: 'ocean',
      name: t.collab.anonymousThemeOcean,
      bg: '#E0F2FE',
      border: '#BAE6FD',
      text: '#0C4A6E',
      mutedText: '#0369A1',
      tagBg: '#BAE6FD',
      tagText: '#0369A1',
    },
    {
      id: 'lavender',
      name: t.collab.anonymousThemeLavender,
      bg: '#F3E8FF',
      border: '#E9D5FF',
      text: '#581C87',
      mutedText: '#6B21A8',
      tagBg: '#E9D5FF',
      tagText: '#7E22CE',
    },
    {
      id: 'rose',
      name: t.collab.anonymousThemeRose,
      bg: '#FFE4E6',
      border: '#FECDD3',
      text: '#881337',
      mutedText: '#9F1239',
      tagBg: '#FECDD3',
      tagText: '#BE123C',
    },
    {
      id: 'mint',
      name: t.collab.anonymousThemeMint,
      bg: '#D1FAE5',
      border: '#A7F3D0',
      text: '#064E3B',
      mutedText: '#047857',
      tagBg: '#A7F3D0',
      tagText: '#047857',
    },
  ], [t]);

  const [posts, setPosts] = useState<AnonymousPostEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Inline feedback & 2-step delete confirmation (zero Alert.alert)
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Compose modal
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const [content, setContent] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('sunset');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const showNotice = (message: string, type: 'success' | 'error' = 'error') => {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    setStatusNotice({ type, message });
    statusTimerRef.current = setTimeout(() => {
      setStatusNotice(null);
    }, 3200);
  };

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    };
  }, []);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      const data = await getAnonymousPostsApi(circleId);
      setPosts(data);
    } catch (err: any) {
      showNotice(err?.message || t.collab.loadNotesError, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [circleId]);

  const handleCreatePost = async () => {
    if (!content.trim()) {
      setFormError(t.collab.enterNoteContentError);
      return;
    }

    try {
      setIsSending(true);
      setFormError(null);
      await createAnonymousPostApi(circleId, {
        content: content.trim(),
        cardTheme: selectedTheme,
      });

      setContent('');
      setIsComposeModalOpen(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showNotice(t.collab.anonymousSentSuccess, 'success');
      loadPosts();
    } catch (err: any) {
      setFormError(err?.message || t.collab.sendNoteError);
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirmDeletePost = async (postId: string) => {
    if (deletingId) return;
    try {
      setDeletingId(postId);
      await deleteAnonymousPostApi(circleId, postId);
      setConfirmDeleteId(null);
      loadPosts();
    } catch (err: any) {
      showNotice(err?.message || t.collab.deleteNoteError, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      {statusNotice && (
        <View pointerEvents="box-none" style={[styles.noticeWrapper, { top: topClearance + 4 }]}>
          <View
            style={[
              styles.noticeBanner,
              {
                backgroundColor: colors.surface,
                borderColor: statusNotice.type === 'success' ? colors.sage : '#DC2626',
              },
            ]}
          >
            {statusNotice.type === 'success' ? (
              <Check size={14} color={colors.sage} />
            ) : (
              <X size={14} color="#DC2626" />
            )}
            <Text style={[styles.noticeText, { color: colors.text }]} numberOfLines={2}>
              {statusNotice.message}
            </Text>
            <TouchableOpacity
              onPress={() => setStatusNotice(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={14} color={colors.subtle} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Scroll-under Content Layer */}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topClearance, paddingBottom: Math.max(insets.bottom + 80, 100) },
        ]}
      >
        {/* Security Banner */}
        <View style={styles.securityBanner}>
          <ShieldCheck size={18} color={colors.sage} />
          <Text style={styles.securityText}>
            <Text style={{ fontWeight: '700' }}>{`${t.collab.anonymousSecurityTitle} `}</Text>
            {t.collab.anonymousPrivacyNotice}
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.sage} style={{ marginTop: 40 }} />
        ) : posts.length > 0 ? (
          <View style={{ gap: 12 }}>
            {posts.map((post) => {
              const th = cardThemes.find((item) => item.id === post.cardTheme) || cardThemes[0]!;
              const isConfirming = confirmDeleteId === post.id;
              const isDeletingThis = deletingId === post.id;

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
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      onPress={() => setConfirmDeleteId(isConfirming ? null : post.id)}
                      accessibilityLabel={t.collab.anonymousRemoveTooltip}
                    >
                      <Trash2 size={14} color={th.mutedText} />
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.cardContent, { color: th.text }]}>
                    {post.content}
                  </Text>

                  {isConfirming ? (
                    <View style={[styles.cardConfirmRow, { borderTopColor: th.border }]}>
                      <Text style={[styles.cardConfirmText, { color: th.text }]} numberOfLines={2}>
                        {t.collab.anonymousRemoveConfirm}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <TouchableOpacity
                          disabled={isDeletingThis}
                          onPress={() => setConfirmDeleteId(null)}
                          style={[styles.cardCancelBtn, { backgroundColor: 'rgba(255,255,255,0.65)', borderColor: th.border }]}
                        >
                          <Text style={[styles.cardCancelText, { color: th.text }]}>
                            {t.common.cancel}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          disabled={isDeletingThis}
                          onPress={() => handleConfirmDeletePost(post.id)}
                          style={styles.cardDangerBtn}
                        >
                          {isDeletingThis ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text style={styles.cardDangerText}>
                              {t.collab.anonymousRemoveAction}
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.cardFooter}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Sparkles size={11} color={th.mutedText} />
                        <Text style={[styles.footerText, { color: th.mutedText }]}>
                          {t.collab.anonymousCardTag}
                        </Text>
                      </View>
                      <Text style={[styles.footerText, { color: th.mutedText }]}>
                        {new Date(post.postedAt).toLocaleDateString(dateLocale)}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={[styles.emptyContainer, { backgroundColor: colors.canvas }]}>
            <Heart size={48} color={colors.subtle} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.collab.notesEmptyTitle}</Text>
            <Text style={styles.emptySub}>{t.collab.notesEmptyDesc}</Text>
            <TouchableOpacity
              style={[styles.createEmptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                setFormError(null);
                setIsComposeModalOpen(true);
              }}
            >
              <Plus size={16} color={colors.onPrimary} />
              <Text style={[styles.createEmptyText, { color: colors.onPrimary }]}>
                {t.collab.createAnonymousNote}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          setFormError(null);
          setIsComposeModalOpen(true);
        }}
        style={[
          styles.fab,
          {
            bottom: Math.max(insets.bottom + 16, 24),
            backgroundColor: colors.primary,
          },
        ]}
      >
        <Plus size={18} color={colors.onPrimary} />
        <Text style={[styles.fabText, { color: colors.onPrimary }]}>{t.collab.createAnonymousNote}</Text>
      </TouchableOpacity>

      {/* Compose Modal */}
      <Modal
        visible={isComposeModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsComposeModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface,
                borderColor: colors.hairline,
                paddingBottom: Math.max(insets.bottom + 16, 20),
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t.collab.anonymousComposeTitle}
              </Text>
              <TouchableOpacity
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => setIsComposeModalOpen(false)}
                accessibilityLabel={t.common.close}
              >
                <X size={20} color={colors.subtle} />
              </TouchableOpacity>
            </View>

            {formError && (
              <View style={styles.formErrorBox}>
                <Text style={styles.formErrorText}>{formError}</Text>
              </View>
            )}

            {/* Theme Picker */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t.collab.anonymousThemeLabel}</Text>
              <View style={styles.themesRow}>
                {cardThemes.map((th) => (
                  <TouchableOpacity
                    key={th.id}
                    style={[
                      styles.themeBtn,
                      { backgroundColor: th.bg, borderColor: th.border },
                      selectedTheme === th.id && styles.themeBtnSelected,
                    ]}
                    onPress={() => setSelectedTheme(th.id)}
                  >
                    <Text style={[styles.themeBtnText, { color: th.text }]}>
                      {th.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t.collab.anonymousContentLabel}</Text>
              <TextInput
                style={styles.textArea}
                placeholder={t.collab.anonymousContentExample}
                placeholderTextColor={colors.subtle}
                multiline
                numberOfLines={4}
                maxLength={1000}
                value={content}
                onChangeText={(txt) => {
                  setContent(txt);
                  if (formError) setFormError(null);
                }}
              />
              <Text style={styles.charCount}>
                {t.collab.anonymousCharCount.replace('{count}', String(content.length))}
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                disabled={isSending}
                onPress={() => setIsComposeModalOpen(false)}
              >
                <Text style={styles.cancelText}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                disabled={isSending}
                onPress={handleCreatePost}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <>
                    <Send size={14} color={colors.onPrimary} />
                    <Text style={[styles.submitText, { color: colors.onPrimary }]}>
                      {t.collab.anonymousComposeSubmit}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 20,
  },
  fabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: isDark ? 'rgba(52, 211, 153, 0.12)' : '#ECFDF5',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(52, 211, 153, 0.30)' : '#A7F3D0',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  securityText: {
    flex: 1,
    fontSize: 11,
    color: isDark ? '#D1FAE5' : '#065F46',
    lineHeight: 16,
  },
  postCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
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
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  footerText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cardConfirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  cardConfirmText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
  },
  cardCancelBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  cardCancelText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardDangerBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#DC2626',
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDangerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
  },
  createEmptyText: {
    fontSize: 13,
    fontWeight: '700',
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
    borderTopWidth: 1,
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
  formErrorBox: {
    backgroundColor: isDark ? 'rgba(220, 38, 38, 0.14)' : 'rgba(220, 38, 38, 0.08)',
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  formErrorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
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
    borderColor: colors.text,
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
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    minWidth: 112,
  },
  submitText: {
    fontSize: 13,
    fontWeight: '700',
  },
  noticeWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 45,
    alignItems: 'center',
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 6,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
});
