import React, { useState, useRef } from 'react';
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
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import {
  Camera,
  RefreshCw,
  Zap,
  ZapOff,
  Home,
  Send,
  Heart,
  Image as ImageIcon,
  ChevronDown,
  X,
  Sparkles,
  History,
  RotateCcw,
  MessageCircle,
} from 'lucide-react-native';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';
import { useAuthStore } from '../../stores/auth.store';
import {
  useCircleMomentsQuery,
  useReactMomentMutation,
  useCreateMomentMutation,
} from '../../hooks/use-circle-queries';

const { width: SCREEN_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

const SAMPLE_CAPTURE_PHOTOS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface LocketMomentsViewProps {
  circleId: string;
  circleName: string;
}

type FeedItem =
  | { type: 'camera'; id: string }
  | { type: 'empty'; id: string }
  | { type: 'moment'; id: string; data: any; index: number };

export function LocketMomentsView({ circleId, circleName }: LocketMomentsViewProps) {
  const { colors, resolvedTheme } = useThemeStore();
  const t = useLanguageStore((s) => s.t);
  const user = useAuthStore((s) => s.user);
  const isDark = resolvedTheme === 'dark';

  const flatListRef = useRef<FlatList<FeedItem>>(null);
  const [containerHeight, setContainerHeight] = useState<number>(WINDOW_HEIGHT - 170);

  // Queries & Mutations
  const { data: moments = [], isLoading: isLoadingMoments } = useCircleMomentsQuery(circleId);
  const createMomentMutation = useCreateMomentMutation(circleId);
  const reactMomentMutation = useReactMomentMutation(circleId);

  // Camera Viewfinder States (Locket UI)
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');
  const [flashMode, setFlashMode] = useState<boolean>(false);
  const [activeSampleIndex, setActiveSampleIndex] = useState<number>(0);

  // Captured Photo State for review
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [captionText, setCaptionText] = useState<string>('');
  const [replyingToAuthor, setReplyingToAuthor] = useState<string | null>(null);

  // Page Tracking
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  // Bố cục khung ảnh to sát viền theo yêu cầu
  const locketFrameSize = Math.min(
    SCREEN_WIDTH - 20,
    containerHeight > 0 ? containerHeight - 200 : 360,
    360
  );

  const momentCardWidth = SCREEN_WIDTH - 20;

  // Shutter action
  const handleSnapPhoto = () => {
    const selectedUrl = SAMPLE_CAPTURE_PHOTOS[activeSampleIndex];
    setCapturedPhotoUrl(selectedUrl);
  };

  const handleFlipCamera = () => {
    setCameraFacing((prev) => (prev === 'front' ? 'back' : 'front'));
    setActiveSampleIndex((prev) => (prev + 1) % SAMPLE_CAPTURE_PHOTOS.length);
  };

  const handleToggleFlash = () => {
    setFlashMode((prev) => !prev);
  };

  const handleRetake = () => {
    setCapturedPhotoUrl(null);
    setCaptionText('');
    setReplyingToAuthor(null);
  };

  const handleSendMoment = async () => {
    if (!capturedPhotoUrl || !circleId) return;

    try {
      await createMomentMutation.mutateAsync({
        photoUrl: capturedPhotoUrl,
        caption: replyingToAuthor
          ? `Trả lời @${replyingToAuthor}: ${captionText.trim()}`
          : captionText.trim() || undefined,
        circleIds: [circleId],
      });
      setCapturedPhotoUrl(null);
      setCaptionText('');
      setReplyingToAuthor(null);
      // Snap down to the first moment page
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: 1, animated: true });
        setCurrentPageIndex(1);
      }, 350);
    } catch (err: any) {
      Alert.alert(t.common.appName, err?.message || t.common.unknownError);
    }
  };

  const handleReplyWithPhoto = (authorName: string) => {
    setReplyingToAuthor(authorName);
    flatListRef.current?.scrollToIndex({ index: 0, animated: true });
    setCurrentPageIndex(0);
  };

  const handleReactMoment = (momentId: string, emoji: string) => {
    reactMomentMutation.mutate({ momentId, emoji });
  };

  const scrollToFirstMoment = () => {
    flatListRef.current?.scrollToIndex({ index: 1, animated: true });
    setCurrentPageIndex(1);
  };

  const scrollToCamera = () => {
    flatListRef.current?.scrollToIndex({ index: 0, animated: true });
    setCurrentPageIndex(0);
  };

  const previewPhoto = capturedPhotoUrl || SAMPLE_CAPTURE_PHOTOS[activeSampleIndex];

  // Prepare full feed items (Page 0 = Camera, Page 1..N = Moments or Empty)
  const feedItems: FeedItem[] = [
    { type: 'camera', id: 'camera-view' },
    ...(moments.length === 0
      ? [{ type: 'empty' as const, id: 'empty-view' }]
      : moments.map((m: any, idx: number) => ({
          type: 'moment' as const,
          id: m.id || `moment-${idx}`,
          data: m,
          index: idx,
        }))),
  ];

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (containerHeight <= 0) return;
    const y = e.nativeEvent.contentOffset.y;
    const page = Math.round(y / containerHeight);
    if (page !== currentPageIndex && page >= 0 && page < feedItems.length) {
      setCurrentPageIndex(page);
    }
  };

  const renderFeedItem = ({ item }: { item: FeedItem; index: number }) => {
    if (item.type === 'camera') {
      return (
        <View style={[styles.pageContainer, { height: containerHeight }]}>
          <View style={styles.cameraContent}>
            {/* Header indicator banner */}
            <View style={styles.viewfinderHeader}>
              <View style={[styles.circleBadgeSmall, { backgroundColor: `${colors.primary}20` }]}>
                <Sparkles size={14} color={colors.primary} />
                <Text style={[styles.circleBadgeText, { color: colors.primary }]}>
                  {circleName}
                </Text>
              </View>
              {replyingToAuthor && (
                <View style={[styles.replyingBadge, { backgroundColor: `${colors.warning}20` }]}>
                  <MessageCircle size={12} color={colors.warning} />
                  <Text style={[styles.replyingBadgeText, { color: colors.warning }]}>
                    Đáp lại: {replyingToAuthor}
                  </Text>
                  <TouchableOpacity onPress={() => setReplyingToAuthor(null)}>
                    <X size={12} color={colors.warning} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Locket 1:1 Viewfinder Window (To sát viền) */}
            <View
              style={[
                styles.locketWindow,
                {
                  width: locketFrameSize,
                  height: locketFrameSize,
                  backgroundColor: colors.surface,
                  borderColor: colors.hairline,
                },
              ]}
            >
              <RNImage source={{ uri: previewPhoto }} style={styles.locketWindowImage} resizeMode="cover" />

              {!capturedPhotoUrl && (
                <>
                  <View style={[styles.cornerGuide, styles.cornerTopLeft, { borderColor: 'rgba(255,255,255,0.7)' }]} />
                  <View style={[styles.cornerGuide, styles.cornerTopRight, { borderColor: 'rgba(255,255,255,0.7)' }]} />
                  <View style={[styles.cornerGuide, styles.cornerBottomLeft, { borderColor: 'rgba(255,255,255,0.7)' }]} />
                  <View style={[styles.cornerGuide, styles.cornerBottomRight, { borderColor: 'rgba(255,255,255,0.7)' }]} />

                  {/* Top Overlay Controls inside Camera: Flash & Mode */}
                  <View style={styles.cameraInnerTopBar}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleToggleFlash}
                      style={[styles.cameraMiniBtn, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
                    >
                      {flashMode ? (
                        <Zap size={16} color="#FBBF24" fill="#FBBF24" />
                      ) : (
                        <ZapOff size={16} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>

                    <View style={[styles.cameraModePill, { backgroundColor: 'rgba(0,0,0,0.45)' }]}>
                      <Text style={styles.cameraModePillText}>
                        {cameraFacing === 'front' ? 'Camera trước' : 'Camera sau'}
                      </Text>
                    </View>
                  </View>
                </>
              )}

              {/* Caption Overlay on Captured Photo */}
              {capturedPhotoUrl && (
                <View style={styles.capturedCaptionOverlay}>
                  <View style={styles.captionInputPill}>
                    <TextInput
                      value={captionText}
                      onChangeText={setCaptionText}
                      placeholder="Thêm tin nhắn gửi bạn bè..."
                      placeholderTextColor="rgba(255,255,255,0.7)"
                      maxLength={140}
                      style={styles.captionTextInput}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* Review actions when photo is captured */}
            {capturedPhotoUrl ? (
              <View style={[styles.reviewActionsBar, { width: locketFrameSize }]}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleRetake}
                  style={[styles.reviewActionBtn, { backgroundColor: colors.wash, borderColor: colors.hairline }]}
                >
                  <RotateCcw size={18} color={colors.text} />
                  <Text style={[styles.reviewBtnText, { color: colors.text }]}>Chụp lại</Text>
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
                      <Send size={16} color={colors.onPrimary} />
                      <Text style={[styles.sendMomentBtnText, { color: colors.onPrimary }]}>
                        Gửi vào {circleName}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              /* Shutter controls bar right at Page 0 */
              <View style={styles.shutterControlsBar}>
                {/* Left Button: Flash Toggle */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleToggleFlash}
                  style={[styles.sideControlBtn, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
                >
                  {flashMode ? (
                    <Zap size={22} color="#FBBF24" fill="#FBBF24" />
                  ) : (
                    <ZapOff size={22} color={colors.text} />
                  )}
                </TouchableOpacity>

                {/* Center Button: Authentic Locket Double-Ring Shutter */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleSnapPhoto}
                  style={[
                    styles.locketMainShutterOuter,
                    {
                      borderColor: colors.primary,
                      backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)',
                    },
                  ]}
                >
                  <View style={[styles.locketMainShutterInner, { backgroundColor: colors.primary }]}>
                    <Camera size={26} color={colors.onPrimary} />
                  </View>
                </TouchableOpacity>

                {/* Right Button: Flip Camera */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleFlipCamera}
                  style={[styles.sideControlBtn, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
                >
                  <RefreshCw size={22} color={colors.text} />
                </TouchableOpacity>
              </View>
            )}

            {/* Scroll Down Cue to First Moment */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={scrollToFirstMoment}
              style={styles.scrollDownCue}
            >
              <Text style={[styles.scrollDownText, { color: colors.subtle }]}>
                Vuốt xuống xem khoảnh khắc ({moments.length})
              </Text>
              <ChevronDown size={16} color={colors.subtle} />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (item.type === 'empty') {
      return (
        <View style={[styles.pageContainer, { height: containerHeight }]}>
          <View style={[styles.emptyHistoryBox, { width: momentCardWidth, backgroundColor: colors.surface, borderColor: colors.hairline }]}>
            <ImageIcon size={44} color={colors.subtle} />
            <Text style={[styles.emptyHistoryTitle, { color: colors.text }]}>
              {t.moments.emptyCircleTitle}
            </Text>
            <Text style={[styles.emptyHistoryDesc, { color: colors.subtle }]}>
              Hãy là người đầu tiên chụp & chia sẻ khoảnh khắc với {circleName}!
            </Text>
            <TouchableOpacity
              onPress={scrollToCamera}
              style={[styles.firstSnapBtn, { backgroundColor: colors.primary }]}
            >
              <Camera size={16} color={colors.onPrimary} />
              <Text style={[styles.firstSnapBtnText, { color: colors.onPrimary }]}>
                Chụp khoảnh khắc ngay
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Single Moment Snap Card (1 card per page, To sát viền)
    const m = item.data;
    const authorName = m.user?.profile?.displayName || m.user?.email || 'User';
    const photoSrc = m.photoUrl || m.imageUrl;
    const formattedDate = new Date(m.createdAt).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={[styles.pageContainer, { height: containerHeight }]}>
        <View
          style={[
            styles.momentFeedCard,
            {
              width: momentCardWidth,
              backgroundColor: colors.surface,
              borderColor: colors.hairline,
            },
          ]}
        >
          {/* Card Top: Author Info + Index Badge */}
          <View style={styles.momentFeedHeader}>
            <View style={styles.momentFeedAuthor}>
              <View style={[styles.authorAvatar, { backgroundColor: `${colors.primary}20` }]}>
                {m.user?.profile?.avatarUrl ? (
                  <RNImage source={{ uri: m.user.profile.avatarUrl }} style={styles.authorAvatarImg} />
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
                {item.index + 1}/{moments.length}
              </Text>
            </View>
          </View>

          {/* 1:1 Rounded Square Photo with In-photo Caption Overlay (To sát viền) */}
          <View style={[styles.momentPhotoFrame, { backgroundColor: colors.wash }]}>
            {photoSrc ? (
              <RNImage source={{ uri: photoSrc }} style={styles.momentPhotoImage} resizeMode="cover" />
            ) : (
              <View style={styles.noPhotoPlaceholder}>
                <ImageIcon size={36} color={colors.subtle} />
              </View>
            )}

            {m.caption ? (
              <View style={styles.photoCaptionPill}>
                <Text numberOfLines={3} style={styles.photoCaptionText}>
                  {m.caption}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Card Bottom: Reply With Photo + Quick Emoji Reactions */}
          <View style={[styles.momentFeedFooter, { borderTopColor: colors.hairline }]}>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => handleReplyWithPhoto(authorName)}
              style={[styles.replyWithPhotoBtn, { backgroundColor: colors.wash }]}
            >
              <Camera size={14} color={colors.primary} />
              <Text style={[styles.replyWithPhotoText, { color: colors.text }]}>
                Đáp lại bằng ảnh
              </Text>
            </TouchableOpacity>

            <View style={styles.reactionEmojisBar}>
              {['❤️', '🔥', '👏', '🥰'].map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => handleReactMoment(m.id, emoji)}
                  style={[styles.reactionMiniPill, { backgroundColor: colors.wash }]}
                >
                  <Text style={styles.reactionEmojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        const h = e.nativeEvent.layout.height;
        if (h > 0 && Math.abs(h - containerHeight) > 5) {
          setContainerHeight(h);
        }
      }}
    >
      <FlatList
        ref={flatListRef}
        data={feedItems}
        keyExtractor={(item) => item.id}
        renderItem={renderFeedItem}
        pagingEnabled
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        getItemLayout={(_, index) => ({
          length: containerHeight,
          offset: containerHeight * index,
          index,
        })}
      />

      {/* =========================================================================
          FLOATING BOTTOM DOCK: LUÔN HIỆN Ở CẢ TRANG 0 VÀ CÁC TRANG LỊCH SỬ
          - Nút giữa cố định kích thước: Trang 0 là Ngôi nhà (Home), Trang >= 1 là Vòng tròn Camera
          - Nút bên trái là Lịch sử
          - Nút bên phải là Lật cam (ở trang 0) hoặc Chụp mới (ở trang lịch sử)
         ========================================================================= */}
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
            onPress={currentPageIndex === 0 ? () => {} : scrollToCamera}
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

          {/* Nút bên phải: Ở trang 0 là Lật cam, ở các trang lịch sử là Chụp mới */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={currentPageIndex === 0 ? handleFlipCamera : scrollToCamera}
            style={styles.dockIconBtn}
          >
            {currentPageIndex === 0 ? (
              <>
                <RefreshCw size={22} color={colors.text} />
                <Text style={[styles.dockBtnLabel, { color: colors.subtle }]}>Lật cam</Text>
              </>
            ) : (
              <>
                <Camera size={22} color={colors.primary} />
                <Text style={[styles.dockBtnLabel, { color: colors.primary }]}>Chụp mới</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageContainer: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingBottom: 84, // Chừa khoảng trống cho thanh floating dock
  },
  cameraContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  viewfinderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  circleBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  circleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  replyingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  replyingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  locketWindow: {
    borderRadius: 32,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  locketWindowImage: {
    width: '100%',
    height: '100%',
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
  capturedCaptionOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  captionInputPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  captionTextInput: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  shutterControlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 36,
    marginTop: 2,
  },
  sideControlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locketMainShutterOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 12,
  },
  locketMainShutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  reviewActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 44,
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
    height: 44,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  sendMomentBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  scrollDownCue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  scrollDownText: {
    fontSize: 12,
    fontWeight: '600',
  },
  momentFeedCard: {
    borderRadius: 28,
    borderWidth: 1.2,
    padding: 10,
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
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  momentPhotoImage: {
    width: '100%',
    height: '100%',
  },
  noPhotoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCaptionPill: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  photoCaptionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  reactionEmojiText: {
    fontSize: 15,
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
});
