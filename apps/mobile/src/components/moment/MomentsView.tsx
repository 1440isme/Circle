import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
import * as Haptics from 'expo-haptics';
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as Location from 'expo-location';
import { File, Paths, Directory } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

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
  Calendar,
  LayoutGrid,
  RotateCcw,
  MessageCircle,
  Share2,
  Download,
  Users,
  Filter,
  Check,
  Layers,
  Maximize2,
  Minimize2,
  MapPin,
  Trash2,
} from 'lucide-react-native';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';
import { useAuthStore } from '../../stores/auth.store';
import {
  useCircleMomentsQuery,
  useCircleMembersQuery,
  useReactMomentMutation,
  useCreateMomentMutation,
  useDeleteMomentMutation,
  useReplyMomentMutation,
} from '../../hooks/use-circle-queries';
import { getItem, setItem } from '../../services/storage';
import { uploadMobileMedia } from '../../services/storage-upload.service';
import { resolveMobileMediaUrl } from '../../services/api';
import { Emoji } from '../ui/Emoji';
import { MomentHistoryView, resolveMomentLocation } from './MomentHistoryView';


const { width: SCREEN_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  (Constants as any).appOwnership === 'expo';

// Safe dynamic resolution for native MultiCam module (only active on Development Build)
let DualCameraFrontView: any = null;
let DualCameraBackView: any = null;
let takeDualPictureAsync: any = null;
let checkDualCameraHardwareSupportedAsync: (() => Promise<boolean>) | null = null;

if (!isExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const dualCam = require('expo-dual-camera');
    DualCameraFrontView = dualCam?.DualCameraFrontView;
    DualCameraBackView = dualCam?.DualCameraBackView;
    takeDualPictureAsync = dualCam?.takePictureAsync;
    checkDualCameraHardwareSupportedAsync = dualCam?.isSupported;
  } catch {
    // Native module 'ExpoDualCamera' not present in this client
  }
}

const hasNativeDualCam = !isExpoGo && Boolean(DualCameraFrontView) && Boolean(DualCameraBackView);

export function resolveAuthorDisplayName(authorId?: string | null, authorObj?: any, membersList: any[] = []): string {
  if (authorId && Array.isArray(membersList) && membersList.length > 0) {
    const memberMatch = membersList.find(
      (m: any) => m.userId === authorId || m.id === authorId || m.user?.id === authorId
    );
    if (memberMatch?.nickname && memberMatch.nickname.trim().length > 0) {
      return memberMatch.nickname.trim();
    }
  }
  return (
    authorObj?.nickname ||
    authorObj?.profile?.displayName ||
    authorObj?.user?.profile?.displayName ||
    authorObj?.email?.split('@')[0] ||
    authorObj?.user?.email?.split('@')[0] ||
    'Thành viên'
  );
}

export function getPipCornerStyle(cornerIndex: number = 0, margin: number = 5) {
  switch (cornerIndex % 4) {
    case 0:
      return { top: margin, left: margin };
    case 1:
      return { top: margin, right: margin };
    case 2:
      return { bottom: margin + 16, right: margin };
    case 3:
      return { bottom: margin + 16, left: margin };
    default:
      return { top: margin, right: margin };
  }
}

export function getCompositePipPosition(cornerIdx: number = 1) {
  const margin = 12;
  switch (cornerIdx % 4) {
    case 0:
      return { top: margin, left: margin };
    case 1:
      return { top: margin, right: margin };
    case 2:
      return { bottom: margin, right: margin };
    case 3:
      return { bottom: margin, left: margin };
    default:
      return { top: margin, right: margin };
  }
}

export function getCompositeBrandingPosition(cornerIdx: number = 1) {
  return cornerIdx % 4 === 0 ? { top: 12, right: 12 } : { top: 12, left: 12 };
}

