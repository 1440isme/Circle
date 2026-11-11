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
  Vote,
  Plus,
  Trash2,
  Lock,
  Check,
  X,
} from 'lucide-react-native';
import {
  getPollsApi,
  createPollApi,
  votePollApi,
  closePollApi,
  deletePollApi,
} from '../../services/circle-tools.service';
import { getMobileSocket } from '../../services/socket';
import { GroupPollEntity } from '@circle/types';
import { ColorTheme } from '../../constants/theme';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';

interface MobilePollViewProps {
  circleId: string;
}

export const MobilePollView: React.FC<MobilePollViewProps> = ({ circleId }) => {
  const { colors, resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const { t, locale } = useLanguageStore();
  const insets = useSafeAreaInsets();
  const dateLocale = locale === 'vi' ? 'vi-VN' : 'en-US';
  const topClearance = Math.max(insets.top + 52, Platform.OS === 'ios' ? 74 : 64);
  const bottomClearance = Math.max(insets.bottom + 16, 24);
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [polls, setPolls] = useState<GroupPollEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Inline feedback & per-poll 2-step confirm (zero Alert.alert)
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    pollId: string;
    type: 'close' | 'delete';
  } | null>(null);
  const [isMutatingId, setIsMutatingId] = useState<string | null>(null);

  // Modal: Create Poll
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [formError, setFormError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

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

  const loadPolls = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const data = await getPollsApi(circleId);
      setPolls(data);
    } catch (err: any) {
      showNotice(err?.message || t.collab.loadPollsError, 'error');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let sockInstance: any = null;
    const refresh = () => {
      if (isMounted) loadPolls(true);
    };

    setConfirmAction(null);
    loadPolls();

    getMobileSocket().then((sock) => {
      if (!isMounted || !sock) return;
      sockInstance = sock;

      sock.on('circle:poll-created', refresh);
      sock.on('circle:poll-voted', refresh);
      sock.on('circle:poll-closed', refresh);
      sock.on('circle:poll-deleted', refresh);
    });

    return () => {
      isMounted = false;
      if (sockInstance) {
        sockInstance.off('circle:poll-created', refresh);
        sockInstance.off('circle:poll-voted', refresh);
        sockInstance.off('circle:poll-closed', refresh);
        sockInstance.off('circle:poll-deleted', refresh);
      }
    };
  }, [circleId]);

  const handleOpenCreateModal = () => {
    setFormError(null);
    setQuestion('');
    setOptions(['', '']);
    setIsCreateModalOpen(true);
  };

  const handleAddOptionField = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOptionField = (idx: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== idx));
    }
  };

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
    if (formError) setFormError(null);
  };

  const handleCreatePoll = async () => {
    if (!question.trim()) {
      setFormError(t.collab.pollValidationQuestion);
      return;
    }
    const validOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (validOptions.length < 2) {
      setFormError(t.collab.pollValidationOptions);
      return;
    }

    try {
      setIsCreating(true);
      setFormError(null);
      await createPollApi(circleId, {
        question: question.trim(),
        options: validOptions,
      });
      setQuestion('');
      setOptions(['', '']);
      setIsCreateModalOpen(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showNotice(t.collab.pollCreatedSuccess, 'success');
      loadPolls(true);
    } catch (err: any) {
      setFormError(err?.message || t.collab.createPollError);
    } finally {
      setIsCreating(false);
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await votePollApi(circleId, pollId, { optionId });
      showNotice(t.collab.pollVoteSubmitted, 'success');
      loadPolls(true);
    } catch (err: any) {
      showNotice(err?.message || t.collab.votePollError, 'error');
    }
  };

  const handleConfirmPollAction = async () => {
    if (!confirmAction || isMutatingId) return;
    const { pollId, type } = confirmAction;
    try {
      setIsMutatingId(pollId);
      if (type === 'close') {
        await closePollApi(circleId, pollId);
        showNotice(t.collab.pollClosedSuccess, 'success');
      } else {
        await deletePollApi(circleId, pollId);
        showNotice(t.collab.pollDeletedSuccess, 'success');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setConfirmAction(null);
      loadPolls(true);
    } catch (err: any) {
      showNotice(
        err?.message || (type === 'close' ? t.collab.closePollError : t.collab.deletePollError),
        'error',
      );
    } finally {
      setIsMutatingId(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      {statusNotice ? (
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
              accessibilityLabel={t.common.close}
            >
              <X size={14} color={colors.subtle} />
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* Polls List (Floating glass controls with scroll-under content) */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.sage} />
        </View>
      ) : polls.length === 0 ? (
        <View style={[styles.emptyContainer, { paddingTop: topClearance }]}>
          <Vote size={48} color={colors.subtle} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {t.collab.pollEmptyTitle}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.subtle }]}>
            {t.collab.pollEmptyDesc}
          </Text>
          <TouchableOpacity
            onPress={handleOpenCreateModal}
            style={[styles.emptyCreateBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.emptyCreateBtnText, { color: colors.onPrimary }]}>
              {t.collab.pollCreateFirst}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollList}
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: topClearance + 8, paddingBottom: bottomClearance + 76 },
          ]}
        >
          {polls.map((poll) => {
            const isClosed = poll.isClosed;
            const isConfirmingThis = confirmAction?.pollId === poll.id;
            const totalVotesLabel =
              poll.totalVotes === 0
                ? t.collab.pollEmptyVotes
                : poll.totalVotes === 1
                ? t.collab.pollSingleVote
                : t.collab.pollTotalVotes.replace('{count}', String(poll.totalVotes));

            return (
              <View
                key={poll.id}
                style={[
                  styles.pollCard,
                  { backgroundColor: colors.surface, borderColor: colors.hairline },
                ]}
              >
                {/* Header row */}
                <View style={styles.pollCardHeader}>
                  <View style={styles.statusBadgeRow}>
                    {isClosed ? (
                      <View
                        style={[
                          styles.closedBadge,
                          { backgroundColor: isDark ? colors.elevated : colors.canvas },
                        ]}
                      >
                        <Lock size={10} color={colors.subtle} />
                        <Text style={[styles.closedBadgeText, { color: colors.subtle }]}>
                          {t.collab.pollClosedBadge}
                        </Text>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.activeBadge,
                          {
                            backgroundColor: isDark
                              ? 'rgba(52, 211, 153, 0.14)'
                              : 'rgba(16, 185, 129, 0.12)',
                          },
                        ]}
                      >
                        <Text style={[styles.activeBadgeText, { color: colors.sage }]}>
                          {t.collab.pollOpenBadge}
                        </Text>
                      </View>
                    )}
                    <Text style={[styles.voteCountText, { color: colors.subtle }]}>
                      {totalVotesLabel}
                    </Text>
                  </View>

                  <View style={styles.cardActions}>
                    {!isClosed && (
                      <TouchableOpacity
                        onPress={() =>
                          setConfirmAction((prev) =>
                            prev?.pollId === poll.id && prev.type === 'close'
                              ? null
                              : { pollId: poll.id, type: 'close' },
                          )
                        }
                        style={styles.iconBtn}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        accessibilityLabel={t.collab.pollCloseTitle}
                      >
                        <Lock size={14} color={colors.subtle} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() =>
                        setConfirmAction((prev) =>
                          prev?.pollId === poll.id && prev.type === 'delete'
                            ? null
                            : { pollId: poll.id, type: 'delete' },
                        )
                      }
                      style={styles.iconBtn}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      accessibilityLabel={t.collab.pollDeleteTitle}
                    >
                      <Trash2 size={14} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Inline 2-step Close / Delete confirmation */}
                {isConfirmingThis && (
                  <View
                    style={[
                      styles.inlineConfirmBar,
                      {
                        backgroundColor: colors.canvas,
                        borderColor: confirmAction.type === 'delete' ? '#DC2626' : colors.hairline,
                      },
                    ]}
                  >
                    <Text style={[styles.inlineConfirmTitle, { color: colors.text }]}>
                      {confirmAction.type === 'close'
                        ? t.collab.pollCloseConfirm
                        : t.collab.pollDeleteConfirm}
                    </Text>
                    <View style={styles.inlineConfirmBtns}>
                      <TouchableOpacity
                        onPress={() => setConfirmAction(null)}
                        disabled={isMutatingId === poll.id}
                        style={[styles.inlineCancelBtn, { borderColor: colors.hairline }]}
                      >
                        <Text style={[styles.inlineCancelText, { color: colors.text }]}>
                          {t.common.cancel}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleConfirmPollAction}
                        disabled={isMutatingId === poll.id}
                        style={
                          confirmAction.type === 'delete'
                            ? styles.inlineDeleteConfirmBtn
                            : [styles.inlineCloseConfirmBtn, { backgroundColor: colors.primary }]
                        }
                      >
                        {isMutatingId === poll.id ? (
                          <ActivityIndicator
                            size="small"
                            color={confirmAction.type === 'delete' ? '#FFFFFF' : colors.onPrimary}
                          />
                        ) : (
                          <Text
                            style={[
                              styles.inlineConfirmActionText,
                              {
                                color:
                                  confirmAction.type === 'delete' ? '#FFFFFF' : colors.onPrimary,
                              },
                            ]}
                          >
                            {confirmAction.type === 'close' ? t.common.confirm : t.common.delete}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Question */}
                <Text style={[styles.pollQuestion, { color: colors.text }]}>{poll.question}</Text>

                {/* Options */}
                <View style={styles.optionsList}>
                  {poll.options.map((opt) => {
                    const isSelected = poll.userVotedOptionId === opt.id;

                    return (
                      <TouchableOpacity
                        key={opt.id}
                        activeOpacity={0.8}
                        disabled={isClosed}
                        onPress={() => handleVote(poll.id, opt.id)}
                        style={[
                          styles.optionCard,
                          {
                            backgroundColor: isSelected
                              ? colors.wash
                              : isDark
                              ? colors.elevated
                              : colors.canvas,
                            borderColor: isSelected ? colors.sage : colors.hairline,
                          },
                        ]}
                      >
                        {/* Progress bar background */}
                        <View
                          style={[
                            styles.optionProgressFill,
                            {
                              width: `${Math.min(100, Math.max(0, opt.percentage || 0))}%`,
                              backgroundColor: isSelected
                                ? colors.sage
                                : isDark
                                ? 'rgba(255,255,255,0.20)'
                                : '#CBD5E1',
                              opacity: isSelected ? (isDark ? 0.25 : 0.16) : isDark ? 0.22 : 0.32,
                            },
                          ]}
                        />

                        <View style={styles.optionContent}>
                          <View style={styles.optionLeft}>
                            <View
                              style={[
                                styles.optionCheck,
                                { borderColor: isSelected ? colors.primary : colors.hairline },
                                isSelected && { backgroundColor: colors.primary },
                              ]}
                            >
                              {isSelected && (
                                <Check size={10} color={colors.onPrimary} strokeWidth={3} />
                              )}
                            </View>
                            <Text
                              style={[
                                styles.optionText,
                                { color: colors.text },
                                isSelected && { fontWeight: '700' },
                              ]}
                            >
                              {opt.optionText}
                            </Text>
                          </View>

                          <Text
                            style={[
                              styles.optionPercent,
                              { color: isSelected ? colors.sage : colors.subtle },
                            ]}
                          >
                            {opt.voteCount} ({opt.percentage}%)
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Footer info */}
                <View style={[styles.pollFooter, { borderTopColor: colors.hairline }]}>
                  <Text style={[styles.pollCreator, { color: colors.subtle }]}>
                    {t.collab.pollCreatedBy.replace(
                      '{name}',
                      poll.creator?.user?.profile?.displayName ||
                        poll.creator?.nickname ||
                        t.collab.memberDefault,
                    )}
                  </Text>
                  <Text style={[styles.pollDate, { color: colors.subtle }]}>
                    {poll.deadline
                      ? t.collab.pollDeadlinePrefix.replace(
                          '{date}',
                          new Date(poll.deadline).toLocaleDateString(dateLocale),
                        )
                      : new Date(poll.createdAt).toLocaleDateString(dateLocale)}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleOpenCreateModal}
        style={[
          styles.fab,
          {
            bottom: bottomClearance,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
          },
        ]}
        accessibilityLabel={t.collab.createPoll}
      >
        <Plus size={18} color={colors.onPrimary} />
        <Text style={[styles.fabText, { color: colors.onPrimary }]}>{t.collab.createPoll}</Text>
      </TouchableOpacity>

      {/* Modal: Create Poll */}
      <Modal
        visible={isCreateModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCreateModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.surface, borderColor: colors.hairline },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t.collab.pollCreateModalTitle}
              </Text>
              <TouchableOpacity
                onPress={() => setIsCreateModalOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel={t.common.close}
              >
                <X size={18} color={colors.subtle} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputSectionTitle, { color: colors.subtle }]}>
              {t.collab.pollQuestionLabel}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.canvas,
                  borderColor: colors.hairline,
                  color: colors.text,
                },
              ]}
              value={question}
              onChangeText={(val) => {
                setQuestion(val);
                if (formError) setFormError(null);
              }}
              placeholder={t.collab.pollQuestionExample}
              placeholderTextColor={colors.subtle}
              autoFocus
            />

            <Text style={[styles.inputSectionTitle, { color: colors.subtle, marginTop: 12 }]}>
              {t.collab.pollOptionsLabel}
            </Text>
            <ScrollView
              style={{ maxHeight: 240 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.optionsInputGroup}>
                {options.map((opt, idx) => (
                  <View key={idx} style={styles.optionInputRow}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          flex: 1,
                          backgroundColor: colors.canvas,
                          borderColor: colors.hairline,
                          color: colors.text,
                        },
                      ]}
                      value={opt}
                      onChangeText={(val) => handleOptionChange(idx, val)}
                      placeholder={t.collab.pollOptionPlaceholder.replace(
                        '{index}',
                        String(idx + 1),
                      )}
                      placeholderTextColor={colors.subtle}
                    />
                    {options.length > 2 && (
                      <TouchableOpacity
                        onPress={() => handleRemoveOptionField(idx)}
                        style={styles.removeOptionBtn}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        accessibilityLabel={t.collab.removeOption}
                      >
                        <X size={15} color={colors.danger} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>

            {options.length < 6 && (
              <TouchableOpacity
                onPress={handleAddOptionField}
                style={styles.addOptionBtn}
              >
                <Plus size={13} color={colors.sage} />
                <Text style={[styles.addOptionBtnText, { color: colors.sage }]}>
                  {t.collab.addOption}
                </Text>
              </TouchableOpacity>
            )}

            {formError ? (
              <Text style={[styles.inlineErrorText, { color: isDark ? '#F87171' : '#DC2626' }]}>
                {formError}
              </Text>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setIsCreateModalOpen(false)}
                disabled={isCreating}
                style={styles.modalCancelBtn}
              >
                <Text style={[styles.modalCancelText, { color: colors.subtle }]}>
                  {t.common.cancel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreatePoll}
                disabled={isCreating}
                style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <Text style={[styles.modalSubmitText, { color: colors.onPrimary }]}>
                    {t.collab.pollCreateSubmit}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const createStyles = (colors: ColorTheme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    centerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    noticeWrapper: {
      position: 'absolute',
      left: 16,
      right: 16,
      zIndex: 60,
    },
    noticeBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.35 : 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
    noticeText: {
      flex: 1,
      fontSize: 12,
      fontWeight: '600',
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '700',
      marginTop: 12,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 12,
      textAlign: 'center',
      marginTop: 4,
      lineHeight: 18,
      marginBottom: 16,
    },
    emptyCreateBtn: {
      paddingHorizontal: 18,
      paddingVertical: 11,
      borderRadius: 999,
    },
    emptyCreateBtnText: {
      fontSize: 13,
      fontWeight: '700',
    },
    scrollList: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: 16,
      gap: 12,
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
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.35 : 0.22,
      shadowRadius: 8,
      elevation: 4,
      zIndex: 20,
    },
    fabText: {
      fontSize: 13,
      fontWeight: '700',
    },
    pollCard: {
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
    },
    pollCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    statusBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    activeBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    activeBadgeText: {
      fontSize: 10,
      fontWeight: '700',
    },
    closedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    closedBadgeText: {
      fontSize: 10,
      fontWeight: '600',
    },
    voteCountText: {
      fontSize: 11,
    },
    cardActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    iconBtn: {
      padding: 4,
    },
    inlineConfirmBar: {
      borderRadius: 12,
      borderWidth: 1,
      padding: 10,
      marginBottom: 10,
      gap: 8,
    },
    inlineConfirmTitle: {
      fontSize: 12,
      fontWeight: '600',
    },
    inlineConfirmBtns: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
    },
    inlineCancelBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
    },
    inlineCancelText: {
      fontSize: 11,
      fontWeight: '600',
    },
    inlineCloseConfirmBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      minWidth: 64,
      alignItems: 'center',
    },
    inlineDeleteConfirmBtn: {
      backgroundColor: '#DC2626',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      minWidth: 64,
      alignItems: 'center',
    },
    inlineConfirmActionText: {
      fontSize: 11,
      fontWeight: '700',
    },
    pollQuestion: {
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 12,
    },
    optionsList: {
      gap: 8,
      marginBottom: 12,
    },
    optionCard: {
      position: 'relative',
      borderWidth: 1,
      borderRadius: 12,
      overflow: 'hidden',
    },
    optionProgressFill: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
    },
    optionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 11,
      paddingHorizontal: 12,
      zIndex: 1,
      gap: 8,
    },
    optionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    optionCheck: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionText: {
      fontSize: 13,
      fontWeight: '500',
      flex: 1,
    },
    optionPercent: {
      fontSize: 11,
      fontWeight: '600',
    },
    pollFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderTopWidth: StyleSheet.hairlineWidth,
      paddingTop: 8,
    },
    pollCreator: {
      fontSize: 11,
    },
    pollDate: {
      fontSize: 11,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    modalCard: {
      borderRadius: 16,
      borderWidth: 1,
      padding: 20,
      width: '100%',
      maxWidth: 380,
    },
    modalHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
      gap: 8,
    },
    modalTitle: {
      fontSize: 15,
      fontWeight: '700',
      flex: 1,
    },
    inputSectionTitle: {
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 6,
    },
    input: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 13,
    },
    optionsInputGroup: {
      gap: 8,
    },
    optionInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    removeOptionBtn: {
      padding: 6,
    },
    addOptionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 10,
      alignSelf: 'flex-start',
    },
    addOptionBtnText: {
      fontSize: 12,
      fontWeight: '600',
    },
    inlineErrorText: {
      fontSize: 12,
      fontWeight: '600',
      marginTop: 8,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 8,
      marginTop: 16,
    },
    modalCancelBtn: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 8,
    },
    modalCancelText: {
      fontSize: 12,
      fontWeight: '600',
    },
    modalSubmitBtn: {
      paddingHorizontal: 18,
      paddingVertical: 9,
      borderRadius: 999,
      minWidth: 96,
      alignItems: 'center',
    },
    modalSubmitText: {
      fontSize: 12,
      fontWeight: '700',
    },
  });
