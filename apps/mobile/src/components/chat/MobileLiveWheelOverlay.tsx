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
  User,
  Play,
  RotateCw,
  Trash2,
} from 'lucide-react-native';
import { LiveWheelSession, LiveWheelItem, LiveWheelParticipant } from '@circle/types';
import {
  getActiveLiveWheelApi,
  liveSpinWheelApi,
  liveRemoveResultApi,
} from '../../services/circle-tools.service';
import { getSocket } from '../../services/socket';
import { useLanguageStore } from '../../stores/language.store';
import { useThemeStore } from '../../stores/theme.store';

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

  const [session, setSession] = useState<LiveWheelSession | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissedSessionId, setDismissedSessionId] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmittingSpin, setIsSubmittingSpin] = useState(false);

  // 4 Animated values cho 4 bánh xe
  const rotAnim0 = useRef(new Animated.Value(0)).current;
  const rotAnim1 = useRef(new Animated.Value(0)).current;
  const rotAnim2 = useRef(new Animated.Value(0)).current;
  const rotAnim3 = useRef(new Animated.Value(0)).current;
  const rotateAnims = useMemo(() => [rotAnim0, rotAnim1, rotAnim2, rotAnim3], [
    rotAnim0,
    rotAnim1,
    rotAnim2,
    rotAnim3,
  ]);

  // Kích thước mỗi đĩa quay (2 hàng x 2 cột)
  const discSize = useMemo(() => {
    return Math.min(Math.floor((width - 68) / 2), 120);
  }, [width]);

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

  // 2. Lắng nghe WebSocket cả stage-created, started, participants-updated, updated và DeviceEventEmitter
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

      const handleParticipantsUpdated = (data: { sessionId: string; participants: LiveWheelParticipant[] }) => {
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

      socket.on('circle:live-wheel:stage-created', handleStageCreated);
      socket.on('circle:live-wheel:started', handleLiveWheelStarted);
      socket.on('circle:live-wheel:participants-updated', handleParticipantsUpdated);
      socket.on('circle:live-wheel:updated', handleWheelUpdated);

      cleanupSocket = () => {
        socket.off('circle:live-wheel:stage-created', handleStageCreated);
        socket.off('circle:live-wheel:started', handleLiveWheelStarted);
        socket.off('circle:live-wheel:participants-updated', handleParticipantsUpdated);
        socket.off('circle:live-wheel:updated', handleWheelUpdated);
      };
    });

    // Lắng nghe sự kiện từ tin nhắn card chat khi bấm "Tham gia"
    const sub = DeviceEventEmitter.addListener('circle:open-live-wheel', (data) => {
      if (data?.circleId === circleId) {
        setDismissedSessionId(null);
        setIsVisible(true);
        if (data?.session) {
          setSession(data.session);
        } else {
          getActiveLiveWheelApi(circleId).then((act) => {
            if (act) setSession(act);
          }).catch(() => {});
        }
      }
    });

    return () => {
      cleanupSocket?.();
      sub.remove();
    };
  }, [circleId, rotateAnims]);

  // Danh sách 4 vòng xoay
  const wheelsList: LiveWheelItem[] = useMemo(() => {
    if (session?.wheels && session.wheels.length > 0) {
      return session.wheels.slice(0, 4);
    }
    if (session?.options && session.options.length > 0) {
      return [
        {
          wheelId: session.wheelId || 'single-wheel',
          wheelTitle: session.wheelTitle || 'Vòng 1',
          options: session.options,
          winningIndex: session.winningIndex,
          winningOption: session.winningOption,
        },
      ];
    }
    return [];
  }, [session]);

  // 3. Tính toán và chạy Animation đồng bộ cho cả 4 vòng
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
      return;
    }

    setIsFinished(false);
    const activeTimings = animations.filter(Boolean) as Animated.CompositeAnimation[];

    if (activeTimings.length > 0) {
      Animated.parallel(activeTimings).start(() => {
        setIsFinished(true);
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      });
    }
  }, [isVisible, session, wheelsList, rotateAnims, rotAnim0]);

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
      if (label.length > 8) {
        label = label.substring(0, 7) + '…';
      }

      return (
        <G key={`slice-${idx}`}>
          <Path d={pathD} fill={color} stroke="#FFFFFF" strokeWidth={1} />
          <SvgText
            x={tx}
            y={ty}
            fill="#1E293B"
            fontSize={9}
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
      // ignore
    } finally {
      setIsSubmittingSpin(false);
    }
  };

  // 6. Xử lý khi ấn nút "Loại bỏ kết quả" (Đồng bộ mọi thành viên)
  const handleRemoveLiveResult = async (wheelId?: string, optionLabel?: string, removeAll?: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const updated = await liveRemoveResultApi(circleId, { wheelId, optionLabel, removeAll });
      if (updated) {
        setSession(updated);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Không thể loại bỏ kết quả');
    }
  };

  const handleClose = () => {
    if (session) {
      setDismissedSessionId(session.id);
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  if (!session) {
    return (
      <Modal visible={isVisible} animationType="fade" transparent onRequestClose={handleClose}>
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
    <Modal visible={isVisible} animationType="fade" transparent onRequestClose={handleClose}>
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
          {/* HEADER: CHỈ ĐỂ "Vòng quay may mắn" (BỎ LIVE STAGE, BỎ 4 VÒNG) */}
          {/* ============================================================== */}
          <View style={[styles.topBar, { borderBottomColor: colors.hairline }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconBox, { backgroundColor: `${colors.primary}20` }]}>
                <Compass size={18} color={colors.primary} />
              </View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {locale === 'vi' ? 'Vòng quay may mắn' : 'Lucky Wheel'}
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <X size={20} color={colors.subtle} />
            </TouchableOpacity>
          </View>

          {/* ============================================================== */}
          {/* SÂN KHẤU 4 VÒNG XOAY HIỂN THỊ NHƯ CHỨC NĂNG VÒNG XOAY MAY MẮN */}
          {/* ============================================================== */}
          <ScrollView
            style={styles.wheelsScroll}
            contentContainerStyle={styles.wheelsGrid}
            showsVerticalScrollIndicator={false}
          >
            {wheelsList.map((wheel, idx) => {
              const anim = rotateAnims[idx] || rotAnim0;
              const rotateInterpolate = anim.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg'],
              });

              return (
                <View key={wheel.wheelId || `wheel-${idx}`} style={styles.wheelCell}>
                  {/* Nhãn nút tên vòng phía trên (như MobileWheelView) */}
                  <View
                    style={[
                      styles.wheelCellLabel,
                      {
                        backgroundColor: isDark ? colors.surface : '#F1F5F9',
                        borderColor: colors.hairline,
                      },
                    ]}
                  >
                    <Compass size={11} color={colors.primary} />
                    <Text
                      style={[styles.wheelCellLabelText, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {wheel.wheelTitle || `Vòng ${idx + 1}`}
                    </Text>
                  </View>

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
                          r={12}
                          fill="#FFFFFF"
                          stroke="#E2E8F0"
                          strokeWidth={1.5}
                        />
                        <Circle
                          cx={discSize / 2}
                          cy={discSize / 2}
                          r={4.5}
                          fill={colors.primary}
                        />
                      </Svg>
                    </Animated.View>

                    {/* Kim chỉ bên phải */}
                    <View style={styles.pointerRight} pointerEvents="none">
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
                      <TouchableOpacity
                        style={styles.cellRemoveBtn}
                        onPress={() => handleRemoveLiveResult(wheel.wheelId, wheel.winningOption?.optionLabel)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Trash2 size={11} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* ============================================================== */}
          {/* MỤC NGƯỜI THAM GIA (GIỐNG CUỘC GỌI) VÀ BẢNG KẾT QUẢ BÊN PHẢI/DƯỚI*/}
          {/* ============================================================== */}
          <View style={[styles.bottomInfoSection, { borderTopColor: colors.hairline }]}>
            {/* Hàng người tham gia */}
            <View style={styles.participantsSection}>
              <View style={styles.participantsHeader}>
                <View style={styles.participantsTitleRow}>
                  <Users size={12} color={colors.primary} />
                  <Text style={[styles.participantsTitle, { color: colors.text }]}>
                    {locale === 'vi' ? 'Người tham gia' : 'Participants'} ({participants.length})
                  </Text>
                </View>
                <View style={styles.liveDotRow}>
                  <View style={styles.greenDot} />
                  <Text style={styles.liveDotText}>{locale === 'vi' ? 'Trực tiếp' : 'Live'}</Text>
                </View>
              </View>

              {/* Danh sách avatar người tham gia */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarRow}>
                {participants.map((p) => (
                  <View key={p.userId} style={styles.participantChip}>
                    {p.avatarUrl ? (
                      <Image source={{ uri: p.avatarUrl }} style={styles.participantAvatar} />
                    ) : (
                      <View style={[styles.participantAvatarFallback, { backgroundColor: `${colors.primary}25` }]}>
                        <Text style={[styles.participantAvatarFallbackText, { color: colors.primary }]}>
                          {p.displayName?.charAt(0) || 'U'}
                        </Text>
                      </View>
                    )}
                    <Text style={[styles.participantName, { color: colors.text }]} numberOfLines={1}>
                      {p.displayName}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Bảng kết quả */}
            <View style={styles.resultContainer}>
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

                  {/* Nút Loại bỏ kết quả vừa quay */}
                  <TouchableOpacity
                    style={styles.removeResultBtn}
                    onPress={() => handleRemoveLiveResult(undefined, undefined, true)}
                    activeOpacity={0.8}
                  >
                    <Trash2 size={12} color="#EF4444" />
                    <Text style={styles.removeResultBtnText}>{t.luckyWheel.removeResult}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={[styles.idleHintText, { color: colors.subtle }]}>
                  {locale === 'vi'
                    ? 'Bấm "Quay tất cả" để bắt đầu quay cùng nhau!'
                    : 'Press "Spin All" to spin together!'}
                </Text>
              )}
            </View>
          </View>

          {/* ============================================================== */}
          {/* NÚT QUAY (AI ẤN CŨNG ĐƯỢC) + NÚT QUAY LẠI CHAT                */}
          {/* ============================================================== */}
          <View style={[styles.actionRow, { borderTopColor: colors.hairline }]}>
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isSpinning || isSubmittingSpin}
              onPress={handleSpinClick}
              style={[
                styles.spinBtn,
                { backgroundColor: colors.primary },
                (isSpinning || isSubmittingSpin) && { opacity: 0.5 },
              ]}
            >
              {isSpinning || isSubmittingSpin ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
              )}
              <Text style={styles.spinBtnText}>
                {isSpinning || isSubmittingSpin
                  ? t.luckyWheel.spinning
                  : isFinished
                  ? t.luckyWheel.spinAgain
                  : t.luckyWheel.spinAll}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleClose}
              style={[
                styles.backBtn,
                { backgroundColor: isDark ? colors.surface : '#F1F5F9' },
              ]}
            >
              <Text style={[styles.backBtnText, { color: colors.text }]}>
                {t.luckyWheel.backToChat}
              </Text>
              <ArrowRight size={14} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    paddingBottom: 10,
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
    fontSize: 15,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
    borderRadius: 16,
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
  bottomInfoSection: {
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 6,
  },
  participantsSection: {
    gap: 4,
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
  resultContainer: {
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
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
  idleHintText: {
    fontSize: 10.5,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  spinBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  spinBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  backBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cellWinnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 3,
    maxWidth: '100%',
  },
  cellRemoveBtn: {
    padding: 3,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
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
  loadingBox: {
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: 220,
    borderWidth: 1,
  },
});
