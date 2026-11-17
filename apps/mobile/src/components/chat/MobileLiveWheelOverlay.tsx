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
  Radio,
  User,
  Play,
} from 'lucide-react-native';
import { LiveWheelSession, LiveWheelItem } from '@circle/types';
import {
  getActiveLiveWheelApi,
  liveSpinWheelApi,
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
    return Math.min(Math.floor((width - 68) / 2), 125);
  }, [width]);

  // 1. Kiểm tra session đang hoạt động khi mount
  useEffect(() => {
    if (!circleId) return;
    getActiveLiveWheelApi(circleId)
      .then((active) => {
        if (active && active.id !== dismissedSessionId) {
          const elapsed = Date.now() - active.startedAt;
          if (elapsed < 60000) {
            setSession(active);
            setIsVisible(true);
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

  // 2. Lắng nghe WebSocket cả stage-created và started
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

      socket.on('circle:live-wheel:stage-created', handleStageCreated);
      socket.on('circle:live-wheel:started', handleLiveWheelStarted);

      cleanupSocket = () => {
        socket.off('circle:live-wheel:stage-created', handleStageCreated);
        socket.off('circle:live-wheel:started', handleLiveWheelStarted);
      };
    });

    return () => {
      cleanupSocket?.();
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

  const handleClose = () => {
    if (session) {
      setDismissedSessionId(session.id);
    }
    setIsVisible(false);
  };

  if (!isVisible || !session) return null;

  const isSpinning = !isFinished && session.stageStatus === 'spinning';
  const spunByName = session.spunBy?.displayName || (locale === 'vi' ? 'Thành viên' : 'Member');

  return (
    <Modal visible={isVisible} animationType="fade" transparent onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.cardContainer,
            {
              backgroundColor: isDark ? colors.elevated : '#FFFFFF',
              borderColor: colors.hairline,
              maxHeight: '92%',
            },
          ]}
        >
          {/* Top Bar: LIVE Badge + Title + Close Button */}
          <View style={[styles.topBar, { borderBottomColor: colors.hairline }]}>
            <View style={styles.badgeLive}>
              <View style={styles.redDot} />
              <Radio size={13} color="#E11D48" />
              <Text style={styles.badgeLiveText}>
                {isSpinning ? 'SPINNING LIVE' : isFinished ? 'LIVE RESULT' : 'LIVE STAGE'}
              </Text>
            </View>

            <View style={styles.userBadge}>
              <User size={12} color={colors.primary} />
              <Text style={[styles.userBadgeText, { color: colors.text }]} numberOfLines={1}>
                {spunByName}
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <X size={20} color={colors.subtle} />
            </TouchableOpacity>
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={[styles.wheelTitle, { color: colors.text }]} numberOfLines={1}>
              {session.wheelTitle || 'Vòng quay may mắn (4 vòng)'}
            </Text>
            <Text style={[styles.statusSubtitle, { color: colors.subtle }]}>
              {isSpinning
                ? `${t.luckyWheel.spunBy.replace('{name}', spunByName)} - Đang quay...`
                : isFinished
                ? 'Đã quay xong! Ai cũng có thể bấm quay tiếp!'
                : 'Sân khấu trực tiếp! Ai cũng có thể bấm quay!'}
            </Text>
          </View>

          {/* SÂN KHẤU 4 CÁI VÒNG XOAY: 2 HÀNG X 2 CỘT */}
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
                  <Text
                    style={[
                      styles.wheelCellTitle,
                      {
                        color: colors.text,
                        backgroundColor: isDark ? colors.surface : '#F1F5F9',
                        borderColor: colors.hairline,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {wheel.wheelTitle || `Vòng ${idx + 1}`}
                  </Text>

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
                          r={13}
                          fill="#FFFFFF"
                          stroke="#E2E8F0"
                          strokeWidth={1.5}
                        />
                        <Circle
                          cx={discSize / 2}
                          cy={discSize / 2}
                          r={5}
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
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* HỘP KẾT QUẢ ĐỒNG BỘ CẢ 4 VÒNG */}
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
                  <Trophy size={14} color="#D97706" />
                  <Sparkles size={13} color="#D97706" />
                  <Text style={styles.winnerTitle}>{t.luckyWheel.winnerAnnounce}</Text>
                </View>
                <Text style={styles.winnerText} numberOfLines={2}>
                  {session.winningOption.optionLabel}
                </Text>
              </View>
            ) : (
              <Text style={[styles.idleHintText, { color: colors.subtle }]}>
                {locale === 'vi'
                  ? 'Bấm nút "Quay" bên dưới để quay trực tiếp cho cả nhóm!'
                  : 'Press "Spin" below to start live spinning for the group!'}
              </Text>
            )}
          </View>

          {/* NÚT QUAY (AI ẤN CŨNG ĐƯỢC) + NÚT QUAY LẠI CHAT */}
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 28,
    borderWidth: 1,
    padding: 16,
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
  badgeLive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.25)',
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E11D48',
  },
  badgeLiveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E11D48',
    letterSpacing: 0.5,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 120,
  },
  userBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
    borderRadius: 16,
  },
  titleSection: {
    alignItems: 'center',
    marginVertical: 8,
  },
  wheelTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  statusSubtitle: {
    fontSize: 10.5,
    marginTop: 2,
    textAlign: 'center',
  },
  wheelsScroll: {
    maxHeight: 290,
    marginVertical: 4,
  },
  wheelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 10,
    paddingVertical: 4,
  },
  wheelCell: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  wheelCellTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 130,
    textAlign: 'center',
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
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    maxWidth: 130,
    textAlign: 'center',
  },
  resultContainer: {
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 6,
  },
  spinningAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  spinningAlertText: {
    fontSize: 12,
    fontWeight: '700',
  },
  winnerCard: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    alignItems: 'center',
  },
  winnerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  winnerTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  winnerText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#B45309',
    textAlign: 'center',
  },
  idleHintText: {
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  spinBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  spinBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12.5,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  backBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
});
