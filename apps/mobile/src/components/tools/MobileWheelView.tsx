import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, G, Circle, Rect, Text as SvgText } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import {
  Compass,
  Plus,
  Trash2,
  X,
  Trophy,
  RotateCw,
  Volume2,
  VolumeX,
  Shuffle,
  RotateCcw,
  ArrowDownAZ,
  PanelRightClose,
  PanelRightOpen,
  BookmarkCheck,
  Check,
  Share2,
  Sparkles,
} from 'lucide-react-native';
import {
  getWheelsApi,
  createWheelApi,
  updateWheelApi,
  spinWheelApi,
  spinAllWheelsApi,
  deleteWheelApi,
  deleteAllWheelsApi,
  shareWheelResultsToChatApi,
} from '../../services/circle-tools.service';
import { DecisionWheelEntity } from '@circle/types';
import { getSocket } from '../../services/socket';
import { useAuthStore } from '../../stores/auth.store';
import { useLanguageStore } from '../../stores/language.store';

interface MobileWheelViewProps {
  circleId: string;
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

interface WheelMobileState {
  optionsText: string;
  isSpinning: boolean;
}

export const MobileWheelView: React.FC<MobileWheelViewProps> = ({ circleId }) => {
  const insets = useSafeAreaInsets();
  const t = useLanguageStore((s) => s.t);
  const user = useAuthStore((s) => s.user);

  // Khoảng cách an toàn để Floating Pill Toolbar và nội dung không bị đè lên thanh điều hướng của Modal cha
  const navBarBottom = Math.max(insets.top + 8, 16) + 36;
  const floatingToolbarTop = navBarBottom + 10;
  const scrollPaddingTop = floatingToolbarTop + 44;
  const scrollPaddingBottom = Math.max(insets.bottom + 36, 60);

  // Wheels state
  const [wheels, setWheels] = useState<DecisionWheelEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Tab: wheel ID or 'results'
  const [activeTab, setActiveTab] = useState<string>('wheel');
  const [activeWheelId, setActiveWheelId] = useState<string | null>(null);

  // Results Text: Mỗi dòng là kết quả của 1 lần quay (các vòng cách nhau bởi dấu " - ")
  const [resultsText, setResultsText] = useState<string>('');
  const resultLines = useMemo(() => {
    return resultsText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  }, [resultsText]);
  const resultLinesCount = resultLines.length;
  const [isSharingResults, setIsSharingResults] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Board Collapsed State (mặc định thu gọn khi mới vào để xem vòng tròn trọn vẹn)
  const [isBoardCollapsed, setIsBoardCollapsed] = useState(true);

  // Local state per wheel
  const [wheelStates, setWheelStates] = useState<Record<string, WheelMobileState>>({});
  const rotateAnims = useRef<Record<string, Animated.Value>>({});
  const currentRotations = useRef<Record<string, number>>({});

  // Batch spinning tracking (gom kết quả chung khi quay nhiều vòng)
  const activeSpinningBatchRef = useRef<Set<string>>(new Set());
  const batchAccumulatorRef = useRef<
    { wheelId: string; wheelTitle: string; winner: string; winningIndex: number }[]
  >([]);

  // Combined Results Modal
  const [combinedWinnersModal, setCombinedWinnersModal] = useState<
    { wheelId: string; wheelTitle: string; winner: string; winningIndex: number }[] | null
  >(null);

  // Sync wheel states when wheels load
  useEffect(() => {
    setWheelStates((prev) => {
      const next: Record<string, WheelMobileState> = { ...prev };
      wheels.forEach((w) => {
        if (!next[w.id]) {
          const text = (w.options || []).map((o) => o.optionLabel).join('\n');
          next[w.id] = {
            optionsText: text,
            isSpinning: false,
          };
          if (!rotateAnims.current[w.id]) {
            rotateAnims.current[w.id] = new Animated.Value(0);
            currentRotations.current[w.id] = 0;
          }
        }
      });
      return next;
    });

    if (wheels.length > 0 && (!activeWheelId || !wheels.some((w) => w.id === activeWheelId))) {
      const fallbackId = wheels[0]?.id || null;
      setActiveWheelId(fallbackId);
      if (activeTab !== 'results' && fallbackId) {
        setActiveTab(fallbackId);
      }
    }
  }, [wheels, activeWheelId, activeTab]);

  // Audio settings
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Parse lines to options helper
  const parseOptions = useCallback((text: string): string[] => {
    return text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  }, []);

  // Is any wheel currently spinning
  const isAnySpinning = useMemo(
    () => Object.values(wheelStates).some((s) => s.isSpinning),
    [wheelStates],
  );

  // Auto-save debounce timers
  const autoSaveTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const saveWheelChanges = useCallback(
    async (wheelId: string, updatedText?: string, titleOverride?: string) => {
      const currentWheel = wheels.find((w) => w.id === wheelId);
      const state = wheelStates[wheelId];
      if (!currentWheel || !state) return;

      const text = updatedText !== undefined ? updatedText : state.optionsText;
      const opts = parseOptions(text);
      if (opts.length < 1) return;

      try {
        const formatted = opts.map((label, idx) => ({
          optionLabel: label,
          color: PASTEL_WHEEL_COLORS[idx % PASTEL_WHEEL_COLORS.length],
        }));

        const updated = await updateWheelApi(circleId, wheelId, {
          title: titleOverride ?? currentWheel.title,
          options: formatted,
          soundEnabled,
        });

        setWheels((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
      } catch {}
    },
    [circleId, wheels, wheelStates, parseOptions, soundEnabled],
  );

  const handleTextChange = (wheelId: string, newText: string) => {
    if (isAnySpinning) return;
    setWheelStates((prev) => ({
      ...prev,
      [wheelId]: {
        ...prev[wheelId]!,
        optionsText: newText,
      },
    }));

    if (autoSaveTimers.current[wheelId]) {
      clearTimeout(autoSaveTimers.current[wheelId]);
    }

    const opts = parseOptions(newText);
    if (opts.length >= 1) {
      autoSaveTimers.current[wheelId] = setTimeout(() => {
        saveWheelChanges(wheelId, newText);
      }, 900);
    }
  };

  // Load wheels
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const wheelsData = await getWheelsApi(circleId);
      setWheels(wheelsData);
    } catch (err: any) {
      Alert.alert(t.common.unknownError, err.message || t.common.unknownError);
    } finally {
      setIsLoading(false);
    }
  }, [circleId, t.common.unknownError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-seed: Khởi tạo 1 vòng mặc định mẫu pastel ngay khi mở nếu Circle chưa có vòng nào (mở ra là quay ngay)
  const autoSeedRef = useRef(false);
  useEffect(() => {
    if (!isLoading && wheels.length === 0 && !autoSeedRef.current) {
      autoSeedRef.current = true;
      handleAddDefaultWheel();
    }
  }, [isLoading, wheels.length]);

  // Animate a specific wheel to target
  const animateWheelTo = useCallback(
    (
      wheelId: string,
      targetIndex: number,
      targetLabel: string,
      wheelTitle: string,
    ) => {
      const state = wheelStates[wheelId];
      if (!state) return;

      const opts = parseOptions(state.optionsText);
      const count = opts.length;
      if (count < 1) return;

      setWheelStates((prev) => ({
        ...prev,
        [wheelId]: { ...prev[wheelId]!, isSpinning: true },
      }));

      const sliceDeg = 360 / count;
      const targetCenterDeg = targetIndex * sliceDeg + sliceDeg / 2;
      const stopAngle = (360 - (targetCenterDeg % 360)) % 360;

      const prevRotation = currentRotations.current[wheelId] || 0;
      const prevNorm = prevRotation % 360;
      const extraSpins = 6 * 360;
      let delta = stopAngle - prevNorm;
      if (delta < 0) delta += 360;
      const finalRotation = prevRotation + extraSpins + delta;

      if (!rotateAnims.current[wheelId]) {
        rotateAnims.current[wheelId] = new Animated.Value(prevRotation);
      }

      Animated.timing(rotateAnims.current[wheelId]!, {
        toValue: finalRotation,
        duration: 5200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        currentRotations.current[wheelId] = finalRotation;
        setWheelStates((prev) => ({
          ...prev,
          [wheelId]: { ...prev[wheelId]!, isSpinning: false },
        }));

        if (soundEnabled) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Add to batch accumulator
        batchAccumulatorRef.current.push({
          wheelId,
          wheelTitle,
          winner: targetLabel,
          winningIndex: targetIndex,
        });

        // Remove from active batch
        activeSpinningBatchRef.current.delete(wheelId);

        // When all active spinning wheels finish, show combined modal!
        if (activeSpinningBatchRef.current.size === 0) {
          const rawBatch = [...batchAccumulatorRef.current];
          const sortedBatch = [...rawBatch].sort((a, b) => {
            const idxA = wheels.findIndex((w) => w.id === a.wheelId);
            const idxB = wheels.findIndex((w) => w.id === b.wheelId);
            return idxA - idxB;
          });
          setCombinedWinnersModal(sortedBatch);
          const roundLine = sortedBatch.map((b) => b.winner).join(' - ');
          setResultsText((prev) => (prev ? `${prev}\n${roundLine}` : roundLine));
          batchAccumulatorRef.current = [];
        }
      });
    },
    [wheelStates, parseOptions, soundEnabled],
  );

  // Spin Single Wheel Action
  const handleSpinSingle = async (wheelId: string) => {
    const wheel = wheels.find((w) => w.id === wheelId);
    const state = wheelStates[wheelId];
    if (!wheel || !state || state.isSpinning) return;

    const opts = parseOptions(state.optionsText);
    if (opts.length < 1) return;

    // Register to active batch
    activeSpinningBatchRef.current.add(wheelId);

    try {
      const res = await spinWheelApi(circleId, wheelId);
      let targetIdx = opts.indexOf(res.selectedOption.optionLabel);
      if (targetIdx === -1) {
        targetIdx =
          typeof res.selectedOptionIndex === 'number' && res.selectedOptionIndex < opts.length
            ? res.selectedOptionIndex
            : 0;
      }

      animateWheelTo(wheelId, targetIdx, res.selectedOption.optionLabel, wheel.title);
    } catch (err: any) {
      activeSpinningBatchRef.current.delete(wheelId);
      Alert.alert(t.common.unknownError, err.message || t.common.unknownError);
    }
  };

  // Spin All Wheels
  const handleSpinAll = async () => {
    if (wheels.length === 0 || isAnySpinning) return;

    wheels.forEach((w) => {
      const state = wheelStates[w.id];
      if (state && parseOptions(state.optionsText).length >= 1) {
        activeSpinningBatchRef.current.add(w.id);
      }
    });

    try {
      const results = await spinAllWheelsApi(circleId);
      results.forEach((r) => {
        const wheel = wheels.find((w) => w.id === r.wheelId);
        const state = wheelStates[r.wheelId];
        if (!wheel || !state) return;

        const opts = parseOptions(state.optionsText);
        if (opts.length < 1) return;

        let targetIdx = opts.indexOf(r.selectedOption.optionLabel);
        if (targetIdx === -1) {
          targetIdx =
            typeof r.selectedOptionIndex === 'number' && r.selectedOptionIndex < opts.length
              ? r.selectedOptionIndex
              : 0;
        }

        animateWheelTo(r.wheelId, targetIdx, r.selectedOption.optionLabel, wheel.title);
      });
    } catch (err: any) {
      activeSpinningBatchRef.current.clear();
      Alert.alert(t.common.unknownError, err.message || t.common.unknownError);
    }
  };

  // Remove Winning Option
  const handleRemoveWinningOption = (wheelId: string, winningIdx: number) => {
    const state = wheelStates[wheelId];
    if (!state) return;

    const opts = parseOptions(state.optionsText);
    const updated = opts.filter((_, idx) => idx !== winningIdx);
    const updatedText = updated.join('\n');

    setWheelStates((prev) => ({
      ...prev,
      [wheelId]: {
        ...prev[wheelId]!,
        optionsText: updatedText,
      },
    }));

    saveWheelChanges(wheelId, updatedText);

    if (combinedWinnersModal) {
      setCombinedWinnersModal((prev) => {
        if (!prev) return null;
        const remaining = prev.filter(
          (r) => !(r.wheelId === wheelId && r.winningIndex === winningIdx),
        );
        return remaining.length > 0 ? remaining : null;
      });
    }
  };

  // Sort results: toggle between alphabetical (A-Z) and reverse order
  const handleSortResults = () => {
    if (resultLines.length < 2) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isSortedAZ = resultLines.every(
      (line, idx, arr) => idx === 0 || line.localeCompare(arr[idx - 1]!, 'vi') >= 0,
    );
    const sorted = isSortedAZ
      ? [...resultLines].reverse()
      : [...resultLines].sort((a, b) => a.localeCompare(b, 'vi'));
    setResultsText(sorted.join('\n'));
  };

  // Share results board to circle chat channel
  const handleShareResultsToChat = async () => {
    if (resultLines.length === 0 || isSharingResults) return;
    setIsSharingResults(true);
    try {
      await shareWheelResultsToChatApi(
        circleId,
        resultLines.map((line, idx) => ({ wheelTitle: `Lần ${idx + 1}`, winner: line })),
      );
      setShareSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setShareSuccess(false), 2500);
    } catch (err: any) {
      Alert.alert(t.common.unknownError, err?.message || t.common.unknownError);
    } finally {
      setIsSharingResults(false);
    }
  };

  // Clear all results history with confirmation alert
  const handleClearResults = () => {
    if (resultLines.length === 0) return;
    Alert.alert(
      t.luckyWheel.confirmClearResultsTitle,
      t.luckyWheel.confirmClearResultsDesc,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setResultsText('');
          },
        },
      ],
    );
  };

  // Shuffle options
  const handleShuffle = (wheelId: string) => {
    if (isAnySpinning) return;
    const state = wheelStates[wheelId];
    if (!state) return;
    const opts = parseOptions(state.optionsText);
    if (opts.length < 2) return;

    const shuffled = [...opts];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i]!;
      shuffled[i] = shuffled[j]!;
      shuffled[j] = temp;
    }
    const text = shuffled.join('\n');
    setWheelStates((prev) => ({
      ...prev,
      [wheelId]: {
        ...prev[wheelId]!,
        optionsText: text,
      },
    }));
    saveWheelChanges(wheelId, text);
  };

  // Sort options A-Z
  const handleSortAZ = (wheelId: string) => {
    if (isAnySpinning) return;
    const state = wheelStates[wheelId];
    if (!state) return;
    const opts = parseOptions(state.optionsText);
    if (opts.length < 2) return;

    const sorted = [...opts].sort((a, b) =>
      a.localeCompare(b, 'vi', { sensitivity: 'base' }),
    );
    const text = sorted.join('\n');
    setWheelStates((prev) => ({
      ...prev,
      [wheelId]: {
        ...prev[wheelId]!,
        optionsText: text,
      },
    }));
    saveWheelChanges(wheelId, text);
  };

  // Save current options as initial baseline
  const handleSaveAsInitial = async (wheelId: string) => {
    if (isAnySpinning) return;
    const wheel = wheels.find((w) => w.id === wheelId);
    if (!wheel) return;

    const currentText = wheelStates[wheelId]?.optionsText || '';
    const parsed = parseOptions(currentText);
    if (parsed.length < 1) {
      Alert.alert(t.luckyWheel.emptyOptionsWarning, t.luckyWheel.minOptionsError);
      return;
    }

    try {
      const formatted = parsed.map((label, idx) => ({
        optionLabel: label,
        color: PASTEL_WHEEL_COLORS[idx % PASTEL_WHEEL_COLORS.length],
      }));

      const updated = await updateWheelApi(circleId, wheelId, {
        title: wheel.title,
        options: formatted,
        initialOptions: parsed,
      });

      setWheels((prev) => prev.map((w) => (w.id === wheelId ? updated : w)));
      Alert.alert(t.luckyWheel.saveAsInitial, t.luckyWheel.saveAsInitialSuccess);
    } catch (err: any) {
      Alert.alert(t.common.unknownError, err.message || t.common.unknownError);
    }
  };

  // Reset options to initial baseline
  const handleReset = (wheelId: string) => {
    if (isAnySpinning) return;
    const wheel = wheels.find((w) => w.id === wheelId);
    if (!wheel) return;
    const initial =
      wheel.initialOptions && wheel.initialOptions.length >= 2
        ? wheel.initialOptions
        : null;
    if (!initial) {
      Alert.alert(t.luckyWheel.resetOptions, t.luckyWheel.resetEmptyWarning);
      return;
    }

    Alert.alert(t.luckyWheel.resetOptions, t.luckyWheel.confirmReset, [
      { text: t.luckyWheel.cancel, style: 'cancel' },
      {
        text: t.luckyWheel.resetOptions,
        onPress: () => {
          const text = initial.join('\n');
          setWheelStates((prev) => ({
            ...prev,
            [wheelId]: {
              ...prev[wheelId]!,
              optionsText: text,
            },
          }));
          saveWheelChanges(wheelId, text);
          Alert.alert(t.luckyWheel.resetOptions, t.luckyWheel.resetSuccess);
        },
      },
    ]);
  };

  // Add Wheel with Default Name immediately
  const handleAddDefaultWheel = async () => {
    if (wheels.length >= 4 || isAnySpinning) {
      if (wheels.length >= 4) {
        Alert.alert(t.luckyWheel.maxWheelsBadge, t.luckyWheel.maxWheelsReached);
      }
      return;
    }

    const nextNumber = wheels.length + 1;
    const defaultTitle = t.luckyWheel.wheelNumber.replace('{number}', String(nextNumber));
    const defaultChoices = ['Phở', 'Bún bò', 'Cơm tấm', 'Bánh mì'];

    try {
      const res = await createWheelApi(circleId, {
        title: defaultTitle,
        options: defaultChoices.map((label, idx) => ({
          optionLabel: label,
          color: PASTEL_WHEEL_COLORS[idx % PASTEL_WHEEL_COLORS.length],
        })),
        initialOptions: defaultChoices,
        soundEnabled: true,
        confettiEnabled: true,
      });

      setWheels((prev) => [...prev, res]);
      setActiveWheelId(res.id);
    } catch (err: any) {
      Alert.alert(t.common.unknownError, err.message || t.luckyWheel.maxWheelsReached);
    }
  };

  // Delete Wheel
  const handleDeleteWheel = (wheelId: string) => {
    if (isAnySpinning) return;
    Alert.alert(t.luckyWheel.confirmDeleteTitle, t.luckyWheel.confirmDeleteDesc, [
      { text: t.luckyWheel.cancel, style: 'cancel' },
      {
        text: t.common.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteWheelApi(circleId, wheelId);
            setWheels((prev) => prev.filter((w) => w.id !== wheelId));
          } catch (err: any) {
            Alert.alert(t.common.unknownError, err.message || t.common.unknownError);
          }
        },
      },
    ]);
  };

  // Delete All Wheels (leaves 1 default wheel)
  const handleDeleteAllWheels = () => {
    if (isAnySpinning || wheels.length === 0) return;
    Alert.alert(t.luckyWheel.deleteAllWheels, t.luckyWheel.confirmDeleteAllWheels, [
      { text: t.luckyWheel.cancel, style: 'cancel' },
      {
        text: t.common.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            const defaultTitle = t.luckyWheel.wheelNumber.replace('{number}', '1');
            await deleteAllWheelsApi(circleId, defaultTitle);
            await loadData();
          } catch (err: any) {
            Alert.alert(t.common.unknownError, err.message || t.common.unknownError);
          }
        },
      },
    ]);
  };

  // Render SVG slices for a specific wheel
  const renderWheelSvg = (options: string[], discSize: number) => {
    const count = options.length;
    if (count === 0) return null;

    const radius = discSize / 2;
    const centerX = discSize / 2;
    const centerY = discSize / 2;

    if (count === 1) {
      const label = options[0]!;
      const color = PASTEL_WHEEL_COLORS[0]!;
      const maxLen = discSize > 200 ? 12 : 7;
      const displayLabel = label.length > maxLen ? label.slice(0, maxLen - 1) + '…' : label;
      return (
        <G key="slice-single">
          <Circle cx={centerX} cy={centerY} r={radius} fill={color} />
          <SvgText
            x={centerX}
            y={centerY}
            fill="#1E293B"
            fontSize={discSize > 200 ? 14 : 11}
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="central"
          >
            {displayLabel}
          </SvgText>
        </G>
      );
    }

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
            fontWeight="600"
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

  const activeWheel = useMemo(
    () => wheels.find((w) => w.id === activeWheelId) || wheels[0] || null,
    [wheels, activeWheelId],
  );

  const activeState = useMemo(() => {
    if (!activeWheel) return null;
    return wheelStates[activeWheel.id];
  }, [activeWheel, wheelStates]);

  const activeParsed = useMemo(() => {
    if (!activeState) return [];
    return parseOptions(activeState.optionsText);
  }, [activeState, parseOptions]);

  // Dynamic Disc Size for Mobile
  const singleDiscSize = isBoardCollapsed ? 280 : 230;
  const multiDiscSize = isBoardCollapsed ? 165 : 145;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D9488" />
      </View>
    );
  }

  // Loại bỏ tất cả kết quả trúng thưởng vừa quay và đóng modal
  const handleRemoveAllWinningOptions = () => {
    if (!combinedWinnersModal) return;
    combinedWinnersModal.forEach((r) => {
      handleRemoveWinningOption(r.wheelId, r.winningIndex);
    });
    setCombinedWinnersModal(null);
  };

  return (
    <View style={styles.container}>
      {/* Floating Pill Toolbar: Floating over content with pointerEvents="box-none" */}
      <View style={[styles.floatingHeaderArea, { top: floatingToolbarTop }]} pointerEvents="box-none">
        <View />

        {/* Right: Add Wheel & Spin All Pills */}
        <View style={styles.floatingRightActions}>
          <TouchableOpacity
            style={[
              styles.floatingPillBtn,
              (wheels.length >= 4 || isAnySpinning) && { opacity: 0.4 },
            ]}
            disabled={wheels.length >= 4 || isAnySpinning}
            onPress={handleAddDefaultWheel}
            activeOpacity={0.8}
          >
            <Plus size={14} color="#0D9488" />
            <Text style={styles.floatingPillText}>{t.luckyWheel.addWheel}</Text>
          </TouchableOpacity>

          {wheels.length > 0 && (
            <TouchableOpacity
              style={[
                styles.floatingPillPrimaryBtn,
                isAnySpinning && { opacity: 0.5 },
              ]}
              disabled={isAnySpinning}
              onPress={handleSpinAll}
              activeOpacity={0.8}
            >
              <RotateCw size={13} color="#FFFFFF" />
              <Text style={styles.floatingPillPrimaryText}>{t.luckyWheel.spinAll}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: scrollPaddingTop,
            paddingBottom: scrollPaddingBottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* SÂN KHẤU VÒNG QUAY (VISUAL ARENA) */}
        <View style={styles.arenaContainer}>
        {wheels.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Compass size={40} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>{t.luckyWheel.emptyWheelsTitle}</Text>
            <Text style={styles.emptyDesc}>{t.luckyWheel.emptyWheelsDesc}</Text>
            <TouchableOpacity style={styles.createFirstBtn} onPress={handleAddDefaultWheel}>
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.createFirstBtnText}>{t.luckyWheel.createWheel}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.arenaStage}>
            {/* 1 VÒNG: Vòng to chính giữa */}
            {wheels.length === 1 && (
              <View style={styles.singleWheelWrapper}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setActiveWheelId(wheels[0]!.id);
                    setActiveTab(wheels[0]!.id);
                    setIsBoardCollapsed(false);
                  }}
                  style={[
                    styles.mobileWheelTitleBadge,
                    activeWheelId === wheels[0]!.id && styles.mobileWheelTitleBadgeActive,
                  ]}
                >
                  <Compass size={13} color={activeWheelId === wheels[0]!.id ? '#FFFFFF' : '#0D9488'} />
                  <Text
                    style={[
                      styles.mobileWheelTitleText,
                      activeWheelId === wheels[0]!.id && styles.mobileWheelTitleTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {wheels[0]!.title}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => {
                    handleSpinSingle(wheels[0]!.id);
                  }}
                  style={styles.cleanWheelCard}
                >
                  <View style={{ width: singleDiscSize, height: singleDiscSize, position: 'relative' }}>
                    <Animated.View
                      style={{
                        width: singleDiscSize,
                        height: singleDiscSize,
                        transform: [
                          {
                            rotate: (
                              rotateAnims.current[wheels[0]!.id] || new Animated.Value(0)
                            ).interpolate({
                              inputRange: [0, 360],
                              outputRange: ['0deg', '360deg'],
                            }),
                          },
                        ],
                      }}
                    >
                      <Svg width={singleDiscSize} height={singleDiscSize}>
                        {renderWheelSvg(
                          parseOptions(wheelStates[wheels[0]!.id]?.optionsText || ''),
                          singleDiscSize,
                        )}
                        <Circle
                          cx={singleDiscSize / 2}
                          cy={singleDiscSize / 2}
                          r={16}
                          fill="#FFFFFF"
                          stroke="#0D9488"
                          strokeWidth={3}
                        />
                        <Circle
                          cx={singleDiscSize / 2}
                          cy={singleDiscSize / 2}
                          r={6}
                          fill="#0D9488"
                        />
                      </Svg>
                    </Animated.View>
                    <View style={styles.pointerRight} pointerEvents="none">
                      <Svg width={30} height={20} viewBox="0 0 30 20">
                        <Path
                          d="M2 10L18 2C20 1 21 2 21 4V16C21 18 20 19 18 18L2 10Z"
                          fill="#0D9488"
                          stroke="#FFFFFF"
                          strokeWidth={1.5}
                          strokeLinejoin="round"
                        />
                        <Rect x={19} y={4} width={9} height={12} rx={3} fill="#0F766E" stroke="#FFFFFF" strokeWidth={1.5} />
                        <Circle cx={23.5} cy={10} r={2.5} fill="#FFFFFF" />
                        <Circle cx={23.5} cy={10} r={1.2} fill="#0D9488" />
                      </Svg>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* 2 VÒNG: Hàng trên 2 vòng đặt cạnh nhau */}
            {wheels.length === 2 && (
              <View style={styles.rowTwoWheels}>
                {wheels.map((wheel) => {
                  const local = wheelStates[wheel.id];
                  const opts = parseOptions(local?.optionsText || '');
                  return (
                    <View key={wheel.id} style={{ alignItems: 'center' }}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          setActiveWheelId(wheel.id);
                          setActiveTab(wheel.id);
                          setIsBoardCollapsed(false);
                        }}
                        style={[
                          styles.mobileWheelTitleBadge,
                          activeWheelId === wheel.id && styles.mobileWheelTitleBadgeActive,
                        ]}
                      >
                        <Compass size={12} color={activeWheelId === wheel.id ? '#FFFFFF' : '#0D9488'} />
                        <Text
                          style={[
                            styles.mobileWheelTitleText,
                            activeWheelId === wheel.id && styles.mobileWheelTitleTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {wheel.title}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => {
                          handleSpinSingle(wheel.id);
                        }}
                        style={styles.cleanSmallWheelCard}
                      >
                        <View style={{ width: multiDiscSize, height: multiDiscSize, position: 'relative' }}>
                          <Animated.View
                            style={{
                              width: multiDiscSize,
                              height: multiDiscSize,
                              transform: [
                                {
                                  rotate: (
                                    rotateAnims.current[wheel.id] || new Animated.Value(0)
                                  ).interpolate({
                                    inputRange: [0, 360],
                                    outputRange: ['0deg', '360deg'],
                                  }),
                                },
                              ],
                            }}
                          >
                            <Svg width={multiDiscSize} height={multiDiscSize}>
                              {renderWheelSvg(opts, multiDiscSize)}
                              <Circle
                                cx={multiDiscSize / 2}
                                cy={multiDiscSize / 2}
                                r={12}
                                fill="#FFFFFF"
                                stroke="#0D9488"
                                strokeWidth={2}
                              />
                              <Circle
                                cx={multiDiscSize / 2}
                                cy={multiDiscSize / 2}
                                r={4}
                                fill="#0D9488"
                              />
                            </Svg>
                          </Animated.View>
                          <View style={styles.pointerRightSmall} pointerEvents="none">
                            <Svg width={24} height={16} viewBox="0 0 24 16">
                              <Path
                                d="M2 8L14 2C16 1 17 2 17 3.5V12.5C17 14 16 15 14 14L2 8Z"
                                fill="#0D9488"
                                stroke="#FFFFFF"
                                strokeWidth={1.5}
                                strokeLinejoin="round"
                              />
                              <Rect x={15} y={3} width={7} height={10} rx={2} fill="#0F766E" stroke="#FFFFFF" strokeWidth={1.5} />
                              <Circle cx={18.5} cy={8} r={2} fill="#FFFFFF" />
                              <Circle cx={18.5} cy={8} r={1} fill="#0D9488" />
                            </Svg>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {/* 3 VÒNG: Hàng trên 2 vòng, hàng dưới 1 vòng */}
            {wheels.length === 3 && (
              <View style={styles.gridThreeWheels}>
                <View style={styles.rowTwoWheels}>
                  {wheels.slice(0, 2).map((wheel) => {
                    const local = wheelStates[wheel.id];
                    const opts = parseOptions(local?.optionsText || '');
                    return (
                      <View key={wheel.id} style={{ alignItems: 'center' }}>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => {
                            setActiveWheelId(wheel.id);
                            setActiveTab(wheel.id);
                            setIsBoardCollapsed(false);
                          }}
                          style={[
                            styles.mobileWheelTitleBadge,
                            activeWheelId === wheel.id && styles.mobileWheelTitleBadgeActive,
                          ]}
                        >
                          <Compass size={12} color={activeWheelId === wheel.id ? '#FFFFFF' : '#0D9488'} />
                          <Text
                            style={[
                              styles.mobileWheelTitleText,
                              activeWheelId === wheel.id && styles.mobileWheelTitleTextActive,
                            ]}
                            numberOfLines={1}
                          >
                            {wheel.title}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={() => {
                            handleSpinSingle(wheel.id);
                          }}
                          style={styles.cleanSmallWheelCard}
                        >
                          <View style={{ width: multiDiscSize, height: multiDiscSize, position: 'relative' }}>
                            <Animated.View
                              style={{
                                width: multiDiscSize,
                                height: multiDiscSize,
                                transform: [
                                  {
                                    rotate: (
                                      rotateAnims.current[wheel.id] || new Animated.Value(0)
                                    ).interpolate({
                                      inputRange: [0, 360],
                                      outputRange: ['0deg', '360deg'],
                                    }),
                                  },
                                ],
                              }}
                            >
                              <Svg width={multiDiscSize} height={multiDiscSize}>
                                {renderWheelSvg(opts, multiDiscSize)}
                                <Circle
                                  cx={multiDiscSize / 2}
                                  cy={multiDiscSize / 2}
                                  r={12}
                                  fill="#FFFFFF"
                                  stroke="#0D9488"
                                  strokeWidth={2}
                                />
                                <Circle
                                  cx={multiDiscSize / 2}
                                  cy={multiDiscSize / 2}
                                  r={4}
                                  fill="#0D9488"
                                />
                              </Svg>
                            </Animated.View>
                            <View style={styles.pointerRightSmall} pointerEvents="none">
                              <Svg width={24} height={16} viewBox="0 0 24 16">
                                <Path
                                  d="M2 8L14 2C16 1 17 2 17 3.5V12.5C17 14 16 15 14 14L2 8Z"
                                  fill="#0D9488"
                                  stroke="#FFFFFF"
                                  strokeWidth={1.5}
                                  strokeLinejoin="round"
                                />
                                <Rect x={15} y={3} width={7} height={10} rx={2} fill="#0F766E" stroke="#FFFFFF" strokeWidth={1.5} />
                                <Circle cx={18.5} cy={8} r={2} fill="#FFFFFF" />
                                <Circle cx={18.5} cy={8} r={1} fill="#0D9488" />
                              </Svg>
                            </View>
                          </View>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>

                {wheels[2] && (
                  <View style={{ alignItems: 'center', marginTop: 10 }}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        setActiveWheelId(wheels[2]!.id);
                        setActiveTab(wheels[2]!.id);
                        setIsBoardCollapsed(false);
                      }}
                      style={[
                        styles.mobileWheelTitleBadge,
                        activeWheelId === wheels[2]!.id && styles.mobileWheelTitleBadgeActive,
                      ]}
                    >
                      <Compass size={12} color={activeWheelId === wheels[2]!.id ? '#FFFFFF' : '#0D9488'} />
                      <Text
                        style={[
                          styles.mobileWheelTitleText,
                          activeWheelId === wheels[2]!.id && styles.mobileWheelTitleTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {wheels[2]!.title}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => {
                        handleSpinSingle(wheels[2]!.id);
                      }}
                      style={styles.cleanSmallWheelCard}
                    >
                      <View style={{ width: multiDiscSize, height: multiDiscSize, position: 'relative' }}>
                        <Animated.View
                          style={{
                            width: multiDiscSize,
                            height: multiDiscSize,
                            transform: [
                              {
                                rotate: (
                                  rotateAnims.current[wheels[2]!.id] || new Animated.Value(0)
                                ).interpolate({
                                  inputRange: [0, 360],
                                  outputRange: ['0deg', '360deg'],
                                }),
                              },
                            ],
                          }}
                        >
                          <Svg width={multiDiscSize} height={multiDiscSize}>
                            {renderWheelSvg(
                              parseOptions(wheelStates[wheels[2]!.id]?.optionsText || ''),
                              multiDiscSize,
                            )}
                            <Circle
                              cx={multiDiscSize / 2}
                              cy={multiDiscSize / 2}
                              r={12}
                              fill="#FFFFFF"
                              stroke="#0D9488"
                              strokeWidth={2}
                            />
                            <Circle
                              cx={multiDiscSize / 2}
                              cy={multiDiscSize / 2}
                              r={4}
                              fill="#0D9488"
                            />
                          </Svg>
                        </Animated.View>
                        <View style={styles.pointerRightSmall} pointerEvents="none">
                          <Svg width={24} height={16} viewBox="0 0 24 16">
                            <Path
                              d="M2 8L14 2C16 1 17 2 17 3.5V12.5C17 14 16 15 14 14L2 8Z"
                              fill="#0D9488"
                              stroke="#FFFFFF"
                              strokeWidth={1.5}
                              strokeLinejoin="round"
                            />
                            <Rect x={15} y={3} width={7} height={10} rx={2} fill="#0F766E" stroke="#FFFFFF" strokeWidth={1.5} />
                            <Circle cx={18.5} cy={8} r={2} fill="#FFFFFF" />
                            <Circle cx={18.5} cy={8} r={1} fill="#0D9488" />
                          </Svg>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* 4 VÒNG: LƯỚI 2x2 */}
            {wheels.length === 4 && (
              <View style={styles.gridFourWheels}>
                {wheels.map((wheel) => {
                  const local = wheelStates[wheel.id];
                  const opts = parseOptions(local?.optionsText || '');
                  return (
                    <View key={wheel.id} style={{ alignItems: 'center' }}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          setActiveWheelId(wheel.id);
                          setActiveTab(wheel.id);
                          setIsBoardCollapsed(false);
                        }}
                        style={[
                          styles.mobileWheelTitleBadge,
                          activeWheelId === wheel.id && styles.mobileWheelTitleBadgeActive,
                        ]}
                      >
                        <Compass size={12} color={activeWheelId === wheel.id ? '#FFFFFF' : '#0D9488'} />
                        <Text
                          style={[
                            styles.mobileWheelTitleText,
                            activeWheelId === wheel.id && styles.mobileWheelTitleTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {wheel.title}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => {
                          handleSpinSingle(wheel.id);
                        }}
                        style={styles.cleanSmallWheelCard}
                      >
                        <View style={{ width: multiDiscSize, height: multiDiscSize, position: 'relative' }}>
                          <Animated.View
                            style={{
                              width: multiDiscSize,
                              height: multiDiscSize,
                              transform: [
                                {
                                  rotate: (
                                    rotateAnims.current[wheel.id] || new Animated.Value(0)
                                  ).interpolate({
                                    inputRange: [0, 360],
                                    outputRange: ['0deg', '360deg'],
                                  }),
                                },
                              ],
                            }}
                          >
                            <Svg width={multiDiscSize} height={multiDiscSize}>
                              {renderWheelSvg(opts, multiDiscSize)}
                              <Circle
                                cx={multiDiscSize / 2}
                                cy={multiDiscSize / 2}
                                r={12}
                                fill="#FFFFFF"
                                stroke="#0D9488"
                                strokeWidth={2}
                              />
                              <Circle
                                cx={multiDiscSize / 2}
                                cy={multiDiscSize / 2}
                                r={4}
                                fill="#0D9488"
                              />
                            </Svg>
                          </Animated.View>
                          <View style={styles.pointerRightSmall} pointerEvents="none">
                            <Svg width={24} height={16} viewBox="0 0 24 16">
                              <Path
                                d="M2 8L14 2C16 1 17 2 17 3.5V12.5C17 14 16 15 14 14L2 8Z"
                                fill="#0D9488"
                                stroke="#FFFFFF"
                                strokeWidth={1.5}
                                strokeLinejoin="round"
                              />
                              <Rect x={15} y={3} width={7} height={10} rx={2} fill="#0F766E" stroke="#FFFFFF" strokeWidth={1.5} />
                              <Circle cx={18.5} cy={8} r={2} fill="#FFFFFF" />
                              <Circle cx={18.5} cy={8} r={1} fill="#0D9488" />
                            </Svg>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </View>

      {/* "CÁI BẢNG" (TABBED OPTIONS BOARD BÊN DƯỚI) */}
      {!isBoardCollapsed && (
        <View style={styles.tabbedBoard}>
          {/* Nút thu gọn bảng: Nửa trong nửa ngoài trên viền mép trên của bảng */}
          <TouchableOpacity
            style={styles.collapseHandleBtn}
            onPress={() => setIsBoardCollapsed(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <PanelRightClose size={14} color="#0D9488" />
          </TouchableOpacity>

          {/* Horizontal Tabs: Hiển thị thẳng tên của từng vòng + TAB KẾT QUẢ */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScroll}
          >
              {wheels.map((wheel) => {
                const isSelected = activeTab === wheel.id;
                return (
                  <TouchableOpacity
                    key={wheel.id}
                    onPress={() => {
                      setActiveTab(wheel.id);
                      setActiveWheelId(wheel.id);
                    }}
                    style={[styles.tabPill, isSelected && styles.tabPillActive]}
                  >
                    <Text style={[styles.tabPillText, isSelected && styles.tabPillTextActive]}>
                      {wheel.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Tab Kết Quả */}
              <TouchableOpacity
                onPress={() => setActiveTab('results')}
                style={[
                  styles.tabPill,
                  activeTab === 'results' && styles.tabPillActiveResults,
                ]}
              >
                <Trophy size={13} color={activeTab === 'results' ? '#FFFFFF' : '#F59E0B'} />
                <Text
                  style={[
                    styles.tabPillText,
                    activeTab === 'results' && styles.tabPillTextActive,
                  ]}
                >
                  {t.luckyWheel.resultsTab}
                </Text>
                {resultLinesCount > 0 && (
                  <View
                    style={[
                      styles.tabBadge,
                      activeTab === 'results' && { backgroundColor: 'rgba(255,255,255,0.25)' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeText,
                        activeTab === 'results' && { color: '#FFFFFF' },
                      ]}
                    >
                      {resultLinesCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </ScrollView>

          {/* TAB CONTENT: KẾT QUẢ (DẠNG TEXT NHƯ KHI NHẬP, GHI THEO LẦN) */}
          {activeTab === 'results' ? (
            <View style={styles.activeContentCard}>
              <View style={styles.resultsHeaderRow}>
                <View style={styles.resultsHeaderLeft}>
                  <Trophy size={16} color="#F59E0B" />
                  <Text style={styles.resultsHeaderTitle}>{t.luckyWheel.resultsHistoryTitle}</Text>
                  <Text style={styles.resultsHeaderCount}>({resultLinesCount})</Text>
                </View>
              </View>

              {/* Textarea lớn hiển thị & cho phép sửa kết quả dạng text */}
              <View style={{ flex: 1, minHeight: 180, marginBottom: 8 }}>
                <TextInput
                  style={[styles.boardTextarea, { minHeight: 180 }]}
                  multiline
                  value={resultsText}
                  onChangeText={setResultsText}
                  placeholder={t.luckyWheel.resultsPlaceholder}
                  placeholderTextColor="#9CA3AF"
                />
                <Text style={styles.resultsHintText}>{t.luckyWheel.resultsHint}</Text>
              </View>

              {/* Action Buttons: Sort A-Z, Share to Chat, Clear All (Icons only) */}
              <View style={styles.boardActionsRow}>
                <TouchableOpacity
                  style={[
                    styles.boardActionBtnIconOnly,
                    resultLinesCount < 2 && { opacity: 0.4 },
                  ]}
                  disabled={resultLinesCount < 2}
                  onPress={handleSortResults}
                >
                  <ArrowDownAZ size={18} color="#6366F1" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.boardActionBtnIconOnly,
                    (resultLinesCount === 0 || isSharingResults) && { opacity: 0.4 },
                  ]}
                  disabled={resultLinesCount === 0 || isSharingResults}
                  onPress={handleShareResultsToChat}
                >
                  {isSharingResults ? (
                    <ActivityIndicator size="small" color="#0D9488" />
                  ) : shareSuccess ? (
                    <Check size={18} color="#10B981" />
                  ) : (
                    <Share2 size={18} color="#0D9488" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.boardActionBtnIconOnly,
                    resultLinesCount === 0 && { opacity: 0.4 },
                  ]}
                  disabled={resultLinesCount === 0}
                  onPress={handleClearResults}
                >
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>

              {/* Sound & Delete All Wheels (Đồng bộ với Tab Setup) */}
              <View style={[styles.togglesRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' }]}>
                <TouchableOpacity
                  style={[styles.toggleItem, isAnySpinning && { opacity: 0.4 }]}
                  disabled={isAnySpinning}
                  onPress={() => setSoundEnabled((prev) => !prev)}
                >
                  {soundEnabled ? (
                    <Volume2 size={16} color="#0D9488" />
                  ) : (
                    <VolumeX size={16} color="#9CA3AF" />
                  )}
                  <Text style={styles.toggleItemText}>{t.luckyWheel.soundSetting}</Text>
                </TouchableOpacity>

                {/* Delete All Wheels Button */}
                <TouchableOpacity
                  style={[styles.toggleItem, isAnySpinning && { opacity: 0.4 }]}
                  disabled={isAnySpinning || wheels.length === 0}
                  onPress={handleDeleteAllWheels}
                >
                  <Trash2 size={15} color="#EF4444" />
                  <Text style={[styles.toggleItemText, { color: '#EF4444', fontWeight: '700' }]}>
                    {t.luckyWheel.deleteAllWheels}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* TAB CONTENT: ACTIVE WHEEL (OPTIONS & SETTINGS) */
            activeWheel && (
              <View style={styles.activeContentCard}>
                {/* Title & Delete */}
                <View style={styles.activeTitleRow}>
                  <TextInput
                    style={styles.inlineTitleInput}
                    value={activeWheel.title}
                    editable={!isAnySpinning}
                    onChangeText={(val) => {
                      setWheels((prev) =>
                        prev.map((w) => (w.id === activeWheel.id ? { ...w, title: val } : w)),
                      );
                      saveWheelChanges(activeWheel.id, undefined, val);
                    }}
                    placeholder={t.luckyWheel.wheelNamePlaceholder}
                  />
                  {wheels.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleDeleteWheel(activeWheel.id)}
                      disabled={isAnySpinning}
                      style={[styles.delWheelBtn, isAnySpinning && { opacity: 0.3 }]}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Counter */}
                <View style={styles.counterRow}>
                  <Text style={styles.counterLabel}>{t.luckyWheel.optionsListTitle}</Text>
                  <Text style={styles.counterValue}>
                    {t.luckyWheel.optionsCount.replace('{count}', String(activeParsed.length))}
                  </Text>
                </View>

                {/* Textarea */}
                <TextInput
                  style={styles.boardTextarea}
                  multiline
                  editable={!isAnySpinning}
                  value={activeState?.optionsText || ''}
                  onChangeText={(txt) => handleTextChange(activeWheel.id, txt)}
                  placeholder={t.luckyWheel.optionsPlaceholder}
                  placeholderTextColor="#9CA3AF"
                />

                {/* Action Buttons: Shuffle, Sort A-Z, Save Initial & Reset (Icons only, no text) */}
                <View style={styles.boardActionsRow}>
                  <TouchableOpacity
                    style={[styles.boardActionBtnIconOnly, isAnySpinning && { opacity: 0.4 }]}
                    disabled={isAnySpinning}
                    onPress={() => handleShuffle(activeWheel.id)}
                  >
                    <Shuffle size={18} color="#0D9488" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.boardActionBtnIconOnly, isAnySpinning && { opacity: 0.4 }]}
                    disabled={isAnySpinning}
                    onPress={() => handleSortAZ(activeWheel.id)}
                  >
                    <ArrowDownAZ size={18} color="#6366F1" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.boardActionBtnIconOnly, isAnySpinning && { opacity: 0.4 }]}
                    disabled={isAnySpinning}
                    onPress={() => handleSaveAsInitial(activeWheel.id)}
                  >
                    <BookmarkCheck size={18} color="#0D9488" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.boardActionBtnIconOnly, isAnySpinning && { opacity: 0.4 }]}
                    disabled={isAnySpinning}
                    onPress={() => handleReset(activeWheel.id)}
                  >
                    <RotateCcw size={18} color="#D97706" />
                  </TouchableOpacity>
                </View>

                {/* Sound & Delete All Wheels */}
                <View style={styles.togglesRow}>
                  <TouchableOpacity
                    style={[styles.toggleItem, isAnySpinning && { opacity: 0.4 }]}
                    disabled={isAnySpinning}
                    onPress={() => setSoundEnabled((prev) => !prev)}
                  >
                    {soundEnabled ? (
                      <Volume2 size={16} color="#0D9488" />
                    ) : (
                      <VolumeX size={16} color="#9CA3AF" />
                    )}
                    <Text style={styles.toggleItemText}>{t.luckyWheel.soundSetting}</Text>
                  </TouchableOpacity>

                  {/* Delete All Wheels Button */}
                  <TouchableOpacity
                    style={[styles.toggleItem, isAnySpinning && { opacity: 0.4 }]}
                    disabled={isAnySpinning || wheels.length === 0}
                    onPress={handleDeleteAllWheels}
                  >
                    <Trash2 size={15} color="#EF4444" />
                    <Text style={[styles.toggleItemText, { color: '#EF4444', fontWeight: '700' }]}>
                      {t.luckyWheel.deleteAllWheels}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          )}
        </View>
      )}
      </ScrollView>

      {/* Nút mở lại bảng: Ghim ở mép bên phải của phần hiển thị khi thu gọn */}
      {isBoardCollapsed && (
        <TouchableOpacity
          style={styles.floatingRightEdgeOpenBtn}
          onPress={() => setIsBoardCollapsed(false)}
          activeOpacity={0.8}
        >
          <PanelRightOpen size={16} color="#0D9488" />
        </TouchableOpacity>
      )}

      {/* COMBINED / BATCH RESULTS MODAL - CELEBRATION WINNER SHOWCASE */}
      <Modal visible={!!combinedWinnersModal && combinedWinnersModal.length > 0} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            {/* Nút X đóng ở góc trên bên phải */}
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setCombinedWinnersModal(null)}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>

            {/* Glowing Golden Trophy Icon */}
            <View style={styles.trophyWrapper}>
              <View style={styles.trophyGlow} />
              <View style={styles.trophyIconBox}>
                <Trophy size={28} color="#FFFFFF" />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.celebrationTitle}>
              🎉 {t.luckyWheel.winnerTitle || 'Xin chúc mừng!'}
            </Text>

            {/* Single Winner Layout */}
            {combinedWinnersModal?.length === 1 && (
              <>
                <View style={styles.singleWinnerCard}>
                  <View style={styles.winnerBadgePill}>
                    <Compass size={11} color="#B45309" />
                    <Text style={styles.singleWinnerWheelTitle} numberOfLines={1}>
                      {combinedWinnersModal[0]!.wheelTitle}
                    </Text>
                  </View>
                  <Text style={styles.singleWinnerName} numberOfLines={2}>
                    {combinedWinnersModal[0]!.winner}
                  </Text>
                  <View style={styles.sparkleRow}>
                    <Sparkles size={12} color="#F59E0B" />
                    <Text style={styles.sparkleSubtext}>Lựa chọn may mắn của bạn!</Text>
                    <Sparkles size={12} color="#F59E0B" />
                  </View>
                </View>

                <View style={styles.modalButtonsCol}>
                  <TouchableOpacity
                    style={styles.primaryModalBtn}
                    onPress={() => setCombinedWinnersModal(null)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.primaryModalBtnText}>{t.luckyWheel.close}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryRemoveBtn}
                    onPress={() =>
                      handleRemoveWinningOption(
                        combinedWinnersModal[0]!.wheelId,
                        combinedWinnersModal[0]!.winningIndex,
                      )
                    }
                    activeOpacity={0.8}
                  >
                    <Trash2 size={14} color="#E11D48" />
                    <Text style={styles.secondaryRemoveBtnText}>{t.luckyWheel.removeResult}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Multiple Winners Layout */}
            {combinedWinnersModal && combinedWinnersModal.length > 1 && (
              <>
                <ScrollView style={styles.multiWinnersScroll} showsVerticalScrollIndicator={false}>
                  {combinedWinnersModal.map((r) => (
                    <View key={r.wheelId} style={styles.multiWinnerRow}>
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={styles.multiWinnerWheelTitle} numberOfLines={1}>
                          {r.wheelTitle}
                        </Text>
                        <Text style={styles.multiWinnerName} numberOfLines={1}>
                          {r.winner}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.multiWinnerRemoveIconBtn}
                        onPress={() => handleRemoveWinningOption(r.wheelId, r.winningIndex)}
                        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                      >
                        <Trash2 size={16} color="#E11D48" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.modalButtonsCol}>
                  <TouchableOpacity
                    style={styles.primaryModalBtn}
                    onPress={() => setCombinedWinnersModal(null)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.primaryModalBtnText}>{t.luckyWheel.close}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.secondaryRemoveBtn}
                    onPress={handleRemoveAllWinningOptions}
                    activeOpacity={0.8}
                  >
                    <Trash2 size={14} color="#E11D48" />
                    <Text style={styles.secondaryRemoveBtnText}>
                      {t.luckyWheel.removeAllResults || 'Loại bỏ tất cả'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingRightEdgeOpenBtn: {
    position: 'absolute',
    right: 0,
    top: '46%',
    zIndex: 35,
    width: 32,
    height: 48,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  collapseHandleBtn: {
    position: 'absolute',
    top: -14,
    left: 16,
    zIndex: 25,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  trophyWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  trophyGlow: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
  },
  trophyIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  celebrationTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  winnerBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 100,
    marginBottom: 8,
  },
  sparkleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  sparkleSubtext: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B45309',
  },

  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    position: 'relative',
  },
  floatingHeaderArea: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  floatingRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  floatingPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  floatingPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  floatingPillPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0D9488',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 100,
    shadowColor: '#0D9488',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  floatingPillPrimaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  mobileBackBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  mobileEmptyWhiteContainer: {
    padding: 32,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  mobileCreateFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0D9488',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 18,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  mobileCreateFirstBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  mobileWheelCardItem: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  mobileWheelCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mobileWheelCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileWheelCardDelete: {
    padding: 6,
  },
  mobileWheelCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  mobileWheelCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  mobileWheelCardMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  mobileWheelCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  mobileWheelCardAuthor: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  mobileWheelCardOpenText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D9488',
  },
  mobileCreateModalCard: {
    width: '90%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  mobileCreateModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  mobileCreateModalDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 18,
  },
  mobileCreateModalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  mobileCreateModalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    marginBottom: 18,
  },
  mobileCreateModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  mobileCreateModalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  mobileCreateModalCancelText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  mobileCreateModalSubmitBtn: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  mobileCreateModalSubmitText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  arenaContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 14,
  },
  arenaStage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  emptyDesc: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 260,
  },
  createFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0D9488',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 8,
  },
  createFirstBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  singleWheelWrapper: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cleanWheelCard: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 20,
  },
  wheelCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  pointerRight: {
    position: 'absolute',
    right: -24,
    top: '50%',
    marginTop: -10,
    zIndex: 20,
  },
  pointerRightSmall: {
    position: 'absolute',
    right: -19,
    top: '50%',
    marginTop: -8,
    zIndex: 20,
  },
  rowTwoWheels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  gridThreeWheels: {
    width: '100%',
  },
  gridFourWheels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 8,
    width: '100%',
  },
  cleanSmallWheelCard: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  smallWheelTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
    maxWidth: 130,
  },
  tabbedBoard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
  },
  boardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  collapseBoardBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsScroll: {
    flexDirection: 'row',
    gap: 6,
  },
  tabPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  tabPillActive: {
    backgroundColor: '#0D9488',
  },
  tabPillActiveResults: {
    backgroundColor: '#F59E0B',
  },
  tabBadge: {
    marginLeft: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  boardActionBtnIconOnly: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 8,
  },
  resultsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultsHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  resultsHeaderCount: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  resultsClearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  resultsClearText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
  },
  emptyResultsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyResultsIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyResultsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  emptyResultsDesc: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 200,
  },
  mobileResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  mobileResultBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 3,
  },
  mobileResultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  mobileResultWinner: {
    fontSize: 16,
    fontWeight: '800',
  },
  mobileResultRemoveBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  mobileResultRemoveText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tabPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  tabPillTextActive: {
    color: '#FFFFFF',
  },
  activeContentCard: {
    paddingTop: 10,
    gap: 8,
  },
  activeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  inlineTitleInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#0D9488',
    paddingVertical: 2,
  },
  delWheelBtn: {
    padding: 4,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  counterLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  counterValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D9488',
  },
  boardTextarea: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    color: '#111827',
    minHeight: 120,
    textAlignVertical: 'top',
    backgroundColor: '#FAFAFA',
  },
  boardActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  boardActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 7,
    borderRadius: 8,
  },
  boardActionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  togglesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleItemText: {
    fontSize: 11,
    color: '#4B5563',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 6,
    borderRadius: 20,
    zIndex: 1,
  },
  winnerHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
    marginBottom: 8,
  },
  winnerHeaderBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D9488',
  },
  singleWinnerCard: {
    width: '100%',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  singleWinnerWheelTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  singleWinnerName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  multiWinnersScroll: {
    width: '100%',
    maxHeight: 280,
    marginVertical: 12,
  },
  multiWinnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  multiWinnerWheelTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  multiWinnerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  multiWinnerRemoveIconBtn: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE4E6',
    backgroundColor: '#FFF1F2',
  },
  modalButtonsCol: {
    width: '100%',
    gap: 8,
    marginTop: 4,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: 6,
  },
  primaryModalBtn: {
    backgroundColor: '#0D9488',
    width: '100%',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryModalBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryRemoveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#FECDD3',
    backgroundColor: '#FFF1F2',
    paddingVertical: 10,
    borderRadius: 12,
    width: '100%',
  },
  secondaryRemoveBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E11D48',
  },
  folderModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  folderModalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  saveFolderCard: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 12,
    marginTop: 10,
  },
  saveFolderLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  saveFolderInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
  },
  saveFolderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0D9488',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveFolderBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  savedFoldersListTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  emptyFolderBox: {
    padding: 16,
    alignItems: 'center',
  },
  emptyFolderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  emptyFolderSub: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 2,
  },
  folderCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  folderCardName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    maxWidth: 100,
  },
  folderCardCount: {
    fontSize: 10,
    color: '#6B7280',
  },
  folderActionBtn: {
    padding: 4,
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  restoreBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D9488',
  },
  previewBox: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  previewTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 4,
  },
  previewItemText: {
    fontSize: 10,
    color: '#4B5563',
    lineHeight: 14,
  },
  mobileWheelTitleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 6,
    maxWidth: 160,
  },
  mobileWheelTitleBadgeActive: {
    borderColor: '#0D9488',
    backgroundColor: '#0D9488',
  },
  mobileWheelTitleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  mobileWheelTitleTextActive: {
    color: '#FFFFFF',
  },
  resultsHintText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
});
