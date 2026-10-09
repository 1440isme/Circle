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
  Sun,
  Moon,
  Monitor,
  Globe,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguageStore } from '../../stores/language.store';
import { useThemeStore, Theme } from '../../stores/theme.store';
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

function getBirthYear(dateString?: string | null): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return d.getFullYear().toString();
  } catch {
    return '';
  }
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const t = useLanguageStore((s) => s.t);
  const { locale, setLocale } = useLanguageStore();
  const { theme, setTheme } = useThemeStore();
  const updateProfileMutation = useUpdateProfileMutation();

  const [mode, setMode] = useState<ModalMode>('view');
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
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
      setHandle(user.profile?.handle || '');
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
  const currentHandle = user.profile?.handle || `user_${user.id.slice(-6)}`;
  const currentAvatarUrl = user.profile?.avatarUrl;
  const currentBio = user.profile?.bio;
  const currentDateOfBirth = user.profile?.dateOfBirth;
  const currentInitials = getInitials(currentDisplayName);


  // Submit full profile edit (Handle, Name, Bio, Date of Birth)
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedName = displayName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage(t.validation.displayNameMinLength);
      return;
    }

    const cleanedHandle = handle.trim().toLowerCase().replace(/^@/, '');
    if (cleanedHandle && cleanedHandle.length < 3) {
      setErrorMessage(t.validation.userHandleMinLength);
      return;
    }
    if (cleanedHandle && !/^[a-z0-9_]+$/.test(cleanedHandle)) {
      setErrorMessage(t.validation.userHandleInvalid);
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        displayName: trimmedName,
        handle: cleanedHandle || null,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-circle-charcoal/40 dark:bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl border border-circle-hairline dark:border-circle-dark-hairline bg-white/95 dark:bg-circle-dark-surface/95 p-6 shadow-2xl backdrop-blur-xl transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-circle-hairline dark:border-circle-dark-hairline">
          <div className="flex items-center gap-2.5">
            {mode !== 'view' ? (
              <button
                type="button"
                onClick={() => {
                  setMode('view');
                  setErrorMessage(null);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-2xl bg-circle-canvas dark:bg-circle-dark-elevated text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-hairline/60 transition-colors"
                title={t.common.cancel}
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-circle-primary/20 text-circle-sage dark:text-circle-primary">
                <User className="h-5 w-5" />
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-circle-charcoal dark:text-circle-dark-text">
                {mode === 'view' && t.auth.profile}
                {mode === 'edit' && t.auth.editProfile}
                {mode === 'avatar' && t.auth.changeAvatarTitle}
              </h3>
              <p className="text-xs text-circle-slate dark:text-circle-dark-muted">
                {mode === 'view' && t.common.slogan}
                {mode === 'edit' && t.auth.editProfileSubtitle}
                {mode === 'avatar' && t.auth.changeAvatarSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-circle-slate hover:bg-circle-canvas dark:hover:bg-circle-dark-elevated hover:text-circle-charcoal dark:hover:text-circle-dark-text transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Success / Error Notification */}
        {successMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-circle-success/30 bg-circle-success/10 px-4 py-2.5 text-xs font-semibold text-circle-success animate-fadeIn">
            <Check className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-circle-coral/30 bg-circle-coral/10 px-4 py-2.5 text-xs font-semibold text-circle-coral animate-fadeIn">
            <X className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* MODE 1: CHẾ ĐỘ XEM THÔNG TIN CÁ NHÂN (AVATAR MÁY ẢNH, TÊN, NĂM SINH, TIỂU SỬ) */}
        {mode === 'view' && (
          <div className="mt-6 flex flex-col items-center text-center animate-fadeIn">
            {/* Avatar kèm nút Máy ảnh Camera để đổi avatar trực tiếp */}
            <div className="relative group">
              <div
                onClick={() => setMode('avatar')}
                className="cursor-pointer relative flex h-28 w-28 items-center justify-center rounded-full border-2 border-circle-primary/40 bg-circle-wash dark:bg-circle-dark-elevated shadow-lg overflow-hidden transition-transform hover:scale-105"
                title={t.auth.changeAvatar}
              >
                {currentAvatarUrl ? (
                  <img
                    src={currentAvatarUrl}
                    alt={currentDisplayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-extrabold text-circle-charcoal dark:text-circle-dark-text">
                    {currentInitials}
                  </span>
                )}
              </div>

              {/* Nút Máy ảnh Camera ở góc avatar */}
              <button
                type="button"
                onClick={() => setMode('avatar')}
                className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-charcoal shadow-md hover:scale-110 transition-transform"
                title={t.auth.changeAvatar}
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            {/* Tên hiển thị & Mã định danh @nickname */}
            <h4 className="mt-4 text-xl font-black text-circle-charcoal dark:text-circle-dark-text tracking-tight">
              {currentDisplayName}
            </h4>
            <div className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-circle-canvas dark:bg-circle-dark-elevated px-2.5 py-0.5 text-xs font-mono font-bold text-circle-sage dark:text-circle-primary border border-circle-hairline dark:border-circle-dark-hairline">
              <span>@{currentHandle}</span>
            </div>



            {/* Tiểu sử nhỏ dưới tên */}
            <p className="mt-2 max-w-xs text-xs text-circle-slate dark:text-circle-dark-muted leading-relaxed">
              {currentBio || t.auth.noBio}
            </p>
            {/* Năm sinh / Ngày sinh */}
            {currentDateOfBirth && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-circle-sage dark:text-circle-primary bg-circle-primary/10 px-3 py-1 rounded-full">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {t.auth.dateOfBirth}: {formatDate(currentDateOfBirth)}
                </span>
              </div>
            )}

            {/* Nút Chỉnh sửa hồ sơ */}
            <div className="mt-5 flex w-full items-center justify-center pt-4 border-t border-circle-hairline dark:border-circle-dark-hairline">
              <button
                type="button"
                onClick={() => setMode('edit')}
                className="flex items-center justify-center gap-2 w-full rounded-full bg-circle-charcoal dark:bg-circle-primary py-2.5 text-xs font-bold text-white dark:text-circle-charcoal hover:opacity-90 transition-opacity shadow-md"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>{t.auth.editProfile}</span>
              </button>
            </div>

            {/* CÀI ĐẶT HỆ THỐNG (THEME & NGÔN NGỮ & ĐĂNG XUẤT) */}
            <div className="mt-4 w-full rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas/60 p-3.5 space-y-3 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-circle-slate dark:text-circle-dark-muted">
                {t.common.systemSettings}
              </span>

              {/* Theme Selection */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text">
                  {t.common.theme}
                </span>
                <div className="flex items-center gap-1 bg-white dark:bg-circle-dark-surface p-1 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline shadow-xs">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      theme === 'light'
                        ? 'bg-circle-primary text-circle-charcoal shadow-xs'
                        : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal'
                    }`}
                    title={t.common.themeLight}
                  >
                    <Sun className="h-3 w-3" />
                    <span>{t.common.themeLight}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      theme === 'dark'
                        ? 'bg-circle-primary text-circle-charcoal shadow-xs'
                        : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal'
                    }`}
                    title={t.common.themeDark}
                  >
                    <Moon className="h-3 w-3" />
                    <span>{t.common.themeDark}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('system')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      theme === 'system'
                        ? 'bg-circle-primary text-circle-charcoal shadow-xs'
                        : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal'
                    }`}
                    title={t.common.themeSystem}
                  >
                    <Monitor className="h-3 w-3" />
                    <span>{t.common.themeSystem}</span>
                  </button>
                </div>
              </div>

              {/* Language Selection */}
              <div className="flex items-center justify-between pt-1 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60">
                <span className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text">
                  {t.common.language}
                </span>
                <div className="flex items-center gap-1 bg-white dark:bg-circle-dark-surface p-1 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline shadow-xs">
                  <button
                    type="button"
                    onClick={() => setLocale('vi')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      locale === 'vi'
                        ? 'bg-circle-primary text-circle-charcoal shadow-xs'
                        : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal'
                    }`}
                  >
                    🇻🇳 Tiếng Việt
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocale('en')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      locale === 'en'
                        ? 'bg-circle-primary text-circle-charcoal shadow-xs'
                        : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal'
                    }`}
                  >
                    🇬🇧 English
                  </button>
                </div>
              </div>

              {/* Logout Button */}
              <div className="pt-2 border-t border-circle-hairline/60 dark:border-circle-dark-hairline/60">
                <button
                  type="button"
                  onClick={async () => {
                    onClose();
                    await logout();
                  }}
                  className="flex w-full items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-circle-coral hover:bg-circle-coral/10 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>{t.auth.logout}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODE 2: CHẾ ĐỘ ĐỔI AVATAR TRỰC TIẾP (KHI BẤM NÚT MÁY ẢNH) */}
        {mode === 'avatar' && (
          <form onSubmit={handleAvatarSubmit} className="mt-5 space-y-5 animate-fadeIn">
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-circle-primary/40 bg-circle-wash dark:bg-circle-dark-elevated shadow-md overflow-hidden">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-full w-full object-cover"
                      onError={() => setAvatarUrl('')}
                    />
                  ) : (
                    <span className="text-2xl font-bold text-circle-charcoal dark:text-circle-dark-text">
                      {currentInitials}
                    </span>
                  )}
                </div>
              </div>

              {/* Danh sách ảnh chọn nhanh */}
              <div className="w-full">
                <p className="text-xs font-semibold text-circle-slate dark:text-circle-dark-muted text-center mb-2.5">
                  {t.auth.quickAvatarChoose}
                </p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {/* Mặc định viết tắt */}
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border text-xs font-bold transition-all ${!avatarUrl
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
                      className={`relative h-10 w-10 rounded-full overflow-hidden border transition-all ${avatarUrl === preset
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
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-elevated text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal hover:bg-circle-wash transition-all"
                    title="Tải ảnh từ thiết bị lên R2 Storage"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-circle-primary" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCustomUrlInput(!showCustomUrlInput)}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all ${showCustomUrlInput
                        ? 'border-circle-primary bg-circle-primary/20 text-circle-sage dark:text-circle-primary'
                        : 'border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-elevated text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal'
                      }`}
                    title="Nhập URL ảnh tự chọn"
                  >
                    <ImageIcon className="h-4 w-4" />
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
                      className="w-full rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-3.5 py-2.5 text-xs text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate dark:placeholder:text-circle-dark-muted focus:border-circle-sage focus:outline-none focus:ring-2 focus:ring-circle-primary/20 transition-all"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Nút lưu avatar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMode('view')}
                className="rounded-full border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-5 py-2.5 text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-hairline/50 transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="flex items-center gap-2 rounded-full bg-circle-charcoal dark:bg-circle-primary px-6 py-2.5 text-xs font-bold text-white dark:text-circle-charcoal hover:opacity-90 transition-opacity shadow-md disabled:opacity-50"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t.auth.savingProfile}</span>
                  </>
                ) : (
                  <span>{t.auth.saveProfile}</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* MODE 3: CHẾ ĐỘ CHỈNH SỬA THÔNG TIN (TÊN, NĂM SINH, TIỂU SỬ) */}
        {mode === 'edit' && (
          <form onSubmit={handleEditSubmit} className="mt-5 space-y-4 animate-fadeIn">
            {/* Mã định danh / Nickname */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                  {t.auth.handle}
                </label>
                <span className="text-[10px] text-circle-slate dark:text-circle-dark-muted font-mono">
                  @{handle.trim().toLowerCase().replace(/^@/, '') || 'nickname'}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-circle-slate dark:text-circle-dark-muted">
                  @
                </span>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder={t.auth.handlePlaceholder}
                  maxLength={30}
                  className="w-full rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas pl-8 pr-4 py-2.5 text-sm text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate dark:placeholder:text-circle-dark-muted focus:border-circle-sage focus:outline-none focus:ring-2 focus:ring-circle-primary/20 transition-all font-mono"
                />
              </div>
              <p className="mt-1 text-[11px] text-circle-slate dark:text-circle-dark-muted">
                {t.validation.userHandleInvalid}
              </p>
            </div>

            {/* Tên hiển thị */}
            <div>
              <label className="block text-xs font-bold text-circle-charcoal dark:text-circle-dark-text mb-1.5">
                {t.auth.displayName} <span className="text-circle-coral">*</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t.auth.displayNamePlaceholder}
                maxLength={50}
                className="w-full rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-4 py-2.5 text-sm text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate dark:placeholder:text-circle-dark-muted focus:border-circle-sage focus:outline-none focus:ring-2 focus:ring-circle-primary/20 transition-all font-medium"
              />
            </div>



            {/* Tiểu sử */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
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
                className="w-full rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-4 py-2.5 text-sm text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate dark:placeholder:text-circle-dark-muted focus:border-circle-sage focus:outline-none focus:ring-2 focus:ring-circle-primary/20 transition-all font-medium resize-none"
              />
            </div>

            {/* Ngày sinh / Năm sinh */}
            <div>
              <label className="block text-xs font-bold text-circle-charcoal dark:text-circle-dark-text mb-1.5">
                {t.auth.dateOfBirth}
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-4 py-2.5 text-sm text-circle-charcoal dark:text-circle-dark-text focus:border-circle-sage focus:outline-none focus:ring-2 focus:ring-circle-primary/20 transition-all font-medium"
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('view');
                  setErrorMessage(null);
                }}
                className="rounded-full border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-5 py-2.5 text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-hairline/50 transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="flex items-center gap-2 rounded-full bg-circle-charcoal dark:bg-circle-primary px-6 py-2.5 text-xs font-bold text-white dark:text-circle-charcoal hover:opacity-90 transition-opacity shadow-md disabled:opacity-50"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
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
