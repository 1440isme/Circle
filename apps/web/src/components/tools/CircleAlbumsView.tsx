'use client';

import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Download,
  X,
  ChevronLeft,
  Calendar,
  FolderOpen,
  UploadCloud,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguageStore } from '../../stores/language.store';
import {
  useAlbumsQuery,
  useAlbumDetailQuery,
  useCreateAlbumMutation,
  useDeleteAlbumMutation,
  useAddPhotosMutation,
  useDeletePhotoMutation,
} from '../../hooks/use-circle-tools';
import { useUploadMedia } from '../../hooks/use-upload-media';
import { SharedAlbumEntity, PhotoEntity } from '@circle/types';

interface CircleAlbumsViewProps {
  circleId: string;
}

export const CircleAlbumsView: React.FC<CircleAlbumsViewProps> = ({ circleId }) => {
  const { user } = useAuth();
  const t = useLanguageStore((s) => s.t);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoEntity | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: albums = [], isLoading: isLoadingAlbums } = useAlbumsQuery(circleId);
  const { data: albumDetail, isLoading: isLoadingDetail } = useAlbumDetailQuery(
    circleId,
    selectedAlbumId,
  );

  const createAlbumMutation = useCreateAlbumMutation(circleId);
  const deleteAlbumMutation = useDeleteAlbumMutation(circleId);
  const addPhotosMutation = useAddPhotosMutation(circleId, selectedAlbumId || '');
  const deletePhotoMutation = useDeletePhotoMutation(circleId, selectedAlbumId || undefined);

  const { uploadMedia, isUploading } = useUploadMedia();

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await createAlbumMutation.mutateAsync({
      albumTitle: newTitle.trim(),
      description: newDescription.trim() || undefined,
    });

    setNewTitle('');
    setNewDescription('');
    setIsCreateModalOpen(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedAlbumId) return;

    try {
      const uploadedPhotos: { fileUrl: string; caption?: string }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file) {
          const res = await uploadMedia({
            folder: 'albums',
            file,
          });
          if (res?.publicUrl) {
            uploadedPhotos.push({
              fileUrl: res.publicUrl,
              caption: file.name.replace(/\.[^/.]+$/, ''),
            });
          }
        }
      }

      if (uploadedPhotos.length > 0) {
        await addPhotosMutation.mutateAsync({ photos: uploadedPhotos });
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tải ảnh lên');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAlbum = async (albumId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa album này cùng tất cả ảnh bên trong?')) {
      await deleteAlbumMutation.mutateAsync(albumId);
      if (selectedAlbumId === albumId) {
        setSelectedAlbumId(null);
      }
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa ảnh này khỏi album?')) {
      await deletePhotoMutation.mutateAsync(photoId);
      setSelectedPhoto(null);
    }
  };

  // =========================================================================
  // VIEW: ALBUM DETAIL
  // =========================================================================
  if (selectedAlbumId) {
    return (
      <div className="flex-1 flex flex-col h-full bg-circle-canvas dark:bg-circle-dark-surface overflow-y-auto p-4 md:p-6 transition-colors">
        {/* Sub-header navigation */}
        <div className="flex items-center justify-between pb-4 border-b border-circle-hairline dark:border-circle-dark-hairline mb-6">
          <button
            type="button"
            onClick={() => setSelectedAlbumId(null)}
            className="flex items-center gap-2 text-xs font-semibold text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Quay lại danh sách Album</span>
          </button>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              disabled={isUploading || addPhotosMutation.isPending}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg bg-circle-charcoal dark:bg-circle-primary px-3.5 py-2 text-xs font-semibold text-white dark:text-circle-charcoal hover:bg-circle-sage transition-all disabled:opacity-50"
            >
              {isUploading || addPhotosMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang tải lên...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Thêm ảnh vào Album</span>
                </>
              )}
            </button>
          </div>
        </div>

        {isLoadingDetail ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-circle-slate dark:text-circle-dark-muted" />
          </div>
        ) : albumDetail ? (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-circle-charcoal dark:text-circle-dark-text">
                  {albumDetail.albumTitle}
                </h2>
                <button
                  type="button"
                  onClick={() => handleDeleteAlbum(albumDetail.id)}
                  className="p-1.5 text-circle-slate hover:text-red-500 transition-colors"
                  title="Xóa album"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {albumDetail.description && (
                <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-1">
                  {albumDetail.description}
                </p>
              )}
              <div className="flex items-center gap-3 text-[11px] text-circle-slate dark:text-circle-dark-muted mt-2">
                <span>{albumDetail.photos?.length || 0} bức ảnh</span>
                <span>•</span>
                <span>Tạo bởi {albumDetail.creator?.user?.profile?.displayName || 'Thành viên'}</span>
              </div>
            </div>

            {/* Photos Grid */}
            {albumDetail.photos && albumDetail.photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {albumDetail.photos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo)}
                    className="group relative aspect-square rounded-xl overflow-hidden bg-circle-wash dark:bg-circle-dark-wash cursor-pointer border border-circle-hairline/60 dark:border-circle-dark-hairline/60 shadow-2xs hover:shadow-md transition-all"
                  >
                    <img
                      src={photo.fileUrl}
                      alt={photo.caption || 'Album photo'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                      <p className="text-[11px] text-white truncate font-medium">
                        {photo.caption || 'Khoảnh khắc'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-circle-hairline dark:border-circle-dark-hairline bg-white/50 dark:bg-circle-dark-surface/50">
                <ImageIcon className="h-10 w-10 text-circle-slate dark:text-circle-dark-muted opacity-40 mb-3" />
                <h4 className="text-sm font-semibold text-circle-charcoal dark:text-circle-dark-text">
                  Album chưa có bức ảnh nào
                </h4>
                <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-1 mb-4">
                  Hãy là người đầu tiên chia sẻ kỷ niệm vào album này!
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-lg bg-circle-charcoal dark:bg-circle-primary px-4 py-2 text-xs font-semibold text-white dark:text-circle-charcoal hover:bg-circle-sage transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tải ảnh lên ngay</span>
                </button>
              </div>
            )}
          </div>
        ) : null}

        {/* Lightbox Modal */}
        {selectedPhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
              <img
                src={selectedPhoto.fileUrl}
                alt="Selected"
                className="max-w-full max-h-[80vh] rounded-lg object-contain shadow-2xl"
              />
              <div className="flex items-center justify-between w-full mt-3 px-2 text-white">
                <div>
                  <p className="text-xs font-medium">{selectedPhoto.caption || 'Khoảnh khắc'}</p>
                  <p className="text-[10px] text-white/60">
                    Tải lên bởi {selectedPhoto.uploader?.user?.profile?.displayName || 'Thành viên'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={selectedPhoto.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="flex items-center gap-1.5 rounded-lg bg-white/20 hover:bg-white/30 px-3 py-1.5 text-xs font-medium text-white transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Tải về</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(selectedPhoto.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Xóa ảnh</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPhoto(null)}
                    className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW: ALBUMS LIST
  // =========================================================================
  return (
    <div className="flex-1 flex flex-col h-full bg-circle-canvas dark:bg-circle-dark-surface overflow-y-auto p-4 md:p-6 transition-colors">
      <div className="flex items-center justify-between pb-4 border-b border-circle-hairline dark:border-circle-dark-hairline mb-6">
        <div>
          <h1 className="text-lg font-bold text-circle-charcoal dark:text-circle-dark-text">
            {t.nav.photoAlbum}
          </h1>
          <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-0.5">
            Lưu giữ và chia sẻ những khoảnh khắc đáng nhớ của vòng tròn
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-circle-charcoal dark:bg-circle-primary px-3.5 py-2 text-xs font-semibold text-white dark:text-circle-charcoal hover:bg-circle-sage transition-all shadow-sm active:scale-98"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Tạo Album mới</span>
        </button>
      </div>

      {isLoadingAlbums ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-circle-slate dark:text-circle-dark-muted" />
        </div>
      ) : albums.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {albums.map((album) => {
            const coverPhoto = album.photos?.[0]?.fileUrl;
            return (
              <div
                key={album.id}
                onClick={() => setSelectedAlbumId(album.id)}
                className="group flex flex-col rounded-2xl border border-circle-hairline/80 dark:border-circle-dark-hairline/80 bg-white dark:bg-circle-dark-canvas p-3 cursor-pointer shadow-2xs hover:shadow-md transition-all hover:border-circle-sage/50"
              >
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-circle-wash dark:bg-circle-dark-wash mb-3">
                  {coverPhoto ? (
                    <img
                      src={coverPhoto}
                      alt={album.albumTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-circle-slate dark:text-circle-dark-muted opacity-40">
                      <FolderOpen className="h-10 w-10" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 rounded-lg bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold text-white">
                    {album._count?.photos || album.photos?.length || 0} ảnh
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-circle-charcoal dark:text-circle-dark-text truncate">
                    {album.albumTitle}
                  </h3>
                </div>
                {album.description && (
                  <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted line-clamp-1 mt-0.5">
                    {album.description}
                  </p>
                )}
                <div className="flex items-center gap-1.5 text-[10px] text-circle-slate dark:text-circle-dark-muted mt-2 pt-2 border-t border-circle-hairline/40 dark:border-circle-dark-hairline/40">
                  <Calendar className="h-3 w-3" />
                  <span>
                    Cập nhật {new Date(album.updatedAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-circle-hairline dark:border-circle-dark-hairline bg-white/40 dark:bg-circle-dark-surface/40">
          <FolderOpen className="h-12 w-12 text-circle-slate dark:text-circle-dark-muted opacity-40 mb-3" />
          <h4 className="text-sm font-semibold text-circle-charcoal dark:text-circle-dark-text">
            Chưa có Album kỷ niệm nào
          </h4>
          <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-1 max-w-sm mb-4">
            Tạo album đầu tiên để gom ảnh chụp chung, chuyến đi hoặc những khoảnh khắc vui vẻ cùng nhóm!
          </p>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-circle-charcoal dark:bg-circle-primary px-4 py-2 text-xs font-semibold text-white dark:text-circle-charcoal hover:bg-circle-sage transition-all shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tạo Album ngay</span>
          </button>
        </div>
      )}

      {/* Create Album Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-circle-hairline dark:border-circle-dark-hairline mb-4">
              <h3 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                Tạo Album Kỷ Niệm Mới
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-circle-slate hover:text-circle-charcoal dark:hover:text-circle-dark-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAlbum} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-1">
                  Tên Album *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Chuyến đi Vũng Tàu 2026..."
                  className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-3.5 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-hidden focus:ring-1 focus:ring-circle-sage"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-1">
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Ghi chú về kỷ niệm hoặc chủ đề của album..."
                  className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-3.5 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-hidden focus:ring-1 focus:ring-circle-sage"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-lg px-3.5 py-2 text-xs font-semibold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createAlbumMutation.isPending || !newTitle.trim()}
                  className="rounded-lg bg-circle-charcoal dark:bg-circle-primary px-4 py-2 text-xs font-semibold text-white dark:text-circle-charcoal hover:bg-circle-sage transition-all disabled:opacity-50"
                >
                  {createAlbumMutation.isPending ? 'Đang tạo...' : 'Tạo Album'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
