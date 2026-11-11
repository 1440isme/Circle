'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  AlertCircle,
} from 'lucide-react';
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
import { PhotoEntity } from '@circle/types';

interface CircleAlbumsViewProps {
  circleId: string;
}

export const CircleAlbumsView: React.FC<CircleAlbumsViewProps> = ({ circleId }) => {
  const t = useLanguageStore((s) => s.t);
  const locale = useLanguageStore((s) => s.locale);

  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoEntity | null>(null);

  const [albumError, setAlbumError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [confirmDeleteAlbumId, setConfirmDeleteAlbumId] = useState<string | null>(null);
  const [confirmDeletePhotoId, setConfirmDeletePhotoId] = useState<string | null>(null);
  const [brokenCovers, setBrokenCovers] = useState<Record<string, boolean>>({});

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

  useEffect(() => {
    if (!isCreateModalOpen && !selectedPhoto) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedPhoto) {
          setSelectedPhoto(null);
          setConfirmDeletePhotoId(null);
        } else if (isCreateModalOpen) {
          setIsCreateModalOpen(false);
          setCreateError(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreateModalOpen, selectedPhoto]);

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setCreateError(t.collab.enterAlbumNameError);
      return;
    }

    setCreateError(null);
    try {
      await createAlbumMutation.mutateAsync({
        albumTitle: newTitle.trim(),
        description: newDescription.trim() || undefined,
      });

      setNewTitle('');
      setNewDescription('');
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setCreateError(err?.message || t.collab.createAlbumError);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedAlbumId) return;

    setAlbumError(null);
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
      setAlbumError(err?.message || t.collab.uploadPhotoAlbumError);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAlbum = async (albumId: string) => {
    setAlbumError(null);
    try {
      await deleteAlbumMutation.mutateAsync(albumId);
      setConfirmDeleteAlbumId(null);
      if (selectedAlbumId === albumId) {
        setSelectedAlbumId(null);
      }
    } catch (err: any) {
      setAlbumError(err?.message || t.collab.deleteAlbumError);
      setConfirmDeleteAlbumId(null);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    setAlbumError(null);
    try {
      await deletePhotoMutation.mutateAsync(photoId);
      setConfirmDeletePhotoId(null);
      setSelectedPhoto(null);
    } catch (err: any) {
      setAlbumError(err?.message || t.collab.deletePhotoError);
      setConfirmDeletePhotoId(null);
    }
  };

  const dateLocale = locale === 'vi' ? 'vi-VN' : 'en-US';

  // =========================================================================
  // VIEW: ALBUM DETAIL
  // =========================================================================
  if (selectedAlbumId) {
    return (
      <div className="relative flex-1 flex flex-col h-full bg-circle-canvas dark:bg-circle-dark-surface overflow-hidden transition-colors">
        {/* Floating Pill Controls (Chi tiết Album: Nút Quay lại & Nút Tải ảnh lên dạng Floating Pill Buttons) */}
        <div className="pointer-events-none absolute top-14 lg:top-3 left-0 right-0 z-20 flex flex-col items-center gap-2 px-4">
          <div className="max-w-4xl w-full flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedAlbumId(null);
                setConfirmDeleteAlbumId(null);
                setAlbumError(null);
              }}
              className="pointer-events-auto inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-sm hover:bg-circle-wash dark:hover:bg-circle-dark-wash text-circle-charcoal dark:text-circle-dark-text font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4 shrink-0 text-circle-primary" />
              <span className="truncate max-w-[150px] sm:max-w-[220px]">
                {albumDetail?.albumTitle || t.common.back}
              </span>
            </button>

            <div className="pointer-events-auto flex items-center gap-2 shrink-0">
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
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full backdrop-blur-xl bg-circle-primary hover:bg-circle-sage text-white font-semibold text-xs sm:text-sm shadow-sm border border-white/20 transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
              >
                {isUploading || addPhotosMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{t.common.uploading}</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-3.5 w-3.5" />
                    <span>{t.collab.uploadPhotos}</span>
                  </>
                )}
              </button>
              {albumDetail && (
                <button
                  type="button"
                  onClick={() =>
                    setConfirmDeleteAlbumId((prev) =>
                      prev === albumDetail.id ? null : albumDetail.id,
                    )
                  }
                  className="flex items-center justify-center h-9 w-9 rounded-full backdrop-blur-xl bg-white/92 dark:bg-circle-dark-surface/90 border border-circle-hairline/80 dark:border-white/12 shadow-sm hover:bg-rose-500/10 text-circle-slate dark:text-circle-dark-muted hover:text-rose-500 transition-all active:scale-95 cursor-pointer"
                  title={t.collab.albumDeleteTitle}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {confirmDeleteAlbumId && (
            <div className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-2 rounded-2xl glass shadow-md max-w-4xl w-full animate-fadeIn">
              <span className="text-xs font-medium text-circle-charcoal dark:text-circle-dark-text">
                {t.collab.deleteAlbumConfirm}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteAlbumId(null)}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  disabled={deleteAlbumMutation.isPending}
                  onClick={() => handleDeleteAlbum(confirmDeleteAlbumId)}
                  className="px-3 py-1 rounded-full bg-rose-500 hover:bg-rose-600 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                >
                  {deleteAlbumMutation.isPending ? t.common.loading : t.common.delete}
                </button>
              </div>
            </div>
          )}

          {albumError && (
            <div className="pointer-events-auto flex items-center justify-between gap-2 px-4 py-2 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs font-medium text-rose-700 dark:text-rose-400 max-w-4xl w-full backdrop-blur-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{albumError}</span>
              </div>
              <button
                type="button"
                onClick={() => setAlbumError(null)}
                className="p-0.5 rounded-full hover:bg-rose-500/20"
                title={t.common.dismiss}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Scroll-under Content Layer */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-28 lg:pt-20 pb-12">
          {isLoadingDetail ? (
            <div className="flex-1 flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-circle-slate dark:text-circle-dark-muted" />
            </div>
          ) : albumDetail ? (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div>
                <h2 className="text-xl font-bold text-circle-charcoal dark:text-circle-dark-text">
                  {albumDetail.albumTitle}
                </h2>
                {albumDetail.description && (
                  <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-1">
                    {albumDetail.description}
                  </p>
                )}
                <div className="flex items-center gap-3 text-[11px] text-circle-slate dark:text-circle-dark-muted mt-2">
                  <span>
                    {t.collab.albumPhotoUnit.replace(
                      '{count}',
                      String(albumDetail.photos?.length || 0),
                    )}
                  </span>
                  <span>•</span>
                  <span>
                    {t.collab.pollCreatedBy.replace(
                      '{name}',
                      albumDetail.creator?.user?.profile?.displayName || t.collab.memberDefault,
                    )}
                  </span>
                </div>
              </div>

              {/* Photos Grid */}
              {albumDetail.photos && albumDetail.photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {albumDetail.photos.map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() => {
                        setConfirmDeletePhotoId(null);
                        setSelectedPhoto(photo);
                      }}
                      className="group relative aspect-square rounded-xl overflow-hidden bg-circle-wash dark:bg-circle-dark-wash cursor-pointer border border-circle-hairline/60 dark:border-circle-dark-hairline/60 shadow-2xs hover:shadow-md transition-all"
                    >
                      <img
                        src={photo.fileUrl}
                        alt={photo.caption || t.collab.albumPhotoFallback}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                        <p className="text-[11px] text-white truncate font-medium">
                          {photo.caption || t.collab.albumPhotoFallback}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-circle-hairline dark:border-circle-dark-hairline bg-white/50 dark:bg-circle-dark-surface/50">
                  <ImageIcon className="h-10 w-10 text-circle-slate dark:text-circle-dark-muted opacity-40 mb-3" />
                  <h4 className="text-sm font-semibold text-circle-charcoal dark:text-circle-dark-text">
                    {t.collab.albumEmptyPhotosTitle}
                  </h4>
                  <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-1 mb-4">
                    {t.collab.albumEmptyPhotosDesc}
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-lg bg-circle-charcoal dark:bg-circle-primary px-4 py-2 text-xs font-semibold text-white dark:text-circle-dark-canvas hover:bg-circle-sage hover:text-white dark:hover:text-white transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{t.collab.albumUploadNow}</span>
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {/* Lightbox Modal */}
          {selectedPhoto && (
            <div
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setSelectedPhoto(null);
                  setConfirmDeletePhotoId(null);
                }
              }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
            >
              <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
                <img
                  src={selectedPhoto.fileUrl}
                  alt={selectedPhoto.caption || t.collab.albumPhotoFallback}
                  className="max-w-full max-h-[75vh] rounded-xl object-contain shadow-2xl"
                />
                {confirmDeletePhotoId === selectedPhoto.id && (
                  <div className="mt-3 w-full max-w-xl flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl glass shadow-lg">
                    <span className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text">
                      {t.collab.deletePhotoConfirm}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setConfirmDeletePhotoId(null)}
                        className="px-3 py-1 rounded-full text-xs font-semibold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash"
                      >
                        {t.common.cancel}
                      </button>
                      <button
                        type="button"
                        disabled={deletePhotoMutation.isPending}
                        onClick={() => handleDeletePhoto(selectedPhoto.id)}
                        className="px-3 py-1 rounded-full bg-rose-500 hover:bg-rose-600 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {deletePhotoMutation.isPending ? t.common.loading : t.common.delete}
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3 w-full mt-3 px-2 text-white">
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">
                      {selectedPhoto.caption || t.collab.albumPhotoFallback}
                    </p>
                    <p className="text-[10px] text-white/70">
                      {t.collab.albumUploadedBy.replace(
                        '{name}',
                        selectedPhoto.uploader?.user?.profile?.displayName || t.collab.memberDefault,
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={selectedPhoto.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="flex items-center gap-1.5 rounded-lg bg-white/20 hover:bg-white/30 px-3 py-1.5 text-xs font-medium text-white transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>{t.collab.albumDownload}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setConfirmDeletePhotoId(selectedPhoto.id)}
                      className="flex items-center gap-1.5 rounded-lg bg-rose-600/85 hover:bg-rose-600 px-3 py-1.5 text-xs font-medium text-white transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{t.collab.albumDeletePhoto}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPhoto(null);
                        setConfirmDeletePhotoId(null);
                      }}
                      className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                      title={t.common.close}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: ALBUMS LIST
  // =========================================================================
  return (
    <div className="relative flex-1 flex flex-col h-full bg-circle-canvas dark:bg-circle-dark-surface overflow-hidden transition-colors">
      {/* Floating Pill Controls (Bỏ heading & text 'Album kỷ niệm', thay bằng Floating Pill Button tạo album) */}
      <div className="pointer-events-none absolute top-14 lg:top-3 left-0 right-0 z-20 flex flex-col items-center gap-2 px-4">
        <div className="max-w-4xl w-full flex justify-end">
          <button
            type="button"
            onClick={() => {
              setCreateError(null);
              setIsCreateModalOpen(true);
            }}
            className="pointer-events-auto inline-flex items-center gap-1.5 px-4 h-9 rounded-full backdrop-blur-xl bg-circle-primary hover:bg-circle-sage text-white font-semibold text-xs sm:text-sm shadow-sm border border-white/20 transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>{t.collab.createAlbum}</span>
          </button>
        </div>

        {albumError && (
          <div className="pointer-events-auto flex items-center justify-between gap-2 px-4 py-2 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs font-medium text-rose-700 dark:text-rose-400 max-w-4xl w-full backdrop-blur-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{albumError}</span>
            </div>
            <button
              type="button"
              onClick={() => setAlbumError(null)}
              className="p-0.5 rounded-full hover:bg-rose-500/20"
              title={t.common.dismiss}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Scroll-under Content Layer */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-28 lg:pt-20 pb-12">
        {isLoadingAlbums ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-circle-slate dark:text-circle-dark-muted" />
          </div>
        ) : albums.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {albums.map((album) => {
              const coverPhoto = album.photos?.[0]?.fileUrl;
              const isCoverBroken = Boolean(brokenCovers[album.id]);
              return (
                <div
                  key={album.id}
                  onClick={() => {
                    setConfirmDeleteAlbumId(null);
                    setAlbumError(null);
                    setSelectedAlbumId(album.id);
                  }}
                  className="group flex flex-col rounded-2xl border border-circle-hairline/80 dark:border-circle-dark-hairline/80 bg-white dark:bg-circle-dark-canvas p-3 cursor-pointer shadow-2xs hover:shadow-md transition-all hover:border-circle-sage/50"
                >
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-circle-wash dark:bg-circle-dark-wash mb-3">
                    {coverPhoto && !isCoverBroken ? (
                      <img
                        src={coverPhoto}
                        alt={album.albumTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={() =>
                          setBrokenCovers((prev) => ({ ...prev, [album.id]: true }))
                        }
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-circle-slate dark:text-circle-dark-muted opacity-40">
                        <FolderOpen className="h-10 w-10" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 rounded-lg bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold text-white">
                      {t.collab.photosCount.replace(
                        '{count}',
                        String(album._count?.photos || album.photos?.length || 0),
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
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
                    <Calendar className="h-3 w-3 shrink-0" />
                    <span>
                      {t.collab.albumUpdatedPrefix.replace(
                        '{date}',
                        new Date(album.updatedAt).toLocaleDateString(dateLocale),
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-circle-hairline dark:border-circle-dark-hairline bg-white/40 dark:bg-circle-dark-surface/40 max-w-2xl mx-auto">
            <FolderOpen className="h-12 w-12 text-circle-slate dark:text-circle-dark-muted opacity-40 mb-3" />
            <h4 className="text-sm font-semibold text-circle-charcoal dark:text-circle-dark-text">
              {t.collab.emptyAlbumsTitle}
            </h4>
            <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-1 max-w-sm mb-4">
              {t.collab.emptyAlbumsDesc}
            </p>
            <button
              type="button"
              onClick={() => {
                setCreateError(null);
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-circle-primary hover:bg-circle-sage px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t.collab.createAlbum}</span>
            </button>
          </div>
        )}
      </div>

      {/* Create Album Modal */}
      {isCreateModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsCreateModalOpen(false);
              setCreateError(null);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md rounded-2xl glass-sheet p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-circle-hairline dark:border-circle-dark-hairline mb-4">
              <h3 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                {t.collab.albumCreateModalTitle}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setCreateError(null);
                }}
                className="p-1 text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text"
                title={t.common.close}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAlbum} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-1">
                  {t.collab.albumNameRequiredLabel}
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={t.collab.albumNameExample}
                  className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-3.5 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-none focus:ring-1 focus:ring-circle-sage"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-circle-slate dark:text-circle-dark-muted mb-1">
                  {t.collab.albumDescLabel}
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder={t.collab.albumDescPlaceholder}
                  className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-3.5 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text focus:outline-none focus:ring-1 focus:ring-circle-sage"
                />
              </div>

              {createError && (
                <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-400 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setCreateError(null);
                  }}
                  className="rounded-lg px-3.5 py-2 text-xs font-semibold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={createAlbumMutation.isPending || !newTitle.trim()}
                  className="rounded-lg bg-circle-charcoal dark:bg-circle-primary px-4 py-2 text-xs font-semibold text-white dark:text-circle-dark-canvas hover:bg-circle-sage hover:text-white dark:hover:text-white transition-all disabled:opacity-50"
                >
                  {createAlbumMutation.isPending
                    ? t.collab.albumCreating
                    : t.collab.albumCreateSubmit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
