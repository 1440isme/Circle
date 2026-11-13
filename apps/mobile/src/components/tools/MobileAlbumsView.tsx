import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  FlatList,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import {
  FolderOpen,
  Plus,
  ArrowLeft,
  Trash2,
  X,
  UploadCloud,
  Calendar,
  Image as ImageIcon,
  Check,
  Link2,
  FileText,
  Globe,
  Copy,
  ExternalLink,
  Download,
  Search,
  Camera,
  Filter,
} from 'lucide-react-native';
import {
  getAlbumsApi,
  getAlbumDetailApi,
  createAlbumApi,
  deleteAlbumApi,
  addPhotosApi,
  deletePhotoApi,
  getMediaHubApi,
} from '../../services/circle-tools.service';
import { uploadMobileMedia } from '../../services/storage-upload.service';
import { SharedAlbumEntity, PhotoEntity, MediaHubResponse } from '@circle/types';
import { useThemeStore } from '../../stores/theme.store';
import { getGlassTheme } from '../../constants/glass-theme';
import { useLanguageStore } from '../../stores/language.store';
import { copyTextSafe } from '../../utils/clipboard';


interface MobileAlbumsViewProps {
  circleId: string;
}

export const MobileAlbumsView: React.FC<MobileAlbumsViewProps> = ({ circleId }) => {
  const { colors, resolvedTheme, uiStyle } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const isGlass = uiStyle === 'glass';
  const glassTheme = useMemo(() => getGlassTheme(isDark, uiStyle), [isDark, uiStyle]);
  const { t, locale } = useLanguageStore();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const photoSize = (width - 48) / 3;
  const dateLocale = locale === 'vi' ? 'vi-VN' : 'en-US';
  const topClearance = Math.max(insets.top + 52, Platform.OS === 'ios' ? 74 : 64);
  const styles = useMemo(() => createStyles(colors, isDark, photoSize), [colors, isDark, photoSize]);

  const [albums, setAlbums] = useState<SharedAlbumEntity[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<SharedAlbumEntity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  type HubTab = 'media' | 'links' | 'files';
  type MediaSubTab = 'albums' | 'all';

  const [activeTab, setActiveTab] = useState<HubTab>('media');
  const [mediaSubTab, setMediaSubTab] = useState<MediaSubTab>('albums');
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  const [mediaHub, setMediaHub] = useState<MediaHubResponse>({ media: [], links: [], files: [] });
  const [isLoadingHub, setIsLoadingHub] = useState(false);
  const mediaItems = mediaHub.media || [];
  const linkItems = mediaHub.links || [];
  const fileItems = mediaHub.files || [];

  const [selectedHubPhoto, setSelectedHubPhoto] = useState<any | null>(null);
  const photos = selectedAlbum?.photos || [];
  const selectedPhoto = selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null;
  const setSelectedPhoto = (photo: PhotoEntity | null) => {
    if (!photo) setSelectedPhotoIndex(null);
    else {
      const idx = photos.findIndex((p) => p.id === photo.id);
      setSelectedPhotoIndex(idx >= 0 ? idx : 0);
    }
  };

  // Inline feedback & 2-step delete confirmations (zero Alert.alert)
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isConfirmingDeleteAlbum, setIsConfirmingDeleteAlbum] = useState(false);
  const [isDeletingAlbum, setIsDeletingAlbum] = useState(false);
  const [isConfirmingDeletePhoto, setIsConfirmingDeletePhoto] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);

  // Create album modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [albumTitle, setAlbumTitle] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSenderId, setSelectedSenderId] = useState<string>('ALL');
  const [selectedFileType, setSelectedFileType] = useState<'ALL' | 'DOCS' | 'SHEETS' | 'ARCHIVES' | 'OTHER'>('ALL');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Extract unique senders
  const uniqueSenders = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    albums.forEach((alb) => {
      const u = alb.creator?.user;
      if (u?.id) {
        map.set(u.id, {
          id: u.id,
          name: u.profile?.displayName || t.collab.memberDefault,
        });
      }
    });
    mediaItems.forEach((m) => {
      const u = m.uploader?.user;
      if (u?.id) {
        map.set(u.id, {
          id: u.id,
          name: u.profile?.displayName || t.collab.memberDefault,
        });
      }
    });
    linkItems.forEach((l) => {
      const u = l.sender?.user;
      if (u?.id) {
        map.set(u.id, {
          id: u.id,
          name: u.profile?.displayName || t.collab.memberDefault,
        });
      }
    });
    fileItems.forEach((f) => {
      const u = f.sender?.user;
      if (u?.id) {
        map.set(u.id, {
          id: u.id,
          name: u.profile?.displayName || t.collab.memberDefault,
        });
      }
    });
    return Array.from(map.values());
  }, [albums, mediaItems, linkItems, fileItems, t]);

  const filteredAlbums = useMemo(() => {
    const result = albums.filter((alb) => {
      if (selectedSenderId !== 'ALL' && alb.creator?.user?.id !== selectedSenderId) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          alb.albumTitle.toLowerCase().includes(q) ||
          (alb.description && alb.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
    return result.sort((a, b) => {
      const timeA = new Date(a.updatedAt).getTime();
      const timeB = new Date(b.updatedAt).getTime();
      return timeB - timeA;
    });
  }, [albums, selectedSenderId, searchQuery]);

  const filteredMediaItems = useMemo(() => {
    const result = mediaItems.filter((item) => {
      if (selectedSenderId !== 'ALL' && item.uploader?.user?.id !== selectedSenderId) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          (item.caption && item.caption.toLowerCase().includes(q)) ||
          (item.fileName && item.fileName.toLowerCase().includes(q))
        );
      }
      return true;
    });
    return result.sort((a, b) => {
      const timeA = new Date(a.createdAt || '').getTime();
      const timeB = new Date(b.createdAt || '').getTime();
      return timeB - timeA;
    });
  }, [mediaItems, selectedSenderId, searchQuery]);

  const filteredLinkItems = useMemo(() => {
    const result = linkItems.filter((item) => {
      if (selectedSenderId !== 'ALL' && item.sender?.user?.id !== selectedSenderId) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return item.url.toLowerCase().includes(q) || item.domain.toLowerCase().includes(q);
      }
      return true;
    });
    return result.sort((a, b) => {
      const timeA = new Date(a.sentAt).getTime();
      const timeB = new Date(b.sentAt).getTime();
      return timeB - timeA;
    });
  }, [linkItems, selectedSenderId, searchQuery]);

  const filteredFileItems = useMemo(() => {
    const result = fileItems.filter((item) => {
      if (selectedSenderId !== 'ALL' && item.sender?.user?.id !== selectedSenderId) {
        return false;
      }
      if (selectedFileType !== 'ALL') {
        const ext = (item.extension || '').toUpperCase();
        if (selectedFileType === 'DOCS' && !['PDF', 'DOC', 'DOCX', 'TXT', 'MD'].includes(ext)) {
          return false;
        }
        if (selectedFileType === 'SHEETS' && !['XLS', 'XLSX', 'CSV'].includes(ext)) {
          return false;
        }
        if (selectedFileType === 'ARCHIVES' && !['ZIP', 'RAR', '7Z', 'TAR', 'GZ'].includes(ext)) {
          return false;
        }
        if (
          selectedFileType === 'OTHER' &&
          ['PDF', 'DOC', 'DOCX', 'TXT', 'MD', 'XLS', 'XLSX', 'CSV', 'ZIP', 'RAR', '7Z', 'TAR', 'GZ'].includes(ext)
        ) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.fileName.toLowerCase().includes(q) ||
          (item.extension && item.extension.toLowerCase().includes(q))
        );
      }
      return true;
    });
    return result.sort((a, b) => {
      const timeA = new Date(a.sentAt).getTime();
      const timeB = new Date(b.sentAt).getTime();
      return timeB - timeA;
    });
  }, [fileItems, selectedSenderId, selectedFileType, searchQuery]);

  const showNotice = (message: string, type: 'success' | 'error' = 'error') => {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    setStatusNotice({ type, message });
    statusTimerRef.current = setTimeout(() => {
      setStatusNotice(null);
    }, 3200);
  };

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    };
  }, []);

  const loadAlbums = async () => {
    try {
      setIsLoading(true);
      const data = await getAlbumsApi(circleId);
      setAlbums(data);
    } catch (err: any) {
      showNotice(err?.message || t.collab.loadAlbumsError, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMediaHub = async () => {
    try {
      setIsLoadingHub(true);
      const data = await getMediaHubApi(circleId);
      setMediaHub(data);
    } catch {
      // ignore
    } finally {
      setIsLoadingHub(false);
    }
  };

  const loadAlbumDetail = async (albumId: string) => {
    try {
      setIsLoading(true);
      setIsConfirmingDeleteAlbum(false);
      const data = await getAlbumDetailApi(circleId, albumId);
      setSelectedAlbum(data);
    } catch (err: any) {
      showNotice(err?.message || t.collab.loadAlbumDetailError, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlbums();
    loadMediaHub();
  }, [circleId]);

  const handleCopyLink = async (id: string, url: string) => {
    const ok = await copyTextSafe(url);
    if (ok) {
      setCopiedLinkId(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showNotice(t.collab.copyLinkSuccess, 'success');
      setTimeout(() => setCopiedLinkId(null), 2000);
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getFileExtColor = (ext?: string) => {
    const upper = (ext || '').toUpperCase();
    if (['PDF'].includes(upper))
      return { bg: 'rgba(239, 68, 68, 0.12)', text: '#EF4444' };
    if (['DOC', 'DOCX', 'TXT', 'MD'].includes(upper))
      return { bg: 'rgba(59, 130, 246, 0.12)', text: '#3B82F6' };
    if (['XLS', 'XLSX', 'CSV'].includes(upper))
      return { bg: 'rgba(16, 185, 129, 0.12)', text: '#10B981' };
    if (['ZIP', 'RAR', '7Z', 'TAR', 'GZ'].includes(upper))
      return { bg: 'rgba(245, 158, 11, 0.12)', text: '#F59E0B' };
    return { bg: 'rgba(168, 85, 247, 0.12)', text: '#A855F7' };
  };

  const handleCreateAlbum = async () => {
    if (!albumTitle.trim()) {
      setFormError(t.collab.enterAlbumNameError);
      return;
    }

    try {
      setIsCreating(true);
      setFormError(null);
      await createAlbumApi(circleId, {
        albumTitle: albumTitle.trim(),
      });
      setAlbumTitle('');
      setIsCreateModalOpen(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showNotice(t.collab.albumCreatedSuccess, 'success');
      loadAlbums();
    } catch (err: any) {
      setFormError(err?.message || t.collab.createAlbumError);
    } finally {
      setIsCreating(false);
    }
  };

  const handlePickAndUploadPhotos = async () => {
    if (!selectedAlbum) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      setIsUploading(true);
      const uploaded: {
        fileUrl: string;
        caption?: string;
        width?: number;
        height?: number;
      }[] = [];

      for (const asset of result.assets) {
        const uploadRes = await uploadMobileMedia({
          folder: 'albums',
          uri: asset.uri,
          fileName: asset.fileName || undefined,
        });

        if (uploadRes?.publicUrl) {
          uploaded.push({
            fileUrl: uploadRes.publicUrl,
            width: asset.width,
            height: asset.height,
          });
        }
      }

      if (uploaded.length > 0) {
        await addPhotosApi(circleId, selectedAlbum.id, { photos: uploaded });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showNotice(t.collab.albumUploadSuccess, 'success');
        loadAlbumDetail(selectedAlbum.id);
      }
    } catch (err: any) {
      showNotice(err?.message || t.collab.uploadPhotoAlbumError, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmDeleteAlbum = async () => {
    if (!selectedAlbum || isDeletingAlbum) return;
    try {
      setIsDeletingAlbum(true);
      await deleteAlbumApi(circleId, selectedAlbum.id);
      setIsConfirmingDeleteAlbum(false);
      setSelectedAlbum(null);
      loadAlbums();
    } catch (err: any) {
      showNotice(err?.message || t.collab.deleteAlbumError, 'error');
    } finally {
      setIsDeletingAlbum(false);
    }
  };

  const handleConfirmDeletePhoto = async () => {
    if (!selectedPhoto || isDeletingPhoto) return;
    try {
      setIsDeletingPhoto(true);
      await deletePhotoApi(circleId, selectedPhoto.id);
      setIsConfirmingDeletePhoto(false);
      setSelectedPhoto(null);
      if (selectedAlbum) {
        loadAlbumDetail(selectedAlbum.id);
      }
    } catch (err: any) {
      showNotice(err?.message || t.collab.deletePhotoError, 'error');
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  const renderNoticeBanner = () =>
    statusNotice ? (
      <View pointerEvents="box-none" style={[styles.noticeWrapper, { top: topClearance + 4 }]}>
        <View
          style={[
            styles.noticeBanner,
            {
              backgroundColor: colors.surface,
              borderColor: statusNotice.type === 'success' ? colors.sage : '#DC2626',
            },
          ]}
        >
          {statusNotice.type === 'success' ? (
            <Check size={14} color={colors.sage} />
          ) : (
            <X size={14} color="#DC2626" />
          )}
          <Text style={[styles.noticeText, { color: colors.text }]} numberOfLines={2}>
            {statusNotice.message}
          </Text>
          <TouchableOpacity
            onPress={() => setStatusNotice(null)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={14} color={colors.subtle} />
          </TouchableOpacity>
        </View>
      </View>
    ) : null;

  // =========================================================================
  // VIEW: ALBUM DETAIL
  // =========================================================================
  if (selectedAlbum) {
    const creatorName =
      selectedAlbum.creator?.user?.profile?.displayName || t.collab.memberDefault;
    const countText = t.collab.albumPhotoUnit.replace(
      '{count}',
      String(selectedAlbum.photos?.length || 0),
    );
    const creatorText = t.collab.calendarCreatorLabel.replace('{name}', creatorName);

    const pillBorderColor = isGlass ? glassTheme.colors.glassBorder : colors.hairline;
    const pillBgColor = isGlass ? glassTheme.colors.glassBg : colors.surface;

    const backButtonContent = (
      <TouchableOpacity
        style={styles.glassPillInner}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        onPress={() => {
          setIsConfirmingDeleteAlbum(false);
          setSelectedAlbum(null);
          loadAlbums();
        }}
        accessibilityLabel={t.common.back}
      >
        <ArrowLeft size={16} color={colors.text} />
        <Text style={styles.backText}>{t.common.back}</Text>
      </TouchableOpacity>
    );

    const deleteIconContent = (
      <TouchableOpacity
        style={styles.glassIconInner}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        onPress={() => setIsConfirmingDeleteAlbum((v) => !v)}
        accessibilityLabel={t.collab.deleteAlbumTitle}
      >
        <Trash2 size={16} color={colors.danger} />
      </TouchableOpacity>
    );

    return (
      <View style={[styles.container, { backgroundColor: colors.canvas }]}>
        {renderNoticeBanner()}

        {/* Floating Sub-toolbar (strictly gated Glass vs Flat) */}
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: topClearance,
            left: 16,
            right: 16,
            zIndex: 30,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {isGlass ? (
            <BlurView
              intensity={glassTheme.blur.intensity}
              tint={glassTheme.blur.tint}
              style={[styles.glassPillShell, { backgroundColor: pillBgColor, borderColor: pillBorderColor }]}
            >
              {backButtonContent}
            </BlurView>
          ) : (
            <View style={[styles.glassPillShell, { backgroundColor: pillBgColor, borderColor: pillBorderColor }]}>
              {backButtonContent}
            </View>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              style={[styles.uploadBtn, { backgroundColor: colors.primary }]}
              disabled={isUploading}
              onPress={handlePickAndUploadPhotos}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <>
                  <UploadCloud size={14} color={colors.onPrimary} />
                  <Text style={[styles.uploadBtnText, { color: colors.onPrimary }]}>
                    {t.collab.addPhotosBtn}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {isGlass ? (
              <BlurView
                intensity={glassTheme.blur.intensity}
                tint={glassTheme.blur.tint}
                style={[styles.glassIconShell, { backgroundColor: pillBgColor, borderColor: pillBorderColor }]}
              >
                {deleteIconContent}
              </BlurView>
            ) : (
              <View style={[styles.glassIconShell, { backgroundColor: pillBgColor, borderColor: pillBorderColor }]}>
                {deleteIconContent}
              </View>
            )}
          </View>
        </View>

        {/* Inline 2-step Confirm Bar for Deleting Album */}
        {isConfirmingDeleteAlbum && (
          <View
            style={[
              styles.inlineConfirmCard,
              {
                top: topClearance + 48,
                backgroundColor: colors.surface,
                borderColor: '#DC2626',
              },
            ]}
          >
            <Text style={[styles.inlineConfirmText, { color: colors.text }]}>
              {t.collab.deleteAlbumConfirm}
            </Text>
            <View style={styles.inlineConfirmActions}>
              <TouchableOpacity
                disabled={isDeletingAlbum}
                onPress={() => setIsConfirmingDeleteAlbum(false)}
                style={[styles.inlineCancelBtn, { backgroundColor: colors.wash, borderColor: colors.hairline }]}
              >
                <Text style={[styles.inlineCancelText, { color: colors.text }]}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={isDeletingAlbum}
                onPress={handleConfirmDeleteAlbum}
                style={styles.inlineDangerBtn}
              >
                {isDeletingAlbum ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.inlineDangerText}>{t.common.delete}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Photos Grid with scroll-under header */}
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.sage} style={{ marginTop: topClearance + 56 }} />
        ) : (
          <FlatList
            data={selectedAlbum.photos || []}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={[
              styles.photosGrid,
              { paddingTop: topClearance + (isConfirmingDeleteAlbum ? 148 : 54), paddingBottom: Math.max(insets.bottom + 40, 60) },
            ]}
            ListHeaderComponent={
              <View style={[styles.albumMetaPill, { backgroundColor: colors.surface, borderColor: colors.hairline }]}>
                <Text style={[styles.albumTitle, { color: colors.text }]}>{selectedAlbum.albumTitle}</Text>
                {selectedAlbum.description ? (
                  <Text style={styles.albumDesc}>{selectedAlbum.description}</Text>
                ) : null}
                <Text style={styles.photoCountText}>
                  {`${countText} · ${creatorText}`}
                </Text>
              </View>
            }
            ListEmptyComponent={
              <View style={[styles.emptyContainer, { backgroundColor: colors.canvas, paddingTop: 40 }]}>
                <ImageIcon size={40} color={colors.subtle} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {t.collab.albumEmptyPhotosTitle}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.photoThumbWrapper}
                onPress={() => {
                  setIsConfirmingDeletePhoto(false);
                  setSelectedPhoto(item);
                }}
              >
                <Image source={{ uri: item.fileUrl }} style={styles.photoThumb} />
              </TouchableOpacity>
            )}
          />
        )}

        {/* Lightbox Modal with Swipe Carousel & Pinch-to-zoom */}
        {selectedPhotoIndex !== null && selectedPhoto && (
          <Modal
            visible={selectedPhotoIndex !== null}
            transparent
            animationType="fade"
            onRequestClose={() => {
              setIsConfirmingDeletePhoto(false);
              setSelectedPhotoIndex(null);
            }}
          >
            <View style={styles.lightboxBackdrop}>
              {/* Header with Counter and Close */}
              <View style={styles.lightboxHeader}>
                <View style={styles.lightboxCounterBadge}>
                  <Text style={styles.lightboxCounterText}>
                    {selectedPhotoIndex + 1} / {photos.length}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.closeBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => {
                    setIsConfirmingDeletePhoto(false);
                    setSelectedPhotoIndex(null);
                  }}
                  accessibilityLabel={t.common.close}
                >
                  <X size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Swipe Carousel with Pinch-to-zoom */}
              <FlatList
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                data={photos}
                keyExtractor={(item) => item.id}
                initialScrollIndex={selectedPhotoIndex}
                getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
                onMomentumScrollEnd={(e) => {
                  const newIdx = Math.round(e.nativeEvent.contentOffset.x / width);
                  if (newIdx >= 0 && newIdx < photos.length) {
                    setSelectedPhotoIndex(newIdx);
                  }
                }}
                renderItem={({ item }) => (
                  <View style={{ width, height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                    <ScrollView
                      maximumZoomScale={3}
                      minimumZoomScale={1}
                      centerContent
                      showsHorizontalScrollIndicator={false}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{ width, height: '100%', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Image
                        source={{ uri: item.fileUrl }}
                        style={{ width, height: '80%' }}
                        resizeMode="contain"
                      />
                    </ScrollView>
                  </View>
                )}
              />

              <View style={[styles.lightboxFooter, { bottom: Math.max(insets.bottom + 20, 36) }]}>
                {isConfirmingDeletePhoto ? (
                  <View style={styles.lightboxConfirmRow}>
                    <Text style={styles.lightboxConfirmText} numberOfLines={2}>
                      {t.collab.deletePhotoConfirm}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        disabled={isDeletingPhoto}
                        onPress={() => setIsConfirmingDeletePhoto(false)}
                        style={styles.lightboxCancelBtn}
                      >
                        <Text style={styles.lightboxCancelText}>{t.common.cancel}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        disabled={isDeletingPhoto}
                        onPress={handleConfirmDeletePhoto}
                        style={styles.deletePhotoBtn}
                      >
                        {isDeletingPhoto ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.deletePhotoText}>{t.common.delete}</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <>
                    <Text style={styles.lightboxCaption} numberOfLines={2}>
                      {selectedPhoto.caption || t.collab.albumPhotoFallback}
                    </Text>
                    <TouchableOpacity
                      style={styles.deletePhotoBtn}
                      onPress={() => setIsConfirmingDeletePhoto(true)}
                    >
                      <Trash2 size={16} color="#FFFFFF" />
                      <Text style={styles.deletePhotoText}>{t.collab.albumDeletePhoto}</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </Modal>
        )}
      </View>
    );
  }

  // =========================================================================
  // VIEW: ALBUMS & MEDIA HUB LIST
  // =========================================================================
  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      {renderNoticeBanner()}

      {/* Floating Pill Controls Bar (Top 3 Tabs & Quick Action) */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: topClearance + 6,
          left: 14,
          right: 14,
          zIndex: 30,
          gap: 6,
        }}
      >
        {/* Row 1: 3 Tabs (File phương tiện, File liên kết, File) */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              padding: 3,
              backgroundColor: isDark ? 'rgba(29, 29, 33, 0.92)' : 'rgba(255, 255, 255, 0.94)',
              borderRadius: 999,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : colors.hairline,
            }}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('media')}
              style={[
                styles.floatingTabBtn,
                activeTab === 'media' && { backgroundColor: colors.primary },
              ]}
            >
              <ImageIcon size={13} color={activeTab === 'media' ? colors.onPrimary : colors.subtle} />
              <Text
                style={[
                  styles.floatingTabText,
                  { color: activeTab === 'media' ? colors.onPrimary : colors.text },
                ]}
              >
                {t.collab.tabMedia}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('links')}
              style={[
                styles.floatingTabBtn,
                activeTab === 'links' && { backgroundColor: colors.primary },
              ]}
            >
              <Link2 size={13} color={activeTab === 'links' ? colors.onPrimary : colors.subtle} />
              <Text
                style={[
                  styles.floatingTabText,
                  { color: activeTab === 'links' ? colors.onPrimary : colors.text },
                ]}
              >
                {t.collab.tabLinks}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('files')}
              style={[
                styles.floatingTabBtn,
                activeTab === 'files' && { backgroundColor: colors.primary },
              ]}
            >
              <FileText size={13} color={activeTab === 'files' ? colors.onPrimary : colors.subtle} />
              <Text
                style={[
                  styles.floatingTabText,
                  { color: activeTab === 'files' ? colors.onPrimary : colors.text },
                ]}
              >
                {t.collab.tabFiles}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Row 2: Search Input + Camera (Visual Search) + Filter by Sender */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={{
              flex: 1,
              height: 34,
              borderRadius: 17,
              backgroundColor: isDark ? 'rgba(29, 29, 33, 0.92)' : 'rgba(255, 255, 255, 0.94)',
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : colors.hairline,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 9,
            }}
          >
            <Search size={13} color={colors.subtle} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t.collab.searchMediaPlaceholder}
              placeholderTextColor={colors.subtle}
              style={{
                flex: 1,
                fontSize: 12,
                color: colors.text,
                paddingVertical: 0,
                paddingHorizontal: 6,
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={12} color={colors.subtle} />
              </TouchableOpacity>
            )}
          </View>

          {/* Button: Tìm kiếm theo ảnh (tab media) */}
          {activeTab === 'media' && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => showNotice(t.collab.imageSearchComingSoon, 'success')}
              style={{
                height: 34,
                paddingHorizontal: 10,
                borderRadius: 17,
                backgroundColor: isDark ? 'rgba(29, 29, 33, 0.92)' : 'rgba(255, 255, 255, 0.94)',
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : colors.hairline,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
              accessibilityLabel={t.collab.imageSearchBtn}
            >
              <Camera size={13} color={colors.primary} />
            </TouchableOpacity>
          )}

          {/* Filter by Sender Button */}
          {uniqueSenders.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsFilterModalOpen(true)}
              style={{
                height: 34,
                paddingHorizontal: 10,
                borderRadius: 17,
                backgroundColor: selectedSenderId !== 'ALL'
                  ? colors.primary
                  : isDark ? 'rgba(29, 29, 33, 0.92)' : 'rgba(255, 255, 255, 0.94)',
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : colors.hairline,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
              accessibilityLabel={t.collab.filterBySender}
            >
              <Filter size={12} color={selectedSenderId !== 'ALL' ? colors.onPrimary : colors.subtle} />
              {selectedSenderId !== 'ALL' && (
                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.onPrimary }} />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Row 3 for Files: Horizontal chips for file types */}
        {activeTab === 'files' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 5 }}>
            {[
              { key: 'ALL', label: t.collab.filterAllTypes },
              { key: 'DOCS', label: t.collab.fileTypeDocs },
              { key: 'SHEETS', label: t.collab.fileTypeSheets },
              { key: 'ARCHIVES', label: t.collab.fileTypeArchives },
              { key: 'OTHER', label: t.collab.fileTypeOther },
            ].map((ft) => (
              <TouchableOpacity
                key={ft.key}
                activeOpacity={0.8}
                onPress={() => setSelectedFileType(ft.key as any)}
                style={{
                  paddingHorizontal: 9,
                  paddingVertical: 3.5,
                  borderRadius: 11,
                  backgroundColor: selectedFileType === ft.key ? colors.primary : isDark ? 'rgba(29, 29, 33, 0.85)' : 'rgba(255, 255, 255, 0.9)',
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : colors.hairline,
                }}
              >
                <Text
                  style={{
                    fontSize: 10.5,
                    fontWeight: '600',
                    color: selectedFileType === ft.key ? colors.onPrimary : colors.subtle,
                  }}
                >
                  {ft.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* =================================================================== */}
      {/* TAB 1: FILE PHƯƠNG TIỆN (ALBUM CUỘN NGANG + TẤT CẢ FILE CỘT DỌC)   */}
      {/* =================================================================== */}
      {activeTab === 'media' && (
        <ScrollView
          contentContainerStyle={[
            styles.albumsList,
            { paddingTop: topClearance + 92, paddingBottom: Math.max(insets.bottom + 40, 60) },
          ]}
        >
          {/* Section 1: Album (Cuộn ngang - Horizontal Carousel) */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <FolderOpen size={16} color={colors.primary} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                  {t.collab.subtabAlbums}
                </Text>
                <View style={{ backgroundColor: colors.wash, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: colors.subtle }}>
                    {filteredAlbums.length}
                  </Text>
                </View>
                {/* Dấu cộng bên cạnh album */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setFormError(null);
                    setIsCreateModalOpen(true);
                  }}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: 4,
                  }}
                  accessibilityLabel={t.collab.createAlbum}
                >
                  <Plus size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Horizontal Scroll for Albums */}
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.sage} style={{ marginVertical: 20 }} />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, paddingVertical: 4 }}
              >
                {/* Quick Add Card (only shown when 0 albums) */}
                {filteredAlbums.length === 0 && (
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => {
                      setFormError(null);
                      setIsCreateModalOpen(true);
                    }}
                    style={{
                      width: 110,
                      height: 120,
                      borderRadius: 14,
                      borderWidth: 1.5,
                      borderStyle: 'dashed',
                      borderColor: colors.hairline,
                      backgroundColor: colors.wash,
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: colors.surface,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Plus size={16} color={colors.primary} />
                    </View>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
                      {t.collab.createAlbum}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Album Cards */}
                {filteredAlbums.map((album) => {
                  const coverUrl = album.photos?.[0]?.fileUrl;
                  const photoCount = album._count?.photos || album.photos?.length || 0;
                  return (
                    <TouchableOpacity
                      key={album.id}
                      activeOpacity={0.85}
                      onPress={() => loadAlbumDetail(album.id)}
                      style={{
                        width: 140,
                        height: 120,
                        borderRadius: 14,
                        overflow: 'hidden',
                        backgroundColor: colors.surface,
                        borderWidth: StyleSheet.hairlineWidth,
                        borderColor: colors.hairline,
                        justifyContent: 'flex-end',
                      }}
                    >
                      {coverUrl ? (
                        <Image
                          source={{ uri: coverUrl }}
                          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
                        />
                      ) : (
                        <View
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: colors.wash,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <FolderOpen size={28} color={colors.subtle} />
                        </View>
                      )}
                      <View
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(0,0,0,0.4)',
                        }}
                      />
                      <View
                        style={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          backgroundColor: 'rgba(0,0,0,0.65)',
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 6,
                        }}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '700' }}>
                          {photoCount}
                        </Text>
                      </View>
                      <View style={{ padding: 8 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }} numberOfLines={1}>
                          {album.albumTitle}
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 9, marginTop: 1 }} numberOfLines={1}>
                          {album.description || new Date(album.updatedAt).toLocaleDateString(dateLocale)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* Section 2: Tất cả file phương tiện (Lưới cột dọc trải dài) */}
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairline }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ImageIcon size={16} color={colors.primary} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
                  {t.collab.subtabAllMedia}
                </Text>
                <View style={{ backgroundColor: colors.wash, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: colors.subtle }}>
                    {filteredMediaItems.length}
                  </Text>
                </View>
              </View>
            </View>

            {isLoadingHub ? (
              <ActivityIndicator size="small" color={colors.sage} style={{ marginVertical: 30 }} />
            ) : filteredMediaItems.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {filteredMediaItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.85}
                    onPress={() => setSelectedHubPhoto(item)}
                    style={{
                      width: photoSize,
                      height: photoSize,
                      borderRadius: 12,
                      overflow: 'hidden',
                      backgroundColor: colors.wash,
                    }}
                  >
                    <Image source={{ uri: item.fileUrl }} style={{ width: '100%', height: '100%' }} />
                    {/* Top-left: Sender round avatar */}
                    <View
                      style={{
                        position: 'absolute',
                        top: 5,
                        left: 5,
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        overflow: 'hidden',
                        borderWidth: 1.5,
                        borderColor: '#FFFFFF',
                        backgroundColor: colors.surface,
                      }}
                    >
                      {item.uploader?.user?.profile?.avatarUrl ? (
                        <Image
                          source={{ uri: item.uploader.user.profile.avatarUrl }}
                          style={{ width: '100%', height: '100%' }}
                        />
                      ) : (
                        <View
                          style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: colors.primary,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ fontSize: 9, fontWeight: '700', color: colors.onPrimary }}>
                            {(item.uploader?.user?.profile?.displayName || 'C').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={[styles.emptyContainer, { backgroundColor: colors.canvas, paddingTop: 20 }]}>
                <ImageIcon size={40} color={colors.subtle} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.collab.emptyAllMediaTitle}</Text>
                <Text style={styles.emptySub}>{t.collab.emptyAllMediaDesc}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* =================================================================== */}
      {/* TAB 2: FILE LIÊN KẾT */}
      {/* =================================================================== */}
      {activeTab === 'links' && (
        <ScrollView
          contentContainerStyle={[
            styles.albumsList,
            { paddingTop: topClearance + 92, paddingBottom: Math.max(insets.bottom + 40, 60) },
          ]}
        >
          {isLoadingHub ? (
            <ActivityIndicator size="large" color={colors.sage} style={{ marginTop: 40 }} />
          ) : filteredLinkItems.length > 0 ? (
            filteredLinkItems.map((link) => (
              <View
                key={link.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 12,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.hairline,
                  gap: 12,
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => Linking.openURL(link.url)}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 0 }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Globe size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }} numberOfLines={1}>
                      {link.domain}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.subtle }} numberOfLines={1}>
                      {link.url}
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.subtle }}>
                      {link.sender?.user?.profile?.displayName || t.collab.memberDefault} •{' '}
                      {new Date(link.sentAt).toLocaleDateString(dateLocale)}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleCopyLink(link.id, link.url)}
                  style={{
                    padding: 8,
                    borderRadius: 16,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  }}
                  accessibilityLabel={t.collab.copyLinkAction}
                >
                  {copiedLinkId === link.id ? (
                    <Check size={14} color={colors.sage} />
                  ) : (
                    <Copy size={14} color={colors.text} />
                  )}
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={[styles.emptyContainer, { backgroundColor: colors.canvas, paddingTop: 30 }]}>
              <Link2 size={44} color={colors.subtle} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.collab.emptyLinksTitle}</Text>
              <Text style={styles.emptySub}>{t.collab.emptyLinksDesc}</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* =================================================================== */}
      {/* TAB 3: FILE TÀI LIỆU */}
      {/* =================================================================== */}
      {activeTab === 'files' && (
        <ScrollView
          contentContainerStyle={[
            styles.albumsList,
            { paddingTop: topClearance + 120, paddingBottom: Math.max(insets.bottom + 40, 60) },
          ]}
        >
          {isLoadingHub ? (
            <ActivityIndicator size="large" color={colors.sage} style={{ marginTop: 40 }} />
          ) : filteredFileItems.length > 0 ? (
            filteredFileItems.map((file) => {
              const extStyle = getFileExtColor(file.extension);
              return (
                <TouchableOpacity
                  key={file.id}
                  activeOpacity={0.7}
                  onPress={() => Linking.openURL(file.fileUrl)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 12,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.hairline,
                    gap: 12,
                  }}
                >
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <View
                      style={[
                        styles.fileExtBadge,
                        {
                          backgroundColor: extStyle.bg,
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          alignItems: 'center',
                          justifyContent: 'center',
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '800', color: extStyle.text }}>
                        {file.extension || 'FILE'}
                      </Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }} numberOfLines={1}>
                        {file.fileName}
                      </Text>
                      <Text style={{ fontSize: 10, color: colors.subtle }}>
                        {formatFileSize(file.fileSize)} •{' '}
                        {new Date(file.sentAt).toLocaleDateString(dateLocale)} •{' '}
                        {file.sender?.user?.profile?.displayName || t.collab.memberDefault}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      padding: 8,
                      borderRadius: 16,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    }}
                  >
                    <Download size={15} color={colors.text} />
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={[styles.emptyContainer, { backgroundColor: colors.canvas, paddingTop: 30 }]}>
              <FileText size={44} color={colors.subtle} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.collab.emptyFilesTitle}</Text>
              <Text style={styles.emptySub}>{t.collab.emptyFilesDesc}</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Filter by Sender Modal */}
      <Modal
        visible={isFilterModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFilterModalOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsFilterModalOpen(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              paddingBottom: Math.max(insets.bottom + 16, 24),
              maxHeight: '60%',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
                {t.collab.filterBySender}
              </Text>
              <TouchableOpacity onPress={() => setIsFilterModalOpen(false)}>
                <X size={18} color={colors.subtle} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TouchableOpacity
                onPress={() => {
                  setSelectedSenderId('ALL');
                  setIsFilterModalOpen(false);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 12,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.hairline,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: selectedSenderId === 'ALL' ? '700' : '500', color: selectedSenderId === 'ALL' ? colors.primary : colors.text }}>
                  {t.collab.filterAllSenders}
                </Text>
                {selectedSenderId === 'ALL' && <Check size={16} color={colors.primary} />}
              </TouchableOpacity>
              {uniqueSenders.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => {
                    setSelectedSenderId(s.id);
                    setIsFilterModalOpen(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 12,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.hairline,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: selectedSenderId === s.id ? '700' : '500', color: selectedSenderId === s.id ? colors.primary : colors.text }}>
                    {s.name}
                  </Text>
                  {selectedSenderId === s.id && <Check size={16} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Lightbox Modal for All Media Item */}
      {selectedHubPhoto && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setSelectedHubPhoto(null)}>
          <View style={styles.lightboxBackdrop}>
            <TouchableOpacity
              style={styles.lightboxCloseBtn}
              onPress={() => setSelectedHubPhoto(null)}
              accessibilityLabel={t.common.close}
            >
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <Image
              source={{ uri: selectedHubPhoto.fileUrl }}
              style={styles.lightboxImage}
              resizeMode="contain"
            />

            <View style={styles.lightboxFooter}>
              <Text style={styles.lightboxCaption} numberOfLines={2}>
                {selectedHubPhoto.caption || selectedHubPhoto.fileName || t.collab.albumPhotoFallback}
              </Text>
              <TouchableOpacity
                style={styles.deletePhotoBtn}
                onPress={() => Linking.openURL(selectedHubPhoto.fileUrl)}
              >
                <Download size={16} color="#FFFFFF" />
                <Text style={styles.deletePhotoText}>{t.collab.downloadPhotoAction}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Create Album Modal */}
      <Modal
        visible={isCreateModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCreateModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface,
                borderColor: colors.hairline,
                paddingBottom: Math.max(insets.bottom + 16, 20),
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t.collab.albumCreateModalTitle}</Text>
              <TouchableOpacity
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => setIsCreateModalOpen(false)}
                accessibilityLabel={t.common.close}
              >
                <X size={20} color={colors.subtle} />
              </TouchableOpacity>
            </View>

            {formError && (
              <View style={styles.formErrorBox}>
                <Text style={styles.formErrorText}>{formError}</Text>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t.collab.albumNameRequiredLabel}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.canvas, borderColor: colors.hairline, color: colors.text }]}
                placeholder={t.collab.albumNameExample}
                placeholderTextColor={colors.subtle}
                value={albumTitle}
                onChangeText={(txt) => {
                  setAlbumTitle(txt);
                  if (formError) setFormError(null);
                }}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                disabled={isCreating}
                onPress={() => setIsCreateModalOpen(false)}
              >
                <Text style={styles.cancelText}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                disabled={isCreating}
                onPress={handleCreateAlbum}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <Text style={[styles.submitText, { color: colors.onPrimary }]}>{t.collab.albumCreateSubmit}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const createStyles = (colors: any, isDark: boolean, photoSize: number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  albumsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  glassPillShell: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  glassPillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  glassIconShell: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  glassIconInner: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumMetaPill: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  floatingTopPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  floatingTopPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 20,
  },
  fabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  albumCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: 'hidden',
  },
  coverWrapper: {
    width: '100%',
    height: 140,
    backgroundColor: colors.wash,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderCover: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  cardInfo: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  cardDesc: {
    fontSize: 11,
    color: colors.subtle,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  cardDate: {
    fontSize: 10,
    color: colors.subtle,
  },
  backText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  uploadBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  albumTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  albumDesc: {
    fontSize: 12,
    color: colors.subtle,
    marginTop: 4,
  },
  photoCountText: {
    fontSize: 11,
    color: colors.subtle,
    marginTop: 4,
  },
  photosGrid: {
    padding: 12,
    gap: 6,
  },
  photoThumbWrapper: {
    width: photoSize,
    height: photoSize,
    margin: 3,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.wash,
  },
  photoThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 12,
    color: colors.subtle,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  createEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
  },
  createEmptyText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  formErrorBox: {
    backgroundColor: isDark ? 'rgba(220, 38, 38, 0.14)' : 'rgba(220, 38, 38, 0.08)',
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  formErrorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.subtle,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.text,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 13,
    color: colors.subtle,
    fontWeight: '600',
  },
  submitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontSize: 13,
    fontWeight: '700',
  },
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxHeader: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lightboxCounterBadge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  lightboxCounterText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 20,
  },
  lightboxImage: {
    width: '100%',
    height: '72%',
  },
  lightboxFooter: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  lightboxCaption: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  lightboxConfirmRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(24,24,27,0.9)',
    borderColor: '#DC2626',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  lightboxConfirmText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  lightboxCancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  lightboxCancelText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  deletePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deletePhotoText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  noticeWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 45,
    alignItems: 'center',
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 6,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  inlineConfirmCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 28,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
  inlineConfirmText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  inlineConfirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  inlineCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  inlineCancelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inlineDangerBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineDangerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  floatingTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  floatingTabText: {
    fontSize: 11,
    fontWeight: '700',
  },
  subTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  subTabText: {
    fontSize: 11,
    fontWeight: '700',
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  linkIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileExtBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkDomain: {
    fontSize: 13,
    fontWeight: '700',
  },
  linkUrl: {
    fontSize: 11,
  },
  linkSender: {
    fontSize: 10,
  },
  linkActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 20,
  },
});
