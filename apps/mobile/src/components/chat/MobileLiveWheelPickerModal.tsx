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
  Animated,
  Easing,
  useWindowDimensions,
  DeviceEventEmitter,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, G, Circle, Rect, Text as SvgText } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
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
  Sparkles,
  ArrowLeft,
  Play,
  ArrowRight,
} from 'lucide-react-native';
import { DecisionWheelEntity } from '@circle/types';
import {
  getWheelsApi,
  createWheelApi,
  updateWheelApi,
  deleteWheelApi,
  deleteAllWheelsApi,
  liveSpinWheelApi,
  createLiveWheelStageApi,
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
  const { width } = useWindowDimensions();
  const { colors, resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const { locale, t } = useLanguageStore();

  // Mode: 'setup' (bảng cấu hình) hoặc 'arena' (sân khấu các vòng tròn quay khi bấm Tạo)
  const [viewMode, setViewMode] = useState<'setup' | 'arena'>('setup');

  const [wheels, setWheels] = useState<DecisionWheelEntity[]>([]);
  const [isLoadingWheels, setIsLoadingWheels] = useState(false);
  const [activeWheelId, setActiveWheelId] = useState<string | null>(null);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [wheelsState, setWheelsState] = useState<Record<string, { optionsText: string }>>({});

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitleText, setEditingTitleText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Arena Spinning states
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastSpinResult, setLastSpinResult] = useState<string | null>(null);
  const rotateAnim = useRef(new Animated.Value(0)).current;

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
      setViewMode('setup');
      setLastSpinResult(null);
      setIsSpinning(false);
      rotateAnim.setValue(0);
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

  // KHI BẤM NÚT "QUAY" / "QUAY TẤT CẢ" TRÊN SÂN KHẤU
  const handleStartSpin = async () => {
    if (wheels.length === 0 || isSpinning || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setIsSpinning(true);
      setLastSpinResult(null);

      const session = await liveSpinWheelApi(circleId, {
        isAll: true,
        wheelId: activeWheel?.id,
        channelId: channelId || undefined,
      });

      const duration = session.durationMs || 6000;
      const targetSlices = session.options.length;
      const sliceDeg = 360 / Math.max(targetSlices, 1);
      const targetCenterDeg = session.winningIndex * sliceDeg + sliceDeg / 2;
      const stopAngle = (360 - (targetCenterDeg % 360)) % 360;
      const extraSpins = 6 * 360;
      const finalRot = extraSpins + stopAngle;

      rotateAnim.setValue(0);

      Animated.timing(rotateAnim, {
        toValue: finalRot,
        duration: duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setIsSpinning(false);
        setIsSubmitting(false);
        setLastSpinResult(session.winningOption?.optionLabel || '');
        try {
          if (soundEnabled) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        } catch {}
      });
    } catch (err: any) {
      setIsSpinning(false);
      setIsSubmitting(false);
      Alert.alert(t.common.error, err?.message || 'Không thể bắt đầu quay');
    }
  };

  // Render SVG Slices cho từng vòng tròn
  const renderWheelSvg = (optionsText: string, discSize: number) => {
    const options = parseOptions(optionsText);
    const count = options.length;
    if (count === 0) return null;

    const radius = discSize / 2;
    const centerX = discSize / 2;
    const centerY = discSize / 2;
    const arcAngle = (2 * Math.PI) / count;

    return options.map((label, idx) => {
      const angle1 = idx * arcAngle;
      const angle2 = (idx + 1) * arcAngle;
      const color = PASTEL_WHEEL_COLORS[idx % PASTEL_WHEEL_COLORS.length]!;

      const x1 = centerX + radius * Math.cos(angle1);
      const y1 = centerY + radius * Math.sin(angle1);
      const x2 = centerX + radius * Math.cos(angle2);
      const y2 = centerY + radius * Math.sin(angle2);

      const largeArcFlag = angle2 - angle1 > Math.PI ? 1 : 0;
      const pathD = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

      const midAngle = angle1 + arcAngle / 2;
      const midAngleDeg = (midAngle * 180) / Math.PI;

      const textRadius = radius * 0.62;
      const tx = centerX + textRadius * Math.cos(midAngle);
      const ty = centerY + textRadius * Math.sin(midAngle);

      const maxLen = discSize > 200 ? 10 : 6;
      const displayLabel = label.length > maxLen ? label.slice(0, maxLen - 1) + '…' : label;

      return (
        <G key={`slice-${idx}`}>
          <Path d={pathD} fill={color} />
          <SvgText
            x={tx}
            y={ty}
            fill="#1E293B"
            fontSize={discSize > 200 ? 11 : 9}
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="middle"
            transform={`rotate(${midAngleDeg}, ${tx}, ${ty})`}
          >
            {displayLabel}
          </SvgText>
        </G>
      );
    });
  };

  // Kích thước vòng quay phù hợp layout
  const discSize = useMemo(() => {
    if (wheels.length === 1) return Math.min(width - 80, 240);
    return Math.min((width - 70) / 2, 135);
  }, [wheels.length, width]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

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
              {viewMode === 'arena' && (
                <TouchableOpacity
                  style={styles.backBtn}
                  disabled={isSpinning}
                  onPress={() => setViewMode('setup')}
                >
                  <ArrowLeft size={18} color={colors.text} />
                </TouchableOpacity>
              )}

              <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}20` }]}>
                <Compass size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  {locale === 'vi' ? 'Vòng quay ngẫu nhiên' : 'Random Wheel'}
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.subtle }]}>
                  {viewMode === 'setup'
                    ? (locale === 'vi' ? 'Thiết lập danh sách lựa chọn' : 'Setup options list')
                    : (locale === 'vi' ? 'Sân khấu trực tiếp trong nhóm' : 'Live stage in group')}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} disabled={isSpinning} onPress={onClose}>
              <X size={20} color={colors.subtle} />
            </TouchableOpacity>
          </View>

          {/* ============================================================== */}
          {/* VIEW MODE 1: SETUP (BẢNG THIẾT LẬP - BỎ KẾT QUẢ ĐI)            */}
          {/* ============================================================== */}
          {viewMode === 'setup' ? (
            <>
              {/* Dãy Tabs các vòng (KHÔNG CÒN TAB KẾT QUẢ) */}
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

              {/* Hàng thiết lập: Xóa tất cả vòng (Đã bỏ nút âm thanh theo yêu cầu) */}
              <View style={[styles.togglesRow, { borderTopColor: colors.hairline, justifyContent: 'flex-end' }]}>
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

              {/* HÀNG NÚT DƯỚI BẬT TẮT ÂM THANH: [Thêm vòng xoay] & [Tạo] */}
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

                {/* Nút TẠO (Thay thế nút Quay tất cả theo yêu cầu) */}
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
                  <Sparkles size={16} color="#FFFFFF" />
                  <Text style={styles.spinAllBtnText}>{locale === 'vi' ? 'Tạo' : 'Create'}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            /* ============================================================== */
            /* VIEW MODE 2: SÂN KHẤU CÁC VÒNG TRÒN (CÓ NÚT QUAY & KẾT QUẢ)   */
            /* ============================================================== */
            <View style={styles.arenaContainer}>
              {/* VÙNG CÁC VÒNG TRÒN ĐƯỢC TẠO RA */}
              <ScrollView
                style={styles.arenaScroll}
                contentContainerStyle={styles.arenaScrollContent}
              >
                <View
                  style={[
                    styles.arenaGrid,
                    wheels.length >= 2 && styles.arenaGridTwoCols,
                  ]}
                >
                  {wheels.map((wheel) => {
                    const optionsText = wheelsState[wheel.id]?.optionsText || '';

                    return (
                      <View key={wheel.id} style={styles.arenaWheelBox}>
                        <Text
                          style={[styles.arenaWheelTitle, { color: colors.text }]}
                          numberOfLines={1}
                        >
                          {wheel.title}
                        </Text>
                        <View style={[styles.discOuter, { width: discSize, height: discSize }]}>
                          <Animated.View
                            style={[
                              styles.wheelRotateBox,
                              {
                                width: discSize,
                                height: discSize,
                                transform: [{ rotate: rotateInterpolate }],
                              },
                            ]}
                          >
                            <Svg width={discSize} height={discSize}>
                              {renderWheelSvg(optionsText, discSize)}
                              <Circle
                                cx={discSize / 2}
                                cy={discSize / 2}
                                r={discSize > 200 ? 18 : 12}
                                fill="#FFFFFF"
                                stroke="#E2E8F0"
                                strokeWidth={2}
                              />
                              <Circle
                                cx={discSize / 2}
                                cy={discSize / 2}
                                r={discSize > 200 ? 7 : 5}
                                fill={colors.primary}
                              />
                            </Svg>
                          </Animated.View>

                          {/* Kim chỉ bên phải */}
                          <View
                            style={[styles.pointerRight, { right: discSize > 200 ? -12 : -10 }]}
                            pointerEvents="none"
                          >
                            <Svg width={24} height={16} viewBox="0 0 30 20">
                              <Path
                                d="M2 10L18 2C20 1 21 2 21 4V16C21 18 20 19 18 18L2 10Z"
                                fill={colors.primary}
                                stroke={isDark ? colors.elevated : '#FFFFFF'}
                                strokeWidth={1.5}
                                strokeLinejoin="round"
                              />
                              <Rect
                                x={19}
                                y={4}
                                width={9}
                                height={12}
                                rx={3}
                                fill={isDark ? colors.primaryDark : '#0F766E'}
                                stroke={isDark ? colors.elevated : '#FFFFFF'}
                                strokeWidth={1.5}
                              />
                              <Circle cx={23.5} cy={10} r={2.5} fill={isDark ? colors.elevated : '#FFFFFF'} />
                              <Circle cx={23.5} cy={10} r={1.2} fill={colors.primary} />
                            </Svg>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>

              {/* PHẦN KẾT QUẢ VÒNG QUAY */}
              <View style={styles.resultBoxWrapper}>
                {isSpinning ? (
                  <View style={[styles.spinningAlert, { backgroundColor: `${colors.primary}15` }]}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.spinningAlertText, { color: colors.primary }]}>
                      {t.luckyWheel.spinningLive}
                    </Text>
                  </View>
                ) : lastSpinResult ? (
                  <View style={styles.winnerShowcaseCard}>
                    <View style={styles.winnerHeader}>
                      <Trophy size={14} color="#D97706" />
                      <Text style={styles.winnerHeaderText}>{t.luckyWheel.winnerAnnounce}</Text>
                    </View>
                    <Text style={styles.winnerText} numberOfLines={2}>
                      {lastSpinResult}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.promptText, { color: colors.subtle }]}>
                    {locale === 'vi'
                      ? 'Nhấn nút "Quay" bên dưới để bắt đầu quay trực tiếp trong nhóm!'
                      : 'Press "Spin" below to start live spinning for the group!'}
                  </Text>
                )}
              </View>

              {/* NÚT QUAY VÀ THAO TÁC Ở SÂN KHẤU */}
              <View style={[styles.arenaActionsRow, { borderTopColor: colors.hairline }]}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={isSpinning || wheels.length === 0}
                  onPress={handleStartSpin}
                  style={[
                    styles.arenaSpinBtn,
                    { backgroundColor: colors.primary },
                    (isSpinning || wheels.length === 0) && { opacity: 0.5 },
                  ]}
                >
                  {isSpinning ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
                  )}
                  <Text style={styles.arenaSpinBtnText}>
                    {isSpinning
                      ? t.luckyWheel.spinning
                      : lastSpinResult
                      ? t.luckyWheel.spinAgain
                      : wheels.length > 1
                      ? t.luckyWheel.spinAll
                      : t.luckyWheel.spin}
                  </Text>
                </TouchableOpacity>

                <View style={styles.arenaSecondaryRow}>
                  <TouchableOpacity
                    style={styles.arenaSecondaryBtn}
                    disabled={isSpinning}
                    onPress={() => setViewMode('setup')}
                  >
                    <ArrowLeft size={14} color={colors.subtle} />
                    <Text style={[styles.arenaSecondaryText, { color: colors.text }]}>
                      {locale === 'vi' ? 'Chỉnh sửa vòng quay' : 'Edit wheel'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.arenaSecondaryBtn}
                    disabled={isSpinning}
                    onPress={onClose}
                  >
                    <Text style={[styles.arenaSecondaryText, { color: colors.text }]}>
                      {t.luckyWheel.backToChat}
                    </Text>
                    <ArrowRight size={14} color={colors.subtle} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
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
    maxHeight: '88%',
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
  },
  boardActionBtnIconOnly: {
    flex: 1,
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
