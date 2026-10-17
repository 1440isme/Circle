'use client';

import React, { useState } from 'react';
import {
  X,
  Users,
  Lock,
  Globe,
  AlertCircle,
  Loader2,
  Check,
  Search,
  Sparkles,
} from 'lucide-react';
import { createCircleSchemas } from '@circle/shared';
import {
  useCreateCircleMutation,
  useSelectableFriendsQuery,
} from '../../hooks/use-circle-queries';
import { useLanguageStore } from '../../stores/language.store';
import { useCircleStore } from '../../stores/circle.store';

export const CreateCircleModal: React.FC = () => {
  const t = useLanguageStore((s) => s.t);
  const locale = useLanguageStore((s) => s.locale);
  const isCreateModalOpen = useCircleStore((s) => s.isCreateModalOpen);
  const setCreateModalOpen = useCircleStore((s) => s.setCreateModalOpen);

  const [name, setName] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [friendSearch, setFriendSearch] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const createCircleMutation = useCreateCircleMutation();
  const { data: selectableFriends = [], isLoading: isLoadingFriends } =
    useSelectableFriendsQuery();

  if (!isCreateModalOpen) {
    return null;
  }

  const handleClose = () => {
    setFieldErrors({});
    setServerError(null);
    setName('');
    setSelectedFriendIds([]);
    setFriendSearch('');
    setIsPrivate(false);
    setCreateModalOpen(false);
  };

  const handleToggleFriend = (friendId: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId],
    );
    if (fieldErrors.name) {
      setFieldErrors((prev) => ({ ...prev, name: '' }));
    }
  };

  const filteredFriends = selectableFriends.filter((f) => {
    const query = friendSearch.toLowerCase().trim();
    if (!query) return true;
    const cleanQuery = query.replace(/^@/, '');
    return (
      f.displayName.toLowerCase().includes(query) ||
      (f.handle && f.handle.toLowerCase().includes(cleanQuery)) ||
      f.email.toLowerCase().includes(query)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setFieldErrors({});

    const { createCircleSchema } = createCircleSchemas(locale);

    const payload = {
      ...(name.trim() ? { name: name.trim() } : {}),
      ...(selectedFriendIds.length > 0 ? { memberIds: selectedFriendIds } : {}),
      isPrivate,
    };

    const validationResult = createCircleSchema.safeParse(payload);

    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.issues.forEach((err) => {
        const fieldName = err.path[0] as string;
        if (fieldName && !errors[fieldName]) {
          errors[fieldName] = err.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    try {
      await createCircleMutation.mutateAsync(validationResult.data);
      handleClose();
    } catch (err: any) {
      setServerError(err?.message || t.circle.createError);
    }
  };

  const canSubmit = name.trim().length >= 2 || selectedFriendIds.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg rounded-3xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-6 sm:p-7 shadow-2xl transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-circle-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-circle-hairline dark:border-circle-dark-hairline">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-circle-primary/10 text-circle-sage dark:text-circle-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3
                id="create-circle-title"
                className="text-lg font-bold text-circle-charcoal dark:text-circle-dark-text"
              >
                {t.circle.createTitle}
              </h3>
              <p className="text-xs text-circle-slate dark:text-circle-dark-muted">
                {t.circle.createSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-circle-canvas dark:bg-circle-dark-canvas text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
            title={t.common.cancel}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-3 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Field 1: Circle Name (Optional) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text">
                {t.circle.nameLabel}
              </label>
              <span className="text-[11px] text-circle-slate dark:text-circle-dark-muted">
                ({t.circle.nameOptionalHint.split('.')[0].toLowerCase()})
              </span>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) {
                  setFieldErrors((prev) => ({ ...prev, name: '' }));
                }
              }}
              placeholder={t.circle.namePlaceholder}
              maxLength={50}
              className={`w-full rounded-2xl border py-2.5 px-3.5 text-sm transition-all bg-circle-canvas dark:bg-circle-dark-canvas text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate/50 dark:placeholder:text-circle-dark-muted/50 focus:bg-white dark:focus:bg-circle-dark-elevated focus:outline-none focus:ring-2 ${
                fieldErrors.name
                  ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-200'
                  : 'border-circle-hairline dark:border-circle-dark-hairline focus:border-circle-sage focus:ring-circle-primary/20'
              }`}
            />
            {fieldErrors.name ? (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 pl-1">
                {fieldErrors.name}
              </p>
            ) : (
              <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted pl-1">
                {t.circle.nameOptionalHint}
              </p>
            )}
          </div>

          {/* Field 2: Select Friends Section (Optional) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text">
                {t.circle.selectFriendsLabel}
              </label>
              {selectedFriendIds.length > 0 && (
                <span className="rounded-full bg-circle-primary/20 dark:bg-circle-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-circle-sage dark:text-circle-primary">
                  {t.circle.selectedFriendsCount.replace(
                    '{count}',
                    String(selectedFriendIds.length),
                  )}
                </span>
              )}
            </div>

            {/* Friend Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-circle-slate dark:text-circle-dark-muted" />
              <input
                type="text"
                value={friendSearch}
                onChange={(e) => setFriendSearch(e.target.value)}
                placeholder={t.circle.friendsSearchPlaceholder}
                className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas py-2 pl-9 pr-3 text-xs text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate/50 dark:placeholder:text-circle-dark-muted/50 focus:bg-white dark:focus:bg-circle-dark-elevated focus:outline-none focus:ring-1 focus:ring-circle-sage"
              />
            </div>

            {/* Friends Scrollable List */}
            <div className="max-h-40 overflow-y-auto rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40 p-1.5 space-y-1">
              {isLoadingFriends ? (
                <div className="flex items-center justify-center p-4 text-xs text-circle-slate dark:text-circle-dark-muted gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-circle-sage dark:text-circle-primary" />
                  <span>{t.circle.loadingFriends}</span>
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="p-4 text-center text-xs text-circle-slate dark:text-circle-dark-muted">
                  {t.circle.noFriendsFound}
                </div>
              ) : (
                filteredFriends.map((friend) => {
                  const isSelected = selectedFriendIds.includes(friend.id);
                  return (
                    <div
                      key={friend.id}
                      onClick={() => handleToggleFriend(friend.id)}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-circle-primary/15 dark:bg-circle-primary/20 text-circle-charcoal dark:text-circle-dark-text'
                          : 'hover:bg-circle-wash/60 dark:hover:bg-circle-dark-wash/60 text-circle-charcoal dark:text-circle-dark-text'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-circle-primary/20 text-circle-sage dark:text-circle-primary text-xs font-bold">
                          {friend.displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-semibold truncate">
                            {friend.displayName}
                          </p>
                          <p className="text-[10px] font-mono text-circle-sage dark:text-circle-primary truncate">
                            @{friend.handle || friend.email.split('@')[0]}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                          isSelected
                            ? 'border-circle-sage dark:border-circle-primary bg-circle-sage dark:bg-circle-primary text-white dark:text-circle-charcoal'
                            : 'border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[2.5]" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Cần trưởng nhóm phê duyệt Toggle Switch */}
          <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/50 dark:bg-circle-dark-canvas/50">
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                {t.circle.requireApprovalTitle || 'Cần trưởng nhóm phê duyệt'}
              </h4>
              <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-0.5 leading-snug">
                {t.circle.requireApprovalDesc || 'Trưởng nhóm cần phê duyệt tất cả yêu cầu tham gia nhóm chat'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isPrivate ? 'bg-circle-primary' : 'bg-gray-300 dark:bg-gray-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isPrivate ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Auto Handle Notice */}
          <div className="flex items-center gap-2 rounded-xl bg-circle-wash/60 dark:bg-circle-dark-wash/60 p-2 text-[11px] text-circle-sage dark:text-circle-primary">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>{t.circle.autoHandleNotice}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-circle-hairline dark:border-circle-dark-hairline">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full border border-circle-hairline dark:border-circle-dark-hairline px-4 py-2 text-xs font-semibold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas hover:text-circle-charcoal dark:hover:text-circle-dark-text transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={createCircleMutation.isPending || !canSubmit}
              className="flex items-center gap-2 rounded-full bg-circle-charcoal dark:bg-circle-primary px-5 py-2 text-xs font-semibold text-white dark:text-circle-charcoal shadow-sm hover:bg-circle-sage dark:hover:bg-circle-sage dark:hover:text-white transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {createCircleMutation.isPending && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              <span>
                {createCircleMutation.isPending
                  ? t.circle.creatingCircle
                  : t.circle.createCircleSubmitBtn}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
