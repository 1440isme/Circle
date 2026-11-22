import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
  ArrowRight,
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
} from 'lucide-react-native';
import { LiveWheelSession, LiveWheelItem, LiveWheelParticipant } from '@circle/types';
import {
  getActiveLiveWheelApi,
  liveSpinWheelApi,
  liveRemoveResultApi,
  updateLiveWheelSettingsApi,
  closeLiveWheelStageApi,
  createWheelApi,
  updateWheelApi,
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
  const { width } = useWindowDimensions();
  const { colors, resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const { locale, t } = useLanguageStore();
  const user = useAuthStore((s) => s.user);

  const [session, setSession] = useState<LiveWheelSession | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissedSessionId, setDismissedSessionId] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmittingSpin, setIsSubmittingSpin] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('results');

  // Menu 3 chấm và settings
  const [isMoreMenuVisible, setIsMoreMenuVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [isAddingWheel, setIsAddingWheel] = useState(false);

  // Local state chỉnh sửa options cho từng vòng khi có quyền
  const [wheelEditingState, setWheelEditingState] = useState<Record<string, string>>({});

  // 4 Animated values cho tối đa 4 bánh xe
  const rotAnim0 = useRef(new Animated.Value(0)).current;
  const rotAnim1 = useRef(new Animated.Value(0)).current;
  const rotAnim2 = useRef(new Animated.Value(0)).current;
  const rotAnim3 = useRef(new Animated.Value(0)).current;
  const rotateAnims = useMemo(
    () => [rotAnim0, rotAnim1, rotAnim2, rotAnim3],
    [rotAnim0, rotAnim1, rotAnim2, rotAnim3]
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

  // Khởi tạo editing state cho từng vòng
  useEffect(() => {
    if (wheelsList.length > 0) {
      setWheelEditingState((prev) => {
        const next = { ...prev };
        wheelsList.forEach((w) => {
          if (!next[w.wheelId]) {
            next[w.wheelId] = w.options.map((o) => o.optionLabel).join('\n');
          }
        });
        return next;
      });
    }
  }, [wheelsList]);

  // Phân quyền: Host vs Spectator (nếu chưa có creatorId thì mặc định coi như host tạo phòng)
  const isHost = Boolean(session && (!session.creatorId || session.creatorId === user?.id));
  const allowMembersToEdit = session?.allowMembersToEdit ?? false;
  const canEdit = isHost || allowMembersToEdit;

  // Kích thước đĩa quay co giãn linh hoạt theo số lượng vòng
  const discSize = useMemo(() => {
    const count = wheelsList.length;
    if (count <= 1) return Math.min(width - 80, 230);
    if (count === 2) return Math.min((width - 64) / 2, 140);
    return Math.min((width - 64) / 2, 118);
  }, [wheelsList.length, width]);

  // 1. Kiểm tra session đang hoạt động khi mount
  useEffect(() => {
    if (!circleId) return;
    getActiveLiveWheelApi(circleId)
      .then((active) => {
        if (active && active.id !== dismissedSessionId) {
          const elapsed = Date.now() - active.startedAt;
          if (elapsed < 4 * 60 * 60 * 1000) {
            setSession(active);
            if (active.stageStatus === 'idle') {
              setIsFinished(false);
            } else if (elapsed >= (active.durationMs || 6000)) {
              setIsFinished(true);
            }
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
          setIsVisible(true);
          setIsFinished(false);
          rotateAnims.forEach((anim) => anim.setValue(0));
        }
      };

      const handleLiveWheelStarted = (incoming: LiveWheelSession) => {
        if (incoming.circleId === circleId) {
          setDismissedSessionId(null);
          setSession(incoming);
          setIsVisible(true);
          setIsFinished(false);
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
        }
      };

      const handleStageClosed = (data: { circleId: string }) => {
        if (data.circleId === circleId) {
          setIsVisible(false);
          setSession(null);
        }
      };

      socket.on('circle:live-wheel:stage-created', handleStageCreated);
      socket.on('circle:live-wheel:started', handleLiveWheelStarted);
      socket.on('circle:live-wheel:participants-updated', handleParticipantsUpdated);
      socket.on('circle:live-wheel:updated', handleWheelUpdated);
      socket.on('circle:live-wheel:stage-closed', handleStageClosed);

      cleanupSocket = () => {
        socket.off('circle:live-wheel:stage-created', handleStageCreated);
        socket.off('circle:live-wheel:started', handleLiveWheelStarted);
        socket.off('circle:live-wheel:participants-updated', handleParticipantsUpdated);
        socket.off('circle:live-wheel:updated', handleWheelUpdated);
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

  // 3. Tính toán và chạy Animation đồng bộ
  useEffect(() => {
    if (!isVisible || !session || wheelsList.length === 0) return;

    if (session.stageStatus === 'idle') {
      setIsFinished(false);
      rotateAnims.forEach((anim) => anim.setValue(0));
      return;
    }

    const duration = session.durationMs || 6000;
    const startedAt = session.startedAt;
    const elapsed = Date.now() - startedAt;

    const animations = wheelsList.map((wheel, idx) => {
      const anim = rotateAnims[idx] || rotAnim0;
      const count = Math.max(wheel.options.length, 1);
      const sliceDeg = 360 / count;
      const winIdx = wheel.winningIndex >= 0 ? wheel.winningIndex : 0;
      const targetCenterDeg = winIdx * sliceDeg + sliceDeg / 2;
      const stopAngle = (360 - (targetCenterDeg % 360)) % 360;
      const extraSpins = (6 + idx) * 360;
      const finalRot = extraSpins + stopAngle;

      if (elapsed >= duration) {
        anim.setValue(finalRot);
        return null;
      }

      const remaining = duration - elapsed;
      const initialProgress = Math.max(elapsed / duration, 0);
      const easeOutInitial = 1 - Math.pow(1 - initialProgress, 4);
      const startRot = finalRot * easeOutInitial;

      anim.setValue(startRot);

      return Animated.timing(anim, {
        toValue: finalRot,
        duration: remaining,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
    });

    if (elapsed >= duration) {
      setIsFinished(true);
      setActiveTab('results');
      return;
    }

    setIsFinished(false);
    const activeTimings = animations.filter(Boolean) as Animated.CompositeAnimation[];

    if (activeTimings.length > 0) {
      Animated.parallel(activeTimings).start(() => {
        setIsFinished(true);
        setActiveTab('results');
        try {
          if (soundEnabled) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        } catch {}
      });
    }
  }, [isVisible, session, wheelsList, rotateAnims, rotAnim0, soundEnabled]);

  // 4. Render SVG cho từng bánh xe
  const renderWheelSvg = (wheel: LiveWheelItem) => {
    const totalOptions = wheel.options.length;
    if (totalOptions === 0) return null;

    const radius = discSize / 2;
    const centerX = discSize / 2;
    const centerY = discSize / 2;
    const arcAngle = (2 * Math.PI) / totalOptions;

    return wheel.options.map((opt, idx) => {
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
      const maxLen = discSize > 180 ? 10 : 7;
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
            fontSize={discSize > 180 ? 11 : 9}
            fontWeight="bold"
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

  // 5. Xử lý khi ấn nút Quay (Bất kỳ ai cũng có thể ấn)
  const handleSpinClick = async () => {
    if (isSubmittingSpin || (!isFinished && session?.stageStatus === 'spinning')) return;

    try {
      setIsSubmittingSpin(true);
      await liveSpinWheelApi(circleId, {
        isAll: true,
        channelId: session?.channelId,
      });
    } catch (err: any) {
      Alert.alert(t.common.error, err?.message || 'Không thể bắt đầu quay');
    } finally {
      setIsSubmittingSpin(false);
    }
  };

  // 6. Xử lý khi ấn nút "Loại bỏ kết quả"
  const handleRemoveLiveResult = async (
    wheelId?: string,
    optionLabel?: string,
    removeAll?: boolean
  ) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const updated = await liveRemoveResultApi(circleId, { wheelId, optionLabel, removeAll });
      if (updated) {
        setSession(updated);
      }
    } catch (err: any) {
      Alert.alert(t.common.error, err?.response?.data?.message || err?.message || 'Không thể loại bỏ kết quả');
    }
  };

  // 7. Thêm vòng quay
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

  // 8. Đổi cài đặt: Bật/Tắt "Cho phép sửa"
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
      Alert.alert(t.common.error, err?.response?.data?.message || err?.message || 'Không thể cập nhật quyền');
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  // 9. Đổi cài đặt: Bật/Tắt âm thanh
  const handleToggleSound = () => {
    setSoundEnabled((prev) => !prev);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  // 10. Đóng phòng quay (Host) hoặc Rời phòng (Người xem)
  const handleCloseStage = () => {
    Alert.alert(
      locale === 'vi' ? 'Đóng phòng quay' : 'Close stage',
      locale === 'vi'
        ? 'Bạn có chắc chắn muốn đóng phòng quay và gửi kết quả vào nhóm chat không?'
        : 'Are you sure you want to close the stage and share results?',
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: locale === 'vi' ? 'Đóng phòng' : 'Close',
          style: 'destructive',
          onPress: async () => {
            try {
              await closeLiveWheelStageApi(circleId);
              setIsVisible(false);
              setSession(null);
            } catch (err: any) {
              Alert.alert(t.common.error, err?.message || 'Không thể đóng phòng quay');
            }
          },
        },
      ]
    );
  };

  const handleLeaveStage = () => {
    if (session) {
      setDismissedSessionId(session.id);
    }
    setIsVisible(false);
  };

  // 11. Lưu sửa đổi cho tab lựa chọn của vòng
  const handleSaveWheelOptions = async (wheelId: string) => {
    if (!canEdit) return;
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
      a.localeCompare(b, 'vi', { numeric: true, sensitivity: 'base' })
    );
    setWheelEditingState((prev) => ({ ...prev, [wheelId]: sorted.join('\n') }));
  };

  if (!isVisible) return null;

  if (!session) {
    return (
      <Modal visible={isVisible} animationType="fade" transparent onRequestClose={handleLeaveStage}>
        <View style={styles.backdrop}>
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

  const isSpinning = !isFinished && session.stageStatus === 'spinning';
  const spunByName = session.spunBy?.displayName || (locale === 'vi' ? 'Thành viên' : 'Member');
  const participants = session.participants || [];

  return (
    <Modal visible={isVisible} animationType="fade" transparent onRequestClose={handleLeaveStage}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.cardContainer,
            {
              backgroundColor: isDark ? colors.elevated : '#FFFFFF',
              borderColor: colors.hairline,
              maxHeight: '94%',
            },
          ]}
        >
          {/* ============================================================== */}
          {/* TOP BAR: TIÊU ĐỀ + MENU 3 CHẤM + NÚT ĐÓNG / RỜI PHÒNG           */}
          {/* ============================================================== */}
          <View style={[styles.topBar, { borderBottomColor: colors.hairline }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconBox, { backgroundColor: `${colors.primary}20` }]}>
                <Compass size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  {locale === 'vi' ? 'Vòng quay ngẫu nhiên' : 'Random Wheel'}
                </Text>
              </View>
            </View>

            {/* Cụm Action Bên Phải: Nút 3 chấm & Nút Đóng/Rời phòng */}
            <View style={styles.headerRightActions}>
              {/* Nút 3 Chấm */}
              <TouchableOpacity
                style={[
                  styles.moreBtn,
                  {
                    backgroundColor: isDark ? colors.surface : '#F1F5F9',
                    borderColor: colors.hairline,
                  },
                ]}
                onPress={() => setIsMoreMenuVisible(true)}
                activeOpacity={0.75}
              >
                <MoreHorizontal size={18} color={colors.text} />
              </TouchableOpacity>

              {/* Nút Đóng phòng (Host) hoặc Rời phòng (Người xem) */}
              {isHost ? (
                <TouchableOpacity
                  style={styles.closeStageBtn}
                  onPress={handleCloseStage}
                  activeOpacity={0.75}
                >
                  <X size={16} color="#EF4444" />
                  <Text style={styles.closeStageBtnText}>
                    {locale === 'vi' ? 'Đóng' : 'Close'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.leaveStageBtn,
                    {
                      backgroundColor: isDark ? colors.surface : '#F1F5F9',
                      borderColor: colors.hairline,
                    },
                  ]}
                  onPress={handleLeaveStage}
                  activeOpacity={0.75}
                >
                  <LogOut size={14} color={colors.subtle} />
                  <Text style={[styles.leaveStageBtnText, { color: colors.subtle }]}>
                    {locale === 'vi' ? 'Rời' : 'Leave'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ============================================================== */}
          {/* FLOATING PILLS BAR (DẢI CÔNG CỤ NẰM NGANG)                      */}
          {/* ============================================================== */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.floatingPillsBar}
          >
            {/* Pill: KẾT QUẢ */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('results')}
              style={[
                styles.floatingPill,
                {
                  backgroundColor:
                    activeTab === 'results'
                      ? '#F59E0B'
                      : isDark
                      ? colors.surface
                      : '#F1F5F9',
                  borderColor: activeTab === 'results' ? '#F59E0B' : colors.hairline,
                },
              ]}
            >
              <Trophy size={13} color={activeTab === 'results' ? '#FFFFFF' : '#F59E0B'} />
              <Text
                style={[
                  styles.floatingPillText,
                  { color: activeTab === 'results' ? '#FFFFFF' : colors.text },
                ]}
              >
                {t.luckyWheel.resultsTab}
              </Text>
            </TouchableOpacity>

            {/* Pill: NGƯỜI XEM */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('participants')}
              style={[
                styles.floatingPill,
                {
                  backgroundColor:
                    activeTab === 'participants'
                      ? colors.primary
                      : isDark
                      ? colors.surface
                      : '#F1F5F9',
                  borderColor:
                    activeTab === 'participants' ? colors.primary : colors.hairline,
                },
              ]}
            >
              <Users size={13} color={activeTab === 'participants' ? '#FFFFFF' : colors.primary} />
              <Text
                style={[
                  styles.floatingPillText,
                  { color: activeTab === 'participants' ? '#FFFFFF' : colors.text },
                ]}
              >
                {locale === 'vi' ? 'Người xem' : 'Viewers'} ({participants.length})
              </Text>
            </TouchableOpacity>

            {/* Pill: THÊM VÒNG QUAY */}
            {canEdit && (
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={wheelsList.length >= 4 || isAddingWheel}
                onPress={handleAddDefaultWheel}
                style={[
                  styles.floatingPill,
                  {
                    backgroundColor: isDark ? colors.surface : '#F1F5F9',
                    borderColor: colors.hairline,
                    opacity: wheelsList.length >= 4 ? 0.4 : 1,
                  },
                ]}
              >
                <Plus size={13} color={colors.primary} />
                <Text style={[styles.floatingPillText, { color: colors.text }]}>
                  {t.luckyWheel.addWheel}
                </Text>
              </TouchableOpacity>
            )}

            {/* Pill: QUAY TẤT CẢ (Ai cũng có thể bấm) */}
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={isSpinning || isSubmittingSpin}
              onPress={handleSpinClick}
              style={[
                styles.floatingPill,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                  opacity: isSpinning || isSubmittingSpin ? 0.5 : 1,
                },
              ]}
            >
              <RotateCw size={12} color="#FFFFFF" />
              <Text style={[styles.floatingPillText, { color: '#FFFFFF', fontWeight: 'bold' }]}>
                {isSpinning || isSubmittingSpin ? t.luckyWheel.spinning : t.luckyWheel.spinAll}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* ============================================================== */}
          {/* SÂN KHẤU CÁC VÒNG XOAY HIỂN THỊ CO GIÃN LINH HOẠT             */}
          {/* ============================================================== */}
          <ScrollView
            style={styles.wheelsScroll}
            contentContainerStyle={[
              styles.wheelsGrid,
              wheelsList.length === 1 && { justifyContent: 'center' },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {wheelsList.map((wheel, idx) => {
              const anim = rotateAnims[idx] || rotAnim0;
              const rotateInterpolate = anim.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              });
              const tabKey = wheel.wheelId || String(idx);
              const isActive = activeTab === tabKey;

              return (
                <View
                  key={wheel.wheelId || `wheel-${idx}`}
                  style={[
                    styles.wheelCell,
                    wheelsList.length === 1 && { width: '100%', alignItems: 'center' },
                  ]}
                >
                  {/* Nhãn tab trên đầu từng vòng */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setActiveTab(tabKey)}
                    style={[
                      styles.wheelCellLabel,
                      {
                        backgroundColor: isActive
                          ? colors.primary
                          : isDark
                          ? colors.surface
                          : '#F1F5F9',
                        borderColor: isActive ? colors.primary : colors.hairline,
                      },
                    ]}
                  >
                    <Compass size={11} color={isActive ? '#FFFFFF' : colors.primary} />
                    <Text
                      style={[
                        styles.wheelCellLabelText,
                        { color: isActive ? '#FFFFFF' : colors.text },
                      ]}
                      numberOfLines={1}
                    >
                      {wheel.wheelTitle || (locale === 'vi' ? `Vòng ${idx + 1}` : `Wheel ${idx + 1}`)}
                    </Text>
                  </TouchableOpacity>

                  {/* Đĩa quay SVG */}
                  <View style={[styles.discBox, { width: discSize, height: discSize }]}>
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
                        {renderWheelSvg(wheel)}
                        <Circle
                          cx={discSize / 2}
                          cy={discSize / 2}
                          r={discSize > 180 ? 16 : 12}
                          fill="#FFFFFF"
                          stroke="#E2E8F0"
                          strokeWidth={1.5}
                        />
                        <Circle
                          cx={discSize / 2}
                          cy={discSize / 2}
                          r={discSize > 180 ? 6 : 4.5}
                          fill={colors.primary}
                        />
                      </Svg>
                    </Animated.View>

                    {/* Kim chỉ bên phải */}
                    <View
                      style={[styles.pointerRight, { right: discSize > 180 ? -12 : -10 }]}
                      pointerEvents="none"
                    >
                      <Svg width={22} height={14} viewBox="0 0 30 20">
                        <Path
                          d="M2 10L18 2C20 1 21 2 21 4V16C21 18 20 19 18 18L2 10Z"
                          fill={colors.primary}
                          stroke="#FFFFFF"
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
                          stroke="#FFFFFF"
                          strokeWidth={1.5}
                        />
                        <Circle cx={23.5} cy={10} r={2.5} fill="#FFFFFF" />
                        <Circle cx={23.5} cy={10} r={1.2} fill={colors.primary} />
                      </Svg>
                    </View>
                  </View>

                  {/* Hiển thị kết quả thắng riêng của từng vòng */}
                  {isFinished && wheel.winningOption && (
                    <View style={styles.cellWinnerRow}>
                      <Text
                        style={[
                          styles.cellWinnerBadge,
                          {
                            color: '#D97706',
                            backgroundColor: '#FEF3C7',
                            borderColor: '#FDE68A',
                          },
                        ]}
                        numberOfLines={1}
                      >
                        🏆 {wheel.winningOption.optionLabel}
                      </Text>
                      {canEdit && (
                        <TouchableOpacity
                          style={styles.cellRemoveBtn}
                          onPress={() =>
                            handleRemoveLiveResult(
                              wheel.wheelId,
                              wheel.winningOption?.optionLabel
                            )
                          }
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Trash2 size={11} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* ============================================================== */}
          {/* "CÁI BẢNG" (TABBED BOARD BÊN DƯỚI)                            */}
          {/* ============================================================== */}
          <View style={[styles.tabbedBoard, { borderTopColor: colors.hairline }]}>
            {/* Horizontal Tabs: [Vòng 1] [Vòng 2] ... [🏆 Kết quả] [👥 Người xem] */}
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
                    onPress={() => setActiveTab(tabKey)}
                    style={[
                      styles.tabPill,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : isDark
                          ? colors.surface
                          : '#F1F5F9',
                        borderColor: isSelected ? colors.primary : colors.hairline,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabPillText,
                        {
                          color: isSelected ? '#FFFFFF' : colors.text,
                          fontWeight: isSelected ? '700' : '600',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {wheel.wheelTitle || (locale === 'vi' ? `Vòng ${idx + 1}` : `Wheel ${idx + 1}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Tab Kết Quả */}
              <TouchableOpacity
                onPress={() => setActiveTab('results')}
                style={[
                  styles.tabPill,
                  {
                    backgroundColor:
                      activeTab === 'results'
                        ? '#F59E0B'
                        : isDark
                        ? colors.surface
                        : '#F1F5F9',
                    borderColor: activeTab === 'results' ? '#F59E0B' : colors.hairline,
                  },
                ]}
              >
                <Trophy size={13} color={activeTab === 'results' ? '#FFFFFF' : '#F59E0B'} />
                <Text
                  style={[
                    styles.tabPillText,
                    {
                      color: activeTab === 'results' ? '#FFFFFF' : colors.text,
                      fontWeight: activeTab === 'results' ? '700' : '600',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {t.luckyWheel.resultsTab}
                </Text>
              </TouchableOpacity>

              {/* Tab Người xem */}
              <TouchableOpacity
                onPress={() => setActiveTab('participants')}
                style={[
                  styles.tabPill,
                  {
                    backgroundColor:
                      activeTab === 'participants'
                        ? colors.primary
                        : isDark
                        ? colors.surface
                        : '#F1F5F9',
                    borderColor:
                      activeTab === 'participants' ? colors.primary : colors.hairline,
                  },
                ]}
              >
                <Users
                  size={13}
                  color={activeTab === 'participants' ? '#FFFFFF' : colors.primary}
                />
                <Text
                  style={[
                    styles.tabPillText,
                    {
                      color: activeTab === 'participants' ? '#FFFFFF' : colors.text,
                      fontWeight: activeTab === 'participants' ? '700' : '600',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {locale === 'vi' ? 'Người xem' : 'Viewers'} ({participants.length})
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {/* TAB CONTENT BODY */}
            <View style={styles.tabContentContainer}>
              {activeTab === 'results' ? (
                /* TAB 1: KẾT QUẢ */
                <View style={styles.tabResultsWrapper}>
                  {isSpinning ? (
                    <View style={[styles.spinningAlert, { backgroundColor: `${colors.primary}15` }]}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={[styles.spinningAlertText, { color: colors.primary }]}>
                        {t.luckyWheel.spinningLive}
                      </Text>
                    </View>
                  ) : isFinished && session.winningOption ? (
                    <View style={styles.winnerCard}>
                      <View style={styles.winnerHeaderRow}>
                        <Trophy size={13} color="#D97706" />
                        <Sparkles size={12} color="#D97706" />
                        <Text style={styles.winnerTitle}>{t.luckyWheel.winnerAnnounce}</Text>
                      </View>
                      <Text style={styles.winnerText} numberOfLines={2}>
                        {session.winningOption.optionLabel}
                      </Text>
                      <Text style={[styles.spunBySub, { color: colors.subtle }]}>
                        {t.luckyWheel.spunBy.replace('{name}', spunByName)}
                      </Text>

                      {canEdit && (
                        <TouchableOpacity
                          style={styles.removeResultBtn}
                          onPress={() => handleRemoveLiveResult(undefined, undefined, true)}
                          activeOpacity={0.8}
                        >
                          <Trash2 size={12} color="#EF4444" />
                          <Text style={styles.removeResultBtnText}>
                            {t.luckyWheel.removeResult}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : (
                    <Text style={[styles.idleHintText, { color: colors.subtle }]}>
                      {locale === 'vi'
                        ? 'Bấm "Quay tất cả" để bắt đầu quay cùng nhau!'
                        : 'Press "Spin All" to spin together!'}
                    </Text>
                  )}
                </View>
              ) : activeTab === 'participants' ? (
                /* TAB 2: NGƯỜI XEM TRỰC TIẾP */
                <View style={styles.tabParticipantsWrapper}>
                  <View style={styles.participantsHeader}>
                    <View style={styles.participantsTitleRow}>
                      <Users size={12} color={colors.primary} />
                      <Text style={[styles.participantsTitle, { color: colors.text }]}>
                        {locale === 'vi' ? 'Đang trong phòng' : 'In Room'} ({participants.length})
                      </Text>
                    </View>
                    <View style={styles.liveDotRow}>
                      <View style={styles.greenDot} />
                      <Text style={styles.liveDotText}>
                        {locale === 'vi' ? 'Trực tiếp' : 'Live'}
                      </Text>
                    </View>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.avatarRow}
                  >
                    {participants.map((p) => (
                      <View key={p.userId} style={styles.participantChip}>
                        {p.avatarUrl ? (
                          <Image source={{ uri: p.avatarUrl }} style={styles.participantAvatar} />
                        ) : (
                          <View
                            style={[
                              styles.participantAvatarFallback,
                              { backgroundColor: `${colors.primary}25` },
                            ]}
                          >
                            <Text
                              style={[
                                styles.participantAvatarFallbackText,
                                { color: colors.primary },
                              ]}
                            >
                              {p.displayName?.charAt(0) || 'U'}
                            </Text>
                          </View>
                        )}
                        <Text
                          style={[styles.participantName, { color: colors.text }]}
                          numberOfLines={1}
                        >
                          {p.displayName}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ) : (
                /* TAB 3: DANH SÁCH LỰA CHỌN CỦA VÒNG */
                (() => {
                  const currentWheel =
                    wheelsList.find((w, i) => (w.wheelId || String(i)) === activeTab) ||
                    wheelsList[0];
                  if (!currentWheel) return null;
                  const currentWheelId = currentWheel.wheelId;
                  const currentText =
                    wheelEditingState[currentWheelId] !== undefined
                      ? wheelEditingState[currentWheelId]
                      : currentWheel.options.map((o) => o.optionLabel).join('\n');

                  return (
                    <View style={styles.tabOptionsWrapper}>
                      <View style={styles.tabOptionsHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text
                            style={[styles.tabOptionsTitle, { color: colors.text }]}
                            numberOfLines={1}
                          >
                            {currentWheel.wheelTitle || 'Vòng quay'}
                          </Text>
                          <Text style={[styles.tabOptionsCount, { color: colors.subtle }]}>
                            ({currentWheel.options.length}{' '}
                            {locale === 'vi' ? 'lựa chọn' : 'options'})
                          </Text>
                        </View>

                        {/* Badge quyền hoặc các nút thao tác nhanh */}
                        {canEdit ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <TouchableOpacity
                              style={styles.wheelMiniActionBtn}
                              onPress={() => handleShuffleWheel(currentWheelId)}
                            >
                              <Shuffle size={13} color={colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.wheelMiniActionBtn}
                              onPress={() => handleSortAZWheel(currentWheelId)}
                            >
                              <ArrowDownAZ size={13} color="#6366F1" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.wheelMiniActionBtn, { backgroundColor: colors.primary }]}
                              onPress={() => handleSaveWheelOptions(currentWheelId)}
                            >
                              <Check size={13} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View
                            style={[
                              styles.viewOnlyBadge,
                              { backgroundColor: isDark ? colors.surface : '#F1F5F9' },
                            ]}
                          >
                            <Lock size={10} color={colors.subtle} />
                            <Text style={[styles.viewOnlyBadgeText, { color: colors.subtle }]}>
                              {locale === 'vi' ? 'Chỉ xem' : 'View only'}
                            </Text>
                          </View>
                        )}
                      </View>

                      <TextInput
                        style={[
                          styles.boardTextarea,
                          {
                            backgroundColor: isDark ? colors.surface : '#F8FAFC',
                            borderColor: colors.hairline,
                            color: colors.text,
                          },
                          !canEdit && { opacity: 0.75 },
                        ]}
                        multiline
                        editable={canEdit}
                        value={currentText}
                        onChangeText={(txt) =>
                          setWheelEditingState((prev) => ({
                            ...prev,
                            [currentWheelId]: txt,
                          }))
                        }
                        numberOfLines={4}
                        placeholder={t.luckyWheel.optionsPlaceholder}
                        placeholderTextColor={colors.subtle}
                      />
                    </View>
                  );
                })()
              )}
            </View>
          </View>
        </View>
      </View>

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
          style={styles.menuBackdrop}
          activeOpacity={1}
          onPress={() => setIsMoreMenuVisible(false)}
        >
          <View
            style={[
              styles.menuCard,
              {
                backgroundColor: isDark ? colors.elevated : '#FFFFFF',
                borderColor: colors.hairline,
              },
            ]}
          >
            {/* Header Menu */}
            <View style={[styles.menuHeader, { borderBottomColor: colors.hairline }]}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>
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
              style={styles.menuItem}
              onPress={handleToggleSound}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuIconBox,
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
                  <Text style={[styles.menuItemLabel, { color: colors.text }]}>
                    {t.luckyWheel.soundSetting}
                  </Text>
                  <Text style={[styles.menuItemSub, { color: colors.subtle }]}>
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
                  styles.toggleTrack,
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
                    styles.toggleThumb,
                    soundEnabled && styles.toggleThumbActive,
                  ]}
                />
              </View>
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: colors.hairline }]} />

            {/* 2. QUYỀN CHỈNH SỬA */}
            {isHost ? (
              <TouchableOpacity
                style={styles.menuItem}
                disabled={isUpdatingSettings}
                onPress={handleToggleAllowEdit}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <View
                    style={[
                      styles.menuIconBox,
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
                    <Text style={[styles.menuItemLabel, { color: colors.text }]}>
                      {t.luckyWheel.allowEdit || (locale === 'vi' ? 'Cho phép sửa' : 'Allow edit')}
                    </Text>
                    <Text style={[styles.menuItemSub, { color: colors.subtle }]}>
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
                    styles.toggleTrack,
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
                      styles.toggleThumb,
                      allowMembersToEdit && styles.toggleThumbActive,
                    ]}
                  />
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.menuItem}>
                <View style={styles.menuItemLeft}>
                  <View
                    style={[
                      styles.menuIconBox,
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
                    <Text style={[styles.menuItemLabel, { color: colors.text }]}>
                      {t.luckyWheel.allowEdit || (locale === 'vi' ? 'Quyền chỉnh sửa' : 'Edit permission')}
                    </Text>
                    <Text style={[styles.menuItemSub, { color: colors.subtle }]}>
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
                    styles.viewOnlyBadge,
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
                      styles.viewOnlyBadgeText,
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
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moreBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  closeStageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  closeStageBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  leaveStageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  leaveStageBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  floatingPillsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  floatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  floatingPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  wheelsScroll: {
    maxHeight: 275,
    marginVertical: 4,
  },
  wheelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 8,
    paddingVertical: 4,
  },
  wheelCell: {
    alignItems: 'center',
    gap: 3,
    marginBottom: 4,
  },
  wheelCellLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 130,
  },
  wheelCellLabelText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  discBox: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelRotateBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointerRight: {
    position: 'absolute',
    right: -10,
    top: '50%',
    marginTop: -7,
    zIndex: 10,
  },
  cellWinnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 3,
    maxWidth: '100%',
  },
  cellWinnerBadge: {
    fontSize: 9.5,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
    maxWidth: 130,
    textAlign: 'center',
  },
  cellRemoveBtn: {
    padding: 3,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  tabbedBoard: {
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 6,
  },
  tabsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  tabPillText: {
    fontSize: 11,
  },
  tabContentContainer: {
    minHeight: 100,
    maxHeight: 140,
    justifyContent: 'center',
  },
  tabResultsWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  tabParticipantsWrapper: {
    flex: 1,
    gap: 6,
    paddingTop: 4,
  },
  tabOptionsWrapper: {
    flex: 1,
    gap: 4,
  },
  tabOptionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabOptionsTitle: {
    fontSize: 11.5,
    fontWeight: 'bold',
    maxWidth: 180,
  },
  tabOptionsCount: {
    fontSize: 10.5,
  },
  wheelMiniActionBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
  },
  viewOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  viewOnlyBadgeText: {
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  boardTextarea: {
    flex: 1,
    minHeight: 75,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 12,
    textAlignVertical: 'top',
  },
  participantsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  participantsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  participantsTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  liveDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  greenDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  liveDotText: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#10B981',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  participantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(13, 148, 136, 0.08)',
  },
  participantAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  participantAvatarFallback: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantAvatarFallbackText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  participantName: {
    fontSize: 10,
    fontWeight: '600',
    maxWidth: 70,
  },
  spinningAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  spinningAlertText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  winnerCard: {
    width: '100%',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    alignItems: 'center',
  },
  winnerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  winnerTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  winnerText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#B45309',
    textAlign: 'center',
  },
  spunBySub: {
    fontSize: 9.5,
    marginTop: 1,
  },
  removeResultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  removeResultBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#EF4444',
  },
  idleHintText: {
    fontSize: 10.5,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  loadingBox: {
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: 220,
    borderWidth: 1,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  menuCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  menuIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  menuItemSub: {
    fontSize: 10,
    marginTop: 1,
  },
  menuDivider: {
    height: 1,
    marginVertical: 2,
  },
  toggleTrack: {
    width: 38,
    height: 22,
    borderRadius: 11,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
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
  toggleThumbActive: {
    transform: [{ translateX: 16 }],
  },
});
