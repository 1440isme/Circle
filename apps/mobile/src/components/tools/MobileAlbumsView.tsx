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
} from 'lucide-react-native';
import {
  getAlbumsApi,
  getAlbumDetailApi,
  createAlbumApi,
  deleteAlbumApi,
  addPhotosApi,
  deletePhotoApi,
} from '../../services/circle-tools.service';
import { uploadMobileMedia } from '../../services/storage-upload.service';
import { SharedAlbumEntity, PhotoEntity } from '@circle/types';
import { useThemeStore } from '../../stores/theme.store';
import { getGlassTheme } from '../../constants/glass-theme';
import { useLanguageStore } from '../../stores/language.store';


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
  const [albumDescription, setAlbumDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

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
  }, [circleId]);

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
        description: albumDescription.trim() || undefined,
      });
      setAlbumTitle('');
      setAlbumDescription('');
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
  // VIEW: ALBUMS LIST
  // =========================================================================
  return (
    <View style={[styles.container, { backgroundColor: colors.canvas }]}>
      {renderNoticeBanner()}

      {/* Floating Pill Button (Bỏ heading, thay nút Tạo album thành Floating Pill Button ở góc trên) */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: topClearance + 8,
          left: 16,
          right: 16,
          zIndex: 30,
          flexDirection: 'row',
          justifyContent: 'flex-end',
        }}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            setFormError(null);
            setIsCreateModalOpen(true);
          }}
          style={[styles.floatingTopPillBtn, { backgroundColor: colors.primary }]}
        >
          <Plus size={14} color={colors.onPrimary} />
          <Text style={[styles.floatingTopPillText, { color: colors.onPrimary }]}>
            {t.collab.createAlbum}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Scroll-under Content Layer */}
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.sage} style={{ marginTop: topClearance + 56 }} />
      ) : albums.length > 0 ? (
        <ScrollView
          contentContainerStyle={[
            styles.albumsList,
            { paddingTop: topClearance + 48, paddingBottom: Math.max(insets.bottom + 40, 60) },
          ]}
        >
          {albums.map((album) => {
            const coverUrl = album.photos?.[0]?.fileUrl;
            const photoCount = album._count?.photos || album.photos?.length || 0;
            return (
              <TouchableOpacity
                key={album.id}
                style={[styles.albumCard, { backgroundColor: colors.surface, borderColor: colors.hairline }]}
                onPress={() => loadAlbumDetail(album.id)}
              >
                <View style={styles.coverWrapper}>
                  {coverUrl ? (
                    <Image source={{ uri: coverUrl }} style={styles.coverImage} />
                  ) : (
                    <View style={styles.placeholderCover}>
                      <FolderOpen size={32} color={colors.subtle} />
                    </View>
                  )}
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {t.collab.albumPhotoUnit.replace('{count}', String(photoCount))}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{album.albumTitle}</Text>
                  {album.description ? (
                    <Text style={styles.cardDesc} numberOfLines={1}>
                      {album.description}
                    </Text>
                  ) : null}
                  <View style={styles.cardFooter}>
                    <Calendar size={12} color={colors.subtle} />
                    <Text style={styles.cardDate}>
                      {new Date(album.updatedAt).toLocaleDateString(dateLocale)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <View style={[styles.emptyContainer, { backgroundColor: colors.canvas, paddingTop: topClearance + 16 }]}>
          <FolderOpen size={48} color={colors.subtle} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.collab.emptyAlbumsTitle}</Text>
          <Text style={styles.emptySub}>{t.collab.emptyAlbumsDesc}</Text>
          <TouchableOpacity
            style={[styles.createEmptyBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              setFormError(null);
              setIsCreateModalOpen(true);
            }}
          >
            <Plus size={16} color={colors.onPrimary} />
            <Text style={[styles.createEmptyText, { color: colors.onPrimary }]}>{t.collab.createAlbum}</Text>
          </TouchableOpacity>
        </View>
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

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t.collab.albumDescLabel}</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.canvas, borderColor: colors.hairline, color: colors.text }]}
                placeholder={t.collab.albumDescPlaceholder}
                placeholderTextColor={colors.subtle}
                multiline
                numberOfLines={3}
                value={albumDescription}
                onChangeText={setAlbumDescription}
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
});
