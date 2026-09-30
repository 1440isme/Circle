import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  Image as RNImage,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Camera,
  RefreshCw,
  Zap,
  ZapOff,
  Plus,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LOCKET_FRAME_SIZE = Math.min(SCREEN_WIDTH - 32, 360);

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

export function LocketMomentsView({ circleId, circleName }: LocketMomentsViewProps) {
  const { colors, resolvedTheme } = useThemeStore();
  const t = useLanguageStore((s) => s.t);
  const user = useAuthStore((s) => s.user);
  const isDark = resolvedTheme === 'dark';

  const scrollViewRef = useRef<ScrollView>(null);

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
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [isUrlModalOpen, setIsUrlModalOpen] = useState<boolean>(false);
  const [replyingToAuthor, setReplyingToAuthor] = useState<string | null>(null);

  // Shutter action
  const handleSnapPhoto = () => {
    const selectedUrl = customUrlInput.trim() || SAMPLE_CAPTURE_PHOTOS[activeSampleIndex];
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
      // Smoothly scroll down to see newly posted moment in history
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: LOCKET_FRAME_SIZE + 140, animated: true });
      }, 500);
    } catch (err: any) {
      Alert.alert(t.common.appName, err?.message || t.common.unknownError);
    }
  };

  const handleReplyWithPhoto = (authorName: string) => {
    setReplyingToAuthor(authorName);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleReactMoment = (momentId: string, emoji: string) => {
    reactMomentMutation.mutate({ momentId, emoji });
  };

  const scrollToHistory = () => {
    scrollViewRef.current?.scrollTo({ y: LOCKET_FRAME_SIZE + 120, animated: true });
  };

  const scrollToCamera = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const previewPhoto = capturedPhotoUrl || SAMPLE_CAPTURE_PHOTOS[activeSampleIndex];

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* =========================================================================
            SECTION 1: LOCKET CAMERA VIEWFINDER (MÀN HÌNH CAMERA CHÍNH)
           ========================================================================= */}
        <View style={styles.cameraSection}>
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

          {/* Locket 1:1 Viewfinder Window */}
          <View
            style={[
              styles.locketWindow,
              {
                width: LOCKET_FRAME_SIZE,
                height: LOCKET_FRAME_SIZE,
                backgroundColor: colors.surface,
                borderColor: colors.hairline,
              },
            ]}
          >
            {/* Viewfinder Image */}
            <RNImage source={{ uri: previewPhoto }} style={styles.locketWindowImage} resizeMode="cover" />

            {/* Camera Corner Guides / Viewfinder Crosshairs */}
            {!capturedPhotoUrl && (
              <>
                <View style={[styles.cornerGuide, styles.cornerTopLeft, { borderColor: 'rgba(255,255,255,0.7)' }]} />
                <View style={[styles.cornerGuide, styles.cornerTopRight, { borderColor: 'rgba(255,255,255,0.7)' }]} />
                <View style={[styles.cornerGuide, styles.cornerBottomLeft, { borderColor: 'rgba(255,255,255,0.7)' }]} />
                <View style={[styles.cornerGuide, styles.cornerBottomRight, { borderColor: 'rgba(255,255,255,0.7)' }]} />

                {/* Top Overlay Controls inside Camera: Flash & Info */}
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

            {/* Captured Review Overlay: Caption input overlay on photo like Locket */}
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

          {/* =========================================================================
              CAMERA BOTTOM CONTROLS (NÚT CHỤP CHÍNH & XOAY CAM)
             ========================================================================= */}
          {capturedPhotoUrl ? (
            /* Review Actions Bar (Retake vs Send) */
            <View style={styles.reviewActionsBar}>
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
            /* Live Camera Shutter Controls Bar */
            <View style={styles.shutterControlsBar}>
              {/* Left Button: Flip Camera (Xoay Cam) */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleFlipCamera}
                style={[styles.sideControlBtn, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
              >
                <RefreshCw size={22} color={colors.text} />
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
                  <Camera size={28} color={colors.onPrimary} />
                </View>
              </TouchableOpacity>

              {/* Right Button: URL / Library preset */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsUrlModalOpen(!isUrlModalOpen)}
                style={[styles.sideControlBtn, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
              >
                <ImageIcon size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
          )}

          {/* Quick Custom Photo URL Dropdown */}
          {isUrlModalOpen && !capturedPhotoUrl && (
            <View style={[styles.customUrlBox, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
              <Text style={[styles.customUrlLabel, { color: colors.text }]}>Nhập URL ảnh chụp tùy ý:</Text>
              <TextInput
                value={customUrlInput}
                onChangeText={setCustomUrlInput}
                placeholder="https://images.unsplash.com/..."
                placeholderTextColor={colors.subtle}
                style={[styles.customUrlInput, { backgroundColor: colors.wash, borderColor: colors.hairline, color: colors.text }]}
              />
              <TouchableOpacity
                onPress={() => {
                  if (customUrlInput.trim()) {
                    setCapturedPhotoUrl(customUrlInput.trim());
                    setIsUrlModalOpen(false);
                  }
                }}
                style={[styles.usePhotoBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.usePhotoBtnText, { color: colors.onPrimary }]}>Dùng ảnh này</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Scroll Down to History Cue */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={scrollToHistory}
            style={styles.scrollDownCue}
          >
            <Text style={[styles.scrollDownText, { color: colors.subtle }]}>
              Vuốt xuống xem lịch sử đăng
            </Text>
            <ChevronDown size={18} color={colors.subtle} />
          </TouchableOpacity>
        </View>

        {/* =========================================================================
            SECTION 2: LỊCH SỬ ĐĂNG (MOMENTS TIMELINE & FEED)
           ========================================================================= */}
        <View style={styles.historySection}>
          <View style={styles.historySectionHeader}>
            <View style={styles.historyTitleRow}>
              <History size={18} color={colors.primary} />
              <Text style={[styles.historyTitle, { color: colors.text }]}>
                Khoảnh khắc của nhóm ({moments.length})
              </Text>
            </View>
            <TouchableOpacity onPress={scrollToCamera} style={[styles.backToCamBtn, { backgroundColor: colors.wash }]}>
              <Camera size={14} color={colors.primary} />
              <Text style={[styles.backToCamText, { color: colors.primary }]}>Chụp mới</Text>
            </TouchableOpacity>
          </View>

          {isLoadingMoments ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 40 }} />
          ) : moments.length === 0 ? (
            <View style={[styles.emptyHistoryBox, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
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
                <Text style={[styles.firstSnapBtnText, { color: colors.onPrimary }]}>Chụp khoảnh khắc ngay</Text>
              </TouchableOpacity>
            </View>
          ) : (
            moments.map((m: any) => {
              const authorName = m.user?.profile?.displayName || m.user?.email || 'User';
              const photoSrc = m.photoUrl || m.imageUrl;
              const formattedDate = new Date(m.createdAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <View
                  key={m.id}
                  style={[
                    styles.momentFeedCard,
                    {
                      width: LOCKET_FRAME_SIZE,
                      backgroundColor: colors.surface,
                      borderColor: colors.hairline,
                    },
                  ]}
                >
                  {/* Card Header: Author info */}
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
                  </View>

                  {/* Locket 1:1 Photo Frame */}
                  <View style={[styles.momentPhotoFrame, { backgroundColor: colors.wash }]}>
                    {photoSrc ? (
                      <RNImage source={{ uri: photoSrc }} style={styles.momentPhotoImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.noPhotoPlaceholder}>
                        <ImageIcon size={36} color={colors.subtle} />
                      </View>
                    )}

                    {/* Caption floating pill inside photo bottom like Locket */}
                    {m.caption ? (
                      <View style={styles.photoCaptionPill}>
                        <Text numberOfLines={3} style={styles.photoCaptionText}>
                          {m.caption}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Card Footer: Reply with photo & Emoji Reactions */}
                  <View style={[styles.momentFeedFooter, { borderTopColor: colors.hairline }]}>
                    {/* Reply with photo button */}
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

                    {/* Reaction Bar */}
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
              );
            })
          )}
        </View>
      </ScrollView>

      {/* =========================================================================
          SECTION 3: FLOATING MINI DOCK (LOCKET BOTTOM FLOATING BAR)
         ========================================================================= */}
      <View pointerEvents="box-none" style={styles.floatingDockContainer}>
        <View
          style={[
            styles.floatingDockBar,
            {
              backgroundColor: isDark ? 'rgba(25, 25, 25, 0.88)' : 'rgba(255, 255, 255, 0.92)',
              borderColor: colors.hairline,
            },
          ]}
        >
          {/* Left: Memory history button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={scrollToHistory}
            style={styles.dockIconBtn}
          >
            <History size={20} color={colors.text} />
            <Text style={[styles.dockBtnLabel, { color: colors.subtle }]}>Lịch sử</Text>
          </TouchableOpacity>

          {/* Center: Mini Locket Shutter */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={scrollToCamera}
            style={[styles.dockShutterOuter, { borderColor: colors.primary }]}
          >
            <View style={[styles.dockShutterInner, { backgroundColor: colors.primary }]}>
              <Plus size={22} color={colors.onPrimary} strokeWidth={3} />
            </View>
          </TouchableOpacity>

          {/* Right: Quick Capture / Preset */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={scrollToCamera}
            style={styles.dockIconBtn}
          >
            <Camera size={20} color={colors.text} />
            <Text style={[styles.dockBtnLabel, { color: colors.subtle }]}>Chụp</Text>
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
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 110,
  },
  cameraSection: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 24,
    gap: 16,
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
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
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
    gap: 32,
    marginTop: 4,
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
    width: 80,
    height: 80,
    borderRadius: 40,
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
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
    paddingHorizontal: 16,
    width: LOCKET_FRAME_SIZE,
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
  customUrlBox: {
    width: LOCKET_FRAME_SIZE,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
  },
  customUrlLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  customUrlInput: {
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 12,
  },
  usePhotoBtn: {
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  usePhotoBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scrollDownCue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  scrollDownText: {
    fontSize: 12,
    fontWeight: '600',
  },
  historySection: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 16,
    gap: 16,
  },
  historySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: LOCKET_FRAME_SIZE,
    paddingHorizontal: 4,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  backToCamBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  backToCamText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyHistoryBox: {
    width: LOCKET_FRAME_SIZE,
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
  momentFeedCard: {
    borderRadius: 28,
    borderWidth: 1.2,
    padding: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  momentFeedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  momentFeedAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 8,
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
  floatingDockContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingDockBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 28,
    borderWidth: 1.2,
    width: 260,
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
    width: 48,
  },
  dockBtnLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  dockShutterOuter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockShutterInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
