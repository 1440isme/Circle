import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Image as RNImage,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  Share as RNShare,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
  Easing,
  PanResponder,
  KeyboardAvoidingView,
  Vibration,
  Keyboard,
  GestureResponderEvent,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { VideoView, useVideoPlayer } from 'expo-video';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const SHUTTER_SIZE = 92;
const PROGRESS_STROKE_WIDTH = 5;
const PROGRESS_RADIUS = (SHUTTER_SIZE - PROGRESS_STROKE_WIDTH) / 2;
const PROGRESS_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS;

import {
  Camera,
  Video as VideoIcon,
  RefreshCw,
  Zap,
  ZapOff,
  Home,
  Send,
  Heart,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  History,
  RotateCcw,
  MessageCircle,
  Share2,
  Download,
  Copy,
  Users,
  Filter,
  Check,
  Layers,
  Maximize2,
  Minimize2,
} from 'lucide-react-native';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';
import { useAuthStore } from '../../stores/auth.store';
import {
  useCircleMomentsQuery,
  useCircleMembersQuery,
  useReactMomentMutation,
  useCreateMomentMutation,
  useReplyMomentMutation,
} from '../../hooks/use-circle-queries';
import { uploadMobileMedia } from '../../services/storage-upload.service';
import { resolveMobileMediaUrl } from '../../services/api';
import { Emoji } from '../ui/Emoji';


const { width: SCREEN_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  (Constants as any).appOwnership === 'expo';

// Safe dynamic resolution for native MultiCam module (only active on Development Build)
let DualCameraFrontView: any = null;
let DualCameraBackView: any = null;
let takeDualPictureAsync: any = null;

if (!isExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const dualCam = require('expo-dual-camera');
    DualCameraFrontView = dualCam?.DualCameraFrontView;
    DualCameraBackView = dualCam?.DualCameraBackView;
    takeDualPictureAsync = dualCam?.takePictureAsync;
  } catch {
    // Native module 'ExpoDualCamera' not present in this client
  }
}

const hasNativeDualCam = !isExpoGo && Boolean(DualCameraFrontView) && Boolean(DualCameraBackView);

export function parseMomentPhotos(rawUrl?: string | null): { mainUrl: string; pipUrl: string | null; cornerIndex: number } {
  if (!rawUrl) return { mainUrl: '', pipUrl: null, cornerIndex: 0 };
  if (rawUrl.includes('#pip=')) {
    const parts = rawUrl.split('#pip=');
    const main = resolveMobileMediaUrl(parts[0] || '');
    const pipPart = decodeURIComponent(parts[1] || '');
    let pip = pipPart;
    let cornerIndex = 0;
    if (pipPart.includes('#corner=')) {
      const pipSplit = pipPart.split('#corner=');
      pip = pipSplit[0] || '';
      cornerIndex = parseInt(pipSplit[1] || '0', 10) || 0;
    }
    return {
      mainUrl: main,
      pipUrl: resolveMobileMediaUrl(pip) || null,
      cornerIndex,
    };
  }
  return { mainUrl: resolveMobileMediaUrl(rawUrl), pipUrl: null, cornerIndex: 0 };
}

export function formatMomentRelativeTime(dateInput?: string | Date | null, locale: string = 'vi'): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  // Vừa xong / just now
  if (diffSec < 60 && diffSec >= -10) {
    return locale === 'vi' ? 'vừa xong' : 'just now';
  }

  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  // Cùng ngày hôm nay: ví dụ "29 p trước" hoặc "2 giờ trước"
  const isSameDay = date.toDateString() === now.toDateString();

  if (isSameDay) {
    if (diffMin < 60) {
      return locale === 'vi' ? `${Math.max(1, diffMin)} p trước` : `${Math.max(1, diffMin)}m ago`;
    }
    return locale === 'vi' ? `${diffHour} giờ trước` : `${diffHour}h ago`;
  }

  // Khác ngày hôm nay (1, 2 ngày sau hoặc trước đó): hiển thị ngày cụ thể "15 tháng 10"
  const isSameYear = date.getFullYear() === now.getFullYear();
  if (locale === 'vi') {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    if (isSameYear) {
      return `${day} tháng ${month}`;
    }
    return `${day} thg ${month}, ${date.getFullYear()}`;
  }

  if (isSameYear) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface MomentVideoPlayerProps {
  uri: string;
  isMuted?: boolean;
  style?: any;
}

const MomentVideoPlayer: React.FC<MomentVideoPlayerProps> = ({ uri, isMuted = true, style }) => {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = isMuted;
    p.play();
  });

  useEffect(() => {
    player.muted = isMuted;
  }, [player, isMuted]);

  return (
    <VideoView
      player={player}
      style={style}
      contentFit="cover"
      nativeControls={false}
    />
  );
};

export interface MomentFeedPipViewProps {
  pipUrl: string;
  initialCornerIndex: number;
  momentSize: number;
  primaryColor: string;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onSwap: () => void;
  onCornerChange?: (newCornerIndex: number) => void;
}

export const MomentFeedPipView: React.FC<MomentFeedPipViewProps> = ({
  pipUrl,
  initialCornerIndex,
  momentSize,
  primaryColor,
  onDragStart,
  onDragEnd,
  onSwap,
  onCornerChange,
}) => {
  const PIP_SIZE = 92;
  const margin = 14;

  const [actualSize, setActualSize] = useState(momentSize);
  const actualSizeRef = useRef(momentSize);
  actualSizeRef.current = actualSize;

  const getCornerCoords = (idx: number, size = actualSizeRef.current) => {
    const maxOffset = Math.max(size - PIP_SIZE - margin, margin);
    switch (idx % 4) {
      case 0:
        return { x: margin, y: margin }; // Top-Left
      case 1:
        return { x: maxOffset, y: margin }; // Top-Right
      case 2:
        return { x: maxOffset, y: maxOffset }; // Bottom-Right
      case 3:
        return { x: margin, y: maxOffset }; // Bottom-Left
      default:
        return { x: margin, y: margin };
    }
  };

  const currentCornerRef = useRef(initialCornerIndex % 4);
  const startCoords = getCornerCoords(initialCornerIndex, momentSize);
  const pan = useRef(new Animated.ValueXY(startCoords)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const lastCoordRef = useRef(startCoords);
  const dragOriginRef = useRef({ x: 0, y: 0 });
  const isPickedUpRef = useRef(false);

  useEffect(() => {
    if (momentSize > 0 && Math.abs(momentSize - actualSizeRef.current) > 1) {
      setActualSize(momentSize);
      actualSizeRef.current = momentSize;
      const target = getCornerCoords(currentCornerRef.current, momentSize);
      lastCoordRef.current = target;
      pan.setValue(target);
    }
  }, [momentSize]);

  const animateToCorner = (targetIdx: number) => {
    const target = getCornerCoords(targetIdx, actualSizeRef.current);
    currentCornerRef.current = targetIdx;
    lastCoordRef.current = target;
    onCornerChange?.(targetIdx);
    Animated.parallel([
      Animated.spring(pan, {
        toValue: target,
        useNativeDriver: false,
        friction: 9,
        tension: 50,
        velocity: 0,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: false,
        friction: 7,
      }),
    ]).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        onDragStart?.();
        isPickedUpRef.current = false;
        dragOriginRef.current = { x: 0, y: 0 };
      },
      onPanResponderMove: (_, gestureState) => {
        const maxOffset = Math.max(actualSizeRef.current - PIP_SIZE - margin, margin);
        if (!isPickedUpRef.current && (Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3)) {
          isPickedUpRef.current = true;
          dragOriginRef.current = { x: gestureState.dx, y: gestureState.dy };
          try { Vibration.vibrate(20); } catch {}
          Animated.spring(scale, {
            toValue: 1.06,
            useNativeDriver: false,
            friction: 6,
          }).start();
        }
        if (isPickedUpRef.current) {
          const deltaX = gestureState.dx - dragOriginRef.current.x;
          const deltaY = gestureState.dy - dragOriginRef.current.y;
          const newX = Math.max(margin, Math.min(lastCoordRef.current.x + deltaX, maxOffset));
          const newY = Math.max(margin, Math.min(lastCoordRef.current.y + deltaY, maxOffset));
          pan.setValue({ x: newX, y: newY });
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        onDragEnd?.();
        const maxOffset = Math.max(actualSizeRef.current - PIP_SIZE - margin, margin);
        const movedDistance = Math.hypot(gestureState.dx, gestureState.dy);
        if (!isPickedUpRef.current || movedDistance < 8) {
          // Tap -> swap
          isPickedUpRef.current = false;
          try { Vibration.vibrate(15); } catch {}
          onSwap();
          return;
        }

        // Snap to closest corner
        isPickedUpRef.current = false;
        const deltaX = gestureState.dx - dragOriginRef.current.x;
        const deltaY = gestureState.dy - dragOriginRef.current.y;
        const currentX = Math.max(margin, Math.min(lastCoordRef.current.x + deltaX, maxOffset));
        const currentY = Math.max(margin, Math.min(lastCoordRef.current.y + deltaY, maxOffset));

        const corners = [
          { idx: 0, x: margin, y: margin },
          { idx: 1, x: maxOffset, y: margin },
          { idx: 2, x: maxOffset, y: maxOffset },
          { idx: 3, x: margin, y: maxOffset },
        ];

        let closestCorner = 0;
        let minDistance = Infinity;
        corners.forEach((c) => {
          const d = Math.hypot(currentX - c.x, currentY - c.y);
          if (d < minDistance) {
            minDistance = d;
            closestCorner = c.idx;
          }
        });

        const mid = (margin + maxOffset) / 2;
        if (gestureState.vx > 0.4) {
          closestCorner = currentY > mid ? 2 : 1;
        } else if (gestureState.vx < -0.4) {
          closestCorner = currentY > mid ? 3 : 0;
        } else if (gestureState.vy > 0.4) {
          closestCorner = currentX > mid ? 2 : 3;
        } else if (gestureState.vy < -0.4) {
          closestCorner = currentX > mid ? 1 : 0;
        }

        try { Vibration.vibrate(18); } catch {}
        animateToCorner(closestCorner);
      },
      onPanResponderTerminate: () => {
        onDragEnd?.();
        isPickedUpRef.current = false;
        animateToCorner(currentCornerRef.current);
      },
    })
  ).current;

  return (
    <View
      style={[StyleSheet.absoluteFill, { zIndex: 10 }]}
      pointerEvents="box-none"
      onLayout={(e) => {
        const { width } = e.nativeEvent.layout;
        if (width > 0 && Math.abs(width - actualSizeRef.current) > 2) {
          setActualSize(width);
          actualSizeRef.current = width;
          const target = getCornerCoords(currentCornerRef.current, width);
          lastCoordRef.current = target;
          pan.setValue(target);
        }
      }}
    >
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.pipFloatingBox,
          {
            zIndex: 10,
            elevation: 6,
            borderColor: primaryColor,
            transform: [
              ...pan.getTranslateTransform(),
              { scale },
            ],
          },
        ]}
      >
        <RNImage source={{ uri: pipUrl }} style={styles.pipFloatingImage} resizeMode="cover" />
        <View style={[styles.pipSwapOverlay, { backgroundColor: 'rgba(0,0,0,0.65)' }]} pointerEvents="none">
          <RefreshCw size={9} color="#FFFFFF" />
          <Text style={styles.pipBadgeText}>Chạm đổi</Text>
        </View>
      </Animated.View>
    </View>
  );
};

interface MomentsViewProps {
  circleId: string;
  circleName: string;
  isActive?: boolean;
}

type FeedItem =
  | { type: 'camera'; id: string }
  | { type: 'empty'; id: string }
  | { type: 'moment'; id: string; data: any; index: number };

