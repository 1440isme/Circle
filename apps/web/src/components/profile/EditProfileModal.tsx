'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Mail, Shield, Sparkles, Check, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguageStore } from '../../stores/language.store';
import { useUpdateProfileMutation } from '../../hooks/use-auth-mutations';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const t = useLanguageStore((s) => s.t);
  const updateProfileMutation = useUpdateProfileMutation();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showCustomUrlInput, setShowCustomUrlInput] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.profile?.displayName || user.email.split('@')[0]);
      setBio(user.profile?.bio || '');
      setAvatarUrl(user.profile?.avatarUrl || '');
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const currentInitials = getInitials(displayName || user.email);

  const handleSubmit = async (e: React.FormEvent) => {
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
        avatarUrl: avatarUrl.trim() || null,
      });
      setSuccessMessage(t.auth.profileUpdatedSuccess);
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMessage(err?.message || t.common.unknownError);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-circle-charcoal/40 dark:bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl border border-circle-hairline dark:border-circle-dark-hairline bg-white/95 dark:bg-circle-dark-surface/95 p-6 shadow-2xl backdrop-blur-xl transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-circle-hairline dark:border-circle-dark-hairline">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-circle-primary/20 text-circle-sage dark:text-circle-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-circle-charcoal dark:text-circle-dark-text">
                {t.auth.editProfile}
              </h3>
              <p className="text-xs text-circle-slate dark:text-circle-dark-muted">
                {t.auth.editProfileSubtitle}
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Avatar Picker & Preview */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-circle-primary/40 bg-circle-wash dark:bg-circle-dark-elevated shadow-md overflow-hidden">
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

            {/* Quick Avatar Presets */}
            <div className="w-full">
              <p className="text-xs font-semibold text-circle-slate dark:text-circle-dark-muted text-center mb-2">
                {t.auth.changeAvatar} (Chọn nhanh hoặc nhập URL)
              </p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {/* Default Initials Option */}
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

                <button
                  type="button"
                  onClick={() => setShowCustomUrlInput(!showCustomUrlInput)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all ${
                    showCustomUrlInput
                      ? 'border-circle-primary bg-circle-primary/20 text-circle-sage dark:text-circle-primary'
                      : 'border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-elevated text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal'
                  }`}
                  title="Nhập URL ảnh tự chọn"
                >
                  <ImageIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Custom Image URL input */}
              {showCustomUrlInput && (
                <div className="mt-2.5 animate-fadeIn">
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-3.5 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate dark:placeholder:text-circle-dark-muted focus:border-circle-sage focus:outline-none focus:ring-2 focus:ring-circle-primary/20 transition-all"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Display Name Input */}
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

          {/* Bio Input */}
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

          {/* Readonly Account Info (Email & Role) */}
          <div className="rounded-2xl border border-circle-hairline/80 dark:border-circle-dark-hairline/80 bg-circle-wash/50 dark:bg-circle-dark-elevated/40 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-circle-slate dark:text-circle-dark-muted font-medium">
                <Mail className="h-3.5 w-3.5" />
                {t.auth.email}
              </span>
              <span className="font-semibold text-circle-charcoal dark:text-circle-dark-text">
                {user.email}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1.5 border-t border-circle-hairline/50 dark:border-circle-dark-hairline/50">
              <span className="flex items-center gap-1.5 text-circle-slate dark:text-circle-dark-muted font-medium">
                <Shield className="h-3.5 w-3.5 text-circle-sage" />
                {t.auth.userBadge}
              </span>
              <span className="font-semibold text-circle-sage dark:text-circle-primary">
                {user.globalRole === 'ADMIN' ? t.auth.admin : t.auth.member}
              </span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
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
      </div>
    </div>
  );
};
