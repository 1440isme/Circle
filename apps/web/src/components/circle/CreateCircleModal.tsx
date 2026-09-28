'use client';

import React, { useState } from 'react';
import { X, Users, Lock, Globe, AlertCircle, Loader2 } from 'lucide-react';
import { createCircleSchemas } from '@circle/shared';
import { useCreateCircleMutation } from '../../hooks/use-circle-queries';
import { useLanguageStore } from '../../stores/language.store';
import { useCircleStore } from '../../stores/circle.store';

export const CreateCircleModal: React.FC = () => {
  const t = useLanguageStore((s) => s.t);
  const locale = useLanguageStore((s) => s.locale);
  const isCreateModalOpen = useCircleStore((s) => s.isCreateModalOpen);
  const setCreateModalOpen = useCircleStore((s) => s.setCreateModalOpen);

  const [formData, setFormData] = useState({
    name: '',
    handle: '',
    description: '',
    isPrivate: false,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const createCircleMutation = useCreateCircleMutation();

  if (!isCreateModalOpen) {
    return null;
  }

  const handleClose = () => {
    setFieldErrors({});
    setServerError(null);
    setCreateModalOpen(false);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    // Auto suggest handle if user hasn't typed custom handle yet
    const autoHandle = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30);

    setFormData((prev) => ({
      ...prev,
      name,
      handle: prev.handle === '' || prev.handle === autoHandle.slice(0, prev.handle.length) ? autoHandle : prev.handle,
    }));

    if (fieldErrors.name) {
      setFieldErrors((prev) => ({ ...prev, name: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // Validate using Single Source of Truth bilingual Zod schema from @circle/shared
    const { createCircleSchema } = createCircleSchemas(locale);
    const validationResult = createCircleSchema.safeParse({
      name: formData.name.trim(),
      handle: formData.handle.trim().toLowerCase(),
      description: formData.description.trim() || undefined,
      isPrivate: formData.isPrivate,
    });

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
      setFormData({
        name: '',
        handle: '',
        description: '',
        isPrivate: false,
      });
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

        {/* Server Error Alert */}
        {serverError && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Circle Name */}
          <div>
            <label className="block text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text mb-1.5">
              {t.circle.nameLabel} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              placeholder={t.circle.namePlaceholder}
              maxLength={50}
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm bg-circle-canvas/50 dark:bg-circle-dark-canvas/50 text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate/50 dark:placeholder:text-circle-dark-muted/50 focus:outline-none transition-colors ${
                fieldErrors.name
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-circle-hairline dark:border-circle-dark-hairline focus:border-circle-sage dark:focus:border-circle-primary'
              }`}
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>
            )}
          </div>

          {/* Circle Handle */}
          <div>
            <label className="block text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text mb-1.5">
              {t.circle.handleLabel} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-medium text-circle-slate dark:text-circle-dark-muted">
                {t.circle.handlePrefix}
              </span>
              <input
                type="text"
                value={formData.handle}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    handle: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                  }));
                  if (fieldErrors.handle) {
                    setFieldErrors((prev) => ({ ...prev, handle: '' }));
                  }
                }}
                placeholder={t.circle.handlePlaceholder}
                maxLength={30}
                className={`w-full rounded-xl border pl-8 pr-3.5 py-2.5 text-sm font-mono bg-circle-canvas/50 dark:bg-circle-dark-canvas/50 text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate/50 dark:placeholder:text-circle-dark-muted/50 focus:outline-none transition-colors ${
                  fieldErrors.handle
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-circle-hairline dark:border-circle-dark-hairline focus:border-circle-sage dark:focus:border-circle-primary'
                }`}
              />
            </div>
            {fieldErrors.handle ? (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.handle}</p>
            ) : (
              <p className="mt-1 text-[11px] text-circle-slate dark:text-circle-dark-muted">
                {t.circle.handleUrlPreview.replace('{handle}', formData.handle || 'handle')}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text mb-1.5">
              {t.circle.descLabel}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder={t.circle.descPlaceholder}
              rows={2}
              maxLength={255}
              className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/50 dark:bg-circle-dark-canvas/50 px-3.5 py-2.5 text-sm text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate/50 dark:placeholder:text-circle-dark-muted/50 focus:border-circle-sage dark:focus:border-circle-primary focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Privacy Toggle */}
          <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40 p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white dark:bg-circle-dark-surface text-circle-slate dark:text-circle-dark-muted shadow-sm">
                  {formData.isPrivate ? (
                    <Lock className="h-4 w-4 text-amber-500" />
                  ) : (
                    <Globe className="h-4 w-4 text-circle-sage dark:text-circle-primary" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text">
                    {formData.isPrivate ? t.circle.privacyPrivate : t.circle.privacyPublic}
                  </h4>
                  <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted">
                    {formData.isPrivate
                      ? t.circle.privacyPrivateDesc
                      : t.circle.privacyPublicDesc}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, isPrivate: !prev.isPrivate }))
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  formData.isPrivate ? 'bg-circle-sage dark:bg-circle-primary' : 'bg-circle-slate/20 dark:bg-circle-dark-hairline'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    formData.isPrivate ? 'translate-x-5' : 'translate-x-0'
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
              disabled={createCircleMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-circle-charcoal dark:bg-circle-primary px-5 py-2 text-xs font-semibold text-white dark:text-circle-charcoal shadow-sm hover:bg-circle-sage hover:text-white transition-all active:scale-98 disabled:opacity-60"
            >
              {createCircleMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{t.circle.creatingCircle}</span>
                </>
              ) : (
                <span>{t.home.createCircleBtn}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
