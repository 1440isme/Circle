import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Compass,
  X,
  Plus,
  Trash2,
  Trophy,
  RotateCw,
  Volume2,
  VolumeX,
  Shuffle,
  RotateCcw,
  Edit2,
  Check,
  ArrowDownAZ,
  BookmarkCheck,
  Share2,
} from 'lucide-react-native';
import { DecisionWheelEntity } from '@circle/types';
import {
  getWheelsApi,
  createWheelApi,
  updateWheelApi,
  deleteWheelApi,
  deleteAllWheelsApi,
  shareWheelResultsToChatApi,
  liveSpinWheelApi,
} from '../../services/circle-tools.service';
import { useLanguageStore } from '../../stores/language.store';
import { useThemeStore } from '../../stores/theme.store';

interface MobileLiveWheelPickerModalProps {
  visible: boolean;
  onClose: () => void;
  circleId: string;
  channelId?: string | null;
}

const PASTEL_WHEEL_COLORS = [
  '#FFD6A5', // Pastel Warm Apricot
  '#CAFFBF', // Pastel Mint Green
  '#9BF6FF', // Pastel Sky Cyan
  '#FFADAD', // Pastel Coral Pink
  '#BDB2FF', // Pastel Soft Lavender
  '#FDFFB6', // Pastel Cream Butter
  '#A0C4FF', // Pastel Powder Blue
  '#FFC6FF', // Pastel Light Orchid
  '#B8E0D2', // Pastel Celadon Sage
  '#FED1BA', // Pastel Peach
  '#D7E3FC', // Pastel Periwinkle
  '#FDE2E4', // Pastel Rose Blossom
];

