import React, { useState, useEffect } from 'react';
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
  Alert,
  FlatList,
  Dimensions,
} from 'react-native';
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

interface MobileAlbumsViewProps {
  circleId: string;
}

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 48) / 3;

export const MobileAlbumsView: React.FC<MobileAlbumsViewProps> = ({ circleId }) => {
  const [albums, setAlbums] = useState<SharedAlbumEntity[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<SharedAlbumEntity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoEntity | null>(null);

  // Create album modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumDescription, setAlbumDescription] = useState('');

  const loadAlbums = async () => {
    try {
      setIsLoading(true);
      const data = await getAlbumsApi(circleId);
      setAlbums(data);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể tải danh sách album');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAlbumDetail = async (albumId: string) => {
    try {
      setIsLoading(true);
      const data = await getAlbumDetailApi(circleId, albumId);
      setSelectedAlbum(data);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể tải chi tiết album');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlbums();
  }, [circleId]);

  const handleCreateAlbum = async () => {
    if (!albumTitle.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập tên album');
      return;
    }

    try {
      await createAlbumApi(circleId, {
        albumTitle: albumTitle.trim(),
        description: albumDescription.trim() || undefined,
      });
      setAlbumTitle('');
      setAlbumDescription('');
      setIsCreateModalOpen(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadAlbums();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể tạo album');
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
        loadAlbumDetail(selectedAlbum.id);
      }
    } catch (err: any) {
      Alert.alert('Lỗi tải ảnh', err.message || 'Không thể tải ảnh lên album');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAlbum = (albumId: string) => {
    Alert.alert('Xóa Album', 'Bạn có chắc chắn muốn xóa album này và toàn bộ ảnh bên trong?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa vĩnh viễn',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAlbumApi(circleId, albumId);
            setSelectedAlbum(null);
            loadAlbums();
          } catch (err: any) {
            Alert.alert('Lỗi', err.message || 'Không thể xóa album');
          }
        },
      },
    ]);
  };

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert('Xóa ảnh', 'Bạn có chắc chắn muốn xóa bức ảnh này khỏi album?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePhotoApi(circleId, photoId);
            setSelectedPhoto(null);
            if (selectedAlbum) {
              loadAlbumDetail(selectedAlbum.id);
            }
          } catch (err: any) {
            Alert.alert('Lỗi', err.message || 'Không thể xóa ảnh');
          }
        },
      },
    ]);
  };

  // =========================================================================
  // VIEW: ALBUM DETAIL
  // =========================================================================
  if (selectedAlbum) {
    return (
      <View style={styles.container}>
        {/* Navigation Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              setSelectedAlbum(null);
              loadAlbums();
            }}
          >
            <ArrowLeft size={18} color="#1E293B" />
            <Text style={styles.backText}>Quay lại</Text>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.uploadBtn}
              disabled={isUploading}
              onPress={handlePickAndUploadPhotos}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <UploadCloud size={14} color="#FFFFFF" />
                  <Text style={styles.uploadBtnText}>Thêm ảnh</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteAlbumBtn}
              onPress={() => handleDeleteAlbum(selectedAlbum.id)}
            >
              <Trash2 size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Album Metadata */}
        <View style={styles.albumMeta}>
          <Text style={styles.albumTitle}>{selectedAlbum.albumTitle}</Text>
          {selectedAlbum.description ? (
            <Text style={styles.albumDesc}>{selectedAlbum.description}</Text>
          ) : null}
          <Text style={styles.photoCountText}>
            {selectedAlbum.photos?.length || 0} ảnh • Tạo bởi{' '}
            {selectedAlbum.creator?.user?.profile?.displayName || 'Thành viên'}
          </Text>
        </View>

        {/* Photos Grid */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#475569" style={{ marginTop: 40 }} />
        ) : selectedAlbum.photos && selectedAlbum.photos.length > 0 ? (
          <FlatList
            data={selectedAlbum.photos}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={styles.photosGrid}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.photoThumbWrapper}
                onPress={() => setSelectedPhoto(item)}
              >
                <Image source={{ uri: item.fileUrl }} style={styles.photoThumb} />
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <ImageIcon size={40} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Chưa có ảnh nào trong album</Text>
            <Text style={styles.emptySub}>Chạm "Thêm ảnh" để tải lên những kỷ niệm đầu tiên!</Text>
          </View>
        )}

        {/* Lightbox Modal */}
        {selectedPhoto && (
          <Modal visible={!!selectedPhoto} transparent animationType="fade">
            <View style={styles.lightboxBackdrop}>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setSelectedPhoto(null)}
              >
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>

              <Image
                source={{ uri: selectedPhoto.fileUrl }}
                style={styles.lightboxImage}
                resizeMode="contain"
              />

              <View style={styles.lightboxFooter}>
                <Text style={styles.lightboxCaption}>
                  {selectedPhoto.caption || 'Khoảnh khắc'}
                </Text>
                <TouchableOpacity
                  style={styles.deletePhotoBtn}
                  onPress={() => handleDeletePhoto(selectedPhoto.id)}
                >
                  <Trash2 size={16} color="#FFFFFF" />
                  <Text style={styles.deletePhotoText}>Xóa ảnh</Text>
                </TouchableOpacity>
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
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>Album Kỷ Niệm</Text>
          <Text style={styles.screenSub}>Kho ảnh và kỷ niệm chung của nhóm</Text>
        </View>

        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => setIsCreateModalOpen(true)}
        >
          <Plus size={14} color="#FFFFFF" />
          <Text style={styles.createBtnText}>Tạo Album</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#475569" style={{ marginTop: 40 }} />
      ) : albums.length > 0 ? (
        <ScrollView contentContainerStyle={styles.albumsList}>
          {albums.map((album) => {
            const coverUrl = album.photos?.[0]?.fileUrl;
            return (
              <TouchableOpacity
                key={album.id}
                style={styles.albumCard}
                onPress={() => loadAlbumDetail(album.id)}
              >
                <View style={styles.coverWrapper}>
                  {coverUrl ? (
                    <Image source={{ uri: coverUrl }} style={styles.coverImage} />
                  ) : (
                    <View style={styles.placeholderCover}>
                      <FolderOpen size={32} color="#94A3B8" />
                    </View>
                  )}
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {album._count?.photos || album.photos?.length || 0} ảnh
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
                    <Calendar size={12} color="#94A3B8" />
                    <Text style={styles.cardDate}>
                      {new Date(album.updatedAt).toLocaleDateString('vi-VN')}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <FolderOpen size={48} color="#94A3B8" />
          <Text style={styles.emptyTitle}>Chưa có Album kỷ niệm nào</Text>
          <Text style={styles.emptySub}>
            Tạo album đầu tiên để gom ảnh chụp chung cùng các thành viên trong vòng tròn!
          </Text>
          <TouchableOpacity
            style={styles.createEmptyBtn}
            onPress={() => setIsCreateModalOpen(true)}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.createEmptyText}>Tạo Album Ngay</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Create Album Modal */}
      <Modal visible={isCreateModalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo Album Kỷ Niệm Mới</Text>
              <TouchableOpacity onPress={() => setIsCreateModalOpen(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Tên Album *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Chuyến đi Vũng Tàu, Kỷ niệm 2026..."
                placeholderTextColor="#94A3B8"
                value={albumTitle}
                onChangeText={setAlbumTitle}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Mô tả (tùy chọn)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ghi chú về kỷ niệm hoặc chủ đề album..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={albumDescription}
                onChangeText={setAlbumDescription}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsCreateModalOpen(false)}
              >
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreateAlbum}>
                <Text style={styles.submitText}>Tạo Album</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  screenSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  albumsList: {
    padding: 16,
    gap: 12,
  },
  albumCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  coverWrapper: {
    width: '100%',
    height: 140,
    backgroundColor: '#F1F5F9',
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
    color: '#0F172A',
  },
  cardDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cardDate: {
    fontSize: 10,
    color: '#94A3B8',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  uploadBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  deleteAlbumBtn: {
    padding: 6,
  },
  albumMeta: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  albumTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  albumDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  photoCountText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  photosGrid: {
    padding: 12,
    gap: 6,
  },
  photoThumbWrapper: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    margin: 3,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
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
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  createEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 16,
  },
  createEmptyText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    color: '#0F172A',
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
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
    color: '#64748B',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 20,
  },
  lightboxImage: {
    width: '100%',
    height: '75%',
  },
  lightboxFooter: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lightboxCaption: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  deletePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deletePhotoText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});
