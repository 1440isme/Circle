'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Mail, ArrowRight, Loader2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { verifyOtpSchema } from '@circle/shared';
import { useVerifyOtpMutation, useResendOtpMutation } from '../../../hooks/use-auth-mutations';
import { useLanguageStore } from '../../../stores/language.store';
import { AuthGuard } from '../../../components/auth/AuthGuard';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const fromLogin = searchParams.get('from') === 'login';
  const t = useLanguageStore((s) => s.t);

  const [email, setEmail] = useState(emailParam);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(fromLogin ? 0 : 60);
  const [canResend, setCanResend] = useState(fromLogin);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const verifyMutation = useVerifyOtpMutation();
  const resendMutation = useResendOtpMutation();

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  // Focus the first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // 60-second countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleDigitChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned && value !== '') return;

    const newDigits = [...otpDigits];

    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = chars[i] || '';
      }
      setOtpDigits(newDigits);
      const nextFocus = Math.min(chars.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    newDigits[index] = cleaned.slice(-1);
    setOtpDigits(newDigits);
    setApiError(null);

    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (!pasteData) return;

    const chars = pasteData.slice(0, 6).split('');
    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < chars.length; i++) {
      newDigits[i] = chars[i];
    }
    setOtpDigits(newDigits);
    const nextFocus = Math.min(chars.length, 5);
    inputRefs.current[nextFocus]?.focus();
  };

  const fullOtp = otpDigits.join('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setSuccessMsg(null);

    const validation = verifyOtpSchema.safeParse({ email, otp: fullOtp });
    if (!validation.success) {
      setApiError(validation.error.issues[0]?.message || t.auth.otpExpiredOrInvalid);
      return;
    }

    try {
      await verifyMutation.mutateAsync({ email, otp: fullOtp });
      setSuccessMsg(t.auth.accountActivatedSuccess);
      setTimeout(() => {
        router.push('/');
      }, 1200);
    } catch (err: any) {
      setApiError(err?.message || t.auth.otpExpiredOrInvalid);
    }
  };

  const handleResend = async () => {
    if (!canResend || resendMutation.isPending) return;
    setApiError(null);
    setSuccessMsg(null);

    try {
      const res = await resendMutation.mutateAsync({ email, type: 'VERIFICATION' });
      setSuccessMsg(res?.message || t.auth.resendSuccess);
      setCountdown(60);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setApiError(err?.message || t.auth.failedToResendOtp);
    }
  };

  return (
    <div className="rounded-3xl border border-white/80 dark:border-white/10 bg-white/70 dark:bg-circle-dark-surface/80 p-8 sm:p-10 shadow-xl shadow-circle-charcoal/5 dark:shadow-black/25 backdrop-blur-xl transition-all">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-circle-wash dark:bg-circle-dark-wash text-circle-sage dark:text-circle-primary mb-4 shadow-sm">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-circle-charcoal dark:text-circle-dark-text sm:text-3xl">
          {t.auth.verifyOtpTitle}
        </h1>
        <p className="mt-2 text-sm text-circle-slate dark:text-circle-dark-muted">
          {t.auth.verifyOtpSubtitle}{' '}
          <span className="font-semibold text-circle-charcoal dark:text-circle-dark-text">{email || t.common.yourEmail}</span>.
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

      {fromLogin && !apiError && !successMsg && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-circle-sage/30 bg-circle-wash/50 dark:bg-circle-dark-wash/30 p-4 text-xs text-circle-charcoal dark:text-circle-dark-text">
          <ShieldCheck className="h-4 w-4 shrink-0 text-circle-sage dark:text-circle-primary mt-0.5" />
          <span>{t.auth.accountNotActivatedNotice}</span>
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-6">
        {/* If no email in query, let user edit/verify email */}
        {!emailParam && (
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
          </div>
        )}

        {/* 6-Digit Apple-Style PIN Inputs */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-circle-slate dark:text-circle-dark-muted mb-3 text-center">
            {t.auth.otpLabel}
          </label>
          <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="h-13 w-11 sm:h-14 sm:w-12 rounded-2xl border-2 border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-canvas text-center text-2xl font-bold text-circle-charcoal dark:text-circle-dark-text shadow-sm transition-all focus:border-circle-sage focus:outline-none focus:ring-4 focus:ring-circle-primary/15"
              />
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-circle-slate dark:text-circle-dark-muted">
            {t.auth.checkYourInbox}
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={verifyMutation.isPending || fullOtp.length !== 6}
          className="group relative flex w-full items-center justify-center gap-2 rounded-full bg-circle-primary px-6 py-3.5 text-sm font-semibold text-circle-charcoal shadow-md shadow-circle-primary/20 transition-all hover:bg-circle-sage hover:text-white focus:outline-none focus:ring-4 focus:ring-circle-primary/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {verifyMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t.auth.verifying}</span>
            </>
          ) : (
            <>
              <span>{t.auth.verifyButton}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>

        {/* Resend OTP Section */}
        <div className="pt-2 text-center">
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendMutation.isPending}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-circle-sage dark:text-circle-primary hover:underline"
            >
              {resendMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              <span>{t.auth.resendCode}</span>
            </button>
          ) : (
            <p className="text-xs text-circle-slate dark:text-circle-dark-muted">
              {t.auth.resendCountdown}{' '}
              <span className="font-bold text-circle-charcoal dark:text-circle-dark-text">{countdown}s</span>
            </p>
          )}
        </div>

        {/* Back Link */}
        <div className="border-t border-circle-hairline dark:border-circle-dark-hairline pt-4 text-center">
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

export default function VerifyOtpPage() {
  return (
    <AuthGuard mode="guest-only">
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-circle-sage" />
          </div>
        }
      >
        <VerifyOtpContent />
      </Suspense>
    </AuthGuard>
  );
}
