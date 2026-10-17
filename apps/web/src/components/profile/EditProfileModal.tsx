import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Check,
  Image as ImageIcon,
  Loader2,
  Camera,
  Pencil,
  ArrowLeft,
  Calendar,
  Upload,
  AtSign,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguageStore } from '../../stores/language.store';
import { useUpdateProfileMutation } from '../../hooks/use-auth-mutations';
import { useUploadMedia } from '../../hooks/use-upload-media';
import { createPreviewUrl, revokePreviewUrl } from '../../lib/image-optimizer';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalMode = 'view' | 'edit' | 'avatar';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return '';
  }
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const t = useLanguageStore((s) => s.t);
  const updateProfileMutation = useUpdateProfileMutation();

  const [mode, setMode] = useState<ModalMode>('view');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showCustomUrlInput, setShowCustomUrlInput] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { uploadMedia, isUploading } = useUploadMedia();
  const avatarFileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [localAvatarPreview, setLocalAvatarPreview] = useState<string | null>(null);

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (localAvatarPreview) {
      revokePreviewUrl(localAvatarPreview);
    }

    const preview = createPreviewUrl(file);
    setSelectedAvatarFile(file);
    setLocalAvatarPreview(preview);
    setAvatarUrl(preview);
    e.target.value = '';
  };

  useEffect(() => {
    if (user && isOpen) {
      setDisplayName(user.profile?.displayName || user.email.split('@')[0]);
      setBio(user.profile?.bio || '');
      setAvatarUrl(user.profile?.avatarUrl || '');
      const rawDob = user.profile?.dateOfBirth;
      if (rawDob) {
        try {
          const d = new Date(rawDob);
          setDateOfBirth(d.toISOString().split('T')[0]);
        } catch {
          setDateOfBirth('');
        }
      } else {
        setDateOfBirth('');
      }
      setSuccessMessage(null);
      setErrorMessage(null);
      setShowCustomUrlInput(false);
      setMode('view');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const currentDisplayName = user.profile?.displayName || user.email.split('@')[0];
  const currentAvatarUrl = user.profile?.avatarUrl;
  const currentHandle = (user.profile as any)?.handle;
  const currentBio = user.profile?.bio;
  const currentDateOfBirth = user.profile?.dateOfBirth;
  const currentInitials = getInitials(currentDisplayName);

  // Submit profile edit (Name, Bio, Date of Birth)
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedName = displayName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage(t.validation.displayNameMinLength);
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        displayName: trimmedName,
        bio: bio.trim() || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : null,
      });
      setSuccessMessage(t.auth.profileUpdatedSuccess);
      setTimeout(() => {
        setSuccessMessage(null);
        setMode('view');
      }, 700);
    } catch (err: any) {
      setErrorMessage(err?.message || t.common.unknownError);
    }
  };

  // Submit dedicated avatar change
  const handleAvatarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      let finalAvatarUrl = avatarUrl.trim();

      if (selectedAvatarFile) {
        const uploadRes = await uploadMedia({
          folder: 'avatars',
          file: selectedAvatarFile,
          fileName: selectedAvatarFile.name,
        });
        finalAvatarUrl = uploadRes.publicUrl;
      }

      await updateProfileMutation.mutateAsync({
        avatarUrl: finalAvatarUrl || null,
      });

      if (localAvatarPreview) {
        revokePreviewUrl(localAvatarPreview);
        setLocalAvatarPreview(null);
      }
      setSelectedAvatarFile(null);

      setSuccessMessage(t.auth.avatarUpdatedSuccess);
      setTimeout(() => {
        setSuccessMessage(null);
        setMode('view');
      }, 700);
    } catch (err: any) {
      setErrorMessage(err?.message || t.common.unknownError);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-6 shadow-2xl transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-circle-hairline dark:border-circle-dark-hairline">
          <div className="flex items-center gap-2.5">
            {mode !== 'view' && (
              <button
                type="button"
                onClick={() => {
                  setMode('view');
                  setErrorMessage(null);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-circle-canvas dark:bg-circle-dark-elevated text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-hairline/60 transition-colors"
                title={t.common.cancel}
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <h3 className="text-base font-bold text-circle-charcoal dark:text-circle-dark-text">
              {mode === 'view' && t.auth.profile}
              {mode === 'edit' && t.auth.editProfile}
              {mode === 'avatar' && t.auth.changeAvatarTitle}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-circle-canvas dark:bg-circle-dark-canvas text-circle-slate hover:bg-circle-wash hover:text-circle-charcoal dark:hover:text-circle-dark-text transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Success / Error Notification */}
        {successMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-circle-success/30 bg-circle-success/10 px-3.5 py-2 text-xs font-semibold text-circle-success animate-fadeIn">
            <Check className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-circle-coral/30 bg-circle-coral/10 px-3.5 py-2 text-xs font-semibold text-circle-coral animate-fadeIn">
            <X className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* MODE 1: CHẾ ĐỘ XEM THÔNG TIN CÁ NHÂN */}
        {mode === 'view' && (
          <div className="mt-5 flex flex-col items-center text-center animate-fadeIn">
            {/* Avatar kèm nút Máy ảnh Camera để đổi avatar trực tiếp */}
            <div className="relative group">
              <div
                onClick={() => setMode('avatar')}
                className="cursor-pointer relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-circle-primary/40 bg-circle-wash dark:bg-circle-dark-elevated shadow-sm overflow-hidden transition-transform hover:scale-105"
                title={t.auth.changeAvatar}
              >
                {currentAvatarUrl ? (
                  <img
                    src={currentAvatarUrl}
                    alt={currentDisplayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-extrabold text-circle-charcoal dark:text-circle-dark-text">
                    {currentInitials}
                  </span>
                )}
              </div>

              {/* Nút Máy ảnh Camera ở góc avatar */}
              <button
                type="button"
                onClick={() => setMode('avatar')}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-charcoal shadow-sm hover:scale-110 transition-transform"
                title={t.auth.changeAvatar}
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Tên hiển thị */}
            <h4 className="mt-3.5 text-lg font-bold text-circle-charcoal dark:text-circle-dark-text tracking-tight">
              {currentDisplayName}
            </h4>

            {/* Handle nếu có */}
            {currentHandle && (
              <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-circle-sage dark:text-circle-primary">
                <AtSign className="h-3 w-3" />
                <span>{currentHandle}</span>
              </span>
            )}

            {/* Tiểu sử */}
            <p className="mt-2 max-w-sm text-xs text-circle-slate dark:text-circle-dark-muted leading-relaxed">
              {currentBio || t.auth.noBio}
            </p>

            {/* Ngày sinh */}
            {currentDateOfBirth && (
              <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-circle-slate dark:text-circle-dark-muted bg-circle-canvas dark:bg-circle-dark-canvas px-3 py-1 rounded-lg border border-circle-hairline dark:border-circle-dark-hairline">
                <Calendar className="h-3.5 w-3.5 text-circle-sage" />
                <span>
                  {t.auth.dateOfBirth}: {formatDate(currentDateOfBirth)}
                </span>
              </div>
            )}

            {/* Nút Chỉnh sửa hồ sơ (Apple Style) */}
            <div className="mt-5 flex w-full items-center justify-center pt-4 border-t border-circle-hairline dark:border-circle-dark-hairline">
              <button
                type="button"
                onClick={() => setMode('edit')}
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-circle-charcoal dark:bg-circle-primary py-2.5 text-xs font-bold text-white dark:text-circle-charcoal hover:opacity-90 transition-opacity shadow-xs"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>{t.auth.editProfile}</span>
              </button>
            </div>
          </div>
        )}

        {/* MODE 2: CHẾ ĐỘ ĐỔI AVATAR TRỰC TIẾP */}
        {mode === 'avatar' && (
          <form onSubmit={handleAvatarSubmit} className="mt-5 space-y-4 animate-fadeIn">
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-circle-primary/40 bg-circle-wash dark:bg-circle-dark-elevated shadow-sm overflow-hidden">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-full w-full object-cover"
                      onError={() => setAvatarUrl('')}
                    />
                  ) : (
                    <span className="text-xl font-bold text-circle-charcoal dark:text-circle-dark-text">
                      {currentInitials}
                    </span>
                  )}
                </div>
              </div>

              {/* Danh sách ảnh chọn nhanh */}
              <div className="w-full">
                <p className="text-xs font-semibold text-circle-slate dark:text-circle-dark-muted text-center mb-2">
                  {t.auth.quickAvatarChoose}
                </p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {/* Mặc định viết tắt */}
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold transition-all ${
                      !avatarUrl
                        ? 'border-circle-primary ring-2 ring-circle-primary/30 bg-circle-primary text-circle-charcoal'
                        : 'border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-elevated text-circle-slate dark:text-circle-dark-muted'
                    }`}
                    title="Mặc định viết tắt"
                  >
                    {currentInitials}
                  </button>

                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(preset)}
                      className={`relative h-9 w-9 rounded-full overflow-hidden border transition-all ${
                        avatarUrl === preset
                          ? 'border-circle-primary ring-2 ring-circle-primary/40 scale-105'
                          : 'border-circle-hairline dark:border-circle-dark-hairline opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img src={preset} alt={`Preset ${idx + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}

                  {/* Nút tải ảnh từ thiết bị lên Cloudflare R2 */}
                  <button
                    type="button"
                    onClick={() => avatarFileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-elevated text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal hover:bg-circle-wash transition-all"
                    title="Tải ảnh từ thiết bị lên R2 Storage"
                  >
                    {isUploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-circle-primary" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCustomUrlInput(!showCustomUrlInput)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
                      showCustomUrlInput
                        ? 'border-circle-primary bg-circle-primary/20 text-circle-sage dark:text-circle-primary'
                        : 'border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-elevated text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal'
                    }`}
                    title="Nhập URL ảnh tự chọn"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                  </button>
                </div>

                <input
                  ref={avatarFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFileUpload}
                />

                {/* Nhập URL ảnh tự do */}
                {showCustomUrlInput && (
                  <div className="mt-3 animate-fadeIn">
                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full rounded-lg border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-3 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate dark:placeholder:text-circle-dark-muted focus:border-circle-sage focus:outline-none transition-all"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Nút lưu avatar */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-circle-hairline dark:border-circle-dark-hairline">
              <button
                type="button"
                onClick={() => setMode('view')}
                className="rounded-lg border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-4 py-2 text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-hairline/50 transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-circle-charcoal dark:bg-circle-primary px-5 py-2 text-xs font-bold text-white dark:text-circle-charcoal hover:opacity-90 transition-opacity shadow-xs disabled:opacity-50"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{t.auth.savingProfile}</span>
                  </>
                ) : (
                  <span>{t.auth.saveProfile}</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* MODE 3: CHẾ ĐỘ CHỈNH SỬA THÔNG TIN */}
        {mode === 'edit' && (
          <form onSubmit={handleEditSubmit} className="mt-5 space-y-3.5 animate-fadeIn">
            {/* Tên hiển thị */}
            <div>
              <label className="block text-xs font-bold text-circle-charcoal dark:text-circle-dark-text mb-1">
                {t.auth.displayName} <span className="text-circle-coral">*</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t.auth.displayNamePlaceholder}
                maxLength={50}
                className="w-full rounded-lg border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-3.5 py-2 text-sm text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate dark:placeholder:text-circle-dark-muted focus:border-circle-sage focus:outline-none transition-all font-medium"
              />
            </div>

            {/* Tiểu sử */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                  {t.auth.bio}
                </label>
                <span className="text-[11px] font-medium text-circle-slate dark:text-circle-dark-muted">
                  {bio.length}/300
                </span>
              </div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t.auth.bioPlaceholder}
                maxLength={300}
                rows={3}
                className="w-full rounded-lg border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-3.5 py-2 text-sm text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate dark:placeholder:text-circle-dark-muted focus:border-circle-sage focus:outline-none transition-all font-medium resize-none"
              />
            </div>

            {/* Ngày sinh */}
            <div>
              <label className="block text-xs font-bold text-circle-charcoal dark:text-circle-dark-text mb-1">
                {t.auth.dateOfBirth}
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full rounded-lg border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-3.5 py-2 text-sm text-circle-charcoal dark:text-circle-dark-text focus:border-circle-sage focus:outline-none transition-all font-medium"
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-circle-hairline dark:border-circle-dark-hairline">
              <button
                type="button"
                onClick={() => {
                  setMode('view');
                  setErrorMessage(null);
                }}
                className="rounded-lg border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-4 py-2 text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-hairline/50 transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-circle-charcoal dark:bg-circle-primary px-5 py-2 text-xs font-bold text-white dark:text-circle-charcoal hover:opacity-90 transition-opacity shadow-xs disabled:opacity-50"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{t.auth.savingProfile}</span>
                  </>
                ) : (
                  <span>{t.auth.saveProfile}</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
