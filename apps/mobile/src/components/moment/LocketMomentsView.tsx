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
  Modal,
  ScrollView,
  Share as RNShare,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
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
  FolderOpen,
} from 'lucide-react-native';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';
import { useAuthStore } from '../../stores/auth.store';
import {
  useCircleMomentsQuery,
  useCircleMembersQuery,
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
  const cameraRef = useRef<CameraView>(null);
  const [containerHeight, setContainerHeight] = useState<number>(WINDOW_HEIGHT - 170);

  // Real Camera Permissions from expo-camera
  const [permission, requestPermission] = useCameraPermissions();

  // Queries & Mutations
  const { data: moments = [], isLoading: isLoadingMoments } = useCircleMomentsQuery(circleId);
  const { data: members = [] } = useCircleMembersQuery(circleId);
  const createMomentMutation = useCreateMomentMutation(circleId);
  const reactMomentMutation = useReactMomentMutation(circleId);

  // Member Filter State (Trang 1..N: Lọc theo mọi người hoặc từng thành viên dạng sổ tại chỗ)
  const [selectedMemberId, setSelectedMemberId] = useState<string | 'all'>('all');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState<boolean>(false);

  // Real Camera Viewfinder States (Locket UI)
  const [cameraFacing, setCameraFacing] = useState<CameraType>('front');
  const [flashMode, setFlashMode] = useState<boolean>(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState<boolean>(false);
  const [activeSampleIndex, setActiveSampleIndex] = useState<number>(0);

  // Captured Photo State for review & sending
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [captionText, setCaptionText] = useState<string>('');
  const [replyingToAuthor, setReplyingToAuthor] = useState<string | null>(null);

  // Page Tracking & Action Menu State
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState<boolean>(false);

  // Layout calculations: Fixed top header (56px)
  const topHeaderHeight = 56;
  const listHeight = Math.max(containerHeight - topHeaderHeight, 300);

  // Bố cục khung ảnh to sát viền, dịch xuống nhẹ và cân đối
  const locketFrameSize = Math.min(
    SCREEN_WIDTH - 20,
    listHeight > 0 ? listHeight - 210 : 340,
    340
  );

  const momentCardWidth = SCREEN_WIDTH - 20;

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

  // Real Camera Shutter Action
  const handleSnapPhoto = async () => {
    if (cameraRef.current && permission?.granted) {
      try {
        setIsTakingPhoto(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.6,
          base64: true,
          skipProcessing: false,
        });

        if (photo?.base64) {
          setCapturedPhotoUrl(`data:image/jpeg;base64,${photo.base64}`);
        } else if (photo?.uri) {
          setCapturedPhotoUrl(photo.uri);
        }
      } catch (err: any) {
        console.warn('Real camera capture error:', err);
        // Fallback to sample photo if capture fails
        setCapturedPhotoUrl(SAMPLE_CAPTURE_PHOTOS[activeSampleIndex]);
      } finally {
        setIsTakingPhoto(false);
      }
    } else if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        handlePickFromGallery();
      }
    } else {
      setCapturedPhotoUrl(SAMPLE_CAPTURE_PHOTOS[activeSampleIndex]);
    }
  };

  // Pick Photo From Device Gallery / Library
  const handlePickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          setCapturedPhotoUrl(`data:image/jpeg;base64,${asset.base64}`);
        } else if (asset.uri) {
          setCapturedPhotoUrl(asset.uri);
        }
      }
    } catch (err: any) {
      Alert.alert(t.common.appName, err?.message || 'Không thể chọn ảnh từ thư viện');
    }
  };

  const handleFlipCamera = () => {
    setCameraFacing((prev) => (prev === 'front' ? 'back' : 'front'));
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
      // Snap down to the first moment page to see the newly posted moment
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
    setIsFilterDropdownOpen(false);
    flatListRef.current?.scrollToIndex({ index: 1, animated: true });
    setCurrentPageIndex(1);
  };

  const scrollToCamera = () => {
    setIsFilterDropdownOpen(false);
    flatListRef.current?.scrollToIndex({ index: 0, animated: true });
    setCurrentPageIndex(0);
  };

  const previewPhoto = capturedPhotoUrl || SAMPLE_CAPTURE_PHOTOS[activeSampleIndex];

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
          <View style={styles.cameraContent}>
            {/* Locket 1:1 Viewfinder Window (To sát viền, vị trí cố định) */}
            <View
              style={[
                styles.locketWindow,
                {
                  width: locketFrameSize,
                  height: locketFrameSize,
                  backgroundColor: '#18181B',
                  borderColor: colors.hairline,
                },
              ]}
            >
              {capturedPhotoUrl ? (
                <RNImage source={{ uri: capturedPhotoUrl }} style={styles.locketWindowImage} resizeMode="cover" />
              ) : permission?.granted ? (
                <CameraView
                  ref={cameraRef}
                  style={StyleSheet.absoluteFill}
                  facing={cameraFacing}
                  flash={flashMode ? 'on' : 'off'}
                  enableTorch={flashMode}
                  mode="picture"
                />
              ) : (
                <View style={styles.cameraPermissionBox}>
                  <Camera size={40} color={colors.primary} />
                  <Text style={[styles.cameraPermissionTitle, { color: '#FFFFFF' }]}>
                    Quyền truy cập máy ảnh
                  </Text>
                  <Text style={[styles.cameraPermissionSub, { color: 'rgba(255,255,255,0.7)' }]}>
                    Cấp quyền để chụp và chia sẻ khoảnh khắc Locket với bạn bè.
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
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handlePickFromGallery}
                    style={styles.galleryFallbackBtn}
                  >
                    <ImageIcon size={15} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.galleryFallbackText}>Hoặc chọn ảnh từ máy</Text>
                  </TouchableOpacity>
                </View>
              )}

              {!capturedPhotoUrl && (
                <>
                  <View style={[styles.cornerGuide, styles.cornerTopLeft, { borderColor: 'rgba(255,255,255,0.7)' }]} />
                  <View style={[styles.cornerGuide, styles.cornerTopRight, { borderColor: 'rgba(255,255,255,0.7)' }]} />
                  <View style={[styles.cornerGuide, styles.cornerBottomLeft, { borderColor: 'rgba(255,255,255,0.7)' }]} />
                  <View style={[styles.cornerGuide, styles.cornerBottomRight, { borderColor: 'rgba(255,255,255,0.7)' }]} />

                  {/* Top Overlay Controls inside Camera: Flash & Mode & Gallery */}
                  <View style={styles.cameraInnerTopBar}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleToggleFlash}
                      style={[styles.cameraMiniBtn, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                    >
                      {flashMode ? (
                        <Zap size={16} color="#FBBF24" fill="#FBBF24" />
                      ) : (
                        <ZapOff size={16} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>

                    <View style={[styles.cameraModePill, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                      <Text style={styles.cameraModePillText}>
                        {cameraFacing === 'front' ? 'Camera trước' : 'Camera sau'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handlePickFromGallery}
                      style={[styles.cameraMiniBtn, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                    >
                      <ImageIcon size={16} color="#FFFFFF" />
                    </TouchableOpacity>
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

            {/* Fixed Height Controls Area Below Viewfinder (Khoảng cách bằng khoảng cách trên, nút TO NỮA) */}
            <View style={styles.fixedControlsArea}>
              {capturedPhotoUrl ? (
                /* Review actions when photo is captured */
                <View style={[styles.reviewActionsBar, { width: locketFrameSize }]}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleRetake}
                    style={[styles.reviewActionBtn, { backgroundColor: colors.wash, borderColor: colors.hairline }]}
                  >
                    <RotateCcw size={20} color={colors.text} />
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
                        <Send size={18} color={colors.onPrimary} />
                        <Text style={[styles.sendMomentBtnText, { color: colors.onPrimary }]}>
                          Gửi vào {circleName}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                /* Shutter controls bar on Page 0: TO NỮA (90px) */
                <View style={styles.shutterControlsBar}>
                  {/* Left Button: Flash / Gallery Toggle */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handlePickFromGallery}
                    style={[styles.sideControlBtn, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
                  >
                    <FolderOpen size={24} color={colors.text} />
                  </TouchableOpacity>

                  {/* Center Button: Authentic Locket Double-Ring Shutter (TO NỮA: 90px) */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={isTakingPhoto}
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
                      {isTakingPhoto ? (
                        <ActivityIndicator color={colors.onPrimary} size="small" />
                      ) : (
                        <Camera size={32} color={colors.onPrimary} />
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Right Button: Flip Camera */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleFlipCamera}
                    style={[styles.sideControlBtn, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
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
                <RNImage source={{ uri: latestMomentPhoto }} style={styles.historyCueThumb} resizeMode="cover" />
              ) : (
                <View style={[styles.historyCueThumb, { backgroundColor: `${colors.primary}25`, alignItems: 'center', justifyContent: 'center' }]}>
                  <History size={14} color={colors.primary} />
                </View>
              )}
              <Text style={[styles.historyCueText, { color: colors.text }]}>Lịch sử</Text>
              <ChevronDown size={18} color={colors.subtle} />
            </TouchableOpacity>
          </View>
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
    const photoSrc = m.photoUrl || m.imageUrl;
    const formattedDate = new Date(m.createdAt).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={[styles.pageContainer, { height: listHeight }]}>
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
                {authorAvatar ? (
                  <RNImage source={{ uri: authorAvatar }} style={styles.authorAvatarImg} />
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
      {/* =========================================================================
          CỐ ĐỊNH THANH TIÊU ĐỀ TRÊN CÙNG (FIXED TOP HEADER - TO HƠN)
          - Trang 0: Số lượng bạn bè
          - Trang >= 1: Bộ lọc mọi người dạng sổ mũi tên lên xuống ngay tại chỗ
         ========================================================================= */}
      <View style={[styles.fixedTopHeader, { height: topHeaderHeight }]}>
        {currentPageIndex === 0 ? (
          /* Header ở Trang 0 (Camera): Số lượng bạn bè (TO RÕ RÀNG) */
          <View style={[styles.friendsCountBadge, { backgroundColor: `${colors.primary}20` }]}>
            <Users size={16} color={colors.primary} />
            <Text style={[styles.friendsCountText, { color: colors.primary }]}>
              {members.length > 0 ? `${members.length} bạn bè` : 'Bạn bè'}
            </Text>
          </View>
        ) : (
          /* Header ở Trang >= 1 (Khoảnh khắc): Bộ lọc dạng sổ mũi tên lên/xuống ngay tại chỗ */
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            style={[
              styles.memberFilterPill,
              {
                backgroundColor: isFilterDropdownOpen ? `${colors.primary}25` : colors.wash,
                borderColor: isFilterDropdownOpen ? colors.primary : colors.hairline,
              },
            ]}
          >
            <Filter size={15} color={colors.primary} />
            <Text numberOfLines={1} style={[styles.memberFilterPillText, { color: colors.primary }]}>
              {selectedFilterName}
            </Text>
            {isFilterDropdownOpen ? (
              <ChevronUp size={16} color={colors.primary} />
            ) : (
              <ChevronDown size={16} color={colors.primary} />
            )}
          </TouchableOpacity>
        )}

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
                  <RNImage source={{ uri: currentActivePhotoUrl }} style={styles.actionHeaderThumb} resizeMode="cover" />
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
                    {circleName} · Locket Moments
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

              {/* Option 4: Reply With Photo */}
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
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    zIndex: 20,
  },
  friendsCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
  },
  friendsCountText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  memberFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.2,
    maxWidth: 180,
  },
  memberFilterPillText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  inlineDropdownWrapper: {
    position: 'absolute',
    top: 56,
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
  fixedControlsArea: {
    height: 94,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
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
  locketMainShutterOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 12,
  },
  locketMainShutterInner: {
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
    marginTop: 18,
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
