'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KeyRound, Mail, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { forgotPasswordSchema } from '@circle/shared';
import { useForgotPasswordMutation } from '../../../hooks/use-auth-mutations';
import { useLanguageStore } from '../../../stores/language.store';
import { AuthGuard } from '../../../components/auth/AuthGuard';
import { TurnstileWidget } from '../../../components/auth/TurnstileWidget';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const t = useLanguageStore((s) => s.t);
  const forgotMutation = useForgotPasswordMutation();

  const [email, setEmail] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>(undefined);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string[] }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setFieldErrors({});

    const validation = forgotPasswordSchema.safeParse({ email });
    if (!validation.success) {
      setFieldErrors(validation.error.flatten().fieldErrors);
      return;
    }

    try {
      const res = await forgotMutation.mutateAsync({
        email: validation.data.email,
        turnstileToken,
      });
      setSuccessMsg(res?.message || t.auth.resetOtpSentSuccess);
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(validation.data.email)}`);
      }, 1500);
    } catch (err: any) {
      setApiError(err?.message || t.auth.failedToSendResetOtp);
    }
  };

  return (
    <AuthGuard mode="guest-only">
      <div className="rounded-3xl border border-white/80 dark:border-white/10 bg-white/70 dark:bg-circle-dark-surface/80 p-8 sm:p-10 shadow-xl shadow-circle-charcoal/5 dark:shadow-black/25 backdrop-blur-xl transition-all">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-circle-peach/30 text-amber-800 dark:text-amber-300 mb-4 shadow-sm">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-circle-charcoal dark:text-circle-dark-text sm:text-3xl">
            {t.auth.forgotPasswordTitle}
          </h1>
          <p className="mt-2 text-sm text-circle-slate dark:text-circle-dark-muted">
            {t.auth.forgotPasswordSubtitle}
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

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-circle-slate dark:text-circle-dark-muted mb-1.5">
              {t.auth.email}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-circle-slate dark:text-circle-dark-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors({});
                }}
                placeholder={t.auth.emailPlaceholder}
                className="w-full rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white/80 dark:bg-circle-dark-canvas/80 pl-10 pr-4 py-2.5 text-sm text-circle-charcoal dark:text-circle-dark-text placeholder-circle-slate/60 dark:placeholder-circle-dark-muted/60 focus:border-circle-sage focus:outline-none focus:ring-4 focus:ring-circle-primary/10 transition-all"
                required
              />
            </div>
            {fieldErrors.email && (
              <p className="mt-1.5 text-xs text-circle-coral">{fieldErrors.email[0]}</p>
            )}
          </div>

          {/* Cloudflare Turnstile bot verification */}
          <TurnstileWidget
            onVerify={(t) => setTurnstileToken(t)}
            onExpire={() => setTurnstileToken(undefined)}
            onError={() => setTurnstileToken(undefined)}
          />

          {/* Submit button */}
          <button
            type="submit"
            disabled={forgotMutation.isPending}
            className="group relative flex w-full items-center justify-center gap-2 rounded-full bg-circle-primary px-6 py-3.5 text-sm font-semibold text-circle-charcoal shadow-md shadow-circle-primary/20 transition-all hover:bg-circle-sage hover:text-white focus:outline-none focus:ring-4 focus:ring-circle-primary/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {forgotMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t.auth.sendingOtp}</span>
              </>
            ) : (
              <>
                <span>{t.auth.sendResetOtp}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>

          {/* Back link */}
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
    </AuthGuard>
  );
}
