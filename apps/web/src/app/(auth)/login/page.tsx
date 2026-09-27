'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { loginSchema } from '@circle/shared';
import { useLoginMutation } from '../../../hooks/use-auth-mutations';
import { useLanguageStore } from '../../../stores/language.store';
import { AuthGuard } from '../../../components/auth/AuthGuard';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const t = useLanguageStore((s) => s.t);
  const loginMutation = useLoginMutation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string[]; password?: string[] }>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setFieldErrors({});

    // Zod validation (Single Source of Truth from @circle/shared)
    const validationResult = loginSchema.safeParse({
      email,
      password,
    });

    if (!validationResult.success) {
      const flattened = validationResult.error.flatten().fieldErrors;
      setFieldErrors({
        email: flattened.email,
        password: flattened.password,
      });
      return;
    }

    try {
      await loginMutation.mutateAsync(validationResult.data);
      router.push(redirectUrl);
    } catch (err: any) {
      if (err?.details?.code === 'ACCOUNT_NOT_ACTIVATED' || err?.message?.includes('kích hoạt')) {
        router.push(
          `/verify-otp?email=${encodeURIComponent(validationResult.data.email)}&from=login`,
        );
        return;
      }
      setApiError(err?.message || t.auth.loginFailed);
    }
  };

  return (
    <div className="rounded-3xl border border-white/80 bg-white/70 p-8 sm:p-10 shadow-xl shadow-circle-charcoal/5 backdrop-blur-xl transition-all">
      {/* Card Header */}
      <div className="mb-8 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 rounded-full border border-circle-hairline bg-circle-canvas px-3 py-1 text-xs font-semibold text-circle-sage mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-circle-primary animate-presence-breathe" />
          <span>{t.auth.userBadge}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-circle-charcoal sm:text-3xl">
          {t.auth.welcomeBack}
        </h1>
        <p className="mt-1 text-sm text-circle-slate">
          {t.auth.loginSubtitle}
        </p>
      </div>

      {/* API Error Banner */}
      {apiError && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-circle-coral/30 bg-circle-coral/10 p-3.5 text-xs text-circle-charcoal animate-fadeIn">
          <AlertCircle className="h-4 w-4 shrink-0 text-circle-coral mt-0.5" />
          <div className="flex-1 font-medium">{apiError}</div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-circle-slate mb-1.5">
            {t.auth.email}
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-circle-slate" />
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder={t.auth.emailPlaceholder}
              className={`w-full rounded-2xl border bg-circle-canvas/80 py-3 pl-10 pr-4 text-sm text-circle-charcoal placeholder:text-circle-slate/60 focus:bg-white focus:outline-none focus:ring-4 transition-all ${
                fieldErrors.email
                  ? 'border-circle-coral focus:border-circle-coral focus:ring-circle-coral/20'
                  : 'border-circle-hairline focus:border-circle-sage focus:ring-circle-wash/60'
              }`}
            />
          </div>
          {fieldErrors.email?.[0] && (
            <p className="mt-1 text-xs text-circle-coral font-medium">{fieldErrors.email[0]}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-circle-slate">
              {t.auth.password}
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-circle-sage hover:underline"
            >
              {t.auth.forgotPassword}
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-circle-slate" />
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder={t.auth.passwordPlaceholder}
              className={`w-full rounded-2xl border bg-circle-canvas/80 py-3 pl-10 pr-11 text-sm text-circle-charcoal placeholder:text-circle-slate/60 focus:bg-white focus:outline-none focus:ring-4 transition-all ${
                fieldErrors.password
                  ? 'border-circle-coral focus:border-circle-coral focus:ring-circle-coral/20'
                  : 'border-circle-hairline focus:border-circle-sage focus:ring-circle-wash/60'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-circle-slate hover:text-circle-charcoal transition-colors"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {fieldErrors.password?.[0] && (
            <p className="mt-1 text-xs text-circle-coral font-medium">{fieldErrors.password[0]}</p>
          )}
        </div>

        {/* Remember me */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded-md border-circle-hairline text-circle-sage focus:ring-circle-wash"
          />
          <label htmlFor="rememberMe" className="text-xs text-circle-slate cursor-pointer select-none">
            {t.auth.rememberMe}
          </label>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-circle-charcoal py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-circle-charcoal/90 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed transition-all"
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-circle-primary" />
                <span>{t.auth.authenticating}</span>
              </>
            ) : (
              <>
                <span>{t.auth.login}</span>
                <ArrowRight className="h-4 w-4 text-circle-primary" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Switch to Register */}
      <div className="mt-8 text-center border-t border-circle-hairline pt-6">
        <p className="text-xs text-circle-slate">
          {t.auth.noAccount}{' '}
          <Link
            href="/register"
            className="font-semibold text-circle-sage hover:underline hover:text-circle-charcoal transition-colors ml-1"
          >
            {t.auth.signUpNow}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const t = useLanguageStore((s) => s.t);

  return (
    <AuthGuard mode="guest-only">
      <Suspense
        fallback={
          <div className="flex min-h-[400px] w-full items-center justify-center rounded-3xl border border-white/80 bg-white/70 p-8 shadow-xl backdrop-blur-xl">
            <div className="flex items-center gap-2 text-sm text-circle-slate">
              <Loader2 className="h-5 w-5 animate-spin text-circle-primary" />
              <span>{t.common.loading}</span>
            </div>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthGuard>
  );
}
