'use client';

import React, { useState } from 'react';
import { KeyRound, X, Loader2, AlertCircle } from 'lucide-react';
import { createCircleSchemas } from '@circle/shared';
import { useJoinCircleMutation } from '../../hooks/use-circle-queries';
import { useLanguageStore } from '../../stores/language.store';
import { useCircleStore } from '../../stores/circle.store';

export const JoinCircleModal: React.FC = () => {
  const t = useLanguageStore((s) => s.t);
  const locale = useLanguageStore((s) => s.locale);
  const isJoinModalOpen = useCircleStore((s) => s.isJoinModalOpen);
  const setJoinModalOpen = useCircleStore((s) => s.setJoinModalOpen);

  const [inviteCode, setInviteCode] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);

  const joinCircleMutation = useJoinCircleMutation();

  if (!isJoinModalOpen) {
    return null;
  }

  const handleClose = () => {
    setInviteCode('');
    setFieldError(null);
    setServerError(null);
    setPendingNotice(null);
    setJoinModalOpen(false);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setInviteCode(rawVal);
    if (fieldError) setFieldError(null);
    if (serverError) setServerError(null);
    if (pendingNotice) setPendingNotice(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);
    setServerError(null);
    setPendingNotice(null);

    const schemas = createCircleSchemas(locale);
    const parsed = schemas.joinCircleSchema.safeParse({ inviteCode });

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setFieldError(issue?.message || t.validation.circleInviteCodeRequired);
      return;
    }

    try {
      const res = await joinCircleMutation.mutateAsync({
        inviteCode: parsed.data.inviteCode,
      });

      if (res?.isPending) {
        setPendingNotice(t.circle.joinRequestSent);
      } else {
        handleClose();
      }
    } catch (err: any) {
      setServerError(err.message || t.circle.inviteCodeNotFound);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md rounded-3xl border border-circle-hairline dark:border-circle-dark-hairline bg-white/95 dark:bg-circle-dark-surface/95 p-6 sm:p-7 shadow-2xl backdrop-blur-xl transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-circle-primary/15 text-circle-sage dark:text-circle-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="join-modal-title"
                className="text-lg font-bold text-circle-charcoal dark:text-circle-dark-text"
              >
                {t.circle.joinModalTitle}
              </h2>
              <p className="text-xs text-circle-slate dark:text-circle-dark-muted mt-0.5">
                {t.circle.joinModalSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-circle-slate dark:text-circle-dark-muted hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas hover:text-circle-charcoal dark:hover:text-circle-dark-text transition-colors"
            title={t.common.cancel}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-3.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Pending Join Request Sent Alert */}
        {pendingNotice ? (
          <div className="space-y-4 py-2 text-center animate-fade-in">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <KeyRound className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                {t.circle.privacyPrivate}
              </h3>
              <p className="mt-1 text-xs text-circle-slate dark:text-circle-dark-muted px-2">
                {pendingNotice}
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="w-full rounded-2xl bg-circle-primary hover:bg-circle-primary/90 text-circle-charcoal py-2.5 text-xs font-bold transition-all shadow-sm"
              >
                {t.common.confirm}
              </button>
            </div>
          </div>
        ) : (
          /* Join Form */
          <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text">
              {t.circle.inviteCodeLabel}
            </label>
            <div className="relative">
              <input
                type="text"
                value={inviteCode}
                onChange={handleCodeChange}
                placeholder={t.circle.inviteCodePlaceholder}
                maxLength={16}
                autoFocus
                className={`w-full rounded-2xl border py-3 px-4 text-center font-mono text-lg font-bold tracking-widest uppercase transition-all bg-circle-canvas dark:bg-circle-dark-canvas text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate/40 dark:placeholder:text-circle-dark-muted/40 placeholder:font-normal placeholder:tracking-normal focus:bg-white dark:focus:bg-circle-dark-elevated focus:outline-none focus:ring-2 ${
                  fieldError
                    ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-200'
                    : 'border-circle-hairline dark:border-circle-dark-hairline focus:border-circle-sage focus:ring-circle-primary/20'
                }`}
              />
            </div>
            {fieldError ? (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 pl-1">
                {fieldError}
              </p>
            ) : (
              <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted pl-1">
                {t.circle.joinModalHint}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full border border-circle-hairline dark:border-circle-dark-hairline px-5 py-2 text-xs font-semibold text-circle-slate dark:text-circle-dark-muted hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas hover:text-circle-charcoal dark:hover:text-circle-dark-text transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={joinCircleMutation.isPending || !inviteCode.trim()}
              className="flex items-center gap-2 rounded-full bg-circle-charcoal dark:bg-circle-primary px-6 py-2 text-xs font-semibold text-white dark:text-circle-charcoal shadow-sm hover:bg-circle-sage dark:hover:bg-circle-sage dark:hover:text-white transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {joinCircleMutation.isPending && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              <span>
                {joinCircleMutation.isPending
                  ? t.circle.joiningCircle
                  : t.circle.joinCircleBtn}
              </span>
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};
