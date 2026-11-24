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
  useWindowDimensions,
  DeviceEventEmitter,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Compass,
  X,
  Plus,
  Trash2,
  Shuffle,
  RotateCcw,
  Edit2,
  Check,
  ArrowDownAZ,
  BookmarkCheck,
  Sparkles,
} from 'lucide-react-native';
import { DecisionWheelEntity } from '@circle/types';
import {
  getWheelsApi,
  createWheelApi,
  updateWheelApi,
  deleteWheelApi,
  deleteAllWheelsApi,
  createLiveWheelStageApi,
} from '../../services/circle-tools.service';
import { useLanguageStore } from '../../stores/language.store';
import { useThemeStore } from '../../stores/theme.store';
import { useAuthStore } from '../../stores/auth.store';

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
  const { width } = useWindowDimensions();
  const { colors, resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const { locale, t } = useLanguageStore();
  const { user } = useAuthStore();

  // State các vòng quay
  const [wheels, setWheels] = useState<DecisionWheelEntity[]>([]);
  const [isLoadingWheels, setIsLoadingWheels] = useState(false);
  const [activeWheelId, setActiveWheelId] = useState<string | null>(null);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [wheelsState, setWheelsState] = useState<Record<string, { optionsText: string }>>({});

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitleText, setEditingTitleText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveInitialFeedback, setSaveInitialFeedback] = useState(false);

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

      // Auto-seed: Khởi tạo 1 vòng mặc định nếu chưa có vòng nào trong circle
      if (sorted.length === 0) {
        const defaultTitle = t.luckyWheel.wheelNumber.replace('{number}', '1');
        const sampleOptions = [
          { optionLabel: 'Lựa chọn 1' },
          { optionLabel: 'Lựa chọn 2' },
          { optionLabel: 'Lựa chọn 3' },
          { optionLabel: 'Lựa chọn 4' },
        ];
        try {
          const newWheel = await createWheelApi(circleId, {
            title: defaultTitle,
            options: sampleOptions,
            initialOptions: sampleOptions.map((o) => o.optionLabel),
            soundEnabled: true,
            confettiEnabled: true,
          });
          if (newWheel?.id) {
            setWheels([newWheel]);
            setWheelsState({
              [newWheel.id]: {
                optionsText: sampleOptions.map((o) => o.optionLabel).join('\n'),
              },
            });
            setActiveWheelId(newWheel.id);
            return;
          }
        } catch {}
      }

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

      setActiveWheelId((prevId) => {
        if (sorted.length > 0 && (!prevId || !sorted.some((w) => w.id === prevId))) {
          return sorted[0]!.id;
        }
        return prevId;
      });
    } catch {}
    finally {
      setIsLoadingWheels(false);
    }
  }, [circleId, t.luckyWheel.wheelNumber]);

  useEffect(() => {
    if (visible) {
      loadWheels();
    }
  }, [visible]);

  const activeWheel = useMemo(() => {
    return wheels.find((w) => w.id === activeWheelId) || wheels[0] || null;
  }, [wheels, activeWheelId]);

  const activeLocalState = activeWheel ? wheelsState[activeWheel.id] : null;

  const activeParsed = useMemo(() => {
    return parseOptions(activeLocalState?.optionsText || '');
  }, [activeLocalState, parseOptions]);

  const handleOptionsChange = (newText: string) => {
    if (!activeWheel) return;
    setWheelsState((prev) => ({
      ...prev,
      [activeWheel.id]: { optionsText: newText },
    }));
  };

  // Thêm vòng xoay
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
      }
    } catch (err: any) {
      Alert.alert(t.common.error, err?.message || 'Không thể thêm vòng quay');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sửa tên vòng
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

  // Xóa vòng đang chọn
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

  // Xóa tất cả vòng
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
      setSaveInitialFeedback(true);
      setTimeout(() => setSaveInitialFeedback(false), 2000);
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

  // KHI BẤM NÚT "TẠO": Lưu và kích hoạt sân khấu 4 vòng trực tiếp cho cả nhóm
  const handleCreateStage = async () => {
    try {
      setIsSubmitting(true);
      if (activeWheel && activeLocalState?.optionsText) {
        const lines = parseOptions(activeLocalState.optionsText);
        if (lines.length >= 2) {
          await updateWheelApi(circleId, activeWheel.id, {
            options: lines.map((l, idx) => ({
              optionLabel: l,
              color: PASTEL_WHEEL_COLORS[idx % PASTEL_WHEEL_COLORS.length]!,
            })),
          });
        }
      }

      const liveSession = await createLiveWheelStageApi(circleId, channelId);
      if (liveSession?.creatorId && user?.id && liveSession.creatorId !== user.id) {
        Alert.alert(
          locale === 'vi' ? 'Tham gia phòng quay' : 'Joined Live Wheel',
          locale === 'vi'
            ? `Đã tham gia phòng quay trực tiếp do ${liveSession.spunBy?.displayName || 'thành viên'} vừa mở.`
            : `Joined live wheel stage created by ${liveSession.spunBy?.displayName || 'member'}.`,
        );
      }
      DeviceEventEmitter.emit('circle:open-live-wheel', { circleId, session: liveSession });
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      onClose();
    } catch (err: any) {
      Alert.alert(t.common.error, err?.message || 'Không thể tạo sân khấu vòng quay');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <View
            style={[
              styles.sheetContainer,
              {
                backgroundColor: isDark ? colors.elevated : '#FFFFFF',
                borderColor: colors.hairline,
                paddingBottom: 12,
              },
            ]}
          >
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.hairline }]}>
              <View style={styles.headerLeft}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(37, 99, 235, 0.12)' }]}>
                  <Compass size={18} color="#2563EB" />
                </View>
                <View>
                  <Text style={[styles.headerTitle, { color: colors.text }]}>
                    {t.luckyWheel.createRandomWheel || (locale === 'vi' ? 'Tạo vòng quay ngẫu nhiên' : 'Create Random Wheel')}
                  </Text>
                  <Text style={[styles.headerSubtitle, { color: colors.subtle }]}>
                    {locale === 'vi'
                      ? 'Thiết lập danh sách lựa chọn cho vòng quay'
                      : 'Configure options for random wheel'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.closeBtn} disabled={isSubmitting} onPress={onClose}>
                <X size={20} color={colors.subtle} />
              </TouchableOpacity>
            </View>

            {/* Dãy Tabs các vòng */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={[styles.tabsBar, { borderBottomColor: colors.hairline }]}
              contentContainerStyle={styles.tabsBarContent}
            >
              {wheels.map((wheel) => {
                const isSelected = activeWheelId === wheel.id;
                return (
                  <TouchableOpacity
                    key={wheel.id}
                    activeOpacity={0.8}
                    onPress={() => {
                      setIsEditingTitle(false);
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
            </ScrollView>

            {/* Content Body Setup */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollBody}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              {isLoadingWheels ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.subtle }]}>
                    {locale === 'vi' ? 'Đang tải danh sách...' : 'Loading wheels...'}
                  </Text>
                </View>
              ) : (
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
                      onFocus={() => {
                        setTimeout(() => {
                          scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 200);
                      }}
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
                            backgroundColor: saveInitialFeedback
                              ? `${colors.primary}20`
                              : isDark
                              ? colors.surface
                              : '#F8FAFC',
                            borderColor: saveInitialFeedback ? colors.primary : colors.hairline,
                          },
                        ]}
                        onPress={handleSaveAsInitial}
                      >
                        <BookmarkCheck
                          size={16}
                          color={saveInitialFeedback ? colors.primary : isDark ? colors.primary : '#0D9488'}
                        />
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

            {/* Hàng thiết lập: Xóa tất cả vòng (Cố định phía trên bottom action bar, giống Web) */}
            <View style={[styles.togglesRow, { borderTopColor: colors.hairline, justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6 }]}>
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

            {/* HÀNG NÚT DƯỚI CÙNG: [Thêm vòng xoay] & [Tạo vòng quay] */}
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

              {/* Nút TẠO VÒNG QUAY (Hiển thị icon Sparkles / ActivityIndicator và text đầy đủ giống Web) */}
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={wheels.length === 0 || isSubmitting}
                onPress={handleCreateStage}
                style={[
                  styles.spinAllBtn,
                  { backgroundColor: colors.primary },
                  (wheels.length === 0 || isSubmitting) && { opacity: 0.5 },
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Sparkles size={16} color="#FFFFFF" />
                )}
                <Text style={styles.spinAllBtnText}>
                  {isSubmitting
                    ? (locale === 'vi' ? 'Đang tạo...' : 'Creating...')
                    : (locale === 'vi' ? 'Tạo vòng quay' : 'Create Wheel')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  keyboardContainer: {
    width: '100%',
    maxHeight: '94%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetContainer: {
    width: '100%',
    maxHeight: '100%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexShrink: 0,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
    marginRight: 2,
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
    flexShrink: 0,
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
  tabItemText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tabItemTextBold: {
    fontWeight: 'bold',
  },
  scrollBody: {
    flexGrow: 1,
    flexShrink: 1,
    maxHeight: 460,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
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
    minHeight: 280,
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
    height: 120,
    minHeight: 120,
    maxHeight: 120,
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
    flexShrink: 0,
  },
  boardActionBtnIconOnly: {
    flex: 1,
    height: 40,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  togglesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 8,
    flexShrink: 0,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
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
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexShrink: 0,
    minHeight: 64,
  },
  addWheelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 46,
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    flexShrink: 0,
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
    height: 46,
    minHeight: 46,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    flexShrink: 0,
  },
  spinAllBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: 'bold',
  },
  arenaContainer: {
    flex: 1,
    maxHeight: 440,
    justifyContent: 'space-between',
  },
  arenaScroll: {
    maxHeight: 250,
  },
  arenaScrollContent: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  arenaGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    width: '100%',
  },
  arenaGridTwoCols: {
    justifyContent: 'space-around',
  },
  arenaWheelBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 4,
  },
  arenaWheelTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    maxWidth: 120,
  },
  discOuter: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelRotateBox: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  pointerRight: {
    position: 'absolute',
    top: '50%',
    marginTop: -8,
    zIndex: 20,
  },
  resultBoxWrapper: {
    minHeight: 56,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  spinningAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
  },
  spinningAlertText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  winnerShowcaseCard: {
    width: '100%',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  winnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  winnerHeaderText: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#B45309',
    textTransform: 'uppercase',
  },
  winnerText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#D97706',
    textAlign: 'center',
  },
  promptText: {
    fontSize: 11.5,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  arenaActionsRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  arenaSpinBtn: {
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
  arenaSpinBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  arenaSecondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  arenaSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  arenaSecondaryText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
