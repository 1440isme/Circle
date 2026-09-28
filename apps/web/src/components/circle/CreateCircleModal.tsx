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

type CreationMode = 'friends' | 'name';

export const CreateCircleModal: React.FC = () => {
  const t = useLanguageStore((s) => s.t);
  const locale = useLanguageStore((s) => s.locale);
  const isCreateModalOpen = useCircleStore((s) => s.isCreateModalOpen);
  const setCreateModalOpen = useCircleStore((s) => s.setCreateModalOpen);

  const [activeTab, setActiveTab] = useState<CreationMode>('friends');
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
    return (
      f.displayName.toLowerCase().includes(query) ||
      f.email.toLowerCase().includes(query)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const { createCircleSchema } = createCircleSchemas(locale);

    const payload =
      activeTab === 'friends'
        ? {
            memberIds: selectedFriendIds,
            isPrivate,
          }
        : {
            name: name.trim(),
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
      // Reset form on success
      setName('');
      setSelectedFriendIds([]);
      setFriendSearch('');
      setIsPrivate(false);
    } catch (err: any) {
      setServerError(err?.message || t.circle.createError);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-3xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-circle-hairline dark:border-circle-dark-hairline">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-circle-primary/10 text-circle-sage dark:text-circle-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-circle-charcoal dark:text-circle-dark-text">
                {t.circle.createTitle}
              </h3>
              <p className="text-xs text-circle-slate dark:text-circle-dark-muted">
                {t.circle.createSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-circle-canvas dark:bg-circle-dark-canvas text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="mt-4 flex rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas/60 p-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('friends');
              setFieldErrors({});
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
              activeTab === 'friends'
                ? 'bg-white dark:bg-circle-dark-surface text-circle-sage dark:text-circle-primary shadow-sm'
                : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>{t.circle.tabSelectFriends}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('name');
              setFieldErrors({});
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
              activeTab === 'name'
                ? 'bg-white dark:bg-circle-dark-surface text-circle-sage dark:text-circle-primary shadow-sm'
                : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>{t.circle.tabCreateByName}</span>
          </button>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* TAB 1: Select Friends Mode */}
          {activeTab === 'friends' && (
            <div className="space-y-3">
              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-circle-slate dark:text-circle-dark-muted" />
                <input
                  type="text"
                  value={friendSearch}
                  onChange={(e) => setFriendSearch(e.target.value)}
                  placeholder={t.circle.friendsSearchPlaceholder}
                  className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/50 dark:bg-circle-dark-canvas/50 pl-10 pr-3.5 py-2 text-xs text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate/50 dark:placeholder:text-circle-dark-muted/50 focus:border-circle-sage dark:focus:border-circle-primary focus:outline-none transition-colors"
                />
              </div>

              {/* Friends List Container */}
              <div className="max-h-52 overflow-y-auto rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/20 dark:bg-circle-dark-canvas/20 p-1.5 space-y-1">
                {isLoadingFriends ? (
                  <div className="flex items-center justify-center py-8 text-xs text-circle-slate dark:text-circle-dark-muted gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-circle-sage" />
                    <span>{t.circle.loadingFriends}</span>
                  </div>
                ) : filteredFriends.length > 0 ? (
                  filteredFriends.map((friend) => {
                    const isSelected = selectedFriendIds.includes(friend.id);
                    return (
                      <button
                        key={friend.id}
                        type="button"
                        onClick={() => handleToggleFriend(friend.id)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                          isSelected
                            ? 'bg-circle-wash dark:bg-circle-dark-wash text-circle-sage dark:text-circle-primary'
                            : 'hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas text-circle-charcoal dark:text-circle-dark-text'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-circle-primary/10 text-circle-sage dark:text-circle-primary font-bold text-xs uppercase">
                            {friend.displayName ? friend.displayName.slice(0, 2) : 'FR'}
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-semibold truncate">
                              {friend.displayName}
                            </p>
                            <p className="text-[10px] text-circle-slate dark:text-circle-dark-muted truncate">
                              {friend.email}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                            isSelected
                              ? 'border-circle-sage bg-circle-sage text-white dark:border-circle-primary dark:bg-circle-primary dark:text-circle-charcoal'
                              : 'border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-xs text-circle-slate dark:text-circle-dark-muted">
                    {t.circle.noFriendsFound}
                  </div>
                )}
              </div>

              {/* Status and Hint */}
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-medium text-circle-slate dark:text-circle-dark-muted">
                  {t.circle.selectedFriendsCount.replace(
                    '{count}',
                    String(selectedFriendIds.length),
                  )}
                </span>
                <span className="text-[11px] text-circle-sage dark:text-circle-primary">
                  {t.circle.autoHandleNotice}
                </span>
              </div>

              <div className="rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40 p-2.5 text-[11px] text-circle-slate dark:text-circle-dark-muted leading-relaxed">
                {t.circle.tempGroupNameHint}
              </div>

              {fieldErrors.name && (
                <p className="text-xs text-red-500">{fieldErrors.name}</p>
              )}
            </div>
          )}

          {/* TAB 2: Name-Only Mode */}
          {activeTab === 'name' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text mb-1.5">
                  {t.circle.nameLabel} <span className="text-red-500">*</span>
                </label>
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
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm bg-circle-canvas/50 dark:bg-circle-dark-canvas/50 text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate/50 dark:placeholder:text-circle-dark-muted/50 focus:outline-none transition-colors ${
                    fieldErrors.name
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-circle-hairline dark:border-circle-dark-hairline focus:border-circle-sage dark:focus:border-circle-primary'
                  }`}
                />
                {fieldErrors.name ? (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>
                ) : (
                  <p className="mt-1.5 text-[11px] text-circle-slate dark:text-circle-dark-muted">
                    {t.circle.autoHandleNotice}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Privacy Toggle */}
          <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40 p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white dark:bg-circle-dark-surface text-circle-slate dark:text-circle-dark-muted shadow-sm">
                  {isPrivate ? (
                    <Lock className="h-4 w-4 text-amber-500" />
                  ) : (
                    <Globe className="h-4 w-4 text-circle-sage dark:text-circle-primary" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text">
                    {isPrivate ? t.circle.privacyPrivate : t.circle.privacyPublic}
                  </h4>
                  <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted">
                    {isPrivate
                      ? t.circle.privacyPrivateDesc
                      : t.circle.privacyPublicDesc}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isPrivate
                    ? 'bg-circle-sage dark:bg-circle-primary'
                    : 'bg-circle-slate/20 dark:bg-circle-dark-hairline'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isPrivate ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-circle-hairline dark:border-circle-dark-hairline">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl px-4 py-2 text-xs font-medium text-circle-slate dark:text-circle-dark-muted hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={
                createCircleMutation.isPending ||
                (activeTab === 'friends' && selectedFriendIds.length === 0) ||
                (activeTab === 'name' && name.trim().length === 0)
              }
              className="flex items-center gap-2 rounded-xl bg-circle-charcoal dark:bg-circle-primary px-5 py-2 text-xs font-semibold text-white dark:text-circle-charcoal shadow-sm hover:bg-circle-sage hover:text-white transition-all active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
            >
              {createCircleMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{t.circle.creatingCircle}</span>
                </>
              ) : activeTab === 'friends' ? (
                <span>{t.circle.createWithFriendsBtn}</span>
              ) : (
                <span>{t.circle.createByNameBtn}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