export function parseMomentPhotos(rawUrl?: string | null): { mainUrl: string; pipUrl: string | null; cornerIndex: number } {
  if (!rawUrl) return { mainUrl: '', pipUrl: null, cornerIndex: 0 };
  let mainPart = rawUrl;
  let pipUrl: string | null = null;
  let cornerIndex = 0;

  if (rawUrl.includes('#pip=')) {
    const parts = rawUrl.split('#pip=');
    mainPart = parts[0] || '';
    const pipPart = decodeURIComponent(parts[1] || '');
    let pip = pipPart;
    if (pipPart.includes('#corner=')) {
      const pipSplit = pipPart.split('#corner=');
      pip = pipSplit[0] || '';
      cornerIndex = parseInt(pipSplit[1] || '0', 10) || 0;
    }
    pip = pip.split('#')[0] || '';
    pipUrl = resolveMobileMediaUrl(pip) || null;
  }
  mainPart = mainPart.split('#')[0] || '';
  return {
    mainUrl: resolveMobileMediaUrl(mainPart),
    pipUrl,
    cornerIndex,
  };
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

const MomentVideoPlayer: React.FC<MomentVideoPlayerProps> = React.memo(({ uri, isMuted = true, style }) => {
  const player = useVideoPlayer(uri, (p: any) => {
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
});
MomentVideoPlayer.displayName = 'MomentVideoPlayer';

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

export const MomentFeedPipView: React.FC<MomentFeedPipViewProps> = React.memo(({
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
});
MomentFeedPipView.displayName = 'MomentFeedPipView';

interface MomentFeedCardItemProps {
  moment: any;
  listHeight: number;
  momentCardWidth: number;
  colors: any;
  locale: string;
  currentUserId?: string;
  members: any[];
  isSwapped: boolean;
  viewerPipCorner?: number;
  isReplyingThisMoment: boolean;
  keyboardShiftAnim: Animated.Value;
  chatReplyText: string;
  isPendingReply: boolean;
  onOpenActionMenu: (moment: any) => void;
  onSetScrollEnabled: (enabled: boolean) => void;
  onCornerChange: (momentId: string, newCorner: number) => void;
  onSwap: (momentId: string) => void;
  onOpenChatReply: (momentId: string, authorName: string) => void;
  onReplyWithPhoto: (authorName: string) => void;
  onSendChatReply: (momentId: string) => void;
  onChangeChatReplyText: (text: string) => void;
  onCancelChatReply: () => void;
  onSelectReactors: (moment: any) => void;
  onReactMoment: (momentId: string, emoji: string) => void;
}

const MomentFeedCardItem: React.FC<MomentFeedCardItemProps> = React.memo(({
  moment: m,
  listHeight,
  momentCardWidth,
  colors,
  locale,
  currentUserId,
  members,
  isSwapped,
  viewerPipCorner,
  isReplyingThisMoment,
  keyboardShiftAnim,
  chatReplyText,
  isPendingReply,
  onOpenActionMenu,
  onSetScrollEnabled,
  onCornerChange,
  onSwap,
  onOpenChatReply,
  onReplyWithPhoto,
  onSendChatReply,
  onChangeChatReplyText,
  onCancelChatReply,
  onSelectReactors,
  onReactMoment,
}) => {
  const authorName = resolveAuthorDisplayName(
    m.authorId || m.author?.id || m.userId || m.user?.id,
    m.author || m.user,
    members
  );
  const authorAvatar = m.author?.profile?.avatarUrl || m.user?.profile?.avatarUrl;
  const rawPhotoSrc = m.photoUrl || m.imageUrl;
  const { mainUrl, pipUrl, cornerIndex } = parseMomentPhotos(rawPhotoSrc);
  const displayMain = isSwapped ? (pipUrl || mainUrl) : mainUrl;
  const displayPip = isSwapped ? mainUrl : pipUrl;
  const formattedDate = formatMomentRelativeTime(m.createdAt, locale);
  const isAuthor = m.authorId === currentUserId || (m as any).userId === currentUserId;

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
        {/* Card Top: Author Info */}
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
        </View>

        {/* 1:1 Rounded Square Photo / Video with In-photo Caption Overlay & Dual View PiP (Nhấn giữ để mở tùy chọn) */}
        <TouchableOpacity
          activeOpacity={1}
          delayLongPress={220}
          onLongPress={() => onOpenActionMenu(m)}
          style={[styles.momentPhotoFrame, { backgroundColor: colors.wash }]}
        >
          {displayMain ? (
            m.mediaType === 'VIDEO' || displayMain.includes('.mp4') || displayMain.includes('.webm') ? (
              <MomentVideoPlayer uri={displayMain} style={styles.momentPhotoImage} />
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
              initialCornerIndex={viewerPipCorner ?? cornerIndex}
              momentSize={momentCardWidth - 16}
              primaryColor={colors.primary}
              onDragStart={() => onSetScrollEnabled(false)}
              onDragEnd={() => onSetScrollEnabled(true)}
              onCornerChange={(newCorner) => onCornerChange(m.id, newCorner)}
              onSwap={() => onSwap(m.id)}
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

          {/* Ô nhập phản hồi trực tiếp trên ảnh */}
          {isReplyingThisMoment && (
            <View style={styles.feedReplyOverlay} pointerEvents="box-none">
              <View style={styles.feedReplyPill}>
                <TextInput
                  value={chatReplyText}
                  onChangeText={onChangeChatReplyText}
                  placeholder={`Phản hồi ${authorName}...`}
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  maxLength={500}
                  autoFocus={true}
                  returnKeyType="send"
                  blurOnSubmit={true}
                  onSubmitEditing={() => onSendChatReply(m.id)}
                  style={styles.feedReplyTextInput}
                />

                <TouchableOpacity
                  disabled={!chatReplyText.trim() || isPendingReply}
                  onPress={() => onSendChatReply(m.id)}
                  style={[
                    styles.feedReplySendBtn,
                    {
                      backgroundColor: chatReplyText.trim() ? colors.primary : 'rgba(255,255,255,0.2)',
                    },
                  ]}
                >
                  {isPendingReply ? (
                    <ActivityIndicator size="small" color={colors.onPrimary} />
                  ) : (
                    <Send size={15} color={chatReplyText.trim() ? colors.onPrimary : 'rgba(255,255,255,0.6)'} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onCancelChatReply}
                  style={{ padding: 4 }}
                >
                  <X size={16} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Card Bottom: Reply Into Chat + Reply With Photo + Quick Emoji Reactions */}
        <View style={[styles.momentFeedFooter, { borderTopColor: colors.hairline }]}>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => onOpenChatReply(m.id, authorName)}
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
              onPress={() => onReplyWithPhoto(authorName)}
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
              onPress={() => onSelectReactors(m)}
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
                    onPress={() => onReactMoment(m.id, emoji)}
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
});
MomentFeedCardItem.displayName = 'MomentFeedCardItem';

interface MomentsViewProps {
  circleId: string;
  circleName: string;
  isActive?: boolean;
  selectedMemberId?: string | 'all';
  onSelectMemberId?: (id: string | 'all') => void;
  isHistoryActive?: boolean;
  onHistoryActiveChange?: (active: boolean) => void;
  historyViewMode?: 'month' | 'map';
  onHistoryViewModeChange?: (mode: 'month' | 'map') => void;
}

type FeedItem =
  | { type: 'camera'; id: string }
  | { type: 'empty'; id: string }
  | { type: 'moment'; id: string; data: any; index: number };

export function MomentsView({
  circleId,
  circleName,
  isActive = true,
  selectedMemberId: controlledMemberId,
  onSelectMemberId,
  isHistoryActive: controlledHistoryActive,
  onHistoryActiveChange,
  historyViewMode: controlledHistoryViewMode,
  onHistoryViewModeChange,
}: MomentsViewProps) {
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
  // Hybrid Dual-Photo Export State & Ref (dùng ghép 1 ảnh duy nhất khi Lưu / Chia sẻ)
  const [exportingCompositeData, setExportingCompositeData] = useState<{
    mainUri: string;
    pipUri?: string | null;
    cornerIndex: number;
    caption?: string | null;
  } | null>(null);
  const compositeCaptureViewRef = useRef<View>(null);
  const compositeMainLoadedRef = useRef(false);
  const compositePipLoadedRef = useRef(false);
  const compositeResolveRef = useRef<(() => void) | null>(null);

  const handleMainImageLoaded = useCallback(() => {
    compositeMainLoadedRef.current = true;
    if (compositePipLoadedRef.current || !exportingCompositeData?.pipUri) {
      compositeResolveRef.current?.();
    }
  }, [exportingCompositeData?.pipUri]);

  const handlePipImageLoaded = useCallback(() => {
    compositePipLoadedRef.current = true;
    if (compositeMainLoadedRef.current) {
      compositeResolveRef.current?.();
    }
  }, []);

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
  const deleteMomentMutation = useDeleteMomentMutation(circleId);
  const reactMomentMutation = useReactMomentMutation(circleId);
  const replyMomentMutation = useReplyMomentMutation(circleId);

  // Hidden moments state (for moments hidden/deleted by current user from their own view)
  const [hiddenMomentIds, setHiddenMomentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const stored = await getItem('circle_hidden_moments');
        if (stored) {
          const arr = JSON.parse(stored);
          if (Array.isArray(arr)) {
            setHiddenMomentIds(new Set(arr));
          }
        }
      } catch {}
    })();
  }, []);

  const hideMomentLocally = async (momentId: string) => {
    setHiddenMomentIds((prev) => {
      const next = new Set(prev);
      next.add(momentId);
      setItem('circle_hidden_moments', JSON.stringify(Array.from(next))).catch(() => {});
      return next;
    });
  };

  // Member Filter State (Trang 1..N: Lọc theo mọi người hoặc từng thành viên)
  const [internalMemberId, setInternalMemberId] = useState<string | 'all'>('all');
  const selectedMemberId = controlledMemberId !== undefined ? controlledMemberId : internalMemberId;
  const setSelectedMemberId = onSelectMemberId || setInternalMemberId;
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState<boolean>(false);

  // Grid View Mode State (Chế độ xem lưới tất cả khoảnh khắc)
  const [isGridViewActive, setIsGridViewActive] = useState<boolean>(false);
  const [selectedMomentForAction, setSelectedMomentForAction] = useState<any | null>(null);

  // History / Account Owner Moments Archive Modal & View Mode
  const [internalHistoryActive, setInternalHistoryActive] = useState<boolean>(false);
  const isHistoryViewActive = controlledHistoryActive !== undefined ? controlledHistoryActive : internalHistoryActive;
  const setIsHistoryViewActive = onHistoryActiveChange || setInternalHistoryActive;

  const [internalHistoryViewMode, setInternalHistoryViewMode] = useState<'month' | 'map'>('month');
  const historyViewMode = controlledHistoryViewMode !== undefined ? controlledHistoryViewMode : internalHistoryViewMode;
  const setHistoryViewMode = onHistoryViewModeChange || setInternalHistoryViewMode;

  // Reactors List Modal (Author only)
  const [selectedMomentForReactors, setSelectedMomentForReactors] = useState<any | null>(null);
  const [reactorEmojiFilter, setReactorEmojiFilter] = useState<string>('ALL');

  // Real Camera Viewfinder States (Moment UI & Dual View)
  const [cameraFacing, setCameraFacing] = useState<CameraType>('front');
  const [flashMode, setFlashMode] = useState<boolean>(false);
  const [isDualMode, setIsDualMode] = useState<boolean>(false);
  const [isHardwareConcurrentSupported, setIsHardwareConcurrentSupported] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    if (checkDualCameraHardwareSupportedAsync) {
      checkDualCameraHardwareSupportedAsync()
        .then((supported) => {
          if (isMounted) {
            setIsHardwareConcurrentSupported(Boolean(supported));
          }
        })
        .catch(() => {
          if (isMounted) {
            setIsHardwareConcurrentSupported(false);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, []);

  const canUseNativeConcurrent = hasNativeDualCam && isHardwareConcurrentSupported;
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

  // Layout calculations: full container height (synchronized with unified 2-layer parent header)
  const listHeight = Math.max(containerHeight, 300);

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

  // Silent background GPS location tracking for places map archive
  const capturedLocationRef = useRef<{
    locationName: string;
    address: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  const locationPromiseRef = useRef<Promise<{
    locationName: string;
    address: string;
    latitude: number;
    longitude: number;
  } | null> | null>(null);

  const fetchCurrentLocationSilently = () => {
    const promise = (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return null;

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const lat = loc.coords.latitude;
        const lng = loc.coords.longitude;

        let locationName = 'Vị trí đã chụp';
        let address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

        try {
          const rev = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
          if (rev && rev.length > 0) {
            const r = rev[0];
            const street = [r?.streetNumber, r?.street].filter(Boolean).join(' ');
            const sub = r?.district || r?.subregion || '';
            const city = r?.city || r?.region || '';
            const namePart = r?.name || street || sub || city;

            locationName = namePart || 'Vị trí đã chụp';
            address = [street, sub, city].filter(Boolean).join(', ') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          }
        } catch {
          // Reverse geocoding optional fallback
        }

        const result = { locationName, address, latitude: lat, longitude: lng };
        capturedLocationRef.current = result;
        return result;
      } catch {
        return null;
      }
    })();

    locationPromiseRef.current = promise;
    return promise;
  };

  useEffect(() => {
    if (capturedPhotoUrl) {
      fetchCurrentLocationSilently();
    } else {
      capturedLocationRef.current = null;
      locationPromiseRef.current = null;
    }
  }, [capturedPhotoUrl]);

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
  const [isActionProcessing, setIsActionProcessing] = useState<boolean>(false);



  // Lọc moments theo thành viên được chọn và loại bỏ các khoảnh khắc người dùng đã xóa/ẩn khỏi bên mình
  const filteredMoments = useMemo(() => {
    const list = selectedMemberId === 'all'
      ? moments
      : moments.filter(
        (m: any) =>
          m.authorId === selectedMemberId ||
          m.author?.id === selectedMemberId ||
          m.userId === selectedMemberId ||
          m.user?.id === selectedMemberId
      );
    return list.filter((m: any) => !hiddenMomentIds.has(m.id));
  }, [moments, selectedMemberId, hiddenMomentIds]);

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
      : selectedMember?.nickname ||
        selectedMember?.user?.profile?.displayName ||
        selectedMember?.profile?.displayName ||
        selectedMember?.user?.email?.split('@')[0] ||
        'Thành viên';

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

      if (isDualMode && canUseNativeConcurrent && takeDualPictureAsync) {
        // Dual Mode trên thiết bị có hỗ trợ concurrent camera thật (MultiCam):
        try {
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
            setCapturedMediaType('IMAGE');
            return;
          }
        } catch (dualErr) {
          console.warn('Native concurrent dual camera failed, smoothly falling back to sequential shot:', dualErr);
          setIsScreenFlashing(false);
        }
      }

      if (isDualMode && cameraRef.current) {
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
        });
        await new Promise((r) => setTimeout(r, 100));
        setIsScreenFlashing(false);
        const shot1Url = shot1?.uri || (shot1?.base64 ? `data:image/jpeg;base64,${shot1.base64}` : null);

        if (!shot1Url) {
          throw new Error('Không thể chụp ảnh từ camera 1');
        }

        // 2. Lật sang camera đối diện để chụp bức ảnh 2
        const secondFacing: CameraType = cameraFacing === 'front' ? 'back' : 'front';
        setCameraFacing(secondFacing);

        // Đợi native camera session khởi tạo góc thứ 2
        await new Promise((resolve) => setTimeout(resolve, 500));

        let shot2Url = shot1Url;
        try {
          if (cameraRef.current) {
            const shot2 = await cameraRef.current.takePictureAsync({
              quality: 0.78,
              exif: false,
              skipProcessing: false,
            });
            if (shot2?.uri) {
              shot2Url = shot2.uri;
            } else if (shot2?.base64) {
              shot2Url = `data:image/jpeg;base64,${shot2.base64}`;
            }
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
    capturedLocationRef.current = null;
    locationPromiseRef.current = null;
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

      // Silently retrieve the background-fetched location (max 1.5s race to avoid blocking send)
      let locData = capturedLocationRef.current;
      if (!locData && locationPromiseRef.current) {
        try {
          locData = await Promise.race([
            locationPromiseRef.current,
            new Promise<{ locationName: string; address: string; latitude: number; longitude: number } | null>(
              (resolve) => setTimeout(() => resolve(null), 1500),
            ),
          ]);
        } catch {
          locData = null;
        }
      }

      await createMomentMutation.mutateAsync({
        photoUrl: finalPhotoUrl,
        mediaType: capturedMediaType,
        caption: replyingToAuthor
          ? `Trả lời @${replyingToAuthor}: ${captionText.trim()}`
          : captionText.trim() || undefined,
        locationName: locData?.locationName || null,
        address: locData?.address || null,
        latitude: locData?.latitude ?? null,
        longitude: locData?.longitude ?? null,
        circleIds: [circleId],
      });
      setCapturedPhotoUrl(null);
      setDualPipPhotoUrl(null);
      setCaptionText('');
      setReplyingToAuthor(null);
      setCapturedMediaType('IMAGE');
      capturedLocationRef.current = null;
      locationPromiseRef.current = null;
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


  const handleSetScrollEnabled = useCallback((enabled: boolean) => {
    (flatListRef.current as any)?.setNativeProps?.({ scrollEnabled: enabled });
  }, []);

  const handleCornerChange = useCallback((momentId: string, newCorner: number) => {
    setViewerPipCorners((prev) => ({
      ...prev,
      [momentId]: newCorner,
    }));
  }, []);

  const handleSwap = useCallback((momentId: string) => {
    setSwappedMoments((prev) => ({
      ...prev,
      [momentId]: !prev[momentId],
    }));
  }, []);

  const handleSelectReactors = useCallback((moment: any) => {
    setSelectedMomentForReactors(moment);
    setReactorEmojiFilter('ALL');
  }, []);

  const handleCancelChatReply = useCallback(() => {
    setActiveReplyMomentId(null);
    setChatReplyText('');
    Keyboard.dismiss();
  }, []);

  const handleReplyWithPhoto = useCallback((authorName: string) => {
    setReplyingToAuthor(authorName);
    flatListRef.current?.scrollToIndex({ index: 0, animated: true });
    setCurrentPageIndex(0);
  }, []);

  const handleOpenChatReply = useCallback((momentId: string, authorName: string) => {
    setActiveReplyMomentId((prev) => {
      if (prev === momentId) {
        Keyboard.dismiss();
        return null;
      }
      return momentId;
    });
    setActiveReplyAuthorName(authorName);
    setChatReplyText('');
  }, []);

  const handleSendChatReply = useCallback(async (momentId: string) => {
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
  }, [chatReplyText, replyMomentMutation, circleId, t.common.appName, t.common.unknownError]);

  const handleReactMoment = useCallback((momentId: string, emoji: string) => {
    const target = moments.find((it: any) => it.id === momentId);
    if (target && (target.authorId === user?.id || (target as any).userId === user?.id)) {
      return;
    }
    reactMomentMutation.mutate({ momentId, emoji });
  }, [moments, user?.id, reactMomentMutation]);

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
  const feedItems: FeedItem[] = useMemo(() => [
    { type: 'camera', id: 'camera-view' },
    ...(filteredMoments.length === 0
      ? [{ type: 'empty' as const, id: 'empty-view' }]
      : filteredMoments.map((m: any, idx: number) => ({
        type: 'moment' as const,
        id: m.id || `moment-${idx}`,
        data: m,
        index: idx,
      }))),
  ], [filteredMoments]);

  // Active Moment / Photo Resolution for Action Menu (Hỗ trợ nhấn giữ ảnh bất kỳ hoặc ảnh trang hiện tại)
  const currentFeedItem = feedItems[currentPageIndex] || feedItems[0];
  const targetActionMoment = selectedMomentForAction || (currentFeedItem.type === 'moment' ? currentFeedItem.data : null);

  const currentActivePhotoUrl = targetActionMoment
    ? targetActionMoment.photoUrl || targetActionMoment.imageUrl
    : (currentFeedItem.type === 'moment'
      ? currentFeedItem.data?.photoUrl || currentFeedItem.data?.imageUrl
      : previewPhoto);

  const currentAuthorName = targetActionMoment
    ? resolveAuthorDisplayName(targetActionMoment.authorId || targetActionMoment.author?.id || targetActionMoment.user?.id, targetActionMoment.author || targetActionMoment.user, members)
    : (currentFeedItem.type === 'moment'
      ? resolveAuthorDisplayName(currentFeedItem.data?.authorId || currentFeedItem.data?.author?.id || currentFeedItem.data?.user?.id, currentFeedItem.data?.author || currentFeedItem.data?.user, members)
      : user?.profile?.displayName || 'Bạn');

  const prepareExportImageUri = async (): Promise<string | null> => {
    let rawMainUrl: string | null = null;
    let rawPipUrl: string | null = null;
    let exportCorner = 1;
    let caption: string | null = null;

    if (targetActionMoment) {
      const rawSrc = targetActionMoment.photoUrl || targetActionMoment.imageUrl;
      if (!rawSrc) return null;
      const parsed = parseMomentPhotos(rawSrc);
      const isSwapped = Boolean(swappedMoments[targetActionMoment.id]);
      rawMainUrl = isSwapped ? (parsed.pipUrl || parsed.mainUrl) : parsed.mainUrl;
      rawPipUrl = isSwapped ? parsed.mainUrl : parsed.pipUrl;
      exportCorner = viewerPipCorners[targetActionMoment.id] ?? parsed.cornerIndex ?? 1;
      caption = targetActionMoment.caption || null;
    } else if (currentFeedItem.type === 'moment' && currentFeedItem.data) {
      const rawSrc = currentFeedItem.data.photoUrl || currentFeedItem.data.imageUrl;
      if (!rawSrc) return null;
      const parsed = parseMomentPhotos(rawSrc);
      const isSwapped = Boolean(swappedMoments[currentFeedItem.data.id]);
      rawMainUrl = isSwapped ? (parsed.pipUrl || parsed.mainUrl) : parsed.mainUrl;
      rawPipUrl = isSwapped ? parsed.mainUrl : parsed.pipUrl;
      exportCorner = viewerPipCorners[currentFeedItem.data.id] ?? parsed.cornerIndex ?? 1;
      caption = currentFeedItem.data.caption || null;
    } else if (previewPhoto) {
      rawMainUrl = previewPhoto;
      rawPipUrl = dualPipPhotoUrl || null;
      exportCorner = pipCornerIndex ?? 1;
      caption = captionText.trim() || null;
    }

    if (!rawMainUrl) return null;

    const resolvedMainUrl = resolveMobileMediaUrl(rawMainUrl);
    const resolvedPipUrl = rawPipUrl ? resolveMobileMediaUrl(rawPipUrl) : null;

    const isVideo = resolvedMainUrl.includes('.mp4') || resolvedMainUrl.includes('.webm');
    if (isVideo) {
      const downloaded = await File.downloadFileAsync(resolvedMainUrl, new Directory(Paths.cache));
      return downloaded.uri;
    }

    // Nếu không có ảnh phụ PiP (Ảnh đơn): tải ảnh chính về lưu/chia sẻ ngay
    if (!resolvedPipUrl || resolvedPipUrl === resolvedMainUrl) {
      const downloaded = await File.downloadFileAsync(resolvedMainUrl, new Directory(Paths.cache));
      return downloaded.uri;
    }

    // Nếu là ảnh Dual (có cả ảnh trước và sau): Ghép thành 1 ảnh duy nhất (Hybrid export)
    const [downloadedMain, downloadedPip] = await Promise.all([
      File.downloadFileAsync(resolvedMainUrl, new Directory(Paths.cache)),
      File.downloadFileAsync(resolvedPipUrl, new Directory(Paths.cache)),
    ]);

    compositeMainLoadedRef.current = false;
    compositePipLoadedRef.current = false;

    const waitForImagesPromise = new Promise<void>((resolve) => {
      compositeResolveRef.current = resolve;
      // Timeout an toàn phòng trường hợp mạng hoặc render trễ (tối đa 2.5s)
      setTimeout(resolve, 2500);
    });

    setExportingCompositeData({
      mainUri: downloadedMain.uri,
      pipUri: downloadedPip.uri,
      cornerIndex: exportCorner,
      caption,
    });

    // Đợi 2 ảnh nạp và giải mã hoàn toàn vào GPU
    await waitForImagesPromise;
    // Chờ 1 nhịp ngắn (120ms) để buffer vẽ native của iOS/Android hoàn tất
    await new Promise((r) => setTimeout(r, 120));

    try {
      if (compositeCaptureViewRef.current) {
        const capturedUri = await captureRef(compositeCaptureViewRef.current, {
          format: 'jpg',
          quality: 0.96,
          width: 1080,
          height: 1080,
          result: 'tmpfile',
        });
        return capturedUri;
      }
    } catch (err) {
      console.warn('captureRef dual composite error, falling back to main photo:', err);
    } finally {
      setExportingCompositeData(null);
    }

    return downloadedMain.uri;
  };

  const handleSharePhoto = async () => {
    setIsActionMenuOpen(false);
    try {
      setIsActionProcessing(true);
      const exportUri = await prepareExportImageUri();
      if (!exportUri) return;

      const isVideo = exportUri.includes('.mp4') || exportUri.includes('.webm');

      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(exportUri, {
          mimeType: isVideo ? 'video/mp4' : 'image/jpeg',
          dialogTitle: 'Chia sẻ khoảnh khắc',
        });
      } else {
        await RNShare.share({
          message: `Khoảnh khắc từ nhóm ${circleName} trên Circle!`,
          url: exportUri,
        });
      }
    } catch (err: any) {
      console.warn('handleSharePhoto error:', err);
    } finally {
      setIsActionProcessing(false);
    }
  };

  const handleSaveImage = async () => {
    setIsActionMenuOpen(false);
    try {
      setIsActionProcessing(true);
      const exportUri = await prepareExportImageUri();
      if (!exportUri) return;

      // 1. Xin quyền truy cập Thư viện ảnh nếu cần
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status !== 'granted') {
        Alert.alert(t.common.appName, 'Cần cấp quyền truy cập thư viện để lưu vào thiết bị.');
        return;
      }

      // 2. Lưu chính thức vào Thư viện ảnh / Gallery của thiết bị (sử dụng API chuẩn Asset.create mới của Expo SDK 57)
      if (MediaLibrary.Asset && typeof MediaLibrary.Asset.create === 'function') {
        await MediaLibrary.Asset.create(exportUri);
      } else if (typeof (MediaLibrary as any).createAssetAsync === 'function') {
        await (MediaLibrary as any).createAssetAsync(exportUri);
      } else {
        await (MediaLibrary as any).saveToLibraryAsync(exportUri);
      }
      Alert.alert(t.common.appName, 'Đã lưu khoảnh khắc vào thư viện thiết bị thành công!');
    } catch (err: any) {
      Alert.alert(t.common.appName, err?.message || 'Không thể lưu vào thư viện thiết bị.');
    } finally {
      setIsActionProcessing(false);
    }
  };

  const handleDeleteMoment = () => {
    if (!selectedMomentForAction) return;
    const targetMoment = selectedMomentForAction;
    const isOwn =
      targetMoment.authorId === user?.id ||
      targetMoment.author?.id === user?.id ||
      targetMoment.userId === user?.id;

    setIsActionMenuOpen(false);

    if (isOwn) {
      Alert.alert(
        'Xoá vĩnh viễn khoảnh khắc?',
        'Khoảnh khắc này sẽ bị xoá vĩnh viễn khỏi Circle và bạn bè sẽ không thể xem lại nữa.',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Xoá vĩnh viễn',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteMomentMutation.mutateAsync(targetMoment.id);
                setTimeout(() => {
                  flatListRef.current?.scrollToIndex({ index: 0, animated: true });
                  setCurrentPageIndex(0);
                }, 200);
              } catch (err: any) {
                Alert.alert(t.common.appName, err?.message || 'Không thể xoá khoảnh khắc');
              }
            },
          },
        ],
      );
    } else {
      Alert.alert(
        'Xoá khỏi bên mình?',
        'Khoảnh khắc này sẽ được xoá khỏi trang của bạn. Bạn bè khác trong Vòng tròn vẫn có thể xem được bình thường.',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Xoá khỏi bên mình',
            style: 'destructive',
            onPress: async () => {
              await hideMomentLocally(targetMoment.id);
              setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: 0, animated: true });
                setCurrentPageIndex(0);
              }, 200);
            },
          },
        ],
      );
    }
  };

  const handleOpenActionMenuForMoment = useCallback((momentItem?: any) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    if (momentItem) {
      setSelectedMomentForAction(momentItem);
    }
    setIsActionMenuOpen(true);
  }, []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: listHeight,
      offset: listHeight * index,
      index,
    }),
    [listHeight]
  );

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

  const renderFeedItem = useCallback(
    ({ item, index }: { item: FeedItem; index: number }) => {
    if (item.type === 'camera') {
      return (
        <View style={[styles.pageContainer, { height: listHeight }]}>
          <Animated.View
            style={[
              styles.cameraContent,
              { transform: [{ translateY: keyboardShiftAnim }] },
            ]}
          >
            {/* Replying Badge when user is replying to a moment */}
            {replyingToAuthor && (
              <View style={[styles.replyingBadge, { backgroundColor: `${colors.warning}20`, marginBottom: 8 }]}>
                <MessageCircle size={13} color={colors.warning} />
                <Text style={[styles.replyingBadgeText, { color: colors.warning }]}>
                  Đáp lại: {replyingToAuthor}
                </Text>
                <TouchableOpacity onPress={() => setReplyingToAuthor(null)}>
                  <X size={13} color={colors.warning} />
                </TouchableOpacity>
              </View>
            )}

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
                  {isDualMode && canUseNativeConcurrent ? (
                    /* Dual Mode trên Development Build có hỗ trợ hardware concurrent: Live thật đồng thời cả 2 camera bằng expo-dual-camera */
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
              onPress={() => setIsHistoryViewActive(true)}
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
    return (
      <MomentFeedCardItem
        key={m.id}
        moment={m}
        listHeight={listHeight}
        momentCardWidth={momentCardWidth}
        colors={colors}
        locale={locale}
        currentUserId={user?.id}
        members={members}
        isSwapped={Boolean(swappedMoments[m.id])}
        viewerPipCorner={viewerPipCorners[m.id]}
        isReplyingThisMoment={activeReplyMomentId === m.id}
        keyboardShiftAnim={keyboardShiftAnim}
        chatReplyText={chatReplyText}
        isPendingReply={replyMomentMutation.isPending}
        onOpenActionMenu={handleOpenActionMenuForMoment}
        onSetScrollEnabled={handleSetScrollEnabled}
        onCornerChange={handleCornerChange}
        onSwap={handleSwap}
        onOpenChatReply={handleOpenChatReply}
        onReplyWithPhoto={handleReplyWithPhoto}
        onSendChatReply={handleSendChatReply}
        onChangeChatReplyText={setChatReplyText}
        onCancelChatReply={handleCancelChatReply}
        onSelectReactors={handleSelectReactors}
        onReactMoment={handleReactMoment}
      />
    );
  }, [
    listHeight,
    keyboardShiftAnim,
    replyingToAuthor,
    colors,
    momentFrameSize,
    capturedPhotoUrl,
    capturedMediaType,
    dualPipPhotoUrl,
    pipSwipePanResponder.panHandlers,
    pipPan,
    pipScale,
    isDualMode,
    canUseNativeConcurrent,
    cameraFacing,
    user?.id,
    members,
    user?.profile?.displayName,
    captionText,
    isActionProcessing,
    createMomentMutation.isPending,
    permission,
    requestPermission,
    cameraPinchPanResponder.panHandlers,
    cameraZoom,
    flashMode,
    displayZoomText,
    momentCardWidth,
    isRecordingVideo,
    selectedMemberId,
    selectedFilterName,
    circleName,
    t.moments.emptyCircleTitle,
    locale,
    swappedMoments,
    viewerPipCorners,
    activeReplyMomentId,
    chatReplyText,
    replyMomentMutation.isPending,
    handleOpenActionMenuForMoment,
    handleSetScrollEnabled,
    handleCornerChange,
    handleSwap,
    handleOpenChatReply,
    handleReplyWithPhoto,
    handleSendChatReply,
    handleCancelChatReply,
    handleSelectReactors,
    handleReactMoment,
  ]);

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        const h = Math.round(e.nativeEvent.layout.height);
        if (h > 200 && !isKeyboardOpenRef.current) {
          if (Math.abs(h - containerHeight) > 1) {
            setContainerHeight(h);
          }
        }
      }}
    >
      {/* =========================================================================
          NỘI DUNG CHÍNH: LỊCH SỬ KHOẢNH KHẮC (INLINE) HOẶC CHẾ ĐỘ XEM LƯỚI HOẶC SNAP PAGING FEED
         ========================================================================= */}
      {isHistoryViewActive ? (
        <MomentHistoryView
          onClose={() => setIsHistoryViewActive(false)}
          allCircleMoments={filteredMoments}
          capturedPhotoUrl={capturedPhotoUrl}
          containerHeight={containerHeight}
          viewMode={historyViewMode}
          onViewModeChange={setHistoryViewMode}
          hideInternalHeader={true}
        />
      ) : isGridViewActive ? (
        /* CHẾ ĐỘ XEM LƯỚI TẤT CẢ KHOẢNH KHẮC TRONG NHÓM (CHUẨN 3 CỘT ĐỀU NHAU) */
        <FlatList
          key="moments-grid-3-col"
          data={filteredMoments}
          numColumns={3}
          keyExtractor={(item, gIdx) => item.id || `grid-${gIdx}`}
          style={styles.gridContainer}
          contentContainerStyle={[styles.gridContentContainer, { paddingBottom: 110 }]}
          showsVerticalScrollIndicator={false}
          initialNumToRender={15}
          maxToRenderPerBatch={12}
          windowSize={5}
          ListEmptyComponent={
            <View style={styles.gridEmptyBox}>
              <View style={[styles.gridEmptyIconCircle, { backgroundColor: `${colors.primary}15` }]}>
                <ImageIcon size={32} color={colors.primary} />
              </View>
              <Text style={[styles.gridEmptyTitle, { color: colors.text }]}>
                {selectedMemberId === 'all' ? 'Chưa có khoảnh khắc nào' : `Chưa có khoảnh khắc từ ${selectedFilterName}`}
              </Text>
              <Text style={[styles.gridEmptyDesc, { color: colors.subtle }]}>
                Chụp khoảnh khắc đầu tiên để lưu lại kỷ niệm đáng nhớ cùng bạn bè
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  setIsGridViewActive(false);
                  scrollToCamera();
                }}
                style={[styles.gridEmptySnapBtn, { backgroundColor: colors.primary }]}
              >
                <Camera size={16} color={colors.onPrimary} />
                <Text style={[styles.gridEmptySnapBtnText, { color: colors.onPrimary }]}>
                  Chụp ảnh ngay
                </Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item, index: gIdx }) => {
            const { mainUrl, pipUrl, cornerIndex } = parseMomentPhotos(item.photoUrl || item.imageUrl);
            const displayPhoto = mainUrl || pipUrl;
            const authorDisplay = resolveAuthorDisplayName(item.authorId || item.author?.id || item.userId || item.user?.id, item.author || item.user, members);

            return (
              <TouchableOpacity
                key={item.id || `grid-${gIdx}`}
                activeOpacity={0.85}
                delayLongPress={220}
                onPress={() => {
                  // Nhấn để nhảy tới vị trí ảnh trong Feed
                  const feedIdx = feedItems.findIndex((fi) => fi.type === 'moment' && fi.data?.id === item.id);
                  setIsGridViewActive(false);
                  if (feedIdx >= 0) {
                    setTimeout(() => {
                      flatListRef.current?.scrollToIndex({ index: feedIdx, animated: true });
                      setCurrentPageIndex(feedIdx);
                    }, 120);
                  }
                }}
                onLongPress={() => handleOpenActionMenuForMoment(item)}
                style={[
                  styles.gridItemCell,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.hairline,
                  },
                ]}
              >
                {displayPhoto ? (
                  <RNImage
                    source={{ uri: displayPhoto }}
                    style={styles.gridItemPhoto}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.gridItemPhoto, { backgroundColor: colors.wash, alignItems: 'center', justifyContent: 'center' }]}>
                    <ImageIcon size={22} color={colors.subtle} />
                  </View>
                )}

                {/* Khung PiP thu nhỏ hiển thị ảnh góc chụp thứ 2 nếu là ảnh chụp kép Dual Cam */}
                {pipUrl && (
                  <View
                    style={[
                      styles.gridItemPipWindow,
                      getPipCornerStyle(cornerIndex, 5),
                      { borderColor: colors.primary },
                    ]}
                  >
                    <RNImage
                      source={{ uri: pipUrl }}
                      style={styles.gridItemPipPhoto}
                      resizeMode="cover"
                    />
                  </View>
                )}

                {/* Tên tác giả ở góc dưới (đã bỏ thời gian theo yêu cầu) */}
                <View style={styles.gridItemFooter}>
                  <Text numberOfLines={1} style={styles.gridItemAuthorText}>
                    {authorDisplay}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        <FlatList
          ref={flatListRef}
          data={feedItems}
          keyExtractor={(item) => item.id}
          renderItem={renderFeedItem}
          pagingEnabled={Platform.OS === 'ios'}
          snapToInterval={listHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum={true}
          scrollEnabled={!isPinchingCamera}
          showsVerticalScrollIndicator={false}
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={handleScrollEnd}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={3}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={Platform.OS === 'android'}
          getItemLayout={getItemLayout}
        />
      )}

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
          {/* Nút bên trái: Lịch sử (Icon Calendar, không text) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              if (isGridViewActive) setIsGridViewActive(false);
              setIsHistoryViewActive(!isHistoryViewActive);
            }}
            style={styles.dockIconBtn}
            accessibilityLabel="Lịch sử khoảnh khắc"
          >
            <Calendar
              size={24}
              color={isHistoryViewActive ? colors.primary : (currentPageIndex > 0 ? colors.primary : colors.text)}
            />
          </TouchableOpacity>

          {/* Nút chính giữa: Cố định kích thước. Nếu đang xem Lịch sử hoặc Xem Lưới -> bấm để quay lại Camera */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={
              isHistoryViewActive || isGridViewActive
                ? () => {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch {}
                    setIsHistoryViewActive(false);
                    setIsGridViewActive(false);
                    scrollToCamera();
                  }
                : (currentPageIndex === 0 ? () => {} : scrollToCamera)
            }
            style={[styles.dockCenterBtnOuter, { borderColor: colors.primary }]}
            accessibilityLabel="Camera hoặc Về đầu"
          >
            <View style={[styles.dockCenterBtnInner, { backgroundColor: colors.primary }]}>
              {isHistoryViewActive || isGridViewActive ? (
                <Camera size={22} color={colors.onPrimary} />
              ) : currentPageIndex === 0 ? (
                <Home size={22} color={colors.onPrimary} />
              ) : (
                <Camera size={22} color={colors.onPrimary} />
              )}
            </View>
          </TouchableOpacity>

          {/* Nút bên phải: Chế độ xem lưới (LayoutGrid, không text) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              if (isHistoryViewActive) setIsHistoryViewActive(false);
              setIsGridViewActive(!isGridViewActive);
            }}
            style={styles.dockIconBtn}
            accessibilityLabel="Chế độ xem lưới"
          >
            <LayoutGrid
              size={24}
              color={isGridViewActive ? colors.primary : colors.text}
            />
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
        onRequestClose={() => {
          setIsActionMenuOpen(false);
          setSelectedMomentForAction(null);
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            setIsActionMenuOpen(false);
            setSelectedMomentForAction(null);
          }}
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

            {/* Action Items List: Chia sẻ, Lưu, Xoá */}
            <View style={styles.actionList}>
              {/* Option 1: Chia sẻ */}
              <TouchableOpacity
                activeOpacity={0.75}
                disabled={isActionProcessing}
                onPress={handleSharePhoto}
                style={[styles.actionItem, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
              >
                <View style={[styles.actionIconBox, { backgroundColor: `${colors.primary}20` }]}>
                  {isActionProcessing ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Share2 size={20} color={colors.primary} />
                  )}
                </View>
                <View style={styles.actionItemInfo}>
                  <Text style={[styles.actionItemTitle, { color: colors.text, fontWeight: '600' }]}>Chia sẻ</Text>
                </View>
              </TouchableOpacity>

              {/* Option 2: Lưu */}
              <TouchableOpacity
                activeOpacity={0.75}
                disabled={isActionProcessing}
                onPress={handleSaveImage}
                style={[styles.actionItem, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
              >
                <View style={[styles.actionIconBox, { backgroundColor: `${colors.success}20` }]}>
                  {isActionProcessing ? (
                    <ActivityIndicator size="small" color={colors.success} />
                  ) : (
                    <Download size={20} color={colors.success} />
                  )}
                </View>
                <View style={styles.actionItemInfo}>
                  <Text style={[styles.actionItemTitle, { color: colors.text, fontWeight: '600' }]}>Lưu</Text>
                </View>
              </TouchableOpacity>

              {/* Option 3: Xoá */}
              <TouchableOpacity
                activeOpacity={0.75}
                disabled={isActionProcessing}
                onPress={handleDeleteMoment}
                style={[
                  styles.actionItem,
                  {
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
                    borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.25)',
                  },
                ]}
              >
                <View style={[styles.actionIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                  <Trash2 size={20} color={colors.danger} />
                </View>
                <View style={styles.actionItemInfo}>
                  <Text style={[styles.actionItemTitle, { color: colors.danger, fontWeight: '700' }]}>
                    Xoá
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


      {/* Offscreen Dual Photo Composite Capture Frame (Chỉ render khi người dùng bấm Lưu/Chia sẻ ảnh Dual) */}
      {/* Modal/Overlay xuất ảnh chất lượng cao (Hiển thị ngay trên màn hình để UIKit/Android rasterize 100% không bị đen) */}
      <Modal
        visible={Boolean(exportingCompositeData)}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.compositeModalBackdrop}>
          <View style={styles.compositeModalCard}>
            <View
              ref={compositeCaptureViewRef}
              collapsable={false}
              style={styles.compositeCaptureFrame}
            >
              {exportingCompositeData && (
                <>
                  <RNImage
                    source={{ uri: exportingCompositeData.mainUri }}
                    style={styles.compositeMainImage}
                    onLoad={handleMainImageLoaded}
                  />
                  {exportingCompositeData.pipUri && (
                    <View
                      style={[
                        styles.compositePipContainer,
                        getCompositePipPosition(exportingCompositeData.cornerIndex),
                      ]}
                    >
                      <RNImage
                        source={{ uri: exportingCompositeData.pipUri }}
                        style={styles.compositePipImage}
                        onLoad={handlePipImageLoaded}
                      />
                    </View>
                  )}

                  {exportingCompositeData.caption && (
                    <View style={styles.compositeCaptionWrapper}>
                      <View style={styles.compositeCaptionPill}>
                        <Text style={styles.compositeCaptionText} numberOfLines={2}>
                          {exportingCompositeData.caption}
                        </Text>
                      </View>
                    </View>
                  )}

                  <View
                    style={[
                      styles.compositeBrandingBadge,
                      getCompositeBrandingPosition(exportingCompositeData.cornerIndex),
                    ]}
                  >
                    <Text style={styles.compositeBrandingText}>Circle</Text>
                  </View>
                </>
              )}
            </View>

            {/* Spinner overlay with status */}
            <View style={styles.compositeSpinnerOverlay}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.compositeSpinnerText}>Đang xuất khoảnh khắc...</Text>
            </View>
          </View>
        </View>
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
    gap: 8,
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
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  gridContainer: {
    flex: 1,
  },
  gridContentContainer: {
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  gridItemCell: {
    flex: 1 / 3,
    aspectRatio: 1,
    margin: 3,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  gridItemPhoto: {
    width: '100%',
    height: '100%',
  },
  gridItemPipWindow: {
    position: 'absolute',
    width: '32%',
    height: '32%',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  gridItemPipPhoto: {
    width: '100%',
    height: '100%',
  },
  gridItemFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  gridItemAuthorText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  gridEmptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 10,
  },
  gridEmptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  gridEmptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  gridEmptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  gridEmptySnapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  gridEmptySnapBtnText: {
    fontSize: 13,
    fontWeight: '700',
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
  compositeModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compositeModalCard: {
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compositeCaptureFrame: {
    width: 320,
    height: 320,
    backgroundColor: '#18181B',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 24,
  },
  compositeMainImage: {
    width: 320,
    height: 320,
    resizeMode: 'cover',
  },
  compositePipContainer: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  compositePipImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  compositeCaptionWrapper: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  compositeCaptionPill: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    maxWidth: '85%',
  },
  compositeCaptionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  compositeBrandingBadge: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  compositeBrandingText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  compositeSpinnerOverlay: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  compositeSpinnerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
