import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  Animated,
  Easing,
  useWindowDimensions,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image,
  DeviceEventEmitter,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, G, Circle, Rect, Text as SvgText } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import {
  Compass,
  X,
  Trophy,
  Sparkles,
  ArrowLeft,
  Users,
  Play,
  RotateCw,
  Trash2,
  MoreHorizontal,
  Volume2,
  VolumeX,
  Lock,
  LockOpen,
  Plus,
  Shuffle,
  ArrowDownAZ,
  Check,
  LogOut,
  BookmarkCheck,
  RotateCcw,
} from 'lucide-react-native';
import { LiveWheelSession, LiveWheelItem, LiveWheelParticipant } from '@circle/types';
import {
  getActiveLiveWheelApi,
  liveSpinWheelApi,
  liveRemoveResultApi,
  updateLiveWheelSettingsApi,
  closeLiveWheelStageApi,
  dismissLiveCelebrationApi,
  leaveLiveWheelStageApi,
  createWheelApi,
  updateWheelApi,
  deleteWheelApi,
  deleteAllWheelsApi,
} from '../../services/circle-tools.service';
import { getSocket } from '../../services/socket';
import { useLanguageStore } from '../../stores/language.store';
import { useThemeStore } from '../../stores/theme.store';
import { useAuthStore } from '../../stores/auth.store';