export function MomentsView({ circleId, circleName, isActive = true }: MomentsViewProps) {
  const { colors, resolvedTheme, uiStyle } = useThemeStore();
  const { t, locale } = useLanguageStore();
  const user = useAuthStore((s) => s.user);
  const isDark = resolvedTheme === 'dark';
  const isGlass = uiStyle === 'glass';

  const flatListRef = useRef<FlatList<FeedItem>>(null);
  const cameraRef = useRef<CameraView>(null);
  const stableContainerHeightRef = useRef<number>(WINDOW_HEIGHT - 170);
  const [containerHeight, setContainerHeight] = useState<number>(WINDOW_HEIGHT - 170);
  const isKeyboardOpenRef = useRef<boolean>(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState<boolean>(false);
  const keyboardShiftAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      isKeyboardOpenRef.current = true;
      setIsKeyboardVisible(true);
      // Nâng nhẹ ảnh và khung chụp lên trên khi bàn phím mở để không bị che khuất ô nhập tin nhắn
      Animated.timing(keyboardShiftAnim, {
        toValue: -90,
        duration: e?.duration || 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      isKeyboardOpenRef.current = false;
      setIsKeyboardVisible(false);
      // Trả ảnh và khung chụp về vị trí ban đầu
      Animated.timing(keyboardShiftAnim, {
        toValue: 0,
        duration: e?.duration || 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardShiftAnim]);

  // Real Camera & Mic Permissions from expo-camera
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  // Video recording & mode states
  const [captureMode, setCaptureMode] = useState<'picture' | 'video'>('picture');
  const [isRecordingVideo, setIsRecordingVideo] = useState<boolean>(false);
  const recordingProgressAnim = useRef(new Animated.Value(0)).current;
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRecordingRef = useRef<boolean>(false);
  const pressStartTimeRef = useRef<number>(0);
  const longPressTriggeredRef = useRef<boolean>(false);
  const [capturedMediaType, setCapturedMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');

  const progressStrokeOffset = recordingProgressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [PROGRESS_CIRCUMFERENCE, 0],
  });

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
      }
    };
  }, []);

  // Queries & Mutations
  const { data: moments = [], isLoading: isLoadingMoments } = useCircleMomentsQuery(circleId);
  const { data: members = [] } = useCircleMembersQuery(circleId);
  const createMomentMutation = useCreateMomentMutation(circleId);
  const reactMomentMutation = useReactMomentMutation(circleId);
  const replyMomentMutation = useReplyMomentMutation(circleId);

  // Member Filter State (Trang 1..N: Lọc theo mọi người hoặc từng thành viên dạng sổ tại chỗ)
  const [selectedMemberId, setSelectedMemberId] = useState<string | 'all'>('all');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState<boolean>(false);

  // Reactors List Modal (Author only)
  const [selectedMomentForReactors, setSelectedMomentForReactors] = useState<any | null>(null);
  const [reactorEmojiFilter, setReactorEmojiFilter] = useState<string>('ALL');

  // Real Camera Viewfinder States (Moment UI & Dual View)
  const [cameraFacing, setCameraFacing] = useState<CameraType>('front');
  const [flashMode, setFlashMode] = useState<boolean>(false);
  const [isDualMode, setIsDualMode] = useState<boolean>(false);
  // Zoom camera:
  // Cam trước: Dưới 1x (< 0.04) là góc rộng toàn cảm biến (dạng khung icon), 0.06 tương ứng chuẩn 1.0x (đỡ gần, tự nhiên), phóng đại lên tới 5x (0.85)
  // Cam sau: 0.00 tương ứng 0.5x (siêu rộng), 0.12 tương ứng 1.0x, 0.95 tương ứng 5.0x
  const [cameraZoom, setCameraZoom] = useState<number>(0.06); // Mặc định ở 1x (0.06) cho cam trước
  const [isPinchingCamera, setIsPinchingCamera] = useState<boolean>(false);
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(0.0);
  const [availableLenses, setAvailableLenses] = useState<string[]>([]);

  // Hiển thị giá trị tiêu cự thực tế góc trên bên phải chạy theo độ zoom của cam:
  // - Cam trước: dưới 1x là dạng khung icon (góc rộng hơn), từ 1x trở lên ghi số bình thường (1x, 1.5x, 2x...)
  // - Cam sau: ghi số bình thường (0.5x, 1x, 2x...)
  const displayZoomText = (() => {
    if (cameraFacing === 'front') {
      // Dưới 1x (< 0.04): là góc rộng hơn (hiển thị biểu tượng khung)
      if (cameraZoom < 0.04) return '';
      // Từ 1x trở lên:
      const factor = 1.0 + ((cameraZoom - 0.06) / (0.85 - 0.06)) * 4.0;
      if (Math.abs(factor - 1.0) < 0.08) return '1x';
      if (Math.abs(factor - 2.0) < 0.08) return '2x';
      return `${factor.toFixed(1)}x`;
    }

    // Cam sau: 0.00 tương ứng 0.5x (siêu rộng), 0.12 tương ứng 1.0x, 0.95 tương ứng 5.0x
    if (cameraZoom <= 0.02) return '0.5x';
    let factor = 1.0;
    if (cameraZoom < 0.12) {
      factor = 0.5 + (cameraZoom / 0.12) * 0.5;
    } else {
      factor = 1.0 + ((cameraZoom - 0.12) / (0.95 - 0.12)) * 4.0;
    }
    if (Math.abs(factor - 0.5) < 0.05) return '0.5x';
    if (Math.abs(factor - 1.0) < 0.06) return '1x';
    return `${factor.toFixed(1)}x`;
  })();

  // PanResponder bắt cử chỉ 2 ngón tay (Pinch to zoom) trên toàn bộ khung ngắm camera
  // Khử rung sai số (deadband/smoothing) và giới hạn độ zoom tối đa an toàn [0, 0.90]
  const cameraPinchPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => evt.nativeEvent.touches.length === 2,
      onMoveShouldSetPanResponder: (evt) => evt.nativeEvent.touches.length === 2,
      onPanResponderTerminationRequest: () => true,
      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2) {
          setIsPinchingCamera(true);
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          pinchStartDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
          pinchStartZoomRef.current = cameraZoom;
        }
      },
      onPanResponderMove: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2 && pinchStartDistanceRef.current && pinchStartDistanceRef.current > 0) {
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const currentDistance = Math.sqrt(dx * dx + dy * dy);
          const ratio = currentDistance / pinchStartDistanceRef.current;
          // Khử rung sai số nhỏ dưới 2% để chuyển động êm ái
          if (Math.abs(ratio - 1) < 0.02) return;
          const delta = (ratio - 1) * 0.32;
          // Giới hạn độ zoom tối đa an toàn [0, 0.90] giúp phóng to thu nhỏ mượt mà
          const nextZoom = Math.max(0, Math.min(pinchStartZoomRef.current + delta, 0.90));
          setCameraZoom(nextZoom);
        }
      },
      onPanResponderRelease: () => {
        pinchStartDistanceRef.current = null;
        setIsPinchingCamera(false);
      },
      onPanResponderTerminate: () => {
        pinchStartDistanceRef.current = null;
        setIsPinchingCamera(false);
      },
    })
  ).current;

  // Layout calculations: Fixed top header (36px, synchronized with Chat Layer 2)
  const topHeaderHeight = 36;
  const listHeight = Math.max(containerHeight - topHeaderHeight, 300);

  // Bố cục khung ảnh to tràn viền sát lề (chỉ chừa 6px mỗi mép)
  const momentCardWidth = SCREEN_WIDTH - 12;
  const momentFrameSize = Math.min(
    momentCardWidth,
    listHeight > 0 ? listHeight - 195 : 380
  );

  // Dual Camera PIP position state (4 corners: top-left -> top-right -> bottom-right -> bottom-left)
  const PIP_SIZE = 92;
  const [pipCornerIndex, setPipCornerIndex] = useState<number>(0);
  const pipCornerIndexRef = useRef<number>(0);
  const pipPan = useRef(new Animated.ValueXY({ x: 14, y: 14 })).current;
  const pipScale = useRef(new Animated.Value(1)).current;
  const currentPipCoordRef = useRef({ x: 14, y: 14 });
  const isPipPickedUpRef = useRef<boolean>(false);
  const pipLongPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Captured Photo State for review & sending (Declared early so refs can track them)
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [dualPipPhotoUrl, setDualPipPhotoUrl] = useState<string | null>(null);
  const capturedPhotoUrlRef = useRef<string | null>(null);
  const dualPipPhotoUrlRef = useRef<string | null>(null);
  capturedPhotoUrlRef.current = capturedPhotoUrl;
  dualPipPhotoUrlRef.current = dualPipPhotoUrl;

  // Track camera facing in ref to avoid stale closure
  const cameraFacingRef = useRef<CameraType>(cameraFacing);
  cameraFacingRef.current = cameraFacing;

  // Tính toán 4 góc trong phạm vi khung ảnh momentFrameSize
  const getPipCornerCoords = (cornerIdx: number) => {
    const margin = 14;
    const maxOffset = Math.max(momentFrameSize - PIP_SIZE - margin, margin);
    switch (cornerIdx % 4) {
      case 0:
        return { x: margin, y: margin }; // Góc trên - trái
      case 1:
        return { x: maxOffset, y: margin }; // Góc trên - phải
      case 2:
        return { x: maxOffset, y: maxOffset }; // Góc dưới - phải
      case 3:
        return { x: margin, y: maxOffset }; // Góc dưới - trái
      default:
        return { x: margin, y: margin };
    }
  };

  const animatePipToCorner = (targetIdx: number) => {
    const target = getPipCornerCoords(targetIdx);
    pipCornerIndexRef.current = targetIdx;
    setPipCornerIndex(targetIdx);
    currentPipCoordRef.current = target;
    Animated.parallel([
      Animated.spring(pipPan, {
        toValue: target,
        useNativeDriver: false,
        friction: 9,
        tension: 50,
        velocity: 0,
      }),
      Animated.spring(pipScale, {
        toValue: 1,
        useNativeDriver: false,
        friction: 7,
      }),
    ]).start();
  };

  const pipDragOriginRef = useRef({ x: 0, y: 0 });

  // PanResponder cho khung PIP (Chạm nhanh: hoán đổi trước/sau; Nhấn giữ 180ms hoặc vuốt ngón tay: nhấc lên kéo thả 4 góc)
  const pipSwipePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        (flatListRef.current as any)?.setNativeProps?.({ scrollEnabled: false });
        isPipPickedUpRef.current = false;
        pipDragOriginRef.current = { x: 0, y: 0 };
        // Lấy toạ độ xuất phát chính xác từ góc hiện tại
        const startPos = getPipCornerCoords(pipCornerIndexRef.current);
        currentPipCoordRef.current = startPos;
        pipPan.stopAnimation((value) => {
          if (value && typeof value.x === 'number' && typeof value.y === 'number') {
            currentPipCoordRef.current = value;
          }
        });

        if (pipLongPressTimerRef.current) clearTimeout(pipLongPressTimerRef.current);
        pipLongPressTimerRef.current = setTimeout(() => {
          isPipPickedUpRef.current = true;
          try { Vibration.vibrate(25); } catch {}
          Animated.spring(pipScale, {
            toValue: 1.06,
            useNativeDriver: false,
            friction: 6,
          }).start();
        }, 180);
      },
      onPanResponderMove: (_, gestureState) => {
        // Nhấc khung ảnh nổi lên êm ái khi phát hiện vuốt ngón tay
        if (!isPipPickedUpRef.current && (Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3)) {
          isPipPickedUpRef.current = true;
          pipDragOriginRef.current = { x: gestureState.dx, y: gestureState.dy };
          if (pipLongPressTimerRef.current) {
            clearTimeout(pipLongPressTimerRef.current);
            pipLongPressTimerRef.current = null;
          }
          try { Vibration.vibrate(20); } catch {}
          Animated.spring(pipScale, {
            toValue: 1.06,
            useNativeDriver: false,
            friction: 6,
          }).start();
        }

        if (isPipPickedUpRef.current) {
          const margin = 14;
          const maxOffset = Math.max(momentFrameSize - PIP_SIZE - margin, margin);
          const deltaX = gestureState.dx - pipDragOriginRef.current.x;
          const deltaY = gestureState.dy - pipDragOriginRef.current.y;
          const newX = Math.max(margin, Math.min(currentPipCoordRef.current.x + deltaX, maxOffset));
          const newY = Math.max(margin, Math.min(currentPipCoordRef.current.y + deltaY, maxOffset));
          pipPan.setValue({ x: newX, y: newY });
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        (flatListRef.current as any)?.setNativeProps?.({ scrollEnabled: true });
        if (pipLongPressTimerRef.current) {
          clearTimeout(pipLongPressTimerRef.current);
          pipLongPressTimerRef.current = null;
        }

        const movedDistance = Math.hypot(gestureState.dx, gestureState.dy);
        if (!isPipPickedUpRef.current || movedDistance < 8) {
          // Chạm nhanh: Ngay lập tức đổi camera (live) hoặc hoán đổi ảnh trước/sau (sau khi chụp)
          isPipPickedUpRef.current = false;
          try { Vibration.vibrate(15); } catch {}
          Animated.spring(pipScale, {
            toValue: 1,
            useNativeDriver: false,
            friction: 7,
          }).start();

          const curMain = capturedPhotoUrlRef.current;
          const curPip = dualPipPhotoUrlRef.current;
          if (curMain && curPip) {
            setCapturedPhotoUrl(curPip);
            setDualPipPhotoUrl(curMain);
          } else {
            setCameraFacing((prev) => (prev === 'front' ? 'back' : 'front'));
          }
          return;
        }

        // Đã kéo thả nhấc lên: Snap êm ái vào góc gần nhất trong cả 4 góc (khoảng cách Euclidean)
        isPipPickedUpRef.current = false;
        const margin = 14;
        const maxOffset = Math.max(momentFrameSize - PIP_SIZE - margin, margin);
        const deltaX = gestureState.dx - pipDragOriginRef.current.x;
        const deltaY = gestureState.dy - pipDragOriginRef.current.y;
        const currentX = Math.max(margin, Math.min(currentPipCoordRef.current.x + deltaX, maxOffset));
        const currentY = Math.max(margin, Math.min(currentPipCoordRef.current.y + deltaY, maxOffset));

        const corners = [
          { idx: 0, x: margin, y: margin },       // Top-Left
          { idx: 1, x: maxOffset, y: margin },    // Top-Right
          { idx: 2, x: maxOffset, y: maxOffset }, // Bottom-Right
          { idx: 3, x: margin, y: maxOffset },    // Bottom-Left
        ];

        let closestCorner = 0;
        let minDistance = Infinity;
        corners.forEach((c) => {
          const d = Math.hypot(currentX - c.x, currentY - c.y);
          if (d < minDistance) {
            minDistance = d;
            closestCorner = c.idx;
          }
        });

        // Nếu có lực vẩy mạnh (velocity) theo phương X hoặc Y, ưu tiên hất theo hướng đó
        const mid = (margin + maxOffset) / 2;
        if (gestureState.vx > 0.4) {
          closestCorner = currentY > mid ? 2 : 1;
        } else if (gestureState.vx < -0.4) {
          closestCorner = currentY > mid ? 3 : 0;
        } else if (gestureState.vy > 0.4) {
          closestCorner = currentX > mid ? 2 : 3;
        } else if (gestureState.vy < -0.4) {
          closestCorner = currentX > mid ? 1 : 0;
        }

        try { Vibration.vibrate(18); } catch {}
        animatePipToCorner(closestCorner);
      },
      onPanResponderTerminate: () => {
        (flatListRef.current as any)?.setNativeProps?.({ scrollEnabled: true });
        if (pipLongPressTimerRef.current) {
          clearTimeout(pipLongPressTimerRef.current);
          pipLongPressTimerRef.current = null;
        }
        isPipPickedUpRef.current = false;
        animatePipToCorner(pipCornerIndexRef.current);
      },
    })
  ).current;

  const [isTakingPhoto, setIsTakingPhoto] = useState<boolean>(false);
  const [isScreenFlashing, setIsScreenFlashing] = useState<boolean>(false);

  const [captionText, setCaptionText] = useState<string>('');
  const [replyingToAuthor, setReplyingToAuthor] = useState<string | null>(null);

  // Giới hạn cứng nội dung độ dài chữ tối đa 2 dòng (80 ký tự)
  const maxCaptionLength = replyingToAuthor
    ? Math.max(30, 80 - (replyingToAuthor.length + 11))
    : 80;

  const handleCaptionChange = (val: string) => {
    let sanitized = val;
    const lines = val.split('\n');
    if (lines.length > 2) {
      sanitized = lines.slice(0, 2).join('\n');
    }
    if (sanitized.length > maxCaptionLength) {
      sanitized = sanitized.slice(0, maxCaptionLength);
    }
    setCaptionText(sanitized);
  };
  const [swappedMoments, setSwappedMoments] = useState<Record<string, boolean>>({});
  // Lưu góc PIP người xem đã tự chỉnh cho từng khoảnh khắc (momentId -> cornerIndex)
  const [viewerPipCorners, setViewerPipCorners] = useState<Record<string, number>>({});

  // Chat Reply Inline State (thay thế popup cầu kì bằng thanh nhập trực tiếp trên ảnh)
  const [activeReplyMomentId, setActiveReplyMomentId] = useState<string | null>(null);
  const [activeReplyAuthorName, setActiveReplyAuthorName] = useState<string>('');
  const [chatReplyText, setChatReplyText] = useState<string>('');

  // Page Tracking & Action Menu State
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState<boolean>(false);



  // Lọc moments theo thành viên được chọn (hỗ trợ cả authorId và userId)
  const filteredMoments = selectedMemberId === 'all'
    ? moments
    : moments.filter(
      (m: any) =>
        m.authorId === selectedMemberId ||
        m.author?.id === selectedMemberId ||
        m.userId === selectedMemberId ||
        m.user?.id === selectedMemberId
    );

  // Tên thành viên đang được lọc
  const selectedMember: any = members.find(
    (mb: any) =>
      mb.userId === selectedMemberId ||
      mb.id === selectedMemberId ||
      mb.user?.id === selectedMemberId
  );
  const selectedFilterName =
    selectedMemberId === 'all'
      ? 'Mọi người'
      : selectedMember?.profile?.displayName || selectedMember?.user?.profile?.displayName || selectedMember?.email || 'Thành viên';

  // Ảnh gần nhất cho nút cuộn xuống Lịch sử
  const latestMomentPhoto = moments[0]?.photoUrl || moments[0]?.imageUrl || null;

  // Real Camera Shutter Action (100% Realtime, Instant & Không bị giật nhảy cam)
  const handleSnapPhoto = async () => {
    if (!isActive) return;
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert(t.common.appName, 'Cần cấp quyền Camera để chụp khoảnh khắc realtime.');
        return;
      }
    }

    try {
      setIsTakingPhoto(true);

      if (isDualMode && hasNativeDualCam) {
        // Dual Mode trên Development Build: Chụp đồng thời 2 camera thật từ expo-dual-camera
        if (flashMode && cameraFacing === 'front') {
          setIsScreenFlashing(true);
          await new Promise((r) => setTimeout(r, 350));
        }
        const dualResult = await takeDualPictureAsync({ quality: 0.78 });
        await new Promise((r) => setTimeout(r, 100));
        setIsScreenFlashing(false);
        if (dualResult?.frontUri && dualResult?.backUri) {
          const mainUrl = cameraFacing === 'back' ? dualResult.backUri : dualResult.frontUri;
          const counterpartUrl = cameraFacing === 'back' ? dualResult.frontUri : dualResult.backUri;
          setCapturedPhotoUrl(mainUrl);
          setDualPipPhotoUrl(counterpartUrl);
        } else {
          Alert.alert(t.common.appName, 'Không thể chụp ảnh chế độ Dual, vui lòng thử lại.');
        }
      } else if (isDualMode && cameraRef.current) {
        // Dual Mode (Fallback): Chụp kép 2 camera thật liên tiếp (Sequential Dual Shot)
        if (flashMode && cameraFacing === 'front') {
          setIsScreenFlashing(true);
          await new Promise((r) => setTimeout(r, 350));
        }
        // 1. Chụp bức ảnh 1 từ camera chính
        const shot1 = await cameraRef.current.takePictureAsync({
          quality: 0.78,
          exif: false,
          skipProcessing: false,
          base64: true,
        });
        await new Promise((r) => setTimeout(r, 100));
        setIsScreenFlashing(false);
        const shot1Url = shot1?.base64
          ? `data:image/jpeg;base64,${shot1.base64}`
          : shot1?.uri || null;

        if (!shot1Url) {
          throw new Error('Không thể chụp ảnh từ camera 1');
        }

        // 2. Lật sang camera đối diện để chụp bức ảnh 2
        const secondFacing: CameraType = cameraFacing === 'front' ? 'back' : 'front';
        setCameraFacing(secondFacing);

        // Đợi native camera session khởi tạo góc thứ 2
        await new Promise((resolve) => setTimeout(resolve, 450));

        let shot2Url = shot1Url;
        try {
          const shot2 = await cameraRef.current.takePictureAsync({
            quality: 0.78,
            exif: false,
            skipProcessing: false,
            base64: true,
          });
          if (shot2?.base64) {
            shot2Url = `data:image/jpeg;base64,${shot2.base64}`;
          } else if (shot2?.uri) {
            shot2Url = shot2.uri;
          }
        } catch (e) {
          console.warn('Shot 2 capture error:', e);
        }

        // 3. Khôi phục lại hướng camera ban đầu
        setCameraFacing(cameraFacing);

        // 4. Lưu cả 2 ảnh CHỤP THẬT từ 2 camera của máy
        setCapturedPhotoUrl(shot1Url);
        setDualPipPhotoUrl(shot2Url);
        setCapturedMediaType('IMAGE');
      } else if (cameraRef.current) {
        // Normal Mode: Chụp bằng expo-camera
        if (flashMode && cameraFacing === 'front') {
          // Bật Screen Flash (sáng màn hình) 350ms để cảm biến thu sáng mặt
          setIsScreenFlashing(true);
          await new Promise((r) => setTimeout(r, 350));
        }

        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.78,
          exif: false,
          skipProcessing: false,
          base64: true,
        });

        await new Promise((r) => setTimeout(r, 100));
        setIsScreenFlashing(false);

        const mainUrl = photo?.base64
          ? `data:image/jpeg;base64,${photo.base64}`
          : photo?.uri || null;
        if (mainUrl) {
          setCapturedPhotoUrl(mainUrl);
          setDualPipPhotoUrl(null);
          setCapturedMediaType('IMAGE');
        }
      }
    } catch (err: any) {
      setIsScreenFlashing(false);
      console.warn('Real camera capture error:', err);
      Alert.alert(t.common.appName, 'Không thể chụp ảnh, vui lòng thử lại.');
    } finally {
      setIsTakingPhoto(false);
      setIsScreenFlashing(false);
    }
  };

  // Dừng quay GIF
  const handleStopRecording = () => {
    if (!isRecordingRef.current) return;
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    recordingProgressAnim.stopAnimation();
    recordingProgressAnim.setValue(0);
    try {
      cameraRef.current?.stopRecording();
    } catch (err) {
      console.warn('stopRecording error:', err);
    }
  };

  // Bắt đầu quay GIF 5s khi giữ nút tròn (khoá khi đang bật Dual Cam)
  const handleStartRecording = async () => {
    if (isRecordingRef.current || isDualMode) return;

    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert(t.common.appName, 'Cần cấp quyền Camera để ghi lại khoảnh khắc.');
        return;
      }
    }

    try {
      if (captureMode !== 'video') {
        setCaptureMode('video');
        await new Promise((r) => setTimeout(r, 200));
      }

      setIsRecordingVideo(true);
      isRecordingRef.current = true;

      // Animate circular progress ring smoothly over 5 seconds
      recordingProgressAnim.setValue(0);
      Animated.timing(recordingProgressAnim, {
        toValue: 1,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();

      if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = setTimeout(() => {
        handleStopRecording();
      }, 5000);

      const videoResult = await cameraRef.current?.recordAsync({ maxDuration: 5 });
      if (videoResult?.uri) {
        setCapturedPhotoUrl(videoResult.uri);
        setCapturedMediaType('VIDEO');
        setDualPipPhotoUrl(null);
      }
    } catch (err: any) {
      console.warn('GIF recording error:', err);
      Alert.alert(t.common.appName, 'Không thể tạo GIF, vui lòng thử lại.');
    } finally {
      setIsRecordingVideo(false);
      isRecordingRef.current = false;
      recordingProgressAnim.stopAnimation();
      recordingProgressAnim.setValue(0);
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const handleFlipCamera = () => {
    setCameraFacing((prev) => {
      const next = prev === 'front' ? 'back' : 'front';
      // Cam trước: mặc định ở 1x (0.06)
      // Cam sau: mặc định ở 1x (0.12)
      setCameraZoom(next === 'front' ? 0.06 : 0.12);
      return next;
    });
  };

  const handleToggleFlash = () => {
    setFlashMode((prev) => !prev);
  };

  const handleToggleZoom = () => {
    try {
      Vibration.vibrate(15);
    } catch {}
    if (cameraFacing === 'front') {
      // Cam trước:
      // - Nếu đang ở góc rộng < 1x (dưới 1x là dạng khung): bấm chuyển lên 1x (0.06 - ghi số '1x')
      // - Nếu đang ở 1x trở lên: bấm chuyển xuống góc rộng hơn (0.0 - dạng khung)
      setCameraZoom((prev) => (prev < 0.04 ? 0.06 : 0.0));
    } else {
      // Cam sau: toggle giữa góc siêu rộng 0.5x (0.0) và chuẩn 1x (0.12)
      setCameraZoom((prev) => (prev <= 0.05 ? 0.12 : 0.0));
    }
  };

  const handleToggleDualMode = () => {
    setIsDualMode((prev) => !prev);
  };

  const handleRetake = () => {
    setCapturedPhotoUrl(null);
    setDualPipPhotoUrl(null);
    setCaptionText('');
    setReplyingToAuthor(null);
    setCapturedMediaType('IMAGE');
    setIsRecordingVideo(false);
  };

  const handleSendMoment = async () => {
    if (!capturedPhotoUrl || !circleId) return;

    try {
      setIsTakingPhoto(true);

      const isVideo = capturedMediaType === 'VIDEO';

      // Upload main photo or video to Cloudflare R2 / Storage
      const uploadedMain = await uploadMobileMedia({
        folder: 'moments',
        uri: capturedPhotoUrl,
        contentType: isVideo ? 'video/mp4' : 'image/jpeg',
      });

      let uploadedPipUrl: string | null = null;
      if (dualPipPhotoUrl && !isVideo) {
        const uploadedPip = await uploadMobileMedia({
          folder: 'moments',
          uri: dualPipPhotoUrl,
          contentType: 'image/jpeg',
        });
        uploadedPipUrl = uploadedPip.publicUrl;
      }

      const finalPhotoUrl = uploadedPipUrl
        ? `${uploadedMain.publicUrl}#pip=${encodeURIComponent(`${uploadedPipUrl}#corner=${pipCornerIndex}`)}`
        : uploadedMain.publicUrl;

      await createMomentMutation.mutateAsync({
        photoUrl: finalPhotoUrl,
        mediaType: capturedMediaType,
        caption: replyingToAuthor
          ? `Trả lời @${replyingToAuthor}: ${captionText.trim()}`
          : captionText.trim() || undefined,
        circleIds: [circleId],
      });
      setCapturedPhotoUrl(null);
      setDualPipPhotoUrl(null);
      setCaptionText('');
      setReplyingToAuthor(null);
      setCapturedMediaType('IMAGE');
      // Snap down to the first moment page to see the newly posted moment
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: 1, animated: true });
        setCurrentPageIndex(1);
      }, 350);
    } catch (err: any) {
      Alert.alert(t.common.appName, err?.message || t.common.unknownError);
    } finally {
      setIsTakingPhoto(false);
    }
  };


  const handleReplyWithPhoto = (authorName: string) => {
    setReplyingToAuthor(authorName);
    flatListRef.current?.scrollToIndex({ index: 0, animated: true });
    setCurrentPageIndex(0);
  };

  const handleOpenChatReply = (momentId: string, authorName: string) => {
    if (activeReplyMomentId === momentId) {
      setActiveReplyMomentId(null);
      setChatReplyText('');
      Keyboard.dismiss();
    } else {
      setActiveReplyMomentId(momentId);
      setActiveReplyAuthorName(authorName);
      setChatReplyText('');
    }
  };

  const handleSendChatReply = async (momentId: string) => {
    if (!momentId || !chatReplyText.trim() || replyMomentMutation.isPending) return;

    try {
      await replyMomentMutation.mutateAsync({
        momentId,
        message: chatReplyText.trim(),
        targetCircleId: circleId,
      });
      setActiveReplyMomentId(null);
      setChatReplyText('');
      Keyboard.dismiss();
      Alert.alert(t.common.appName, 'Đã gửi phản hồi vào nhóm chat!');
    } catch (err: any) {
      Alert.alert(t.common.appName, err?.message || t.common.unknownError);
    }
  };

  const handleReactMoment = (momentId: string, emoji: string) => {
    const target = moments.find((it: any) => it.id === momentId);
    if (target && (target.authorId === user?.id || (target as any).userId === user?.id)) {
      return;
    }
    reactMomentMutation.mutate({ momentId, emoji });
  };

  const scrollToFirstMoment = () => {
    setIsFilterDropdownOpen(false);
    flatListRef.current?.scrollToIndex({ index: 1, animated: true });
    setCurrentPageIndex(1);
  };

  const scrollToCamera = () => {
    setIsFilterDropdownOpen(false);
    flatListRef.current?.scrollToIndex({ index: 0, animated: true });
    setCurrentPageIndex(0);
  };

  const previewPhoto = capturedPhotoUrl || null;

  // Prepare full feed items (Page 0 = Camera, Page 1..N = Filtered Moments or Empty)
  const feedItems: FeedItem[] = [
    { type: 'camera', id: 'camera-view' },
    ...(filteredMoments.length === 0
      ? [{ type: 'empty' as const, id: 'empty-view' }]
      : filteredMoments.map((m: any, idx: number) => ({
        type: 'moment' as const,
        id: m.id || `moment-${idx}`,
        data: m,
        index: idx,
      }))),
  ];

  // Active Moment / Photo Resolution for Action Menu
  const currentFeedItem = feedItems[currentPageIndex] || feedItems[0];
  const currentActivePhotoUrl =
    currentFeedItem.type === 'moment'
      ? currentFeedItem.data?.photoUrl || currentFeedItem.data?.imageUrl
      : previewPhoto;

  const currentAuthorName =
    currentFeedItem.type === 'moment'
      ? currentFeedItem.data?.author?.profile?.displayName ||
      currentFeedItem.data?.author?.email ||
      currentFeedItem.data?.user?.profile?.displayName ||
      currentFeedItem.data?.user?.email ||
      'Thành viên'
      : user?.profile?.displayName || 'Bạn';

  const handleSharePhoto = async () => {
    setIsActionMenuOpen(false);
    if (!currentActivePhotoUrl) return;
    try {
      await RNShare.share({
        message: `Khoảnh khắc từ nhóm ${circleName} trên Circle: ${currentActivePhotoUrl}`,
        url: currentActivePhotoUrl,
      });
    } catch {
      // User cancelled
    }
  };

  const handleCopyLink = () => {
    setIsActionMenuOpen(false);
    Alert.alert(t.common.appName, 'Đã sao chép liên kết ảnh khoảnh khắc!');
  };

  const handleSaveImage = () => {
    setIsActionMenuOpen(false);
    Alert.alert(t.common.appName, 'Đã lưu ảnh về thư viện thiết bị thành công!');
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (listHeight <= 0) return;
    const y = e.nativeEvent.contentOffset.y;
    const page = Math.round(y / listHeight);
    if (page !== currentPageIndex && page >= 0 && page < feedItems.length) {
      setCurrentPageIndex(page);
      setIsFilterDropdownOpen(false);
    }
  };

  const handleSelectFilter = (memberId: string | 'all') => {
    setSelectedMemberId(memberId);
    setIsFilterDropdownOpen(false);
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: 1, animated: true });
      setCurrentPageIndex(1);
    }, 200);
  };

  const renderFeedItem = ({ item }: { item: FeedItem; index: number }) => {
    if (item.type === 'camera') {
      return (
        <View style={[styles.pageContainer, { height: listHeight }]}>
          <Animated.View
            style={[
              styles.cameraContent,
              { transform: [{ translateY: keyboardShiftAnim }] },
            ]}
          >
            {/* Moment 1:1 Viewfinder Window (To sát viền, hỗ trợ zoom bằng 2 ngón tay) */}
            <View
              {...cameraPinchPanResponder.panHandlers}
              style={[
                styles.momentWindow,
                {
                  width: momentFrameSize,
                  height: momentFrameSize,
                  backgroundColor: '#18181B',
                  borderColor: colors.hairline,
                },
              ]}
            >
              {capturedPhotoUrl ? (
                <>
                  {capturedMediaType === 'VIDEO' ? (
                    <MomentVideoPlayer uri={capturedPhotoUrl} style={styles.momentWindowImage} />
                  ) : (
                    <RNImage source={{ uri: capturedPhotoUrl }} style={styles.momentWindowImage} resizeMode="cover" />
                  )}
                  {/* Nếu chụp ở chế độ Dual Cam, hiển thị ảnh PiP tại đúng góc đã chọn lúc chụp, hỗ trợ vuốt đổi góc và chạm đổi trước/sau */}
                  {dualPipPhotoUrl && capturedMediaType !== 'VIDEO' && (
                    <Animated.View
                      {...pipSwipePanResponder.panHandlers}
                      style={[
                        styles.pipFloatingBox,
                        {
                          borderColor: colors.primary,
                          transform: [
                            ...pipPan.getTranslateTransform(),
                            { scale: pipScale },
                          ],
                        },
                      ]}
                    >
                      <RNImage source={{ uri: dualPipPhotoUrl }} style={styles.momentWindowImage} resizeMode="cover" />
                      <View style={[styles.pipFlipBtn, { backgroundColor: 'rgba(0,0,0,0.6)' }]} pointerEvents="none">
                        <RefreshCw size={10} color="#FFFFFF" />
                      </View>
                    </Animated.View>
                  )}
                </>
              ) : !isActive ? (
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      backgroundColor: '#0f1713',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 12,
                    },
                  ]}
                >
                  <Camera size={36} color="rgba(255, 255, 255, 0.4)" />
                  <Text
                    style={{
                      color: 'rgba(255, 255, 255, 0.65)',
                      fontSize: 13,
                      fontWeight: '600',
                      textAlign: 'center',
                      paddingHorizontal: 24,
                    }}
                  >
                    Chuyển sang tab Khoảnh khắc để mở máy ảnh
                  </Text>
                </View>
              ) : permission?.granted ? (
                <>
                  {isDualMode && hasNativeDualCam ? (
                    /* Dual Mode trên Development Build: Live thật đồng thời cả 2 camera (trước + sau) bằng expo-dual-camera */
                    <>
                      {cameraFacing === 'back' ? (
                        <>
                          {/* Khung lớn chính: Camera sau Live */}
                          <DualCameraBackView
                            style={StyleSheet.absoluteFill}
                            lens={cameraZoom <= 0.05 ? 'ultraWide' : 'wide'}
                            zoom={cameraZoom}
                            flash={flashMode ? 'on' : 'off'}
                            enableTorch={false}
                          />
                          {/* Khung PiP nổi vuông: Camera trước Live, vuốt để chạy 4 góc, chạm để đổi camera */}
                          <Animated.View
                            {...pipSwipePanResponder.panHandlers}
                            style={[
                              styles.pipFloatingBox,
                              {
                                borderColor: colors.primary,
                                transform: [
                                  ...pipPan.getTranslateTransform(),
                                  { scale: pipScale },
                                ],
                              },
                            ]}
                          >
                            <DualCameraFrontView style={styles.momentWindowImage} mirror={true} pointerEvents="none" />
                            <View style={[styles.pipFlipBtn, { backgroundColor: colors.primary }]} pointerEvents="none">
                              <RefreshCw size={11} color={colors.onPrimary} />
                            </View>
                          </Animated.View>
                        </>
                      ) : (
                        <>
                          {/* Khung lớn chính: Camera trước Live */}
                          <DualCameraFrontView
                            style={StyleSheet.absoluteFill}
                            mirror={true}
                            zoom={cameraZoom}
                          />
                          {/* Khung PiP nổi vuông: Camera sau Live, vuốt để chạy 4 góc, chạm để đổi camera */}
                          <Animated.View
                            {...pipSwipePanResponder.panHandlers}
                            style={[
                              styles.pipFloatingBox,
                              {
                                borderColor: colors.primary,
                                transform: [
                                  ...pipPan.getTranslateTransform(),
                                  { scale: pipScale },
                                ],
                              },
                            ]}
                          >
                            <DualCameraBackView
                              style={styles.momentWindowImage}
                              lens={cameraZoom <= 0.05 ? 'ultraWide' : 'wide'}
                              pointerEvents="none"
                            />
                            <View style={[styles.pipFlipBtn, { backgroundColor: colors.primary }]} pointerEvents="none">
                              <RefreshCw size={11} color={colors.onPrimary} />
                            </View>
                          </Animated.View>
                        </>
                      )}
                    </>
                  ) : (
                    /* Normal Mode HOẶC Dual Mode khi không có native dual cam */
                    <>
                      <View style={StyleSheet.absoluteFill}>
                        <CameraView
                          key={`${cameraFacing}-${captureMode}`}
                          ref={cameraRef}
                          style={StyleSheet.absoluteFill}
                          facing={cameraFacing}
                          mirror={cameraFacing === 'front'}
                          flash={flashMode ? 'on' : 'off'}
                          enableTorch={false}
                          zoom={cameraZoom}
                          autofocus="on"
                          mode={captureMode === 'video' ? 'video' : 'picture'}
                          mute={captureMode === 'video'}
                          onAvailableLensesChanged={(event: any) => {
                            const list = event?.lenses || event?.nativeEvent?.lenses;
                            if (list && list.length > 0) {
                              setAvailableLenses(list);
                            }
                          }}
                          onCameraReady={async () => {
                            try {
                              const lenses = await cameraRef.current?.getAvailableLensesAsync();
                              if (lenses && lenses.length > 0) {
                                setAvailableLenses(lenses);
                              }
                            } catch { }
                          }}
                        />
                      </View>

                      {/* In-viewfinder Screen Flash Whiteout */}
                      {isScreenFlashing && (
                        <View
                          pointerEvents="none"
                          style={[
                            StyleSheet.absoluteFill,
                            {
                              backgroundColor: '#FFFFFF',
                              zIndex: 99,
                            },
                          ]}
                        />
                      )}

                      {/* Khi bật Dual Mode: Hiển thị khung PiP vuông, vuốt để chạy 4 góc, chạm để đổi camera */}
                      {isDualMode && (
                        <Animated.View
                          {...pipSwipePanResponder.panHandlers}
                          style={[
                            styles.pipFloatingBox,
                            {
                              borderColor: colors.primary,
                              backgroundColor: 'rgba(20,20,20,0.85)',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transform: [
                                ...pipPan.getTranslateTransform(),
                                { scale: pipScale },
                              ],
                            },
                          ]}
                        >
                          <Camera size={26} color={colors.primary} pointerEvents="none" />
                          <View style={[styles.pipFlipBtn, { backgroundColor: colors.primary }]} pointerEvents="none">
                            <RefreshCw size={11} color={colors.onPrimary} />
                          </View>
                        </Animated.View>
                      )}
                    </>
                  )}
                </>
              ) : (
                <View style={styles.cameraPermissionBox}>
                  <Camera size={40} color={colors.primary} />
                  <Text style={[styles.cameraPermissionTitle, { color: '#FFFFFF' }]}>
                    Quyền truy cập máy ảnh
                  </Text>
                  <Text style={[styles.cameraPermissionSub, { color: 'rgba(255,255,255,0.7)' }]}>
                    Cấp quyền để chụp và chia sẻ khoảnh khắc realtime với bạn bè.
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={requestPermission}
                    style={[styles.cameraPermissionBtn, { backgroundColor: colors.primary }]}
                  >
                    <Text style={[styles.cameraPermissionBtnText, { color: colors.onPrimary }]}>
                      Cấp quyền Camera
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {!capturedPhotoUrl && (
                <>
                  {/* Top Overlay Controls inside Camera: Flash (Left), Zoom (Right) */}
                  <View style={styles.cameraInnerTopBar} pointerEvents="box-none">
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleToggleFlash}
                      style={[styles.cameraMiniBtn, { backgroundColor: 'rgba(0,0,0,0.55)' }]}
                    >
                      {flashMode ? (
                        <Zap size={16} color="#FBBF24" fill="#FBBF24" />
                      ) : (
                        <ZapOff size={16} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>

                    {/* Nút Zoom theo tiêu cự: Cam trước dưới 1x là dạng khung (góc rộng), từ 1x trở lên ghi số */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleToggleZoom}
                      style={[
                        styles.cameraMiniBtn,
                        {
                          backgroundColor: 'rgba(0,0,0,0.55)',
                          minWidth: 36,
                          paddingHorizontal: 4,
                        },
                      ]}
                    >
                      {cameraFacing === 'front' && cameraZoom < 0.04 ? (
                        <Maximize2 size={16} color="#FFFFFF" strokeWidth={2.2} />
                      ) : (
                        <Text style={styles.zoomBtnText}>{displayZoomText}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Caption Overlay on Captured Photo (Giới hạn cứng tối đa 2 dòng / 80 ký tự) */}
              {capturedPhotoUrl && (
                <View style={styles.capturedCaptionOverlay} pointerEvents="box-none">
                  <View style={styles.captionInputPill}>
                    <TextInput
                      value={captionText}
                      onChangeText={handleCaptionChange}
                      placeholder="Thêm tin nhắn gửi bạn bè..."
                      placeholderTextColor="rgba(255,255,255,0.7)"
                      maxLength={maxCaptionLength}
                      multiline={true}
                      numberOfLines={2}
                      autoFocus={false}
                      returnKeyType="done"
                      blurOnSubmit={true}
                      onSubmitEditing={() => Keyboard.dismiss()}
                      style={styles.captionTextInput}
                    />
                    {captionText.length >= 50 && (
                      <Text style={styles.captionLimitCounter}>
                        {captionText.length}/{maxCaptionLength}
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Fixed Height Controls Area Below Viewfinder */}
            <View style={styles.fixedControlsArea}>
              {capturedPhotoUrl ? (
                /* Review actions when photo or video is captured */
                <View style={[styles.reviewActionsBar, { width: momentFrameSize }]}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleRetake}
                    style={[styles.reviewActionBtn, { backgroundColor: colors.wash, borderColor: colors.hairline }]}
                  >
                    <RotateCcw size={20} color={colors.text} />
                    <Text style={[styles.reviewBtnText, { color: colors.text }]}>
                      {capturedMediaType === 'VIDEO' ? 'Quay lại GIF' : 'Chụp lại'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={createMomentMutation.isPending}
                    onPress={handleSendMoment}
                    style={[styles.sendMomentBtn, { backgroundColor: colors.primary }]}
                  >
                    {createMomentMutation.isPending ? (
                      <ActivityIndicator color={colors.onPrimary} size="small" />
                    ) : (
                      <>
                        <Send size={18} color={colors.onPrimary} />
                        <Text style={[styles.sendMomentBtnText, { color: colors.onPrimary }]}>
                          Gửi vào {circleName}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.shutterControlsBar}>
                  {/* Left Button: Nút bật/tắt Hiển thị song song (Dual View) */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleToggleDualMode}
                    disabled={isRecordingVideo}
                    style={[
                      styles.sideControlBtn,
                      {
                        backgroundColor: isDualMode ? `${colors.primary}25` : colors.surface,
                        borderColor: isDualMode ? colors.primary : colors.hairline,
                        opacity: isRecordingVideo ? 0.3 : 1,
                      },
                    ]}
                  >
                    <Layers size={26} color={isDualMode ? colors.primary : colors.text} />
                  </TouchableOpacity>

                  {/* Center Button: Single Round Shutter Button with Circular Progress Ring Countdown */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={isTakingPhoto}
                    onPressIn={() => {
                      pressStartTimeRef.current = Date.now();
                    }}
                    delayLongPress={200}
                    onLongPress={() => {
                      if (isDualMode) return;
                      longPressTriggeredRef.current = true;
                      handleStartRecording();
                    }}
                    onPressOut={() => {
                      if (longPressTriggeredRef.current) {
                        longPressTriggeredRef.current = false;
                        handleStopRecording();
                      }
                    }}
                    onPress={() => {
                      if (longPressTriggeredRef.current || isRecordingVideo) return;
                      handleSnapPhoto();
                    }}
                    style={[
                      styles.momentMainShutterOuter,
                      {
                        borderColor: isRecordingVideo ? 'transparent' : colors.primary,
                        backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)',
                        transform: [{ scale: isRecordingVideo ? 1.08 : 1 }],
                      },
                    ]}
                  >
                    {/* Circular Progress Ring when recording GIF (0 to 5s) */}
                    {isRecordingVideo && (
                      <View style={styles.svgProgressContainer} pointerEvents="none">
                        <Svg
                          width={SHUTTER_SIZE}
                          height={SHUTTER_SIZE}
                          style={{ transform: [{ rotate: '-90deg' }] }}
                        >
                          {/* Track circle */}
                          <Circle
                            cx={SHUTTER_SIZE / 2}
                            cy={SHUTTER_SIZE / 2}
                            r={PROGRESS_RADIUS}
                            stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)'}
                            strokeWidth={PROGRESS_STROKE_WIDTH}
                            fill="none"
                          />
                          {/* Animated countdown progress ring */}
                          <AnimatedCircle
                            cx={SHUTTER_SIZE / 2}
                            cy={SHUTTER_SIZE / 2}
                            r={PROGRESS_RADIUS}
                            stroke="#EF4444"
                            strokeWidth={PROGRESS_STROKE_WIDTH}
                            strokeDasharray={PROGRESS_CIRCUMFERENCE}
                            strokeDashoffset={progressStrokeOffset}
                            strokeLinecap="round"
                            fill="none"
                          />
                        </Svg>
                      </View>
                    )}

                    <View
                      style={[
                        styles.momentMainShutterInner,
                        {
                          backgroundColor: isRecordingVideo ? '#EF4444' : colors.primary,

                        },
                      ]}
                    >
                      {isTakingPhoto ? (
                        <ActivityIndicator color={colors.onPrimary} size="small" />
                      ) : isRecordingVideo ? (
                        <View style={styles.recordingStopSquare} />
                      ) : (
                        <Camera size={32} color={colors.onPrimary} />
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Right Button: Nút chuyển đổi Camera Trước / Sau (RefreshCw) */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleFlipCamera}
                    disabled={isRecordingVideo}
                    style={[
                      styles.sideControlBtn,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.hairline,
                        opacity: isRecordingVideo ? 0.3 : 1,
                      },
                    ]}
                  >
                    <RefreshCw size={26} color={colors.text} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Nút xem Lịch sử có ảnh mini + chữ "Lịch sử" + mũi tên xuống (ghi trực tiếp không khung viền) */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={scrollToFirstMoment}
              style={styles.historyCueBtn}
            >
              {latestMomentPhoto ? (
                <RNImage source={{ uri: resolveMobileMediaUrl(latestMomentPhoto) }} style={styles.historyCueThumb} resizeMode="cover" />
              ) : (
                <View style={[styles.historyCueThumb, { backgroundColor: `${colors.primary}25`, alignItems: 'center', justifyContent: 'center' }]}>
                  <History size={14} color={colors.primary} />
                </View>
              )}
              <Text style={[styles.historyCueText, { color: colors.text }]}>Lịch sử</Text>
              <ChevronDown size={18} color={colors.subtle} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      );
    }

    if (item.type === 'empty') {
      return (
        <View style={[styles.pageContainer, { height: listHeight }]}>
          <View style={[styles.emptyHistoryBox, { width: momentCardWidth, backgroundColor: colors.surface, borderColor: colors.hairline }]}>
            <ImageIcon size={44} color={colors.subtle} />
            <Text style={[styles.emptyHistoryTitle, { color: colors.text }]}>
              {selectedMemberId === 'all'
                ? t.moments.emptyCircleTitle
                : `Chưa có khoảnh khắc từ ${selectedFilterName}`}
            </Text>
            <Text style={[styles.emptyHistoryDesc, { color: colors.subtle }]}>
              {selectedMemberId === 'all'
                ? `Hãy là người đầu tiên chụp & chia sẻ khoảnh khắc với ${circleName}!`
                : 'Bạn có thể chọn thành viên khác hoặc bấm xem tất cả mọi người.'}
            </Text>
            {selectedMemberId !== 'all' ? (
              <TouchableOpacity
                onPress={() => setSelectedMemberId('all')}
                style={[styles.firstSnapBtn, { backgroundColor: colors.primary }]}
              >
                <Users size={16} color={colors.onPrimary} />
                <Text style={[styles.firstSnapBtnText, { color: colors.onPrimary }]}>
                  Xem tất cả mọi người
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={scrollToCamera}
                style={[styles.firstSnapBtn, { backgroundColor: colors.primary }]}
              >
                <Camera size={16} color={colors.onPrimary} />
                <Text style={[styles.firstSnapBtnText, { color: colors.onPrimary }]}>
                  Chụp khoảnh khắc ngay
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    // Single Moment Snap Card (1 card per page, To sát viền)
    const m = item.data;
    const authorName =
      m.author?.profile?.displayName ||
      m.author?.email ||
      m.user?.profile?.displayName ||
      m.user?.email ||
      'Thành viên';
    const authorAvatar = m.author?.profile?.avatarUrl || m.user?.profile?.avatarUrl;
    const rawPhotoSrc = m.photoUrl || m.imageUrl;
    const { mainUrl, pipUrl, cornerIndex } = parseMomentPhotos(rawPhotoSrc);
    const isSwapped = Boolean(swappedMoments[m.id]);
    const displayMain = isSwapped ? (pipUrl || mainUrl) : mainUrl;
    const displayPip = isSwapped ? mainUrl : pipUrl;

    const formattedDate = formatMomentRelativeTime(m.createdAt, locale);

    const isReplyingThisMoment = activeReplyMomentId === m.id;
    const isAuthor = m.authorId === user?.id || (m as any).userId === user?.id;

    return (
      <View style={[styles.pageContainer, { height: listHeight }]}>
        <Animated.View
          style={[
            styles.momentFeedCard,
            {
              width: momentCardWidth,
              backgroundColor: colors.surface,
              borderColor: isReplyingThisMoment ? colors.primary : colors.hairline,
              transform: [{ translateY: isReplyingThisMoment ? keyboardShiftAnim : 0 }],
            },
          ]}
        >
          {/* Card Top: Author Info + Index Badge */}
          <View style={styles.momentFeedHeader}>
            <View style={styles.momentFeedAuthor}>
              <View style={[styles.authorAvatar, { backgroundColor: `${colors.primary}20` }]}>
                {authorAvatar ? (
                  <RNImage source={{ uri: resolveMobileMediaUrl(authorAvatar) }} style={styles.authorAvatarImg} />
                ) : (
                  <Text style={[styles.authorAvatarText, { color: colors.primary }]}>
                    {getInitials(authorName)}
                  </Text>
                )}
              </View>
              <View>
                <Text style={[styles.authorDisplayName, { color: colors.text }]}>
                  {authorName}
                </Text>
                <Text style={[styles.momentTimeText, { color: colors.subtle }]}>
                  {formattedDate}
                </Text>
              </View>
            </View>

            <View style={[styles.pageIndexBadge, { backgroundColor: colors.wash }]}>
              <Text style={[styles.pageIndexText, { color: colors.primary }]}>
                {item.index + 1}/{filteredMoments.length}
              </Text>
            </View>
          </View>

          {/* 1:1 Rounded Square Photo / Video with In-photo Caption Overlay & Dual View PiP */}
          <View style={[styles.momentPhotoFrame, { backgroundColor: colors.wash }]}>
            {displayMain ? (
              m.mediaType === 'VIDEO' || displayMain.includes('.mp4') || displayMain.includes('.webm') ? (
                <>
                  <MomentVideoPlayer uri={displayMain} style={styles.momentPhotoImage} />
                  <View style={styles.feedGifBadge}>
                    <Text style={styles.feedGifBadgeText}>GIF</Text>
                  </View>
                </>
              ) : (
                <RNImage source={{ uri: displayMain }} style={styles.momentPhotoImage} resizeMode="cover" />
              )
            ) : (
              <View style={styles.noPhotoPlaceholder}>
                <ImageIcon size={36} color={colors.subtle} />
              </View>
            )}

            {/* Khung nổi Dual View PiP trong Feed: Khởi tạo đúng góc khi chụp và hỗ trợ người xem vuốt 4 góc & chạm đổi trước/sau */}
            {displayPip && (
              <MomentFeedPipView
                key={`${m.id}-${isSwapped ? 'swapped' : 'normal'}`}
                pipUrl={displayPip}
                initialCornerIndex={viewerPipCorners[m.id] ?? cornerIndex}
                momentSize={momentCardWidth - 16}
                primaryColor={colors.primary}
                onDragStart={() => {
                  (flatListRef.current as any)?.setNativeProps?.({ scrollEnabled: false });
                }}
                onDragEnd={() => {
                  (flatListRef.current as any)?.setNativeProps?.({ scrollEnabled: true });
                }}
                onCornerChange={(newCorner) => {
                  setViewerPipCorners((prev) => ({
                    ...prev,
                    [m.id]: newCorner,
                  }));
                }}
                onSwap={() => {
                  setSwappedMoments((prev) => ({
                    ...prev,
                    [m.id]: !prev[m.id],
                  }));
                }}
              />
            )}

            {/* Chú thích của khoảnh khắc (co theo độ dài chữ, tối đa 2 dòng, nổi trên PiP) */}
            {m.caption && !isReplyingThisMoment ? (
              <View style={styles.photoCaptionContainer} pointerEvents="none">
                <View style={styles.photoCaptionPill}>
                  <Text numberOfLines={2} ellipsizeMode="tail" style={styles.photoCaptionText}>
                    {m.caption}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Ô nhập phản hồi trực tiếp trên ảnh (thay thế popup cầu kì) */}
            {isReplyingThisMoment && (
              <View style={styles.feedReplyOverlay} pointerEvents="box-none">
                <View style={styles.feedReplyPill}>
                  <TextInput
                    value={chatReplyText}
                    onChangeText={setChatReplyText}
                    placeholder={`Phản hồi ${authorName}...`}
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    maxLength={500}
                    autoFocus={true}
                    returnKeyType="send"
                    blurOnSubmit={true}
                    onSubmitEditing={() => handleSendChatReply(m.id)}
                    style={styles.feedReplyTextInput}
                  />

                  <TouchableOpacity
                    disabled={!chatReplyText.trim() || replyMomentMutation.isPending}
                    onPress={() => handleSendChatReply(m.id)}
                    style={[
                      styles.feedReplySendBtn,
                      {
                        backgroundColor: chatReplyText.trim() ? colors.primary : 'rgba(255,255,255,0.2)',
                      },
                    ]}
                  >
                    {replyMomentMutation.isPending ? (
                      <ActivityIndicator size="small" color={colors.onPrimary} />
                    ) : (
                      <Send size={15} color={chatReplyText.trim() ? colors.onPrimary : 'rgba(255,255,255,0.6)'} />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setActiveReplyMomentId(null);
                      setChatReplyText('');
                      Keyboard.dismiss();
                    }}
                    style={{ padding: 4 }}
                  >
                    <X size={16} color="rgba(255,255,255,0.7)" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Card Bottom: Reply Into Chat + Reply With Photo + Quick Emoji Reactions */}
          <View style={[styles.momentFeedFooter, { borderTopColor: colors.hairline }]}>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => handleOpenChatReply(m.id, authorName)}
                style={[
                  styles.replyWithPhotoBtn,
                  {
                    backgroundColor: isReplyingThisMoment ? `${colors.primary}25` : colors.wash,
                    borderColor: isReplyingThisMoment ? colors.primary : 'transparent',
                    borderWidth: isReplyingThisMoment ? 1 : 0,
                  },
                ]}
              >
                <MessageCircle size={14} color={isReplyingThisMoment ? colors.primary : colors.text} />
                <Text style={[styles.replyWithPhotoText, { color: isReplyingThisMoment ? colors.primary : colors.text }]}>
                  Phản hồi
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => handleReplyWithPhoto(authorName)}
                style={[styles.replyWithPhotoBtn, { backgroundColor: colors.wash }]}
              >
                <Camera size={14} color={colors.primary} />
                <Text style={[styles.replyWithPhotoText, { color: colors.text }]}>
                  Ảnh
                </Text>
              </TouchableOpacity>
            </View>

            {isAuthor ? (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => {
                  setSelectedMomentForReactors(m);
                  setReactorEmojiFilter('ALL');
                }}
                style={[styles.authorReactorsBtn, { backgroundColor: colors.wash }]}
              >
                {m.reactions && m.reactions.length > 0 ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={styles.authorAvatarStack}>
                      {m.reactions.slice(0, 5).map((r: any, idx: number) => {
                        const reactorAvatar = r.user?.avatarUrl;
                        const reactorName = r.user?.displayName || 'User';

                        return (
                          <View
                            key={r.id || idx}
                            style={[
                              styles.authorStackItem,
                              { marginLeft: idx === 0 ? 0 : -8, zIndex: 10 - idx },
                            ]}
                          >
                            <View style={[styles.authorStackAvatar, { backgroundColor: colors.primary }]}>
                              {reactorAvatar ? (
                                <RNImage
                                  source={{ uri: resolveMobileMediaUrl(reactorAvatar) }}
                                  style={styles.authorStackAvatarImg}
                                />
                              ) : (
                                <Text style={styles.authorStackAvatarText}>
                                  {getInitials(reactorName)}
                                </Text>
                              )}
                            </View>
                            {/* Small circular badge at bottom-right of avatar with emoji */}
                            <View style={[styles.authorStackEmojiBadge, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                              <Text style={styles.authorStackEmojiText}>{r.emoji}</Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                    <Text style={[styles.authorReactorsCountText, { color: colors.text }]}>
                      {m.reactions.length} {locale === 'vi' ? 'cảm xúc' : 'reactions'}
                    </Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 13 }}>❤️</Text>
                    <Text style={[styles.authorNoReactionsText, { color: colors.subtle }]}>
                      {locale === 'vi' ? 'Chưa có cảm xúc' : 'No reactions yet'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.reactionEmojisBar}>
                {['❤️', '🔥', '👏', '🥰'].map((emoji) => {
                  const isSelected = m.userReaction === emoji;

                  return (
                    <TouchableOpacity
                      key={emoji}
                      onPress={() => handleReactMoment(m.id, emoji)}
                      activeOpacity={0.7}
                      style={[
                        styles.reactionMiniPill,
                        {
                          backgroundColor: isSelected ? `${colors.primary}30` : colors.wash,
                          borderColor: isSelected ? colors.primary : 'transparent',
                          borderWidth: isSelected ? 1 : 0,
                        },
                      ]}
                    >
                      <Emoji emoji={emoji} size={18} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    );
  };

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        const h = e.nativeEvent.layout.height;
        // Giữ cố định kích thước khung giao diện, không để bàn phím làm co cụm / biến dạng layout
        if (h > 250) {
          if (!isKeyboardOpenRef.current) {
            // Chỉ cập nhật giảm khi thực sự đổi chiều màn hình, không giảm do bàn phím đẩy lên
            if (h >= stableContainerHeightRef.current || Math.abs(h - stableContainerHeightRef.current) < 80) {
              stableContainerHeightRef.current = Math.max(stableContainerHeightRef.current, h);
              if (Math.abs(h - containerHeight) > 5 && h >= containerHeight) {
                setContainerHeight(h);
              }
            }
          }
        }
      }}
    >
      {/* =========================================================================
          CỐ ĐỊNH THANH TIÊU ĐỀ TRÊN CÙNG (FIXED TOP HEADER - TO HƠN)
          - Tầng 2: Đồng bộ 100% bố cục layout và ngôn ngữ thiết kế (Flat vs Glass) với 2 tab còn lại
         ========================================================================= */}
      <View style={[styles.fixedTopHeader, { height: topHeaderHeight }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
          style={[
            styles.friendsPill,
            {
              backgroundColor: isGlass
                ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')
                : colors.surface,
              borderColor: isGlass
                ? (isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.07)')
                : colors.hairline,
              shadowOpacity: isGlass ? 0.05 : 0,
              elevation: isGlass ? 2 : 0,
            },
          ]}
          accessibilityLabel="Lọc bạn bè"
        >
          <Users size={13} color={colors.subtle} />
          <Text numberOfLines={1} style={[styles.friendsPillText, { color: colors.text }]}>
            {selectedMemberId === 'all'
              ? (members.length > 0 ? `${members.length} bạn bè` : 'Bạn bè')
              : selectedFilterName}
          </Text>
          <ChevronDown size={13} color={colors.subtle} style={{ marginLeft: 2 }} />
        </TouchableOpacity>

        {replyingToAuthor && currentPageIndex === 0 && (
          <View style={[styles.replyingBadge, { backgroundColor: `${colors.warning}20` }]}>
            <MessageCircle size={13} color={colors.warning} />
            <Text style={[styles.replyingBadgeText, { color: colors.warning }]}>
              Đáp lại: {replyingToAuthor}
            </Text>
            <TouchableOpacity onPress={() => setReplyingToAuthor(null)}>
              <X size={13} color={colors.warning} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* =========================================================================
          INLINE MEMBER FILTER DROPDOWN (SỔ NGAY TẠI THANH TIÊU ĐỀ TRÊN CÙNG)
         ========================================================================= */}
      {isFilterDropdownOpen && currentPageIndex > 0 && (
        <View style={styles.inlineDropdownWrapper}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setIsFilterDropdownOpen(false)}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              styles.inlineDropdownMenu,
              {
                backgroundColor: colors.sheetBg,
                borderColor: colors.glassBorder,
              },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 220 }}>
              {/* Option 1: Tất cả mọi người */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => handleSelectFilter('all')}
                style={[
                  styles.dropdownItem,
                  {
                    backgroundColor: selectedMemberId === 'all' ? `${colors.primary}15` : 'transparent',
                    borderBottomColor: colors.hairline,
                  },
                ]}
              >
                <View style={[styles.dropdownAvatar, { backgroundColor: `${colors.primary}20` }]}>
                  <Users size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dropdownItemTitle, { color: colors.text }]}>Mọi người</Text>
                  <Text style={[styles.dropdownItemSub, { color: colors.subtle }]}>
                    Tất cả {moments.length} khoảnh khắc
                  </Text>
                </View>
                {selectedMemberId === 'all' && (
                  <Check size={16} color={colors.primary} />
                )}
              </TouchableOpacity>

              {/* Members List */}
              {members.map((mb: any) => {
                const memberId = mb.userId || mb.id || mb.user?.id;
                const displayName = mb.profile?.displayName || mb.user?.profile?.displayName || mb.email || 'Thành viên';
                const avatarUrl = mb.profile?.avatarUrl || mb.user?.profile?.avatarUrl;
                const isSelected = selectedMemberId === memberId;
                const memberMomentsCount = moments.filter(
                  (m: any) => m.userId === memberId || m.user?.id === memberId
                ).length;

                return (
                  <TouchableOpacity
                    key={memberId}
                    activeOpacity={0.75}
                    onPress={() => handleSelectFilter(memberId)}
                    style={[
                      styles.dropdownItem,
                      {
                        backgroundColor: isSelected ? `${colors.primary}15` : 'transparent',
                        borderBottomColor: colors.hairline,
                      },
                    ]}
                  >
                    <View style={[styles.dropdownAvatar, { backgroundColor: `${colors.primary}20` }]}>
                      {avatarUrl ? (
                        <RNImage source={{ uri: avatarUrl }} style={styles.dropdownAvatarImg} />
                      ) : (
                        <Text style={[styles.dropdownAvatarText, { color: colors.primary }]}>
                          {getInitials(displayName)}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.dropdownItemTitle, { color: colors.text }]}>{displayName}</Text>
                      <Text style={[styles.dropdownItemSub, { color: colors.subtle }]}>
                        {memberMomentsCount} khoảnh khắc
                      </Text>
                    </View>
                    {isSelected && (
                      <Check size={16} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      )}

      {/* =========================================================================
          SNAP PAGING FEED (TRANG 0 = CAMERA, TRANG 1..N = KHOẢNH KHẮC)
         ========================================================================= */}
      <FlatList
        ref={flatListRef}
        data={feedItems}
        keyExtractor={(item) => item.id}
        renderItem={renderFeedItem}
        pagingEnabled
        scrollEnabled={!isPinchingCamera}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        getItemLayout={(_, index) => ({
          length: listHeight,
          offset: listHeight * index,
          index,
        })}
      />

      {/* =========================================================================
          CỐ ĐỊNH THANH ĐIỀU KHIỂN DOCK PHÍA DƯỚI (FIXED BOTTOM DOCK)
          - Nút bên trái: "Lịch sử" (History)
          - Nút chính giữa: Cố định kích thước (Trang 0: Home, Trang >= 1: Camera)
          - Nút bên phải: "Tùy chọn chia sẻ & Quản lý ảnh" (Share / Action Button)
          - Tự động ẩn khi mở bàn phím để không bị đẩy lên trên
         ========================================================================= */}
      {!isKeyboardVisible && (
        <View pointerEvents="box-none" style={styles.floatingDockContainer}>
          <View
            style={[
              styles.floatingDockBar,
              {
                backgroundColor: isDark ? 'rgba(25, 25, 25, 0.92)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: colors.hairline,
              },
            ]}
          >
          {/* Nút bên trái: Lịch sử */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={scrollToFirstMoment}
            style={styles.dockIconBtn}
          >
            <History
              size={22}
              color={currentPageIndex > 0 ? colors.primary : colors.text}
            />
            <Text
              style={[
                styles.dockBtnLabel,
                { color: currentPageIndex > 0 ? colors.primary : colors.subtle },
              ]}
            >
              Lịch sử
            </Text>
          </TouchableOpacity>

          {/* Nút chính giữa: Cố định kích thước (không đổi size). Trang 0 là Ngôi nhà (Home), Trang >= 1 là Vòng tròn Camera */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={currentPageIndex === 0 ? () => { } : scrollToCamera}
            style={[styles.dockCenterBtnOuter, { borderColor: colors.primary }]}
          >
            <View style={[styles.dockCenterBtnInner, { backgroundColor: colors.primary }]}>
              {currentPageIndex === 0 ? (
                <Home size={22} color={colors.onPrimary} />
              ) : (
                <Camera size={22} color={colors.onPrimary} />
              )}
            </View>
          </TouchableOpacity>

          {/* Nút bên phải: Tùy chọn chia sẻ & Quản lý ảnh (Share / Action Button) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsActionMenuOpen(true)}
            style={styles.dockIconBtn}
          >
            <Share2 size={22} color={colors.text} />
            <Text style={[styles.dockBtnLabel, { color: colors.subtle }]}>Tùy chọn</Text>
          </TouchableOpacity>
        </View>
      </View>
      )}

      {/* =========================================================================
          ACTION MENU MODAL (POPOVER / BOTTOM SHEET) GẮN LIỀN VỚI ẢNH ĐANG HIỂN THỊ
         ========================================================================= */}
      <Modal
        visible={isActionMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsActionMenuOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsActionMenuOpen(false)}
          style={styles.actionModalOverlay}
        >
          <BlurView
            intensity={Platform.OS === 'ios' ? 45 : 85}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />

          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.actionModalSheet,
              {
                backgroundColor: colors.sheetBg,
                borderColor: colors.glassBorder,
              },
            ]}
          >
            {/* Sheet Drag Handle */}
            <View style={[styles.actionSheetHandle, { backgroundColor: colors.hairline }]} />

            {/* Header with Photo Preview Thumbnail */}
            <View style={styles.actionSheetHeader}>
              <View style={styles.actionHeaderLeft}>
                {currentActivePhotoUrl ? (
                  <RNImage source={{ uri: resolveMobileMediaUrl(currentActivePhotoUrl) }} style={styles.actionHeaderThumb} resizeMode="cover" />
                ) : (
                  <View style={[styles.actionHeaderThumb, { backgroundColor: colors.wash, alignItems: 'center', justifyContent: 'center' }]}>
                    <ImageIcon size={20} color={colors.subtle} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionSheetTitle, { color: colors.text }]}>
                    Khoảnh khắc của {currentAuthorName}
                  </Text>
                  <Text style={[styles.actionSheetSub, { color: colors.subtle }]}>
                    {circleName} · Moments
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setIsActionMenuOpen(false)}
                style={[styles.actionCloseBtn, { backgroundColor: colors.wash }]}
              >
                <X size={16} color={colors.subtle} />
              </TouchableOpacity>
            </View>

            {/* Action Items List */}
            <View style={styles.actionList}>
              {/* Option 1: Share Photo */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={handleSharePhoto}
                style={[styles.actionItem, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
              >
                <View style={[styles.actionIconBox, { backgroundColor: `${colors.primary}20` }]}>
                  <Share2 size={20} color={colors.primary} />
                </View>
                <View style={styles.actionItemInfo}>
                  <Text style={[styles.actionItemTitle, { color: colors.text }]}>Chia sẻ ảnh...</Text>
                  <Text style={[styles.actionItemDesc, { color: colors.subtle }]}>
                    Gửi đến ứng dụng khác hoặc tin nhắn bạn bè
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option 2: Copy Link */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={handleCopyLink}
                style={[styles.actionItem, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
              >
                <View style={[styles.actionIconBox, { backgroundColor: `${colors.info}20` }]}>
                  <Copy size={20} color={colors.info} />
                </View>
                <View style={styles.actionItemInfo}>
                  <Text style={[styles.actionItemTitle, { color: colors.text }]}>Sao chép liên kết ảnh</Text>
                  <Text style={[styles.actionItemDesc, { color: colors.subtle }]}>
                    Lưu link ảnh vào bộ nhớ tạm
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option 3: Save image */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={handleSaveImage}
                style={[styles.actionItem, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
              >
                <View style={[styles.actionIconBox, { backgroundColor: `${colors.success}20` }]}>
                  <Download size={20} color={colors.success} />
                </View>
                <View style={styles.actionItemInfo}>
                  <Text style={[styles.actionItemTitle, { color: colors.text }]}>Lưu về máy</Text>
                  <Text style={[styles.actionItemDesc, { color: colors.subtle }]}>
                    Tải ảnh gốc về thư viện ảnh thiết bị
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option 4: Reply into Circle Chat */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => {
                  setIsActionMenuOpen(false);
                  if (currentFeedItem.type === 'moment') {
                    handleOpenChatReply(currentFeedItem.data.id, currentAuthorName);
                  }
                }}
                style={[styles.actionItem, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
              >
                <View style={[styles.actionIconBox, { backgroundColor: `${colors.primary}20` }]}>
                  <MessageCircle size={20} color={colors.primary} />
                </View>
                <View style={styles.actionItemInfo}>
                  <Text style={[styles.actionItemTitle, { color: colors.text }]}>Phản hồi vào nhóm chat</Text>
                  <Text style={[styles.actionItemDesc, { color: colors.subtle }]}>
                    Trích dẫn ảnh khoảnh khắc và gửi vào kênh trò chuyện chung
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Option 5: Reply With Photo */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => {
                  setIsActionMenuOpen(false);
                  handleReplyWithPhoto(currentAuthorName);
                }}
                style={[styles.actionItem, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
              >
                <View style={[styles.actionIconBox, { backgroundColor: `${colors.warning}20` }]}>
                  <Sparkles size={20} color={colors.warning} />
                </View>
                <View style={styles.actionItemInfo}>
                  <Text style={[styles.actionItemTitle, { color: colors.text }]}>Đáp lại bằng ảnh mới</Text>
                  <Text style={[styles.actionItemDesc, { color: colors.subtle }]}>
                    Mở camera và gửi ảnh phản hồi ngay
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Screen Flash: Chớp sáng trắng toàn màn hình khi chụp camera trước (dùng Modal để vượt qua SurfaceView camera trên Android) */}
      <Modal
        visible={isScreenFlashing}
        transparent={true}
        animationType="none"
        statusBarTranslucent={true}
        onRequestClose={() => {}}
      >
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
      </Modal>

      {/* =========================================================================
          MOMENT REACTORS MODAL (Danh sách người thả cảm xúc - Author only)
         ========================================================================= */}
      <Modal
        visible={Boolean(selectedMomentForReactors)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedMomentForReactors(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setSelectedMomentForReactors(null)}
          style={styles.reactorsBackdrop}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={[styles.reactorsSheet, { backgroundColor: colors.surface }]}
          >
            {/* Header */}
            <View style={[styles.reactorsHeader, { borderBottomColor: colors.hairline }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[styles.reactorsTitle, { color: colors.text }]}>
                  {locale === 'vi' ? 'Lượt bày tỏ cảm xúc' : 'Reactions'}
                </Text>
                <View style={[styles.reactorsCountBadge, { backgroundColor: `${colors.primary}25` }]}>
                  <Text style={[styles.reactorsCountBadgeText, { color: colors.primary }]}>
                    {selectedMomentForReactors?.reactions?.length || 0}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSelectedMomentForReactors(null)}
                style={[styles.reactorsCloseBtn, { backgroundColor: colors.wash }]}
              >
                <X size={16} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Emoji Filter Chips */}
            {(() => {
              const reactions = selectedMomentForReactors?.reactions || [];
              const emojiCounts: Record<string, number> = {};
              reactions.forEach((r: any) => {
                emojiCounts[r.emoji] = (emojiCounts[r.emoji] || 0) + 1;
              });
              const uniqueEmojis = Object.keys(emojiCounts);

              if (reactions.length === 0) return null;

              return (
                <View style={[styles.reactorsFilterRow, { borderBottomColor: colors.hairline }]}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 16 }}>
                    <TouchableOpacity
                      onPress={() => setReactorEmojiFilter('ALL')}
                      style={[
                        styles.reactorsFilterChip,
                        {
                          backgroundColor: reactorEmojiFilter === 'ALL' ? colors.primary : colors.wash,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.reactorsFilterChipText,
                          { color: reactorEmojiFilter === 'ALL' ? '#FFFFFF' : colors.text },
                        ]}
                      >
                        {locale === 'vi' ? 'Tất cả' : 'All'} ({reactions.length})
                      </Text>
                    </TouchableOpacity>

                    {uniqueEmojis.map((emoji) => (
                      <TouchableOpacity
                        key={emoji}
                        onPress={() => setReactorEmojiFilter(emoji)}
                        style={[
                          styles.reactorsFilterChip,
                          {
                            backgroundColor: reactorEmojiFilter === emoji ? `${colors.primary}25` : colors.wash,
                            borderColor: reactorEmojiFilter === emoji ? colors.primary : 'transparent',
                            borderWidth: 1,
                          },
                        ]}
                      >
                        <Text style={{ fontSize: 13 }}>{emoji}</Text>
                        <Text
                          style={[
                            styles.reactorsFilterChipText,
                            { color: reactorEmojiFilter === emoji ? colors.primary : colors.text },
                          ]}
                        >
                          {emojiCounts[emoji]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              );
            })()}

            {/* Reactors List */}
            <ScrollView style={styles.reactorsList} contentContainerStyle={{ padding: 16, gap: 12 }}>
              {(() => {
                const reactions = selectedMomentForReactors?.reactions || [];
                const filtered =
                  reactorEmojiFilter === 'ALL'
                    ? reactions
                    : reactions.filter((r: any) => r.emoji === reactorEmojiFilter);

                if (filtered.length === 0) {
                  return (
                    <View style={{ paddingVertical: 40, alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 32 }}>❤️</Text>
                      <Text style={{ fontSize: 13, color: colors.subtle }}>
                        {locale === 'vi' ? 'Chưa có lượt cảm xúc nào' : 'No reactions yet'}
                      </Text>
                    </View>
                  );
                }

                return filtered.map((r: any) => {
                  const displayName = r.user?.displayName || 'Người dùng';
                  const avatarUrl = r.user?.avatarUrl;
                  const relativeTime = formatMomentRelativeTime(r.createdAt, locale);

                  return (
                    <View key={r.id} style={styles.reactorItemRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                        <View style={{ position: 'relative' }}>
                          <View style={[styles.reactorItemAvatar, { backgroundColor: colors.primary }]}>
                            {avatarUrl ? (
                              <RNImage
                                source={{ uri: resolveMobileMediaUrl(avatarUrl) }}
                                style={styles.reactorItemAvatarImg}
                              />
                            ) : (
                              <Text style={styles.reactorItemAvatarText}>
                                {getInitials(displayName)}
                              </Text>
                            )}
                          </View>
                          {/* Mini emoji on bottom right of avatar */}
                          <View style={[styles.reactorItemAvatarEmoji, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                            <Text style={{ fontSize: 9 }}>{r.emoji}</Text>
                          </View>
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={[styles.reactorItemName, { color: colors.text }]} numberOfLines={1}>
                            {displayName}
                          </Text>
                          <Text style={[styles.reactorItemTime, { color: colors.subtle }]}>
                            {relativeTime}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.reactorEmojiPill, { backgroundColor: colors.wash }]}>
                        <Text style={{ fontSize: 16 }}>{r.emoji}</Text>
                      </View>
                    </View>
                  );
                });
              })()}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedTopHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 4,
    zIndex: 20,
  },
  friendsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 18,
    maxWidth: '75%',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  friendsPillText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  inlineDropdownWrapper: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    alignItems: 'center',
  },
  inlineDropdownMenu: {
    width: 260,
    borderRadius: 20,
    borderWidth: 1.2,
    paddingVertical: 6,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderBottomWidth: 0.5,
  },
  dropdownAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dropdownAvatarImg: {
    width: '100%',
    height: '100%',
  },
  dropdownAvatarText: {
    fontSize: 11,
    fontWeight: '800',
  },
  dropdownItemTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  dropdownItemSub: {
    fontSize: 10,
    marginTop: 1,
  },
  replyingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  replyingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pageContainer: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 14,
    paddingBottom: 72,
  },
  cameraContent: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  },
  momentWindow: {
    borderRadius: 28,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  momentWindowImage: {
    width: '100%',
    height: '100%',
  },
  cameraPermissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#18181B',
    gap: 10,
  },
  cameraPermissionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'center',
  },
  cameraPermissionSub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  cameraPermissionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  cameraPermissionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  galleryFallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    marginTop: 2,
  },
  galleryFallbackText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  cornerGuide: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderWidth: 2.5,
  },
  cornerTopLeft: {
    top: 14,
    left: 14,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: 14,
    right: 14,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: 14,
    left: 14,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: 14,
    right: 14,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  cameraInnerTopBar: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 35,
    elevation: 20,
  },
  cameraMiniBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraModePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  cameraModePillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  zoomBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  pipFloatingBox: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 92,
    height: 92,
    borderRadius: 18,
    borderWidth: 2.5,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 10,
  },
    pipFloatingImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15.5,
  },
  pipFloatingBoxFeed: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 92,
    height: 92,
    borderRadius: 18,
    borderWidth: 2.5,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 15,
  },
  pipTypeBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pipTypeBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  pipFlipBtn: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipFlipBtnText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  pipSwapOverlay: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pipCornerTag: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  capturedCaptionOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 35,
    elevation: 20,
  },
  captionInputPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 180,
    maxWidth: '92%',
    alignSelf: 'center',
  },
  captionTextInput: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
    maxHeight: 46,
  },
  captionLimitCounter: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  fixedControlsArea: {
    minHeight: 94,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  svgProgressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingStopSquare: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  shutterControlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  sideControlBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 4,
  },
  momentMainShutterOuter: {
    width: SHUTTER_SIZE,
    height: SHUTTER_SIZE,
    borderRadius: SHUTTER_SIZE / 2,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 12,
  },
  momentMainShutterInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
  },
  reviewBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sendMomentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  sendMomentBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  historyCueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 10,
  },
  historyCueThumb: {
    width: 26,
    height: 26,
    borderRadius: 8,
    overflow: 'hidden',
  },
  historyCueText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  momentFeedCard: {
    borderRadius: 26,
    borderWidth: 1.2,
    padding: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  momentFeedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  momentFeedAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  authorAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  authorAvatarImg: {
    width: '100%',
    height: '100%',
  },
  authorAvatarText: {
    fontSize: 12,
    fontWeight: '800',
  },
  authorDisplayName: {
    fontSize: 13,
    fontWeight: '700',
  },
  momentTimeText: {
    fontSize: 11,
  },
  pageIndexBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pageIndexText: {
    fontSize: 11,
    fontWeight: '800',
  },
  momentPhotoFrame: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  momentPhotoImage: {
    width: '100%',
    height: '100%',
  },
  feedGifBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  feedGifBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  noPhotoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCaptionContainer: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
    elevation: 15,
  },
  photoCaptionPill: {
    maxWidth: '92%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCaptionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    textAlign: 'center',
  },
  feedReplyOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    zIndex: 40,
    elevation: 25,
  },
  feedReplyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    borderRadius: 22,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 4,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    gap: 8,
  },
  feedReplyTextInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    paddingVertical: 4,
  },
  feedReplySendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  momentFeedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    gap: 8,
    paddingHorizontal: 2,
  },
  replyWithPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  replyWithPhotoText: {
    fontSize: 11,
    fontWeight: '700',
  },
  reactionEmojisBar: {
    flexDirection: 'row',
    gap: 6,
  },
  reactionMiniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  reactionEmojiText: {
    fontSize: 15,
  },
  reactionCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  authorReactorsBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorStackItem: {
    position: 'relative',
  },
  authorStackAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  authorStackAvatarImg: {
    width: '100%',
    height: '100%',
  },
  authorStackAvatarText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#000000',
  },
  authorStackEmojiBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorStackEmojiText: {
    fontSize: 8,
  },
  authorReactorsCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  authorNoReactionsText: {
    fontSize: 11,
    fontWeight: '600',
  },
  reactorsBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  reactorsSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  reactorsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  reactorsTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  reactorsCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  reactorsCountBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  reactorsCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactorsFilterRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  reactorsFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  reactorsFilterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  reactorsList: {
    maxHeight: 380,
  },
  reactorItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  reactorItemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  reactorItemAvatarImg: {
    width: '100%',
    height: '100%',
  },
  reactorItemAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
  },
  reactorItemAvatarEmoji: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactorItemName: {
    fontSize: 14,
    fontWeight: '600',
  },
  reactorItemTime: {
    fontSize: 11,
    marginTop: 2,
  },
  reactorEmojiPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHistoryBox: {
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: 10,
  },
  emptyHistoryTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyHistoryDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  firstSnapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 4,
  },
  firstSnapBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  floatingDockContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingDockBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 6,
    borderRadius: 30,
    borderWidth: 1.2,
    width: 270,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  dockIconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    width: 52,
  },
  dockBtnLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  dockCenterBtnOuter: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  dockCenterBtnInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  actionModalSheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1.2,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    gap: 14,
  },
  actionSheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
  },
  actionSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.15)',
  },
  actionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  actionHeaderThumb: {
    width: 46,
    height: 46,
    borderRadius: 14,
  },
  actionSheetTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionSheetSub: {
    fontSize: 11,
    marginTop: 2,
  },
  actionCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionList: {
    gap: 10,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  actionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionItemInfo: {
    flex: 1,
    gap: 2,
  },
  actionItemTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionItemDesc: {
    fontSize: 11,
  },
});
