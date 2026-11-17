import React, { useState, useEffect, useRef, useMemo } from 'react';
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
} from 'lucide-react-native';
import { LiveWheelSession } from '@circle/types';
import { getActiveLiveWheelApi } from '../../services/circle-tools.service';
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

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const currentRotationRef = useRef<number>(0);

  // Kích thước đĩa quay phù hợp với màn hình mobile
  const discSize = Math.min(width - 64, 300);

  // 1. Kiểm tra session đang hoạt động khi mount
  useEffect(() => {
    if (!circleId) return;
    getActiveLiveWheelApi(circleId)
      .then((active) => {
        if (active && active.id !== dismissedSessionId) {
          const elapsed = Date.now() - active.startedAt;
          if (elapsed < 30000) {
            setSession(active);
            setIsVisible(true);
          }
        }
      })
      .catch(() => {});
  }, [circleId, dismissedSessionId]);

  // 2. Lắng nghe WebSocket
  useEffect(() => {
    if (!circleId) return;
    let cleanupSocket: (() => void) | undefined;

    getSocket().then((socket) => {
      if (!socket) return;

      const handleLiveWheelStarted = (incoming: LiveWheelSession) => {
        if (incoming.circleId === circleId) {
          setDismissedSessionId(null);
          setSession(incoming);
          setIsVisible(true);
          setIsFinished(false);
        }
      };

      socket.on('circle:live-wheel:started', handleLiveWheelStarted);

      cleanupSocket = () => {
        socket.off('circle:live-wheel:started', handleLiveWheelStarted);
      };
    });

    return () => {
      cleanupSocket?.();
    };
  }, [circleId]);

  // 3. Tính toán và chạy Animation đồng bộ
  const totalOptions = session?.options?.length || 0;
  const sliceDeg = useMemo(() => (totalOptions > 0 ? 360 / totalOptions : 360), [totalOptions]);

  useEffect(() => {
    if (!isVisible || !session || totalOptions === 0) return;

    const duration = session.durationMs || 6000;
    const startedAt = session.startedAt;
    const elapsed = Date.now() - startedAt;

    const targetCenterDeg = session.winningIndex * sliceDeg + sliceDeg / 2;
    const stopAngle = (360 - (targetCenterDeg % 360)) % 360;
    const extraSpins = 6 * 360;
    const finalRot = extraSpins + stopAngle;

    if (elapsed >= duration) {
      // Đã quay xong trước khi người dùng vào xem
      rotateAnim.setValue(finalRot);
      currentRotationRef.current = finalRot;
      setIsFinished(true);
      return;
    }

    const remaining = duration - elapsed;
    const initialProgress = Math.max(elapsed / duration, 0);
    const easeOutInitial = 1 - Math.pow(1 - initialProgress, 4);
    const startRot = finalRot * easeOutInitial;

    rotateAnim.setValue(startRot);
    setIsFinished(false);

    Animated.timing(rotateAnim, {
      toValue: finalRot,
      duration: remaining,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      currentRotationRef.current = finalRot;
      setIsFinished(true);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    });
  }, [isVisible, session, totalOptions, sliceDeg, rotateAnim]);

  // 4. Render SVG Slices cho đĩa quay
  const renderWheelSvg = () => {
    if (!session || totalOptions === 0) return null;

    const radius = discSize / 2;
    const centerX = discSize / 2;
    const centerY = discSize / 2;
    const arcAngle = (2 * Math.PI) / totalOptions;

    return session.options.map((opt, idx) => {
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
      if (label.length > 12) {
        label = label.substring(0, 11) + '…';
      }

      return (
        <G key={`slice-${idx}`}>
          <Path d={pathD} fill={color} />
          <SvgText
            x={tx}
            y={ty}
            fill="#1E293B"
            fontSize={discSize > 250 ? 11 : 9.5}
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

  const handleClose = () => {
    if (session) {
      setDismissedSessionId(session.id);
    }
    setIsVisible(false);
  };

  if (!isVisible || !session) return null;

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

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
            },
          ]}
        >
          {/* Top Bar */}
          <View style={styles.topBar}>
            <View style={styles.badgeLive}>
              <View style={styles.redDot} />
              <Radio size={13} color="#E11D48" />
              <Text style={styles.badgeLiveText}>
                {isFinished ? 'LIVE RESULT' : 'LIVE'}
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <X size={20} color={colors.subtle} />
            </TouchableOpacity>
          </View>

          {/* Wheel Title & Spun By */}
          <View style={styles.titleSection}>
            <Text style={[styles.wheelTitle, { color: colors.text }]} numberOfLines={2}>
              {session.wheelTitle || t.luckyWheel.liveWheelTitle}
            </Text>
            <View style={styles.spunByRow}>
              <User size={13} color={colors.primary} />
              <Text style={[styles.spunByText, { color: colors.subtle }]}>
                {t.luckyWheel.spunBy.replace('{name}', spunByName)}
              </Text>
            </View>
          </View>

          {/* Wheel Disc with Pointer */}
          <View style={[styles.discContainer, { width: discSize, height: discSize }]}>
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
                {renderWheelSvg()}
                {/* Center Hub */}
                <Circle
                  cx={discSize / 2}
                  cy={discSize / 2}
                  r={20}
                  fill="#FFFFFF"
                  stroke="#E2E8F0"
                  strokeWidth={2}
                />
                <Circle cx={discSize / 2} cy={discSize / 2} r={8} fill={colors.primary} />
              </Svg>
            </Animated.View>

            {/* Pointer on the RIGHT OUTSIDE */}
            <View style={styles.pointerRight} pointerEvents="none">
              <Svg width={32} height={22} viewBox="0 0 30 20">
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

          {/* Status or Winner Box */}
          <View style={styles.statusBoxContainer}>
            {!isFinished ? (
              <View style={[styles.spinningBox, { backgroundColor: `${colors.primary}15` }]}>
                <Compass size={16} color={colors.primary} />
                <Text style={[styles.spinningText, { color: colors.primary }]}>
                  {t.luckyWheel.spinningLive}
                </Text>
              </View>
            ) : (
              <View style={styles.winnerCard}>
                <View style={styles.winnerHeader}>
                  <Trophy size={16} color="#D97706" />
                  <Sparkles size={14} color="#D97706" />
                  <Text style={styles.winnerHeaderText}>{t.luckyWheel.winnerAnnounce}</Text>
                </View>
                <Text style={styles.winnerText} numberOfLines={2}>
                  {session.winningOption?.optionLabel}
                </Text>
              </View>
            )}
          </View>

          {/* Back to Chat Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleClose}
            style={[styles.backToChatBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.backToChatBtnText}>{t.luckyWheel.backToChat}</Text>
            <ArrowRight size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgeLive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.3)',
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E11D48',
  },
  badgeLiveText: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#E11D48',
    letterSpacing: 0.8,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  wheelTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  spunByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  spunByText: {
    fontSize: 12,
    fontWeight: '500',
  },
  discContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  wheelRotateBox: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  pointerRight: {
    position: 'absolute',
    right: -14,
    top: '50%',
    marginTop: -10,
    zIndex: 20,
  },
  statusBoxContainer: {
    width: '100%',
    minHeight: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  spinningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  spinningText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  winnerCard: {
    width: '100%',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  winnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  winnerHeaderText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#B45309',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  winnerText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#D97706',
    textAlign: 'center',
  },
  backToChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 46,
    borderRadius: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  backToChatBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: 'bold',
  },
});