interface MobileLiveWheelOverlayProps {
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

export const MobileLiveWheelOverlay: React.FC<MobileLiveWheelOverlayProps> = ({ circleId }) => {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { colors, resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const { locale, t } = useLanguageStore();
  const user = useAuthStore((s) => s.user);
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  // Khoảng cách an toàn cho Floating Header và nội dung cuộn bên dưới
  const floatingToolbarTop = Math.max(insets.top + 8, 16);
  const scrollPaddingTop = floatingToolbarTop + 48;
  const scrollPaddingBottom = Math.max(insets.bottom + 36, 60);

  // Dynamic Disc Size for Mobile (y hệt MobileWheelView.tsx)
  const availableColWidth = Math.floor((windowWidth - 32) / 2);
  const singleDiscSize = Math.min(240, windowWidth - 64);
  const multiDiscSize = Math.max(120, Math.min(availableColWidth - 18, 145));
  const fourDiscSize = Math.max(110, Math.min(availableColWidth - 18, 130));

  const [session, setSession] = useState<LiveWheelSession | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissedSessionId, setDismissedSessionId] = useState<string | null>(null);

  // Active Tab: wheelId hoặc 'results' hoặc 'participants'
  const [activeTab, setActiveTab] = useState<string>('results');
  const [activeWheelId, setActiveWheelId] = useState<string | null>(null);

  // Lịch sử kết quả dạng text nhiều dòng (mỗi dòng 1 lần quay)
  const [resultsText, setResultsText] = useState<string>('');
  const resultLines = useMemo(() => {
    return resultsText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  }, [resultsText]);
  const resultLinesCount = resultLines.length;

  // Celebration Modal (Popup chúc mừng người trúng giải khi quay xong)
  const [combinedWinnersModal, setCombinedWinnersModal] = useState<
    { wheelId: string; wheelTitle: string; winner: string; winningIndex: number }[] | null
  >(null);

  // Menu 3 chấm và settings
  const [isMoreMenuVisible, setIsMoreMenuVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [isAddingWheel, setIsAddingWheel] = useState(false);

  // Trạng thái quay theo từng vòng riêng biệt & accumulator
  const [spinningWheelIds, setSpinningWheelIds] = useState<Record<string, boolean>>({});
  const activeSpinningBatchRef = useRef<Set<string>>(new Set());
  const batchResultsAccumulatorRef = useRef<
    { wheelId: string; wheelTitle: string; winner: string; winningIndex: number }[]
  >([]);
  const submittingSpinRef = useRef<Set<string>>(new Set());
  const [submittingWheelIds, setSubmittingWheelIds] = useState<Record<string, boolean>>({});
  const [isSubmittingSpinAll, setIsSubmittingSpinAll] = useState(false);

  // Local state chỉnh sửa options và title cho từng vòng khi có quyền
  const [wheelEditingState, setWheelEditingState] = useState<Record<string, string>>({});
  const [wheelTitleEditingState, setWheelTitleEditingState] = useState<Record<string, string>>({});

  // ScrollView Ref
  const scrollViewRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  // 4 Animated values cho tối đa 4 bánh xe
  const rotAnim0 = useRef(new Animated.Value(0)).current;
  const rotAnim1 = useRef(new Animated.Value(0)).current;
  const rotAnim2 = useRef(new Animated.Value(0)).current;
  const rotAnim3 = useRef(new Animated.Value(0)).current;
  const rotateAnims = useMemo(
    () => [rotAnim0, rotAnim1, rotAnim2, rotAnim3],
    [rotAnim0, rotAnim1, rotAnim2, rotAnim3],
  );
  const lastRotations = useRef<number[]>([0, 0, 0, 0]);

  // Stable Animated Interpolations để tránh re-attaching native driver animation gây nháy đĩa quay
  const rot0Interpolate = useRef(
    rotAnim0.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }),
  ).current;
  const rot1Interpolate = useRef(
    rotAnim1.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }),
  ).current;
  const rot2Interpolate = useRef(
    rotAnim2.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }),
  ).current;
  const rot3Interpolate = useRef(
    rotAnim3.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }),
  ).current;
  const rotateInterpolates = useMemo(
    () => [rot0Interpolate, rot1Interpolate, rot2Interpolate, rot3Interpolate],
    [rot0Interpolate, rot1Interpolate, rot2Interpolate, rot3Interpolate],
  );

  // Danh sách các vòng xoay (1 đến 4 vòng)
  const wheelsList: LiveWheelItem[] = useMemo(() => {
    if (session?.wheels && session.wheels.length > 0) {
      return session.wheels.slice(0, 4);
    }
    if (session?.options && session.options.length > 0) {
      return [
        {
          wheelId: session.wheelId || 'single-wheel',
          wheelTitle: session.wheelTitle || (locale === 'vi' ? 'Vòng 1' : 'Wheel 1'),
          options: session.options,
          winningIndex: session.winningIndex,
          winningOption: session.winningOption,
        },
      ];
    }
    return [];
  }, [session, locale]);

  // Đồng bộ editing state khi wheelsList thay đổi (không phụ thuộc vào activeTab để tránh re-render kép gây nháy)
  useEffect(() => {
    if (wheelsList.length > 0) {
      setWheelEditingState((prev) => {
        let hasNew = false;
        const next = { ...prev };
        wheelsList.forEach((w) => {
          if (next[w.wheelId] === undefined) {
            next[w.wheelId] = w.options.map((o) => o.optionLabel).join('\n');
            hasNew = true;
          }
        });
        return hasNew ? next : prev;
      });

      setWheelTitleEditingState((prev) => {
        let hasNew = false;
        const next = { ...prev };
        wheelsList.forEach((w) => {
          if (next[w.wheelId] === undefined) {
            next[w.wheelId] = w.wheelTitle || '';
            hasNew = true;
          }
        });
        return hasNew ? next : prev;
      });

      setActiveWheelId((prevId) => {
        if (!prevId || !wheelsList.some((w) => w.wheelId === prevId)) {
          return wheelsList[0]?.wheelId || null;
        }
        return prevId;
      });
    }
  }, [wheelsList]);

  // Phân quyền: Host vs Spectator
  const isHost = Boolean(session && (!session.creatorId || session.creatorId === user?.id));
  const allowMembersToEdit = session?.allowMembersToEdit ?? false;
  const isParticipant = Boolean(
    session?.participants?.some((p) => p.userId === user?.id) || isHost,
  );
  const canEdit = isHost || allowMembersToEdit;

  // Refs đồng bộ tránh stale closure
  const wheelsListRef = useRef<LiveWheelItem[]>(wheelsList);
  useEffect(() => {
    wheelsListRef.current = wheelsList;
  }, [wheelsList]);

  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Animation độc lập cho từng bánh xe (quay đồng thời hoặc nối tiếp mượt mà, không bị khóa)
  const animateWheelRotation = useCallback(
    (
      wheelId: string,
      targetIndex: number,
      totalCount: number,
      wheelTitle: string,
      resultLabel: string,
      customDuration?: number,
    ) => {
      const currentWheels = wheelsListRef.current;
      const idx = currentWheels.findIndex((w) => w.wheelId === wheelId);
      if (idx < 0) return;

      const anim = rotateAnims[idx];
      if (!anim) return;

      const sliceDeg = 360 / Math.max(totalCount, 1);
      const targetCenterDeg = targetIndex * sliceDeg + sliceDeg / 2;
      const stopAngle = (360 - (targetCenterDeg % 360)) % 360;

      const base = lastRotations.current[idx] || 0;
      const prevNorm = base % 360;
      let delta = stopAngle - prevNorm;
      if (delta < 0) delta += 360;
      const extraSpins = (6 + idx) * 360;
      const finalRot = base + extraSpins + delta;

      const duration = customDuration ?? 6000;

      activeSpinningBatchRef.current.add(wheelId);
      setSpinningWheelIds((prev) => ({ ...prev, [wheelId]: true }));

      Animated.timing(anim, {
        toValue: finalRot,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          lastRotations.current[idx] = finalRot;
        }

        setSpinningWheelIds((prev) => {
          const next = { ...prev };
          delete next[wheelId];
          return next;
        });

        activeSpinningBatchRef.current.delete(wheelId);

        batchResultsAccumulatorRef.current.push({
          wheelId,
          wheelTitle,
          winner: resultLabel,
          winningIndex: targetIndex,
        });

        // Khi tất cả các vòng đang quay trong đợt này đã hoàn thành
        if (activeSpinningBatchRef.current.size === 0) {
          const finishedBatch = [...batchResultsAccumulatorRef.current];
          batchResultsAccumulatorRef.current = [];

          // Sắp xếp lại theo thứ tự hiển thị của các vòng
          const sortedBatch = finishedBatch.sort((a, b) => {
            const idxA = currentWheels.findIndex((w) => w.wheelId === a.wheelId);
            const idxB = currentWheels.findIndex((w) => w.wheelId === b.wheelId);
            return idxA - idxB;
          });

          // Ghi kết quả vào resultsText
          const roundLine = sortedBatch.map((b) => `${b.wheelTitle}: ${b.winner}`).join(' - ');
          setResultsText((prev) => {
            const lines = prev.split('\n').filter(Boolean);
            if (lines[lines.length - 1] === roundLine) return prev;
            return prev ? `${prev}\n${roundLine}` : roundLine;
          });

          // Hiển thị Celebration Modal
          setCombinedWinnersModal(sortedBatch);

          try {
            if (soundEnabledRef.current) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          } catch {}
        }
      });
    },
    [rotateAnims],
  );

  const animateWheelRotationRef = useRef(animateWheelRotation);
  useEffect(() => {
    animateWheelRotationRef.current = animateWheelRotation;
  }, [animateWheelRotation]);

  // 1. Kiểm tra session đang hoạt động khi mount
  useEffect(() => {
    if (!circleId) return;
    getActiveLiveWheelApi(circleId)
      .then((active) => {
        if (active && active.id !== dismissedSessionId) {
          const elapsed = Date.now() - active.startedAt;
          if (elapsed < 4 * 60 * 60 * 1000) {
            setSession(active);
          }
        }
      })
      .catch(() => {});
  }, [circleId, dismissedSessionId]);

  // 2. Lắng nghe WebSocket realtime
  useEffect(() => {
    if (!circleId) return;
    let cleanupSocket: (() => void) | undefined;

    getSocket().then((socket) => {
      if (!socket) return;

      const handleStageCreated = (incoming: LiveWheelSession) => {
        if (incoming.circleId === circleId) {
          setDismissedSessionId(null);
          setSession(incoming);
          if (incoming.creatorId === user?.id) {
            setIsVisible(true);
          }
          rotateAnims.forEach((anim) => anim.setValue(0));
          lastRotations.current = [0, 0, 0, 0];
        }
      };

      const handleLiveWheelStarted = (incoming: LiveWheelSession) => {
        if (incoming.circleId === circleId) {
          setDismissedSessionId(null);
          // Tự động đóng popup kết quả cũ trên cả 2 máy khi có lượt quay mới bắt đầu
          setCombinedWinnersModal(null);
          setSession(incoming);

          const isSingle = Boolean(incoming.wheelId);
          const incomingWheels = incoming.wheels || [];
          const wheelsToSpin = incomingWheels.filter((w) => {
            if (isSingle) return w.wheelId === incoming.wheelId;
            return w.winningIndex >= 0 && w.winningOption;
          });

          if (wheelsToSpin.length > 0) {
            const duration = incoming.durationMs || 6000;
            wheelsToSpin.forEach((w) => {
              const count = Math.max(w.options.length, 1);
              const winIdx = w.winningIndex;
              const winLabel = w.winningOption?.optionLabel || w.options[winIdx]?.optionLabel || '';
              animateWheelRotationRef.current(
                w.wheelId,
                winIdx,
                count,
                w.wheelTitle || 'Vòng quay',
                winLabel,
                duration,
              );
            });
          }
        }
      };

      const handleParticipantsUpdated = (data: {
        sessionId: string;
        participants: LiveWheelParticipant[];
      }) => {
        setSession((prev) => {
          if (prev && prev.id === data.sessionId) {
            return {
              ...prev,
              participants: data.participants,
            };
          }
          return prev;
        });
      };

      const handleWheelUpdated = (incoming: LiveWheelSession) => {
        if (incoming.circleId === circleId) {
          setSession(incoming);

          // Đồng bộ loại bỏ kết quả khỏi Celebration Modal của tất cả mọi người trong phòng
          setCombinedWinnersModal((prev) => {
            if (!prev) return null;
            const remaining = prev.filter((item) => {
              const targetWheel = incoming.wheels?.find((w) => w.wheelId === item.wheelId);
              if (!targetWheel) return false;
              return targetWheel.options.some((o) => o.optionLabel === item.winner);
            });
            return remaining.length > 0 ? remaining : null;
          });
        }
      };

      const handleStageClosed = (data: { circleId: string }) => {
        if (data.circleId === circleId) {
          setIsVisible(false);
          setSession(null);
          setResultsText('');
          setCombinedWinnersModal(null);
        }
      };

      const handleCelebrationDismissed = (data: { circleId: string }) => {
        if (data.circleId === circleId) {
          setCombinedWinnersModal(null);
        }
      };

      socket.on('circle:live-wheel:stage-created', handleStageCreated);
      socket.on('circle:live-wheel:started', handleLiveWheelStarted);
      socket.on('circle:live-wheel:participants-updated', handleParticipantsUpdated);
      socket.on('circle:live-wheel:updated', handleWheelUpdated);
      socket.on('circle:live-wheel:celebration-dismissed', handleCelebrationDismissed);
      socket.on('circle:live-wheel:closed', handleStageClosed);
      socket.on('circle:live-wheel:stage-closed', handleStageClosed);

      cleanupSocket = () => {
        socket.off('circle:live-wheel:stage-created', handleStageCreated);
        socket.off('circle:live-wheel:started', handleLiveWheelStarted);
        socket.off('circle:live-wheel:participants-updated', handleParticipantsUpdated);
        socket.off('circle:live-wheel:updated', handleWheelUpdated);
        socket.off('circle:live-wheel:celebration-dismissed', handleCelebrationDismissed);
        socket.off('circle:live-wheel:closed', handleStageClosed);
        socket.off('circle:live-wheel:stage-closed', handleStageClosed);
      };
    });

    // Lắng nghe sự kiện mở trực tiếp từ Chat Card
    const sub = DeviceEventEmitter.addListener('circle:open-live-wheel', (data) => {
      if (data?.circleId === circleId) {
        setDismissedSessionId(null);
        setIsVisible(true);
        if (data?.session) {
          setSession(data.session);
        } else {
          getActiveLiveWheelApi(circleId)
            .then((act) => {
              if (act) setSession(act);
            })
            .catch(() => {});
        }
      }
    });

    return () => {
      cleanupSocket?.();
      sub.remove();
    };
  }, [circleId, rotateAnims]);

  // 3. Resume animation khi mở overlay lên lúc phòng đang quay (chỉ kích hoạt 1 lần cho mỗi phiên)
  const hasResumedSessionRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isVisible || !session) return;
    if (session.stageStatus === 'spinning' && hasResumedSessionRef.current !== session.id) {
      hasResumedSessionRef.current = session.id;
      const elapsed = Date.now() - session.startedAt;
      const duration = session.durationMs || 6000;
      if (elapsed < duration) {
        const remaining = duration - elapsed;
        const isSingle = Boolean(session.wheelId);
        const wheelsToSpin = (session.wheels || []).filter((w) => {
          if (isSingle) return w.wheelId === session.wheelId;
          return w.winningIndex >= 0 && w.winningOption;
        });
        wheelsToSpin.forEach((w) => {
          const count = Math.max(w.options.length, 1);
          const winIdx = w.winningIndex;
          const winLabel = w.winningOption?.optionLabel || w.options[winIdx]?.optionLabel || '';
          animateWheelRotation(
            w.wheelId,
            winIdx,
            count,
            w.wheelTitle || 'Vòng quay',
            winLabel,
            remaining,
          );
        });
      } else {
        (session.wheels || []).forEach((w, idx) => {
          if (w.winningIndex >= 0 && w.winningOption && rotateAnims[idx]) {
            const count = Math.max(w.options.length, 1);
            const sliceDeg = 360 / count;
            const targetCenterDeg = w.winningIndex * sliceDeg + sliceDeg / 2;
            const stopAngle = (360 - (targetCenterDeg % 360)) % 360;
            rotateAnims[idx]?.setValue(stopAngle);
            lastRotations.current[idx] = stopAngle;
          }
        });
      }
    }
  }, [isVisible, session, animateWheelRotation, rotateAnims]);

  // 4. Render SVG cho từng bánh xe
  const renderWheelSvg = (options: { optionLabel: string; color?: string }[], discSize: number) => {
    const totalOptions = options.length;
    const radius = discSize / 2;
    const centerX = discSize / 2;
    const centerY = discSize / 2;

    if (totalOptions === 0) {
      return (
        <G key="slice-empty">
          <Circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill={isDark ? '#1E293B' : '#F8FAFC'}
            stroke={isDark ? '#334155' : '#E2E8F0'}
            strokeWidth={1.5}
          />
          <SvgText
            x={centerX}
            y={centerY}
            fill={isDark ? '#64748B' : '#94A3B8'}
            fontSize={discSize > 200 ? 12 : 9}
            fontWeight="600"
            textAnchor="middle"
            alignmentBaseline="central"
          >
            {locale === 'vi' ? 'Hết phương án' : 'Empty'}
          </SvgText>
        </G>
      );
    }

    if (totalOptions === 1) {
      const label = options[0]!.optionLabel;
      const color = options[0]!.color || PASTEL_WHEEL_COLORS[0]!;
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

    const arcAngle = (2 * Math.PI) / totalOptions;

    return options.map((opt, idx) => {
      const angle1 = idx * arcAngle;
      const angle2 = (idx + 1) * arcAngle;
      const color = opt.color || PASTEL_WHEEL_COLORS[idx % PASTEL_WHEEL_COLORS.length]!;

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

      let label = opt.optionLabel;
      const maxLen = discSize > 200 ? 10 : 6;
      if (label.length > maxLen) {
        label = label.substring(0, maxLen - 1) + '…';
      }

      return (
        <G key={`slice-${idx}`}>
          <Path d={pathD} fill={color} stroke="#FFFFFF" strokeWidth={1} />
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
            {label}
          </SvgText>
        </G>
      );
    });
  };

  // 5. Xử lý khi ấn nút Quay Tất Cả
  const handleSpinClick = async () => {
    const isAnySpinning = Object.values(spinningWheelIds).some(Boolean);
    if (isSubmittingSpinAll || isAnySpinning) return;

    const hasAnyOption = wheelsList.some((w) => w.options && w.options.length > 0);
    if (!hasAnyOption) {
      Alert.alert(t.common.notice, locale === 'vi' ? 'Tất cả vòng quay đã hết phương án lựa chọn' : 'All wheels have no options left');
      return;
    }

    try {
      setIsSubmittingSpinAll(true);
      await liveSpinWheelApi(circleId, {
        isAll: true,
        channelId: session?.channelId,
      });
    } catch (err: any) {
      Alert.alert(t.common.error, err?.message || 'Không thể bắt đầu quay');
    } finally {
      setIsSubmittingSpinAll(false);
    }
  };

  // 6. Xử lý khi ấn nút Quay Riêng Vòng Đang Chọn (độc lập từng vòng)
  const handleSpinSingleWheel = async (wheelId: string) => {
    // CHỈ KIỂM TRA CHÍNH VÒNG NÀY CÓ ĐANG QUAY HOẶC ĐANG GỬI API KHÔNG - TUYỆT ĐỐI KHÔNG KHÓA VÒNG KHÁC!
    if (Boolean(spinningWheelIds[wheelId]) || submittingSpinRef.current.has(wheelId)) return;

    const target = wheelsList.find((w) => w.wheelId === wheelId);
    if (!target || !target.options || target.options.length === 0) {
      Alert.alert(t.common.notice, locale === 'vi' ? 'Vòng quay này đã hết phương án lựa chọn' : 'This wheel has no options left');
      return;
    }

    try {
      submittingSpinRef.current.add(wheelId);
      setSubmittingWheelIds((prev) => ({ ...prev, [wheelId]: true }));
      await liveSpinWheelApi(circleId, {
        isAll: false,
        wheelId,
        channelId: session?.channelId,
      });
    } catch (err: any) {
      Alert.alert(t.common.error, err?.message || 'Không thể quay vòng này');
    } finally {
      submittingSpinRef.current.delete(wheelId);
      setSubmittingWheelIds((prev) => {
        const next = { ...prev };
        delete next[wheelId];
        return next;
      });
    }
  };

  // 7. Xử lý khi ấn nút "Loại bỏ kết quả"
  const handleRemoveLiveResult = async (
    wheelId?: string,
    optionLabel?: string,
    removeAll?: boolean,
  ) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const updated = await liveRemoveResultApi(circleId, { wheelId, optionLabel, removeAll });
      if (updated) {
        setSession(updated);
      }
      if (removeAll) {
        setCombinedWinnersModal(null);
        setResultsText('');
        dismissLiveCelebrationApi(circleId).catch(() => {});
      } else if (wheelId) {
        setCombinedWinnersModal((prev) => {
          if (!prev) return null;
          const remaining = prev.filter((r) => !(r.wheelId === wheelId && r.winner === optionLabel));
          return remaining.length > 0 ? remaining : null;
        });
      }
    } catch (err: any) {
      Alert.alert(
        t.common.error,
        err?.response?.data?.message || err?.message || 'Không thể loại bỏ kết quả',
      );
    }
  };

  // Đóng modal kết quả đồng bộ cho cả 2 bên (Mobile & Web)
  const handleDismissCombinedWinnersModal = () => {
    setCombinedWinnersModal(null);
    dismissLiveCelebrationApi(circleId).catch(() => {});
  };

  // 8. Thêm vòng quay (tối đa 4 vòng)
  const handleAddDefaultWheel = async () => {
    if (wheelsList.length >= 4 || isAddingWheel || !canEdit) return;
    try {
      setIsAddingWheel(true);
      const nextNumber = wheelsList.length + 1;
      const defaultTitle = t.luckyWheel.wheelNumber.replace('{number}', String(nextNumber));
      const sampleOptions = [
        { optionLabel: 'Phương án 1' },
        { optionLabel: 'Phương án 2' },
        { optionLabel: 'Phương án 3' },
        { optionLabel: 'Phương án 4' },
      ];

      await createWheelApi(circleId, {
        title: defaultTitle,
        options: sampleOptions,
        initialOptions: sampleOptions.map((o) => o.optionLabel),
        soundEnabled: true,
        confettiEnabled: true,
      });

      const updated = await getActiveLiveWheelApi(circleId);
      if (updated) setSession(updated);
    } catch (err: any) {
      Alert.alert(t.common.error, err?.message || 'Không thể thêm vòng quay');
    } finally {
      setIsAddingWheel(false);
    }
  };

  // Xóa 1 vòng quay
  const handleDeleteWheel = async (wheelId: string) => {
    if (!canEdit || wheelsList.length <= 1) return;
    Alert.alert(t.luckyWheel.confirmDeleteTitle, t.luckyWheel.confirmDeleteDesc, [
      { text: t.luckyWheel.cancel, style: 'cancel' },
      {
        text: t.common.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteWheelApi(circleId, wheelId);
            const updated = await getActiveLiveWheelApi(circleId);
            if (updated) setSession(updated);
          } catch (err: any) {
            Alert.alert(t.common.error, err?.message || 'Không thể xóa vòng quay');
          }
        },
      },
    ]);
  };

  // 9. Đổi cài đặt: Bật/Tắt "Cho phép sửa"
  const handleToggleAllowEdit = async () => {
    if (!isHost || isUpdatingSettings) return;
    try {
      setIsUpdatingSettings(true);
      const nextVal = !allowMembersToEdit;
      const updated = await updateLiveWheelSettingsApi(circleId, { allowMembersToEdit: nextVal });
      if (updated) {
        setSession(updated);
      }
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    } catch (err: any) {
      Alert.alert(
        t.common.error,
        err?.response?.data?.message || err?.message || 'Không thể cập nhật quyền',
      );
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  // 10. Đổi cài đặt: Bật/Tắt âm thanh
  const handleToggleSound = () => {
    setSoundEnabled((prev) => !prev);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  // 11. Đóng phòng quay hoàn toàn (Host xác nhận)
  const handleCloseStageConfirm = () => {
    const hasResults = resultsText.trim().length > 0;
    Alert.alert(
      locale === 'vi' ? 'Đóng phòng quay' : 'Close stage',
      hasResults
        ? (locale === 'vi'
            ? 'Bạn có chắc chắn muốn đóng phòng quay và gửi kết quả vào nhóm chat không?'
            : 'Are you sure you want to close the stage and share results?')
        : (locale === 'vi'
            ? 'Bạn có chắc chắn muốn đóng phòng quay trực tiếp?'
            : 'Are you sure you want to close this live wheel stage?'),
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: locale === 'vi' ? 'Đóng phòng' : 'Close',
          style: 'destructive',
          onPress: async () => {
            try {
              if (session) {
                setDismissedSessionId(session.id);
              }
              const lines = resultsText
                .split('\n')
                .map((l) => l.trim())
                .filter((l) => l.length > 0);
              const formattedResults =
                lines.length > 0
                  ? lines.map((winner, idx) => ({
                      wheelTitle: `Lần ${idx + 1}`,
                      winner,
                    }))
                  : undefined;

              setIsVisible(false);
              setSession(null);
              setResultsText('');
              setCombinedWinnersModal(null);
              await closeLiveWheelStageApi(circleId, formattedResults);
            } catch (err: any) {
              Alert.alert(t.common.error, err?.message || 'Không thể đóng phòng quay');
            }
          },
        },
      ],
    );
  };

  // Chuyển chủ phòng cho người khác và rời phòng
  const handleTransferHostAndLeave = async () => {
    const otherParticipants = (session?.participants || []).filter(
      (p) => p.userId !== user?.id,
    );

    if (otherParticipants.length === 0) {
      Alert.alert(
        locale === 'vi' ? 'Không có người thay thế' : 'No other participants',
        locale === 'vi'
          ? 'Hiện tại không có thành viên nào khác trong phòng để chuyển quyền chủ phòng. Bạn có muốn đóng phòng quay không?'
          : 'There are no other participants in this stage to transfer host to. Would you like to close the stage?',
        [
          { text: locale === 'vi' ? 'Hủy' : 'Cancel', style: 'cancel' },
          {
            text: locale === 'vi' ? 'Đóng phòng' : 'Close stage',
            style: 'destructive',
            onPress: handleCloseStageConfirm,
          },
        ],
      );
      return;
    }

    const nextHost = otherParticipants[0]!;
    try {
      await updateLiveWheelSettingsApi(circleId, { newHostUserId: nextHost.userId });
      await leaveLiveWheelStageApi(circleId);
      if (session) {
        setDismissedSessionId(session.id);
      }
      setIsVisible(false);
      setSession(null);
      Alert.alert(
        t.common.notice,
        locale === 'vi'
          ? `Đã chuyển quyền chủ phòng cho ${nextHost.displayName} và rời phòng.`
          : `Transferred host to ${nextHost.displayName} and left stage.`,
      );
    } catch (err: any) {
      Alert.alert(t.common.error, err?.message || 'Không thể chuyển quyền chủ phòng');
    }
  };

  // Nút Mũi tên Rời phòng (Arrow / Back button)
  const handleArrowLeaveStage = () => {
    if (isHost) {
      Alert.alert(
        locale === 'vi' ? 'Rời phòng quay' : 'Leave stage',
        locale === 'vi'
          ? 'Bạn muốn đóng phòng quay hay vẫn mở và chuyển chủ phòng cho người khác?'
          : 'Do you want to close the stage or keep it open and transfer host to another member?',
        [
          {
            text: locale === 'vi' ? 'Hủy' : 'Cancel',
            style: 'cancel',
          },
          {
            text: locale === 'vi' ? 'Đóng phòng' : 'Close stage',
            style: 'destructive',
            onPress: handleCloseStageConfirm,
          },
          {
            text: locale === 'vi' ? 'Vẫn mở (Chuyển chủ)' : 'Transfer Host',
            onPress: handleTransferHostAndLeave,
          },
        ],
      );
    } else {
      Alert.alert(
        locale === 'vi' ? 'Rời phòng quay' : 'Leave stage',
        locale === 'vi'
          ? 'Bạn có chắc chắn muốn rời khỏi phòng quay không?'
          : 'Are you sure you want to leave this stage?',
        [
          { text: t.common.cancel, style: 'cancel' },
          {
            text: locale === 'vi' ? 'Rời phòng' : 'Leave',
            style: 'destructive',
            onPress: async () => {
              try {
                if (session) {
                  setDismissedSessionId(session.id);
                }
                setIsVisible(false);
                setSession(null);
                await leaveLiveWheelStageApi(circleId);
              } catch {}
            },
          },
        ],
      );
    }
  };

  const handleLeaveStage = () => {
    handleArrowLeaveStage();
  };

  // 12. Lưu sửa đổi cho tab lựa chọn của vòng
  const handleSaveWheelOptions = async (wheelId: string) => {
    if (!canEdit) return;
    const text = wheelEditingState[wheelId] || '';
    const title = wheelTitleEditingState[wheelId];
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      Alert.alert(t.common.notice, t.luckyWheel.minOptionsWarning);
      return;
    }

    try {
      await updateWheelApi(circleId, wheelId, {
        title: title || undefined,
        options: lines.map((l, idx) => ({
          optionLabel: l,
          color: PASTEL_WHEEL_COLORS[idx % PASTEL_WHEEL_COLORS.length]!,
        })),
      });
      const updated = await getActiveLiveWheelApi(circleId);
      if (updated) setSession(updated);
      Alert.alert(t.common.notice, locale === 'vi' ? 'Đã lưu lựa chọn' : 'Options saved');
    } catch (err: any) {
      Alert.alert(t.common.error, err?.message || 'Không thể lưu lựa chọn');
    }
  };

  const [saveInitialFeedback, setSaveInitialFeedback] = useState<Record<string, boolean>>({});

  const handleShuffleWheel = (wheelId: string) => {
    const text = wheelEditingState[wheelId] || '';
    const arr = text.split('\n').filter((l) => l.trim().length > 0);
    if (arr.length < 2) return;
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    }
    setWheelEditingState((prev) => ({ ...prev, [wheelId]: arr.join('\n') }));
  };

  const handleSortAZWheel = (wheelId: string) => {
    const text = wheelEditingState[wheelId] || '';
    const arr = text.split('\n').filter((l) => l.trim().length > 0);
    if (arr.length < 2) return;
    const sorted = [...arr].sort((a, b) =>
      a.localeCompare(b, 'vi', { numeric: true, sensitivity: 'base' }),
    );
    setWheelEditingState((prev) => ({ ...prev, [wheelId]: sorted.join('\n') }));
  };

  const handleSaveAsInitial = async (wheelId: string) => {
    if (!canEdit || isSpinning) return;
    const text = wheelEditingState[wheelId] || '';
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      Alert.alert(t.common.notice, t.luckyWheel.minOptionsWarning);
      return;
    }

    try {
      await updateWheelApi(circleId, wheelId, {
        initialOptions: lines,
        options: lines.map((l, idx) => ({
          optionLabel: l,
          color: PASTEL_WHEEL_COLORS[idx % PASTEL_WHEEL_COLORS.length]!,
        })),
      });
      setSaveInitialFeedback((prev) => ({ ...prev, [wheelId]: true }));
      setTimeout(() => {
        setSaveInitialFeedback((prev) => ({ ...prev, [wheelId]: false }));
      }, 2000);
      const updated = await getActiveLiveWheelApi(circleId);
      if (updated) setSession(updated);
      Alert.alert(t.common.notice, t.luckyWheel.saveAsInitialSuccess);
    } catch (err: any) {
      Alert.alert(t.common.error, err?.message || 'Không thể lưu lựa chọn');
    }
  };

  const handleResetWheel = (wheelId: string) => {
    if (!canEdit || isSpinning) return;
    const target = wheelsList.find((w) => w.wheelId === wheelId);
    if (!target) return;
    const initialText = target.options.map((o) => o.optionLabel).join('\n');
    setWheelEditingState((prev) => ({ ...prev, [wheelId]: initialText }));
  };

  const handleDeleteAllWheels = () => {
    if (isSpinning || wheelsList.length === 0 || !canEdit) return;
    Alert.alert(t.luckyWheel.deleteAllWheels, t.luckyWheel.confirmDeleteAllWheels, [
      { text: t.luckyWheel.cancel || t.common.cancel, style: 'cancel' },
      {
        text: t.common.delete || t.common.confirm,
        style: 'destructive',
        onPress: async () => {
          try {
            const defaultTitle = t.luckyWheel.wheelNumber.replace('{number}', '1');
            const res: any = await deleteAllWheelsApi(circleId, defaultTitle);
            const updated = await getActiveLiveWheelApi(circleId);
            if (updated) setSession(updated);
            if (res?.defaultWheel?.id) {
              setActiveWheelId(res.defaultWheel.id);
              setActiveTab(res.defaultWheel.id);
            }
          } catch (err: any) {
            Alert.alert(t.common.error, err?.message || 'Không thể xóa các vòng quay');
          }
        },
      },
    ]);
  };

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

  // Helper render 1 small wheel item (dùng cho 2-wheel, 3-wheel, 4-wheel)
  const renderSmallWheelItem = (wheel: LiveWheelItem, discSize: number, idx: number) => {
    const tabKey = wheel.wheelId || String(idx);
    const isSelected = activeTab === tabKey;
    const rotateInterpolate = rotateInterpolates[idx] || rot0Interpolate;
    const isThisWheelSpinning = Boolean(spinningWheelIds[wheel.wheelId]);
    const isThisWheelSubmitting = Boolean(submittingWheelIds[wheel.wheelId]);

    return (
      <View key={wheel.wheelId || `wheel-${idx}`} style={styles.smallWheelItemWrapper}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setActiveWheelId(wheel.wheelId);
            setActiveTab(tabKey);
          }}
          style={[styles.mobileWheelTitleBadge, isSelected && styles.mobileWheelTitleBadgeActive]}
        >
          <Compass
            size={12}
            color={isSelected ? '#FFFFFF' : isDark ? colors.primary : '#0D9488'}
          />
          <Text
            style={[styles.mobileWheelTitleText, isSelected && styles.mobileWheelTitleTextActive]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {wheel.wheelTitle || (locale === 'vi' ? `Vòng ${idx + 1}` : `Wheel ${idx + 1}`)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          disabled={isThisWheelSpinning || isThisWheelSubmitting}
          onPress={() => handleSpinSingleWheel(wheel.wheelId)}
          style={[styles.cleanSmallWheelCard, isThisWheelSpinning && { opacity: 0.9 }]}
        >
          <View style={{ width: discSize, height: discSize, position: 'relative' }}>
            <Animated.View
              style={{
                width: discSize,
                height: discSize,
                transform: [{ rotate: rotateInterpolate }],
              }}
            >
              <Svg width={discSize} height={discSize}>
                {renderWheelSvg(wheel.options, discSize)}
                <Circle
                  cx={discSize / 2}
                  cy={discSize / 2}
                  r={12}
                  fill={isDark ? colors.elevated : '#FFFFFF'}
                  stroke={colors.primary}
                  strokeWidth={2}
                />
                <Circle cx={discSize / 2} cy={discSize / 2} r={4} fill={colors.primary} />
              </Svg>
            </Animated.View>

            <View style={styles.pointerRightSmall} pointerEvents="none">
              <Svg width={24} height={16} viewBox="0 0 24 16">
                <Path
                  d="M2 8L14 2C16 1 17 2 17 3.5V12.5C17 14 16 15 14 14L2 8Z"
                  fill={colors.primary}
                  stroke={isDark ? colors.elevated : '#FFFFFF'}
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                />
                <Rect
                  x={15}
                  y={3}
                  width={7}
                  height={10}
                  rx={2}
                  fill={isDark ? colors.primaryDark : '#0F766E'}
                  stroke={isDark ? colors.elevated : '#FFFFFF'}
                  strokeWidth={1.5}
                />
                <Circle cx={18.5} cy={8} r={2} fill={isDark ? colors.elevated : '#FFFFFF'} />
                <Circle cx={18.5} cy={8} r={1} fill={colors.primary} />
              </Svg>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (!isVisible) return null;

  if (!session) {
    return (
      <Modal visible={isVisible} animationType="fade" transparent onRequestClose={handleLeaveStage}>
        <View style={styles.loadingBackdrop}>
          <View
            style={[
              styles.loadingBox,
              {
                backgroundColor: isDark ? colors.elevated : '#FFFFFF',
                borderColor: colors.hairline,
              },
            ]}
          >
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 12, color: colors.text, fontWeight: '600' }}>
              {locale === 'vi' ? 'Đang kết nối vòng quay...' : 'Connecting to wheel...'}
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  const isAnySpinning = useMemo(
    () => Object.values(spinningWheelIds).some(Boolean),
    [spinningWheelIds],
  );
  const isSpinning = isAnySpinning;
  const participants = session.participants || [];

  // Wheel đang được chọn hiển thị trong Tabbed Board
  const activeWheel =
    wheelsList.find((w) => w.wheelId === activeTab) ||
    wheelsList.find((w) => w.wheelId === activeWheelId) ||
    wheelsList[0] ||
    null;

  const activeWheelOptionsText = activeWheel
    ? wheelEditingState[activeWheel.wheelId] !== undefined
      ? wheelEditingState[activeWheel.wheelId]!
      : activeWheel.options.map((o) => o.optionLabel).join('\n')
    : '';

  const activeWheelParsed = activeWheelOptionsText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleLeaveStage}
    >
      <View style={styles.container}>
        {/* ============================================================== */}
        {/* FLOATING HEADER BAR: ICON-ONLY FLOATING PILL BUTTONS           */}
        {/* ============================================================== */}
        <View style={[styles.floatingHeaderArea, { top: floatingToolbarTop }]} pointerEvents="box-none">
          {/* Left: Nút Mũi Tên Rời Phòng (icon only) */}
          <View style={styles.headerLeftGroup} pointerEvents="box-none">
            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={handleArrowLeaveStage}
              style={styles.floatingPillIconBtn}
              accessibilityLabel={locale === 'vi' ? 'Rời phòng quay' : 'Leave stage'}
            >
              <ArrowLeft size={16} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Right: Results, Viewers, Add Wheel (Host), Spin All, More (Host), Close (Host) */}
          <View style={styles.floatingRightActions}>
            {/* Nút Kết Quả Nhanh (Icon only) */}
            <TouchableOpacity
              style={[
                styles.floatingPillIconBtn,
                activeTab === 'results' && styles.floatingPillIconBtnActiveResults,
              ]}
              onPress={() => {
                setActiveTab((prev) =>
                  prev === 'results' ? activeWheelId || wheelsList[0]?.wheelId || 'wheel' : 'results',
                );
              }}
              activeOpacity={0.8}
              accessibilityLabel={t.luckyWheel.resultsTab}
            >
              <Trophy size={16} color={activeTab === 'results' ? '#FFFFFF' : '#F59E0B'} />
            </TouchableOpacity>

            {/* Nút Người Xem Nhanh (Icon only) */}
            <TouchableOpacity
              style={[
                styles.floatingPillIconBtn,
                activeTab === 'participants' && styles.floatingPillIconBtnActivePrimary,
              ]}
              onPress={() => {
                setActiveTab((prev) =>
                  prev === 'participants'
                    ? activeWheelId || wheelsList[0]?.wheelId || 'wheel'
                    : 'participants',
                );
              }}
              activeOpacity={0.8}
              accessibilityLabel={locale === 'vi' ? 'Người xem' : 'Viewers'}
            >
              <Users
                size={16}
                color={activeTab === 'participants' ? '#FFFFFF' : colors.primary}
              />
            </TouchableOpacity>

            {/* Nút Thêm Vòng Quay (Icon only - khi có quyền) */}
            {canEdit && (
              <TouchableOpacity
                style={[
                  styles.floatingPillIconBtn,
                  (wheelsList.length >= 4 || isSpinning) && { opacity: 0.4 },
                ]}
                disabled={wheelsList.length >= 4 || isSpinning || isAddingWheel}
                onPress={handleAddDefaultWheel}
                activeOpacity={0.8}
                accessibilityLabel={t.luckyWheel.addWheel}
              >
                <Plus size={16} color={isDark ? colors.primary : '#0D9488'} />
              </TouchableOpacity>
            )}

            {/* Nút Quay Tất Cả (Primary Pill Button ICON ONLY, ĐỔI CHỖ LÊN TRƯỚC NÚT 3 CHẤM) */}
            {wheelsList.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.floatingPillPrimaryIconBtn,
                  (isSpinning || isSubmittingSpinAll) && { opacity: 0.5 },
                ]}
                disabled={isSpinning || isSubmittingSpinAll}
                onPress={handleSpinClick}
                activeOpacity={0.8}
                accessibilityLabel={t.luckyWheel.spinAll}
              >
                <RotateCw size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}

            {/* Nút 3 Chấm Cài Đặt (CHỈ CHỦ PHÒNG MỚI CÓ - ĐỔI CHỖ RA SAU NÚT QUAY) */}
            {isHost && (
              <TouchableOpacity
                style={styles.floatingPillIconBtn}
                onPress={() => setIsMoreMenuVisible(true)}
                activeOpacity={0.8}
                accessibilityLabel={locale === 'vi' ? 'Cài đặt phòng quay' : 'Stage settings'}
              >
                <MoreHorizontal size={16} color={colors.text} />
              </TouchableOpacity>
            )}

            {/* Nút Đóng phòng (Dấu X) (CHỈ CHỦ PHÒNG MỚI CÓ) */}
            {isHost && (
              <TouchableOpacity
                style={styles.floatingPillIconBtn}
                onPress={handleCloseStageConfirm}
                activeOpacity={0.8}
                accessibilityLabel={locale === 'vi' ? 'Đóng phòng quay' : 'Close stage'}
              >
                <X size={16} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ============================================================== */}
        {/* NỘI DUNG CUỘN DUY NHẤT: SÂN KHẤU VÒNG QUAY & CÁI BẢNG THIẾT LẬP */}
        {/* ============================================================== */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: scrollPaddingTop,
              paddingBottom: scrollPaddingBottom + 200,
            },
          ]}
          automaticallyAdjustKeyboardInsets={true}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* SÂN KHẤU VÒNG QUAY (VISUAL ARENA) - Y HỆT MOBILEWHEELVIEW.TSX */}
          <View style={styles.arenaContainer}>
            <View style={styles.arenaStage}>
              {/* 1 VÒNG: Vòng to chính giữa */}
              {wheelsList.length === 1 && (
                <View style={styles.singleWheelWrapper}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      setActiveWheelId(wheelsList[0]!.wheelId);
                      setActiveTab(wheelsList[0]!.wheelId);
                    }}
                    style={[
                      styles.mobileWheelTitleBadge,
                      activeTab === wheelsList[0]!.wheelId && styles.mobileWheelTitleBadgeActive,
                    ]}
                  >
                    <Compass
                      size={13}
                      color={
                        activeTab === wheelsList[0]!.wheelId
                          ? '#FFFFFF'
                          : isDark
                          ? colors.primary
                          : '#0D9488'
                      }
                    />
                    <Text
                      style={[
                        styles.mobileWheelTitleText,
                        activeTab === wheelsList[0]!.wheelId && styles.mobileWheelTitleTextActive,
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {wheelsList[0]!.wheelTitle}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    disabled={
                      Boolean(spinningWheelIds[wheelsList[0]!.wheelId]) ||
                      Boolean(submittingWheelIds[wheelsList[0]!.wheelId])
                    }
                    onPress={() => handleSpinSingleWheel(wheelsList[0]!.wheelId)}
                    style={styles.cleanWheelCard}
                  >
                    <View style={{ width: singleDiscSize, height: singleDiscSize, position: 'relative' }}>
                      <Animated.View
                        style={{
                          width: singleDiscSize,
                          height: singleDiscSize,
                          transform: [{ rotate: rot0Interpolate }],
                        }}
                      >
                        <Svg width={singleDiscSize} height={singleDiscSize}>
                          {renderWheelSvg(wheelsList[0]!.options, singleDiscSize)}
                          <Circle
                            cx={singleDiscSize / 2}
                            cy={singleDiscSize / 2}
                            r={16}
                            fill={isDark ? colors.elevated : '#FFFFFF'}
                            stroke={colors.primary}
                            strokeWidth={3}
                          />
                          <Circle cx={singleDiscSize / 2} cy={singleDiscSize / 2} r={6} fill={colors.primary} />
                        </Svg>
                      </Animated.View>

                      <View style={styles.pointerRight} pointerEvents="none">
                        <Svg width={30} height={20} viewBox="0 0 30 20">
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
                  </TouchableOpacity>
                </View>
              )}

              {/* 2 VÒNG: Hàng trên 2 vòng đặt cạnh nhau */}
              {wheelsList.length === 2 && (
                <View style={styles.rowTwoWheels}>
                  {wheelsList.map((wheel, idx) => renderSmallWheelItem(wheel, multiDiscSize, idx))}
                </View>
              )}

              {/* 3 VÒNG: Hàng trên 2 vòng, hàng dưới 1 vòng */}
              {wheelsList.length === 3 && (
                <View style={styles.gridThreeWheels}>
                  <View style={styles.rowTwoWheels}>
                    {wheelsList.slice(0, 2).map((wheel, idx) => renderSmallWheelItem(wheel, multiDiscSize, idx))}
                  </View>
                  {wheelsList[2] && (
                    <View style={{ alignItems: 'center', marginTop: 10 }}>
                      {renderSmallWheelItem(wheelsList[2], multiDiscSize, 2)}
                    </View>
                  )}
                </View>
              )}

              {/* 4 VÒNG: CHÍNH XÁC 2 HÀNG (MỖI HÀNG 2 VÒNG) */}
              {wheelsList.length === 4 && (
                <View style={styles.gridFourWheelsContainer}>
                  <View style={styles.rowTwoWheels}>
                    {wheelsList.slice(0, 2).map((wheel, idx) => renderSmallWheelItem(wheel, fourDiscSize, idx))}
                  </View>
                  <View style={[styles.rowTwoWheels, { marginTop: 12 }]}>
                    {wheelsList.slice(2, 4).map((wheel, idx) => renderSmallWheelItem(wheel, fourDiscSize, idx + 2))}
                  </View>
                </View>
              )}
            </View>

            {/* Nút Quay trung tâm to rõ trên sân khấu (cho phép bấm quay đồng thời 2, 3 hoặc 4 vòng) */}
            {wheelsList.length > 0 && (
              <View style={styles.arenaCenterSpinWrapper}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={isSpinning || isSubmittingSpinAll}
                  onPress={handleSpinClick}
                  style={[
                    styles.arenaCenterSpinBtn,
                    { backgroundColor: colors.primary },
                    (isSpinning || isSubmittingSpinAll) && { opacity: 0.5 },
                  ]}
                >
                  <RotateCw size={18} color="#FFFFFF" />
                  <Text style={styles.arenaCenterSpinText}>
                    {wheelsList.length > 1
                      ? (t.luckyWheel.spinAll || (locale === 'vi' ? 'Quay tất cả' : 'Spin all'))
                      : (locale === 'vi' ? 'Quay ngay' : 'Spin now')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ============================================================== */}
          {/* "CÁI BẢNG" (TABBED OPTIONS BOARD BÊN DƯỚI) - Y HỆT TIỆN ÍCH     */}
          {/* ============================================================== */}
          <View style={styles.tabbedBoard}>
            {/* Horizontal Tabs: Tên từng vòng + [🏆 Kết quả] + [👥 Người xem] */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsScroll}
            >
              {wheelsList.map((wheel, idx) => {
                const tabKey = wheel.wheelId || String(idx);
                const isSelected = activeTab === tabKey;
                return (
                  <TouchableOpacity
                    key={tabKey}
                    onPress={() => {
                      setActiveTab(tabKey);
                      setActiveWheelId(wheel.wheelId);
                    }}
                    style={[styles.tabPill, isSelected && styles.tabPillActive]}
                  >
                    <Text
                      style={[styles.tabPillText, isSelected && styles.tabPillTextActive]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {wheel.wheelTitle || `Vòng ${idx + 1}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Tab Kết Quả */}
              <TouchableOpacity
                onPress={() => setActiveTab('results')}
                style={[
                  styles.tabPill,
                  styles.tabPillResults,
                  activeTab === 'results' && styles.tabPillActiveResults,
                ]}
              >
                <Trophy size={13} color={activeTab === 'results' ? '#FFFFFF' : '#F59E0B'} />
                <Text
                  style={[
                    styles.tabPillText,
                    activeTab === 'results' && styles.tabPillTextActive,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
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

              {/* Tab Người xem */}
              <TouchableOpacity
                onPress={() => setActiveTab('participants')}
                style={[
                  styles.tabPill,
                  styles.tabPillResults,
                  activeTab === 'participants' && styles.tabPillActivePrimary,
                ]}
              >
                <Users
                  size={13}
                  color={activeTab === 'participants' ? '#FFFFFF' : colors.primary}
                />
                <Text
                  style={[
                    styles.tabPillText,
                    activeTab === 'participants' && styles.tabPillTextActive,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {locale === 'vi' ? 'Người xem' : 'Viewers'}
                </Text>
                <View
                  style={[
                    styles.tabBadge,
                    activeTab === 'participants' && { backgroundColor: 'rgba(255,255,255,0.25)' },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabBadgeText,
                      activeTab === 'participants' && { color: '#FFFFFF' },
                    ]}
                  >
                    {participants.length}
                  </Text>
                </View>
              </TouchableOpacity>
            </ScrollView>

            {/* TAB CONTENT: KẾT QUẢ (DẠNG TEXT CHỈ ĐỌC, GHI THEO LẦN) */}
            {activeTab === 'results' ? (
              <View style={styles.activeContentCard}>
                <View style={styles.resultsHeaderRow}>
                  <View style={styles.resultsHeaderLeft}>
                    <Trophy size={16} color="#F59E0B" />
                    <Text style={styles.resultsHeaderTitle} numberOfLines={1}>
                      {t.luckyWheel.resultsHistoryTitle}
                    </Text>
                    <Text style={styles.resultsHeaderCount}>({resultLinesCount})</Text>
                  </View>
                </View>

                {/* Textarea lớn chỉ đọc hiển thị kết quả */}
                <View style={{ flex: 1, minHeight: 180, marginBottom: 8 }}>
                  <TextInput
                    style={[styles.boardTextarea, { minHeight: 180, opacity: 0.95 }]}
                    multiline
                    editable={false}
                    value={resultsText}
                    placeholder={t.luckyWheel.resultsPlaceholder}
                    placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                  />
                  <Text style={styles.resultsHintText} numberOfLines={1} ellipsizeMode="tail">
                    {t.luckyWheel.resultsHint}
                  </Text>
                </View>

                {/* Action Buttons: Sort A-Z, Clear Results (Icons only) */}
                <View style={styles.boardActionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.boardActionBtnIconOnly,
                      resultLinesCount < 2 && { opacity: 0.4 },
                    ]}
                    disabled={resultLinesCount < 2}
                    onPress={handleSortResults}
                    accessibilityLabel={t.luckyWheel.sortAZ}
                  >
                    <ArrowDownAZ size={18} color="#6366F1" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.boardActionBtnIconOnly,
                      resultLinesCount === 0 && { opacity: 0.4 },
                    ]}
                    disabled={resultLinesCount === 0}
                    onPress={() => handleRemoveLiveResult(undefined, undefined, true)}
                    accessibilityLabel={t.luckyWheel.clearResults}
                  >
                    <Trash2 size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                {/* Hàng thiết lập: Xóa tất cả vòng (Căn phải, y hệt Web) */}
                <View style={[styles.togglesRow, { borderTopColor: colors.hairline, justifyContent: 'flex-end', paddingTop: 8 }]}>
                  <TouchableOpacity
                    style={styles.toggleItem}
                    onPress={handleDeleteAllWheels}
                    disabled={isSpinning || wheelsList.length === 0 || !canEdit}
                  >
                    <Trash2 size={15} color="#EF4444" />
                    <Text style={[styles.toggleItemText, { color: '#EF4444', fontWeight: 'bold' }]}>
                      {t.luckyWheel.deleteAllWheels}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : activeTab === 'participants' ? (
              /* TAB CONTENT: NGƯỜI XEM TRỰC TIẾP */
              <View style={styles.activeContentCard}>
                <View style={styles.resultsHeaderRow}>
                  <View style={styles.resultsHeaderLeft}>
                    <Users size={16} color={colors.primary} />
                    <Text style={styles.resultsHeaderTitle} numberOfLines={1}>
                      {locale === 'vi' ? 'Đang trong phòng quay' : 'In Stage'}
                    </Text>
                    <Text style={styles.resultsHeaderCount}>({participants.length})</Text>
                  </View>
                  <View style={styles.liveIndicatorBadge}>
                    <View style={styles.liveGreenDot} />
                    <Text style={styles.liveIndicatorText}>
                      {locale === 'vi' ? 'Trực tiếp' : 'Live'}
                    </Text>
                  </View>
                </View>

                {/* Danh sách người xem cuộn ngang */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.participantsListScroll}
                >
                  {participants.map((p) => (
                    <View
                      key={p.userId}
                      style={[
                        styles.participantCard,
                        {
                          backgroundColor: isDark ? colors.elevated : '#F8FAFC',
                          borderColor: colors.hairline,
                        },
                      ]}
                    >
                      {p.avatarUrl ? (
                        <Image source={{ uri: p.avatarUrl }} style={styles.participantAvatarImg} />
                      ) : (
                        <View
                          style={[
                            styles.participantAvatarPlaceholder,
                            { backgroundColor: `${colors.primary}20` },
                          ]}
                        >
                          <Text
                            style={[
                              styles.participantAvatarPlaceholderText,
                              { color: colors.primary },
                            ]}
                          >
                            {p.displayName?.charAt(0) || 'U'}
                          </Text>
                        </View>
                      )}
                      <Text
                        style={[styles.participantDisplayName, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {p.displayName}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : (
              /* TAB CONTENT: ACTIVE WHEEL (OPTIONS & SETTINGS) */
              activeWheel && (
                <View style={styles.activeContentCard}>
                  {/* Title & Delete (Nếu có quyền sửa) */}
                  <View style={styles.activeTitleRow}>
                    <TextInput
                      style={styles.inlineTitleInput}
                      value={
                        wheelTitleEditingState[activeWheel.wheelId] !== undefined
                          ? wheelTitleEditingState[activeWheel.wheelId]
                          : activeWheel.wheelTitle
                      }
                      maxLength={50}
                      editable={canEdit && !isSpinning}
                      onChangeText={(val) => {
                        setWheelTitleEditingState((prev) => ({
                          ...prev,
                          [activeWheel.wheelId]: val,
                        }));
                      }}
                      onFocus={() => {
                        setTimeout(() => {
                          scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 200);
                      }}
                      placeholder={t.luckyWheel.wheelNamePlaceholder}
                      placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                    />
                    {wheelsList.length > 1 && canEdit && (
                      <TouchableOpacity
                        onPress={() => handleDeleteWheel(activeWheel.wheelId)}
                        disabled={isSpinning}
                        style={[styles.delWheelBtn, isSpinning && { opacity: 0.3 }]}
                        accessibilityLabel={t.luckyWheel.confirmDeleteTitle}
                      >
                        <Trash2 size={18} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Counter */}
                  <View style={styles.counterRow}>
                    <Text style={styles.counterLabel}>{t.luckyWheel.optionsListTitle}</Text>
                    <Text style={styles.counterValue}>
                      {t.luckyWheel.optionsCount.replace('{count}', String(activeWheelParsed.length))}
                    </Text>
                  </View>

                  {/* Textarea */}
                  <TextInput
                    style={[styles.boardTextarea, !canEdit && { opacity: 0.85 }]}
                    multiline
                    editable={canEdit && !isSpinning}
                    value={activeWheelOptionsText}
                    onChangeText={(txt) =>
                      setWheelEditingState((prev) => ({
                        ...prev,
                        [activeWheel.wheelId]: txt,
                      }))
                    }
                    onFocus={() => {
                      setTimeout(() => {
                        scrollViewRef.current?.scrollToEnd({ animated: true });
                      }, 200);
                    }}
                    placeholder={t.luckyWheel.optionsPlaceholder}
                    placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                  />

                  {/* Action Buttons: Shuffle, Sort A-Z, BookmarkCheck, RotateCcw (Icons only, y hệt Web) */}
                  <View style={styles.boardActionsRow}>
                    <TouchableOpacity
                      style={[styles.boardActionBtnIconOnly, isSpinning && { opacity: 0.4 }]}
                      disabled={isSpinning || !canEdit}
                      onPress={() => handleShuffleWheel(activeWheel.wheelId)}
                      accessibilityLabel={t.luckyWheel.shuffleOptions}
                    >
                      <Shuffle size={18} color={isDark ? colors.primary : '#0D9488'} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.boardActionBtnIconOnly, isSpinning && { opacity: 0.4 }]}
                      disabled={isSpinning || !canEdit}
                      onPress={() => handleSortAZWheel(activeWheel.wheelId)}
                      accessibilityLabel={t.luckyWheel.sortAZ}
                    >
                      <ArrowDownAZ size={18} color="#6366F1" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.boardActionBtnIconOnly,
                        isSpinning && { opacity: 0.4 },
                        saveInitialFeedback[activeWheel.wheelId] && {
                          backgroundColor: `${colors.primary}20`,
                          borderColor: colors.primary,
                        },
                      ]}
                      disabled={isSpinning || !canEdit}
                      onPress={() => handleSaveAsInitial(activeWheel.wheelId)}
                      accessibilityLabel={t.luckyWheel.saveAsInitial}
                    >
                      <BookmarkCheck
                        size={18}
                        color={
                          saveInitialFeedback[activeWheel.wheelId]
                            ? colors.primary
                            : isDark
                            ? colors.primary
                            : '#0D9488'
                        }
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.boardActionBtnIconOnly, isSpinning && { opacity: 0.4 }]}
                      disabled={isSpinning || !canEdit}
                      onPress={() => handleResetWheel(activeWheel.wheelId)}
                      accessibilityLabel={t.luckyWheel.resetOptions}
                    >
                      <RotateCcw size={18} color="#D97706" />
                    </TouchableOpacity>
                  </View>

                  {/* Hàng thiết lập: Xóa tất cả vòng (Căn phải, y hệt Web) */}
                  <View style={[styles.togglesRow, { borderTopColor: colors.hairline, justifyContent: 'flex-end', paddingTop: 8 }]}>
                    <TouchableOpacity
                      style={styles.toggleItem}
                      onPress={handleDeleteAllWheels}
                      disabled={isSpinning || wheelsList.length === 0 || !canEdit}
                    >
                      <Trash2 size={15} color="#EF4444" />
                      <Text style={[styles.toggleItemText, { color: '#EF4444', fontWeight: 'bold' }]}>
                        {t.luckyWheel.deleteAllWheels}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            )}
          </View>
        </ScrollView>

        {/* ============================================================== */}
        {/* COMBINED RESULTS MODAL - CELEBRATION WINNER SHOWCASE           */}
        {/* ============================================================== */}
        <Modal
          visible={!!combinedWinnersModal && combinedWinnersModal.length > 0}
          transparent
          animationType="fade"
          onRequestClose={handleDismissCombinedWinnersModal}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleDismissCombinedWinnersModal}
          >
            <TouchableWithoutFeedback>
              <View style={styles.modalBox}>
                {/* Nút X đóng ở góc trên bên phải */}
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={handleDismissCombinedWinnersModal}
                  hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  accessibilityLabel={t.luckyWheel.close}
                >
                  <X size={18} color={isDark ? colors.subtle : '#94A3B8'} />
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
                  🎉 {t.luckyWheel.winnerTitle}
                </Text>

                {/* Single Winner Layout */}
                {combinedWinnersModal?.length === 1 && (
                  <>
                    <View style={styles.singleWinnerCard}>
                      <View style={styles.winnerBadgePill}>
                        <Compass size={11} color={isDark ? '#FBBF24' : '#B45309'} />
                        <Text style={styles.singleWinnerWheelTitle} numberOfLines={1}>
                          {combinedWinnersModal[0]!.wheelTitle}
                        </Text>
                      </View>
                      <Text style={styles.singleWinnerName} numberOfLines={2}>
                        {combinedWinnersModal[0]!.winner}
                      </Text>
                      <View style={styles.sparkleRow}>
                        <Sparkles size={12} color="#F59E0B" />
                        <Text style={styles.sparkleSubtext}>{t.luckyWheel.luckyChoiceBadge}</Text>
                        <Sparkles size={12} color="#F59E0B" />
                      </View>
                    </View>

                    <View style={styles.modalButtonsCol}>
                      <TouchableOpacity
                        style={styles.primaryModalBtn}
                        onPress={handleDismissCombinedWinnersModal}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.primaryModalBtnText}>{t.luckyWheel.close}</Text>
                      </TouchableOpacity>
                      {(canEdit || isParticipant) && (
                        <TouchableOpacity
                          style={styles.secondaryRemoveBtn}
                          onPress={() =>
                            handleRemoveLiveResult(
                              combinedWinnersModal[0]!.wheelId,
                              combinedWinnersModal[0]!.winner,
                            )
                          }
                          activeOpacity={0.8}
                        >
                          <Trash2 size={14} color={isDark ? '#F87171' : '#E11D48'} />
                          <Text style={styles.secondaryRemoveBtnText}>{t.luckyWheel.removeResult}</Text>
                        </TouchableOpacity>
                      )}
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
                          {(canEdit || isParticipant) && (
                            <TouchableOpacity
                              style={styles.multiWinnerRemoveIconBtn}
                              onPress={() => handleRemoveLiveResult(r.wheelId, r.winner)}
                              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                              accessibilityLabel={t.luckyWheel.removeResult}
                            >
                              <Trash2 size={16} color={isDark ? '#F87171' : '#E11D48'} />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                    </ScrollView>

                    <View style={styles.modalButtonsCol}>
                      <TouchableOpacity
                        style={styles.primaryModalBtn}
                        onPress={handleDismissCombinedWinnersModal}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.primaryModalBtnText}>{t.luckyWheel.close}</Text>
                      </TouchableOpacity>
                      {(canEdit || isParticipant) && (
                        <TouchableOpacity
                          style={styles.secondaryRemoveBtn}
                          onPress={() => handleRemoveLiveResult(undefined, undefined, true)}
                          activeOpacity={0.8}
                        >
                          <Trash2 size={14} color={isDark ? '#F87171' : '#E11D48'} />
                          <Text style={styles.secondaryRemoveBtnText}>
                            {t.luckyWheel.removeAllResults}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </Modal>

        {/* ============================================================== */}
        {/* MODAL / POPOVER MENU 3 CHẤM (ÂM THANH & QUYỀN SỬA)             */}
        {/* ============================================================== */}
        <Modal
          visible={isMoreMenuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsMoreMenuVisible(false)}
        >
          <TouchableOpacity
            style={styles.moreMenuBackdrop}
            activeOpacity={1}
            onPress={() => setIsMoreMenuVisible(false)}
          >
            <View
              style={[
                styles.moreMenuCard,
                {
                  backgroundColor: isDark ? colors.elevated : '#FFFFFF',
                  borderColor: colors.hairline,
                },
              ]}
            >
              {/* Header Menu */}
              <View style={[styles.moreMenuHeader, { borderBottomColor: colors.hairline }]}>
                <Text style={[styles.moreMenuHeaderTitle, { color: colors.text }]}>
                  {locale === 'vi' ? 'Cài đặt phòng quay' : 'Stage settings'}
                </Text>
                <TouchableOpacity
                  onPress={() => setIsMoreMenuVisible(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={18} color={colors.subtle} />
                </TouchableOpacity>
              </View>

              {/* 1. ÂM THANH */}
              <TouchableOpacity
                style={styles.moreMenuItemRow}
                onPress={handleToggleSound}
                activeOpacity={0.7}
              >
                <View style={styles.moreMenuItemLeft}>
                  <View
                    style={[
                      styles.moreMenuItemIconBox,
                      {
                        backgroundColor: soundEnabled
                          ? `${colors.primary}18`
                          : isDark
                          ? colors.surface
                          : '#F1F5F9',
                      },
                    ]}
                  >
                    {soundEnabled ? (
                      <Volume2 size={16} color={colors.primary} />
                    ) : (
                      <VolumeX size={16} color={colors.subtle} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.moreMenuItemLabel, { color: colors.text }]}>
                      {t.luckyWheel.soundSetting}
                    </Text>
                    <Text style={[styles.moreMenuItemSub, { color: colors.subtle }]}>
                      {soundEnabled
                        ? locale === 'vi'
                          ? 'Bật âm thanh quay & chúc mừng'
                          : 'Sound enabled'
                        : locale === 'vi'
                        ? 'Đang tắt âm thanh'
                        : 'Muted'}
                    </Text>
                  </View>
                </View>

                {/* Switch Toggle */}
                <View
                  style={[
                    styles.switchTrack,
                    {
                      backgroundColor: soundEnabled
                        ? colors.primary
                        : isDark
                        ? colors.surface
                        : '#CBD5E1',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.switchThumb,
                      soundEnabled && styles.switchThumbActive,
                    ]}
                  />
                </View>
              </TouchableOpacity>

              <View style={[styles.moreMenuDivider, { backgroundColor: colors.hairline }]} />

              {/* 2. QUYỀN CHỈNH SỬA */}
              {isHost ? (
                <TouchableOpacity
                  style={styles.moreMenuItemRow}
                  disabled={isUpdatingSettings}
                  onPress={handleToggleAllowEdit}
                  activeOpacity={0.7}
                >
                  <View style={styles.moreMenuItemLeft}>
                    <View
                      style={[
                        styles.moreMenuItemIconBox,
                        {
                          backgroundColor: allowMembersToEdit
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(245, 158, 11, 0.15)',
                        },
                      ]}
                    >
                      {allowMembersToEdit ? (
                        <LockOpen size={16} color="#10B981" />
                      ) : (
                        <Lock size={16} color="#D97706" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.moreMenuItemLabel, { color: colors.text }]}>
                        {t.luckyWheel.allowEdit || (locale === 'vi' ? 'Cho phép sửa' : 'Allow edit')}
                      </Text>
                      <Text style={[styles.moreMenuItemSub, { color: colors.subtle }]}>
                        {allowMembersToEdit
                          ? locale === 'vi'
                            ? 'Tất cả thành viên đều được sửa'
                            : 'All members can edit'
                          : locale === 'vi'
                          ? 'Chỉ chủ phòng mới được sửa'
                          : 'Host only'}
                      </Text>
                    </View>
                  </View>

                  {/* Switch Toggle */}
                  <View
                    style={[
                      styles.switchTrack,
                      {
                        backgroundColor: allowMembersToEdit
                          ? '#10B981'
                          : isDark
                          ? colors.surface
                          : '#CBD5E1',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.switchThumb,
                        allowMembersToEdit && styles.switchThumbActive,
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.moreMenuItemRow}>
                  <View style={styles.moreMenuItemLeft}>
                    <View
                      style={[
                        styles.moreMenuItemIconBox,
                        {
                          backgroundColor: allowMembersToEdit
                            ? 'rgba(16, 185, 129, 0.15)'
                            : isDark
                            ? colors.surface
                            : '#F1F5F9',
                        },
                      ]}
                    >
                      {allowMembersToEdit ? (
                        <LockOpen size={16} color="#10B981" />
                      ) : (
                        <Lock size={16} color={colors.subtle} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.moreMenuItemLabel, { color: colors.text }]}>
                        {t.luckyWheel.allowEdit || (locale === 'vi' ? 'Quyền chỉnh sửa' : 'Edit permission')}
                      </Text>
                      <Text style={[styles.moreMenuItemSub, { color: colors.subtle }]}>
                        {allowMembersToEdit
                          ? locale === 'vi'
                            ? 'Được phép sửa nội dung'
                            : 'Can edit content'
                          : locale === 'vi'
                          ? 'Chế độ chỉ xem'
                          : 'View only mode'}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.viewOnlyBadgePill,
                      {
                        backgroundColor: allowMembersToEdit
                          ? 'rgba(16, 185, 129, 0.15)'
                          : isDark
                          ? colors.surface
                          : '#F1F5F9',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.viewOnlyBadgePillText,
                        { color: allowMembersToEdit ? '#10B981' : colors.subtle },
                      ]}
                    >
                      {allowMembersToEdit
                        ? locale === 'vi'
                          ? 'Được sửa'
                          : 'Can edit'
                        : locale === 'vi'
                        ? 'Chỉ xem'
                        : 'View only'}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </Modal>
  );
};

function createStyles(colors: any, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.canvas,
      position: 'relative',
    },
    loadingBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingBox: {
      padding: 24,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      width: 220,
      borderWidth: 1,
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
    headerLeftGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
      marginRight: 8,
    },
    headerTitleLabelText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      flexShrink: 1,
    },
    floatingRightActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    floatingPillIconBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? colors.elevated : 'rgba(255, 255, 255, 0.94)',
      borderWidth: 1,
      borderColor: colors.hairline,
      shadowColor: '#000',
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 5,
      elevation: 3,
    },
    floatingPillIconBtnActiveResults: {
      backgroundColor: '#F59E0B',
      borderColor: '#D97706',
    },
    floatingPillIconBtnActivePrimary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    floatingPillPrimaryIconBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOpacity: 0.25,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 5,
      elevation: 3,
    },
    floatingPillSpinAllBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: 12,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOpacity: 0.25,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 5,
      elevation: 3,
    },
    floatingPillSpinAllText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 'bold',
    },
    arenaCenterSpinWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 18,
      marginBottom: 6,
      width: '100%',
    },
    arenaCenterSpinBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 26,
      height: 46,
      borderRadius: 23,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 4,
    },
    arenaCenterSpinText: {
      color: '#FFFFFF',
      fontSize: 14.5,
      fontWeight: 'bold',
    },
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
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
      width: '100%',
    },
    singleWheelWrapper: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    mobileWheelTitleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: isDark ? colors.elevated : '#F1F5F9',
      borderWidth: 1,
      borderColor: colors.hairline,
      marginBottom: 8,
      maxWidth: 160,
    },
    mobileWheelTitleBadgeActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    mobileWheelTitleText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.text,
    },
    mobileWheelTitleTextActive: {
      color: '#FFFFFF',
    },
    cleanWheelCard: {
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 20,
    },
    cleanSmallWheelCard: {
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 4,
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
      alignItems: 'center',
      width: '100%',
    },
    gridThreeWheels: {
      width: '100%',
    },
    gridFourWheelsContainer: {
      width: '100%',
    },
    smallWheelItemWrapper: {
      flex: 1,
      alignItems: 'center',
      maxWidth: '50%',
    },
    tabbedBoard: {
      backgroundColor: isDark ? colors.surface : '#FFFFFF',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: 12,
    },
    tabsScroll: {
      flexDirection: 'row',
      gap: 6,
    },
    tabPill: {
      width: 88,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      backgroundColor: isDark ? colors.elevated : '#F1F5F9',
    },
    tabPillActive: {
      backgroundColor: colors.primary,
    },
    tabPillResults: {
      width: 'auto',
      minWidth: 88,
      height: 32,
      paddingHorizontal: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    tabPillActiveResults: {
      backgroundColor: '#F59E0B',
    },
    tabPillActivePrimary: {
      backgroundColor: colors.primary,
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
    tabPillText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.subtle,
    },
    tabPillTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    activeContentCard: {
      marginTop: 10,
      minHeight: 280,
    },
    activeTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 8,
    },
    inlineTitleInput: {
      flex: 1,
      height: 38,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: 10,
      paddingHorizontal: 10,
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      backgroundColor: isDark ? colors.elevated : '#F9FAFB',
    },
    delWheelBtn: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: isDark ? colors.elevated : '#FEF2F2',
    },
    counterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    counterLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    counterValue: {
      fontSize: 11,
      color: colors.subtle,
    },
    boardTextarea: {
      height: 130,
      minHeight: 130,
      maxHeight: 130,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: 12,
      padding: 10,
      fontSize: 13,
      lineHeight: 19,
      color: colors.text,
      backgroundColor: isDark ? colors.elevated : '#F9FAFB',
      textAlignVertical: 'top',
      marginBottom: 8,
    },
    boardActionsRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 10,
    },
    boardActionBtnIconOnly: {
      flex: 1,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: 10,
      backgroundColor: isDark ? colors.elevated : '#F9FAFB',
    },
    togglesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.hairline,
    },
    toggleItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 4,
    },
    toggleItemText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: colors.text,
    },
    resultsHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
      marginBottom: 8,
    },
    resultsHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
    },
    resultsHeaderTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      flexShrink: 1,
    },
    resultsHeaderCount: {
      fontSize: 12,
      color: colors.subtle,
      fontWeight: '600',
    },
    resultsHintText: {
      fontSize: 10.5,
      color: colors.subtle,
      marginTop: 4,
      fontStyle: 'italic',
    },
    liveIndicatorBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    liveGreenDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#10B981',
    },
    liveIndicatorText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#10B981',
    },
    participantsListScroll: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 4,
    },
    participantCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 12,
      borderWidth: 1,
    },
    participantAvatarImg: {
      width: 22,
      height: 22,
      borderRadius: 11,
    },
    participantAvatarPlaceholder: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    participantAvatarPlaceholderText: {
      fontSize: 10,
      fontWeight: 'bold',
    },
    participantDisplayName: {
      fontSize: 11,
      fontWeight: '600',
      maxWidth: 80,
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
      color: colors.text,
      textAlign: 'center',
      marginBottom: 6,
    },
    winnerBadgePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.18)' : '#FEF3C7',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : '#FDE68A',
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
      color: isDark ? '#FBBF24' : '#B45309',
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modalBox: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: isDark ? colors.elevated : '#FFFFFF',
      borderRadius: 24,
      padding: 20,
      alignItems: 'center',
      position: 'relative',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 10,
    },
    modalCloseBtn: {
      position: 'absolute',
      top: 14,
      right: 14,
      padding: 4,
      zIndex: 10,
    },
    singleWinnerCard: {
      width: '100%',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 18,
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(245, 158, 11, 0.25)' : '#FEF3C7',
      marginBottom: 16,
    },
    singleWinnerWheelTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: isDark ? '#FBBF24' : '#B45309',
    },
    singleWinnerName: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.text,
      textAlign: 'center',
    },
    modalButtonsCol: {
      width: '100%',
      gap: 8,
    },
    primaryModalBtn: {
      width: '100%',
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryModalBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    secondaryRemoveBtn: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
    },
    secondaryRemoveBtnText: {
      fontSize: 12.5,
      fontWeight: '700',
      color: isDark ? '#F87171' : '#E11D48',
    },
    multiWinnersScroll: {
      width: '100%',
      maxHeight: 200,
      marginBottom: 14,
    },
    multiWinnerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7',
      marginBottom: 6,
    },
    multiWinnerWheelTitle: {
      fontSize: 11,
      fontWeight: '600',
      color: isDark ? '#FBBF24' : '#B45309',
    },
    multiWinnerName: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.text,
    },
    multiWinnerRemoveIconBtn: {
      padding: 6,
    },
    moreMenuBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    moreMenuCard: {
      width: '100%',
      maxWidth: 320,
      borderRadius: 22,
      borderWidth: 1,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 14,
      elevation: 8,
    },
    moreMenuHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 10,
      borderBottomWidth: 1,
    },
    moreMenuHeaderTitle: {
      fontSize: 13.5,
      fontWeight: 'bold',
    },
    moreMenuItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 11,
    },
    moreMenuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
      paddingRight: 8,
    },
    moreMenuItemIconBox: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    moreMenuItemLabel: {
      fontSize: 12.5,
      fontWeight: '600',
    },
    moreMenuItemSub: {
      fontSize: 10,
      marginTop: 1,
    },
    moreMenuDivider: {
      height: 1,
      marginVertical: 2,
    },
    switchTrack: {
      width: 38,
      height: 22,
      borderRadius: 11,
      padding: 2,
      justifyContent: 'center',
    },
    switchThumb: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    switchThumbActive: {
      transform: [{ translateX: 16 }],
    },
    viewOnlyBadgePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    viewOnlyBadgePillText: {
      fontSize: 11,
      fontWeight: 'bold',
    },
  });
}
