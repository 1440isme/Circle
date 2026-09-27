'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, KeyRound, Eye, EyeOff, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { resetPasswordSchema } from '@circle/shared';
import { useResetPasswordMutation } from '../../../hooks/use-auth-mutations';
import { useLanguageStore } from '../../../stores/language.store';
import { AuthGuard } from '../../../components/auth/AuthGuard';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const t = useLanguageStore((s) => s.t);
  const resetMutation = useResetPasswordMutation();

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{
    email?: string[];
    otp?: string[];
    newPassword?: string[];
    confirmPassword?: string[];
  }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const isLengthValid = newPassword.length >= 8;
  const isMatchValid = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setFieldErrors({});

    const validation = resetPasswordSchema.safeParse({
      email,
      otp,
      newPassword,
      confirmPassword,
    });

    if (!validation.success) {
      setFieldErrors(validation.error.flatten().fieldErrors);
      return;
    }

    try {
      const res = await resetMutation.mutateAsync({
        email: validation.data.email,
        otp: validation.data.otp,
        newPassword: validation.data.newPassword,
        confirmPassword: validation.data.confirmPassword,
      });
      setSuccessMsg(res?.message || t.auth.resetPasswordSuccess);
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err: any) {
      setApiError(err?.message || t.auth.failedToResetPassword);
    }
  };

  return (
    <div className="rounded-3xl border border-white/80 dark:border-white/10 bg-white/70 dark:bg-circle-dark-surface/80 p-8 sm:p-10 shadow-xl shadow-circle-charcoal/5 dark:shadow-black/25 backdrop-blur-xl transition-all">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-circle-wash dark:bg-circle-dark-wash text-circle-sage dark:text-circle-primary mb-4 shadow-sm">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-circle-charcoal dark:text-circle-dark-text sm:text-3xl">
          {t.auth.resetPasswordTitle}
        </h1>
        <p className="mt-2 text-sm text-circle-slate dark:text-circle-dark-muted">
          {t.auth.resetPasswordSubtitle}
        </p>
      </div>

      {/* Alerts */}
      {apiError && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-circle-coral/30 bg-circle-coral/10 p-4 text-sm text-circle-coral">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{apiError}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-circle-primary/30 bg-circle-wash/60 dark:bg-circle-dark-wash/30 p-4 text-sm text-circle-sage dark:text-circle-primary">
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-circle-slate dark:text-circle-dark-muted mb-1.5">
            {t.auth.email}
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-circle-slate dark:text-circle-dark-muted" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.auth.emailPlaceholder}
              className="w-full rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white/80 dark:bg-circle-dark-canvas/80 pl-10 pr-4 py-2.5 text-sm text-circle-charcoal dark:text-circle-dark-text placeholder-circle-slate/60 dark:placeholder-circle-dark-muted/60 focus:border-circle-sage focus:outline-none focus:ring-4 focus:ring-circle-primary/10 transition-all"
              required
            />
          </div>
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-circle-coral">{fieldErrors.email[0]}</p>
          )}
        </div>

        {/* 6-Digit OTP Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-circle-slate dark:text-circle-dark-muted mb-1.5">
            {t.auth.otpLabel}
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-circle-slate dark:text-circle-dark-muted" />
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder={t.auth.otpPlaceholder}
              className="w-full font-mono tracking-widest text-center text-lg font-bold rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white/80 dark:bg-circle-dark-canvas/80 pl-10 pr-4 py-2 text-circle-charcoal dark:text-circle-dark-text placeholder-circle-slate/40 dark:placeholder-circle-dark-muted/40 focus:border-circle-sage focus:outline-none focus:ring-4 focus:ring-circle-primary/10 transition-all"
              required
            />
          </div>
          {fieldErrors.otp && (
            <p className="mt-1 text-xs text-circle-coral">{fieldErrors.otp[0]}</p>
          )}
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-circle-slate dark:text-circle-dark-muted mb-1.5">
            {t.auth.newPassword}
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-circle-slate dark:text-circle-dark-muted" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t.auth.newPasswordPlaceholder}
              className="w-full rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white/80 dark:bg-circle-dark-canvas/80 pl-10 pr-10 py-2.5 text-sm text-circle-charcoal dark:text-circle-dark-text placeholder-circle-slate/60 dark:placeholder-circle-dark-muted/60 focus:border-circle-sage focus:outline-none focus:ring-4 focus:ring-circle-primary/10 transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {fieldErrors.newPassword && (
            <p className="mt-1 text-xs text-circle-coral">{fieldErrors.newPassword[0]}</p>
          )}
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-circle-slate dark:text-circle-dark-muted mb-1.5">
            {t.auth.confirmNewPassword}
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-circle-slate dark:text-circle-dark-muted" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t.auth.confirmNewPasswordPlaceholder}
              className="w-full rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white/80 dark:bg-circle-dark-canvas/80 pl-10 pr-4 py-2.5 text-sm text-circle-charcoal dark:text-circle-dark-text placeholder-circle-slate/60 dark:placeholder-circle-dark-muted/60 focus:border-circle-sage focus:outline-none focus:ring-4 focus:ring-circle-primary/10 transition-all"
              required
            />
          </div>
          {fieldErrors.confirmPassword && (
            <p className="mt-1 text-xs text-circle-coral">{fieldErrors.confirmPassword[0]}</p>
          )}
        </div>

        {/* Password Strength Checklist */}
        <div className="rounded-2xl border border-circle-hairline/80 dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas/60 p-3 space-y-1 text-xs">
          <div className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${isLengthValid ? 'bg-circle-primary' : 'bg-circle-slate/40 dark:bg-circle-dark-muted/40'}`}
            />
            <span className={isLengthValid ? 'text-circle-charcoal dark:text-circle-dark-text font-medium' : 'text-circle-slate dark:text-circle-dark-muted'}>
              {t.auth.min8Chars}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${isMatchValid ? 'bg-circle-primary' : 'bg-circle-slate/40 dark:bg-circle-dark-muted/40'}`}
            />
            <span className={isMatchValid ? 'text-circle-charcoal dark:text-circle-dark-text font-medium' : 'text-circle-coral'}>
              {isMatchValid ? t.auth.passwordMatch : t.auth.passwordMismatch}
            </span>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={resetMutation.isPending || !isLengthValid || !isMatchValid}
          className="group relative flex w-full items-center justify-center gap-2 rounded-full bg-circle-primary px-6 py-3.5 text-sm font-semibold text-circle-charcoal shadow-md shadow-circle-primary/20 transition-all hover:bg-circle-sage hover:text-white focus:outline-none focus:ring-4 focus:ring-circle-primary/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {resetMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t.auth.resettingPassword}</span>
            </>
          ) : (
            <>
              <span>{t.auth.resetPasswordButton}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>

        {/* Back Link */}
        <div className="border-t border-circle-hairline dark:border-circle-dark-hairline pt-3 text-center">
          <Link
            href="/login"
            className="text-xs font-semibold text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-white transition-colors"
          >
            {t.auth.backToLogin}
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthGuard mode="guest-only">
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-circle-sage" />
          </div>
        }
      >
        <ResetPasswordContent />
      </Suspense>
    </AuthGuard>
  );
}