export const MobileLiveWheelPickerModal: React.FC<MobileLiveWheelPickerModalProps> = ({
  visible,
  onClose,
  circleId,
  channelId,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const { locale, t } = useLanguageStore();

  const [wheels, setWheels] = useState<DecisionWheelEntity[]>([]);
  const [isLoadingWheels, setIsLoadingWheels] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('wheel');
  const [activeWheelId, setActiveWheelId] = useState<string | null>(null);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [resultsText, setResultsText] = useState<string>('');
  const [wheelsState, setWheelsState] = useState<Record<string, { optionsText: string }>>({});

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitleText, setEditingTitleText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const scrollViewRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  const parseOptions = useCallback((text: string) => {
    return text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  }, []);

  const loadWheels = useCallback(async () => {
    if (!circleId) return;
    try {
      setIsLoadingWheels(true);
      const data = await getWheelsApi(circleId);
      const sorted = [...(data || [])].sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeA !== timeB) return timeA - timeB;
        return a.title.localeCompare(b.title, 'vi', { numeric: true });
      });

      setWheels(sorted);
      setWheelsState((prev) => {
        const next = { ...prev };
        sorted.forEach((w) => {
          if (!next[w.id]) {
            next[w.id] = {
              optionsText: (w.options || []).map((o) => o.optionLabel).join('\n'),
            };
          }
        });
        return next;
      });

      if (sorted.length > 0 && (!activeWheelId || !sorted.some((w) => w.id === activeWheelId))) {
        setActiveWheelId(sorted[0]!.id);
        setActiveTab(sorted[0]!.id);
      }
    } catch {}
    finally {
      setIsLoadingWheels(false);
    }
  }, [circleId, activeWheelId]);

  useEffect(() => {
    if (visible) {
      loadWheels();
    }
  }, [visible, loadWheels]);

  const activeWheel = useMemo(() => {
    return wheels.find((w) => w.id === activeWheelId) || wheels[0] || null;
  }, [wheels, activeWheelId]);

  const activeLocalState = activeWheel ? wheelsState[activeWheel.id] : null;

  const activeParsed = useMemo(() => {
    return parseOptions(activeLocalState?.optionsText || '');
  }, [activeLocalState, parseOptions]);

  const resultLinesCount = useMemo(() => {
    return resultsText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0).length;
  }, [resultsText]);

  const handleOptionsChange = (newText: string) => {
    if (!activeWheel) return;
    setWheelsState((prev) => ({
      ...prev,
      [activeWheel.id]: { optionsText: newText },
    }));
  };

  // Add Wheel
  const handleAddDefaultWheel = async () => {
    if (wheels.length >= 4 || isSubmitting) return;
    try {
      setIsSubmitting(true);
      const nextNumber = wheels.length + 1;
      const defaultTitle = t.luckyWheel.wheelNumber.replace('{number}', String(nextNumber));
      const sampleOptions = [
        { optionLabel: 'Phở bò' },
        { optionLabel: 'Bún chả' },
        { optionLabel: 'Cơm tấm' },
        { optionLabel: 'Bánh mì' },
      ];

      const newWheel = await createWheelApi(circleId, {
        title: defaultTitle,
        options: sampleOptions,
        initialOptions: sampleOptions.map((o) => o.optionLabel),
        soundEnabled: true,
        confettiEnabled: true,
      });

      if (newWheel?.id) {
        await loadWheels();
        setActiveWheelId(newWheel.id);
        setActiveTab(newWheel.id);
      }
    } catch (err: any) {
      Alert.alert(t.common.error, err?.message || 'Không thể thêm vòng quay');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Title
  const saveEditTitle = async () => {
    if (!activeWheel) return;
    const trimmed = editingTitleText.trim();
    if (trimmed && trimmed !== activeWheel.title) {
      try {
        await updateWheelApi(circleId, activeWheel.id, { title: trimmed.slice(0, 50) });
        await loadWheels();
      } catch {}
    }
    setIsEditingTitle(false);
  };

  // Delete current active wheel
  const handleDeleteCurrentWheel = () => {
    if (!activeWheel || wheels.length <= 1) return;
    Alert.alert(t.luckyWheel.confirmDeleteTitle, t.luckyWheel.confirmDeleteDesc, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.confirm,
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteWheelApi(circleId, activeWheel.id);
            await loadWheels();
          } catch {}
        },
      },
    ]);
  };

  // Delete all wheels
  const handleDeleteAllWheels = () => {
    if (wheels.length === 0) return;
    Alert.alert(t.luckyWheel.deleteAllWheels, t.luckyWheel.confirmDeleteAllWheels, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.confirm,
        style: 'destructive',
        onPress: async () => {
          try {
            const defaultTitle = t.luckyWheel.wheelNumber.replace('{number}', '1');
            const res: any = await deleteAllWheelsApi(circleId, defaultTitle);
            await loadWheels();
            if (res?.defaultWheel?.id) {
              setActiveWheelId(res.defaultWheel.id);
              setActiveTab(res.defaultWheel.id);
            }
          } catch {}
        },
      },
    ]);
  };

  // Shuffle
  const handleShuffle = () => {
    if (!activeWheel || activeParsed.length < 2) return;
    const arr = [...activeParsed];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    }
    handleOptionsChange(arr.join('\n'));
  };

  // Sort A-Z
  const handleSortAZ = () => {
    if (!activeWheel || activeParsed.length < 2) return;
    const sorted = [...activeParsed].sort((a, b) =>
      a.localeCompare(b, 'vi', { numeric: true, sensitivity: 'base' })
    );
    handleOptionsChange(sorted.join('\n'));
  };

  // Save as Initial
  const handleSaveAsInitial = async () => {
    if (!activeWheel) return;
    const lines = parseOptions(activeLocalState?.optionsText || '');
    if (lines.length < 2) {
      Alert.alert(t.common.notice, t.luckyWheel.minOptionsWarning);
      return;
    }
    try {
      await updateWheelApi(circleId, activeWheel.id, {
        initialOptions: lines,
        options: lines.map((l, idx) => ({
          optionLabel: l,
          color: PASTEL_WHEEL_COLORS[idx % PASTEL_WHEEL_COLORS.length]!,
        })),
      });
      Alert.alert(t.common.notice, t.luckyWheel.saveAsInitialSuccess);
    } catch {}
  };

  // Reset to initial
  const handleReset = () => {
    if (!activeWheel) return;
    const initial =
      activeWheel.initialOptions && activeWheel.initialOptions.length > 0
        ? activeWheel.initialOptions
        : (activeWheel.options || []).map((o) => o.optionLabel);
    handleOptionsChange(initial.join('\n'));
  };

  // Clear results
  const handleClearResults = () => {
    Alert.alert(t.luckyWheel.confirmClearResultsTitle, t.luckyWheel.confirmClearResultsDesc, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.confirm,
        style: 'destructive',
        onPress: () => setResultsText(''),
      },
    ]);
  };

  // Share results to chat
  const handleShareResults = async () => {
    if (!resultsText.trim()) return;
    try {
      await shareWheelResultsToChatApi(circleId, [
        { wheelTitle: t.luckyWheel.title, winner: resultsText.trim() },
      ]);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    } catch {}
  };

  // Bắt đầu quay tất cả trực tiếp trong nhóm
  const handleStartSpinAllLive = async () => {
    if (wheels.length === 0 || isSubmitting) return;

    if (activeWheel && activeLocalState?.optionsText) {
      const lines = parseOptions(activeLocalState.optionsText);
      if (lines.length >= 2) {
        updateWheelApi(circleId, activeWheel.id, {
          options: lines.map((l, idx) => ({
            optionLabel: l,
            color: PASTEL_WHEEL_COLORS[idx % PASTEL_WHEEL_COLORS.length]!,
          })),
        }).catch(() => {});
      }
    }

    try {
      setIsSubmitting(true);
      await liveSpinWheelApi(circleId, {
        isAll: true,
        wheelId: activeWheel?.id,
        channelId: channelId || undefined,
      });
      onClose();
    } catch (err: any) {
      Alert.alert(t.common.error, err?.message || 'Không thể bắt đầu quay');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <TouchableOpacity style={styles.dismissOverlay} activeOpacity={1} onPress={onClose} />

        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: isDark ? colors.elevated : '#FFFFFF',
              borderColor: colors.hairline,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.hairline }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}20` }]}>
                <Compass size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  {t.luckyWheel.title}
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.subtle }]}>
                  {t.luckyWheel.liveWheelTitle}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={colors.subtle} />
            </TouchableOpacity>
          </View>

          {/* Dãy Tabs Header: Từng vòng + Tab Kết quả */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.tabsBar, { borderBottomColor: colors.hairline }]}
            contentContainerStyle={styles.tabsBarContent}
          >
            {wheels.map((wheel) => {
              const isSelected = activeTab === wheel.id;
              return (
                <TouchableOpacity
                  key={wheel.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    setActiveTab(wheel.id);
                    setActiveWheelId(wheel.id);
                  }}
                  style={[
                    styles.tabItem,
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : isDark
                        ? colors.surface
                        : '#F1F5F9',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabItemText,
                      { color: isSelected ? '#FFFFFF' : colors.text },
                      isSelected && styles.tabItemTextBold,
                    ]}
                    numberOfLines={1}
                  >
                    {wheel.title}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Tab Kết Quả */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('results')}
              style={[
                styles.tabItem,
                styles.tabItemResults,
                {
                  backgroundColor:
                    activeTab === 'results' ? '#F59E0B' : isDark ? colors.surface : '#F1F5F9',
                },
              ]}
            >
              <Trophy size={13} color={activeTab === 'results' ? '#FFFFFF' : '#D97706'} />
              <Text
                style={[
                  styles.tabItemText,
                  { color: activeTab === 'results' ? '#FFFFFF' : colors.text },
                  activeTab === 'results' && styles.tabItemTextBold,
                ]}
                numberOfLines={1}
              >
                {t.luckyWheel.resultsTab}
              </Text>
              {resultLinesCount > 0 && (
                <View
                  style={[
                    styles.badgeCount,
                    {
                      backgroundColor:
                        activeTab === 'results' ? 'rgba(255,255,255,0.25)' : 'rgba(245,158,11,0.2)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeCountText,
                      { color: activeTab === 'results' ? '#FFFFFF' : '#D97706' },
                    ]}
                  >
                    {resultLinesCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </ScrollView>

          {/* Content Body */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {isLoadingWheels ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.subtle }]}>
                  {locale === 'vi' ? 'Đang tải danh sách...' : 'Loading wheels...'}
                </Text>
              </View>
            ) : activeTab === 'results' ? (
              /* TAB KẾT QUẢ */
              <View style={styles.resultsSection}>
                <View style={styles.labelRow}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    {t.luckyWheel.resultsHistoryTitle}
                  </Text>
                  <Text style={[styles.counterValue, { color: colors.subtle }]}>
                    {resultLinesCount} {locale === 'vi' ? 'lần quay' : 'spins'}
                  </Text>
                </View>

                <TextInput
                  value={resultsText}
                  editable={false}
                  multiline
                  placeholder={t.luckyWheel.resultsPlaceholder}
                  placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                  style={[
                    styles.resultsTextarea,
                    {
                      backgroundColor: isDark ? colors.surface : '#F8FAFC',
                      borderColor: colors.hairline,
                      color: colors.text,
                    },
                  ]}
                />

                <Text style={[styles.hintText, { color: colors.subtle }]}>
                  {t.luckyWheel.resultsHint}
                </Text>

                <View style={styles.resultsActionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.resultsActionBtn,
                      {
                        backgroundColor: isDark ? colors.surface : '#F1F5F9',
                        borderColor: colors.hairline,
                      },
                    ]}
                    onPress={handleShareResults}
                    disabled={resultLinesCount === 0}
                  >
                    {shareSuccess ? (
                      <Check size={16} color="#10B981" />
                    ) : (
                      <Share2 size={16} color="#10B981" />
                    )}
                    <Text style={[styles.resultsActionBtnText, { color: colors.text }]}>
                      {shareSuccess
                        ? t.luckyWheel.shareResultsSuccess
                        : t.luckyWheel.shareResultsToChat}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.resultsClearBtn, { borderColor: colors.hairline }]}
                    onPress={handleClearResults}
                    disabled={resultLinesCount === 0}
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* TAB VÒNG ACTIVE */
              activeWheel && (
                <View style={styles.wheelSetupSection}>
                  {/* Wheel Title Row */}
                  <View style={styles.titleRow}>
                    {isEditingTitle ? (
                      <View style={styles.titleEditBox}>
                        <TextInput
                          value={editingTitleText}
                          onChangeText={setEditingTitleText}
                          maxLength={50}
                          autoFocus
                          style={[
                            styles.titleInput,
                            {
                              backgroundColor: isDark ? colors.surface : '#F8FAFC',
                              borderColor: colors.primary,
                              color: colors.text,
                            },
                          ]}
                        />
                        <TouchableOpacity style={styles.titleConfirmBtn} onPress={saveEditTitle}>
                          <Check size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.titleDisplayRow}>
                        <Text
                          style={[styles.activeWheelTitleText, { color: colors.text }]}
                          numberOfLines={1}
                        >
                          {activeWheel.title}
                        </Text>
                        <TouchableOpacity
                          style={styles.editTitleBtn}
                          onPress={() => {
                            setEditingTitleText(activeWheel.title);
                            setIsEditingTitle(true);
                          }}
                        >
                          <Edit2 size={14} color={colors.subtle} />
                        </TouchableOpacity>
                      </View>
                    )}

                    {wheels.length > 1 && (
                      <TouchableOpacity
                        style={styles.delWheelBtn}
                        onPress={handleDeleteCurrentWheel}
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Options Counter Row */}
                  <View style={styles.labelRow}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      {t.luckyWheel.optionsListTitle}
                    </Text>
                    <Text
                      style={[
                        styles.counterValue,
                        {
                          color: activeParsed.length < 2 ? '#D97706' : colors.primary,
                        },
                      ]}
                    >
                      {t.luckyWheel.optionsCount.replace('{count}', String(activeParsed.length))}
                    </Text>
                  </View>

                  {/* Options Textarea */}
                  <TextInput
                    value={activeLocalState?.optionsText || ''}
                    onChangeText={handleOptionsChange}
                    multiline
                    numberOfLines={5}
                    placeholder={t.luckyWheel.optionsPlaceholder}
                    placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                    style={[
                      styles.optionsTextarea,
                      {
                        backgroundColor: isDark ? colors.surface : '#F8FAFC',
                        borderColor: colors.hairline,
                        color: colors.text,
                      },
                    ]}
                  />

                  <Text style={[styles.hintText, { color: colors.subtle }]}>
                    {t.luckyWheel.optionsHint}
                  </Text>

                  {/* 4 Action Buttons Row: Shuffle, Sort A-Z, BookmarkCheck, RotateCcw */}
                  <View style={[styles.boardActionsRow, { borderTopColor: colors.hairline }]}>
                    <TouchableOpacity
                      style={[
                        styles.boardActionBtnIconOnly,
                        {
                          backgroundColor: isDark ? colors.surface : '#F8FAFC',
                          borderColor: colors.hairline,
                        },
                      ]}
                      onPress={handleShuffle}
                    >
                      <Shuffle size={16} color={isDark ? colors.primary : '#0D9488'} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.boardActionBtnIconOnly,
                        {
                          backgroundColor: isDark ? colors.surface : '#F8FAFC',
                          borderColor: colors.hairline,
                        },
                      ]}
                      onPress={handleSortAZ}
                    >
                      <ArrowDownAZ size={16} color="#6366F1" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.boardActionBtnIconOnly,
                        {
                          backgroundColor: isDark ? colors.surface : '#F8FAFC',
                          borderColor: colors.hairline,
                        },
                      ]}
                      onPress={handleSaveAsInitial}
                    >
                      <BookmarkCheck size={16} color={isDark ? colors.primary : '#0D9488'} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.boardActionBtnIconOnly,
                        {
                          backgroundColor: isDark ? colors.surface : '#F8FAFC',
                          borderColor: colors.hairline,
                        },
                      ]}
                      onPress={handleReset}
                    >
                      <RotateCcw size={16} color="#D97706" />
                    </TouchableOpacity>
                  </View>
                </View>
              )
            )}
          </ScrollView>

          {/* Hàng thiết lập ở đáy: Bật/Tắt âm thanh & Xóa tất cả vòng quay */}
          <View style={[styles.togglesRow, { borderTopColor: colors.hairline }]}>
            <TouchableOpacity
              style={styles.toggleItem}
              onPress={() => setSoundEnabled((prev) => !prev)}
            >
              {soundEnabled ? (
                <Volume2 size={16} color={isDark ? colors.primary : '#0D9488'} />
              ) : (
                <VolumeX size={16} color={colors.subtle} />
              )}
              <Text style={[styles.toggleItemText, { color: colors.text }]}>
                {t.luckyWheel.soundSetting}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleItem}
              onPress={handleDeleteAllWheels}
              disabled={wheels.length === 0}
            >
              <Trash2 size={15} color="#EF4444" />
              <Text style={[styles.toggleItemText, { color: '#EF4444', fontWeight: 'bold' }]}>
                {t.luckyWheel.deleteAllWheels}
              </Text>
            </TouchableOpacity>
          </View>

          {/* HÀNG NÚT Ở DƯỚI CHỖ BẬT TẮT ÂM THANH: [Thêm vòng xoay] & [Quay tất cả] */}
          <View style={[styles.actionButtonsRow, { borderTopColor: colors.hairline }]}>
            {/* Nút Thêm vòng xoay */}
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={wheels.length >= 4 || isSubmitting}
              onPress={handleAddDefaultWheel}
              style={[
                styles.addWheelBtn,
                {
                  backgroundColor: isDark ? colors.surface : '#F1F5F9',
                  borderColor: colors.hairline,
                },
                wheels.length >= 4 && { opacity: 0.4 },
              ]}
            >
              <Plus size={16} color={colors.primary} />
              <Text style={[styles.addWheelBtnText, { color: colors.text }]}>
                {t.luckyWheel.addWheel}
              </Text>
            </TouchableOpacity>

            {/* Nút Quay tất cả */}
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={wheels.length === 0 || isSubmitting}
              onPress={handleStartSpinAllLive}
              style={[
                styles.spinAllBtn,
                { backgroundColor: colors.primary },
                (wheels.length === 0 || isSubmitting) && { opacity: 0.5 },
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <RotateCw size={16} color="#FFFFFF" />
                  <Text style={styles.spinAllBtnText}>{t.luckyWheel.spinAll}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dismissOverlay: {
    flex: 1,
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
  },
  tabsBar: {
    maxHeight: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabsBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tabItem: {
    width: 104,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemResults: {
    flexDirection: 'row',
    gap: 5,
    width: 108,
  },
  tabItemText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tabItemTextBold: {
    fontWeight: 'bold',
  },
  badgeCount: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  badgeCountText: {
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  scrollBody: {
    maxHeight: 330,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
  },
  wheelSetupSection: {
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  activeWheelTitleText: {
    fontSize: 15,
    fontWeight: 'bold',
    maxWidth: 220,
  },
  editTitleBtn: {
    padding: 4,
  },
  titleEditBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  titleInput: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: '600',
  },
  titleConfirmBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  delWheelBtn: {
    padding: 6,
    borderRadius: 10,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  counterValue: {
    fontSize: 11.5,
    fontWeight: 'bold',
  },
  optionsTextarea: {
    minHeight: 110,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12.5,
    textAlignVertical: 'top',
  },
  hintText: {
    fontSize: 10.5,
  },
  boardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  boardActionBtnIconOnly: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsSection: {
    gap: 8,
  },
  resultsTextarea: {
    minHeight: 110,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12.5,
    textAlignVertical: 'top',
  },
  resultsActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultsActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
  },
  resultsActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resultsClearBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  togglesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleItemText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  addWheelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
  },
  addWheelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  spinAllBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  spinAllBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: 'bold',
  },
});
