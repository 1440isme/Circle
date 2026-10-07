'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, User, AlertCircle, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { registerSchema } from '@circle/shared';
import { useRegisterMutation } from '../../../hooks/use-auth-mutations';
import { useLanguageStore } from '../../../stores/language.store';
import { AuthGuard } from '../../../components/auth/AuthGuard';
import { PasswordStrengthIndicator } from '../../../components/auth/PasswordStrengthIndicator';
import { TurnstileWidget } from '../../../components/auth/TurnstileWidget';

export default function RegisterPage() {
  const router = useRouter();
  const t = useLanguageStore((s) => s.t);
  const registerMutation = useRegisterMutation();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>(undefined);

  const [fieldErrors, setFieldErrors] = useState<{
    displayName?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  }>({});
  const [apiError, setApiError] = useState<string | null>(null);

  // Live validation helpers
  const isLengthValid = password.length >= 8;
  const isMatchValid = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setFieldErrors({});

    if (!agreeTerms) {
      setApiError(t.auth.termsRequiredError);
      return;
    }

    // Zod validation (Single Source of Truth from @circle/shared)
    const validationResult = registerSchema.safeParse({
      displayName,
      email,
      password,
      confirmPassword,
    });

    if (!validationResult.success) {
      const flattened = validationResult.error.flatten().fieldErrors;
      setFieldErrors({
        displayName: flattened.displayName,
        email: flattened.email,
        password: flattened.password,
        confirmPassword: flattened.confirmPassword,
      });
      return;
    }

    try {
      await registerMutation.mutateAsync({
        displayName: validationResult.data.displayName,
        email: validationResult.data.email,
        password: validationResult.data.password,
        turnstileToken,
      });
      router.push(`/verify-otp?email=${encodeURIComponent(validationResult.data.email)}`);
    } catch (err: any) {
      setApiError(err?.message || t.auth.registerFailed);
    }
  };

  return (
    <AuthGuard mode="guest-only">
      <div className="rounded-3xl border border-white/80 dark:border-white/10 bg-white/70 dark:bg-circle-dark-surface/80 p-8 sm:p-10 shadow-xl shadow-circle-charcoal/5 dark:shadow-black/25 backdrop-blur-xl transition-all">
        {/* Card Header */}
        <div className="mb-6 text-center sm:text-left">
          <h1 className="text-2xl font-bold tracking-tight text-circle-charcoal dark:text-circle-dark-text sm:text-3xl">
            {t.auth.createAccount}
          </h1>
          <p className="mt-1.5 text-sm text-circle-slate dark:text-circle-dark-muted">
            {t.auth.registerSubtitle}
          </p>
        </div>

        {/* API Error Banner */}
        {apiError && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-circle-coral/30 bg-circle-coral/10 p-3.5 text-xs text-circle-charcoal dark:text-circle-dark-text animate-fadeIn">
            <AlertCircle className="h-4 w-4 shrink-0 text-circle-coral mt-0.5" />
            <div className="flex-1 font-medium">{apiError}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-circle-slate dark:text-circle-dark-muted mb-1.5">
              {t.auth.displayName}
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-circle-slate dark:text-circle-dark-muted" />
              <input
                type="text"
                autoComplete="name"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (fieldErrors.displayName) setFieldErrors((p) => ({ ...p, displayName: undefined }));
                }}
                placeholder={t.auth.displayNamePlaceholder}
                className={`w-full rounded-2xl border bg-circle-canvas/80 dark:bg-circle-dark-canvas/80 py-3 pl-10 pr-4 text-sm text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate/60 dark:placeholder:text-circle-dark-muted/60 focus:bg-white dark:focus:bg-circle-dark-elevated focus:outline-none focus:ring-4 transition-all ${
                  fieldErrors.displayName
                    ? 'border-circle-coral focus:border-circle-coral focus:ring-circle-coral/20'
                    : 'border-circle-hairline dark:border-circle-dark-hairline focus:border-circle-sage focus:ring-circle-wash/60'
                }`}
              />
            </div>
            {fieldErrors.displayName?.[0] && (
              <p className="mt-1 text-xs text-circle-coral font-medium">{fieldErrors.displayName[0]}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-circle-slate dark:text-circle-dark-muted mb-1.5">
              {t.auth.email}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-circle-slate dark:text-circle-dark-muted" />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
                }}
                placeholder={t.auth.emailPlaceholder}
                className={`w-full rounded-2xl border bg-circle-canvas/80 dark:bg-circle-dark-canvas/80 py-3 pl-10 pr-4 text-sm text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate/60 dark:placeholder:text-circle-dark-muted/60 focus:bg-white dark:focus:bg-circle-dark-elevated focus:outline-none focus:ring-4 transition-all ${
                  fieldErrors.email
                    ? 'border-circle-coral focus:border-circle-coral focus:ring-circle-coral/20'
                    : 'border-circle-hairline dark:border-circle-dark-hairline focus:border-circle-sage focus:ring-circle-wash/60'
                }`}
              />
            </div>
            {fieldErrors.email?.[0] && (
              <p className="mt-1 text-xs text-circle-coral font-medium">{fieldErrors.email[0]}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-circle-slate dark:text-circle-dark-muted mb-1.5">
              {t.auth.password} ({t.auth.min8Chars})
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-circle-slate dark:text-circle-dark-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                }}
                placeholder={t.auth.passwordPlaceholder}
                className={`w-full rounded-2xl border bg-circle-canvas/80 dark:bg-circle-dark-canvas/80 py-3 pl-10 pr-11 text-sm text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate/60 dark:placeholder:text-circle-dark-muted/60 focus:bg-white dark:focus:bg-circle-dark-elevated focus:outline-none focus:ring-4 transition-all ${
                  fieldErrors.password
                    ? 'border-circle-coral focus:border-circle-coral focus:ring-circle-coral/20'
                    : 'border-circle-hairline dark:border-circle-dark-hairline focus:border-circle-sage focus:ring-circle-wash/60'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password?.[0] && (
              <p className="mt-1 text-xs text-circle-coral font-medium">{fieldErrors.password[0]}</p>
            )}
            <PasswordStrengthIndicator password={password} />
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-circle-slate dark:text-circle-dark-muted mb-1.5">
              {t.auth.confirmPassword}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-circle-slate dark:text-circle-dark-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) setFieldErrors((p) => ({ ...p, confirmPassword: undefined }));
                }}
                placeholder={t.auth.confirmPasswordPlaceholder}
                className={`w-full rounded-2xl border bg-circle-canvas/80 dark:bg-circle-dark-canvas/80 py-3 pl-10 pr-4 text-sm text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate/60 dark:placeholder:text-circle-dark-muted/60 focus:bg-white dark:focus:bg-circle-dark-elevated focus:outline-none focus:ring-4 transition-all ${
                  fieldErrors.confirmPassword
                    ? 'border-circle-coral focus:border-circle-coral focus:ring-circle-coral/20'
                    : 'border-circle-hairline dark:border-circle-dark-hairline focus:border-circle-sage focus:ring-circle-wash/60'
                }`}
              />
            </div>
            {fieldErrors.confirmPassword?.[0] ? (
              <p className="mt-1 text-xs text-circle-coral font-medium">{fieldErrors.confirmPassword[0]}</p>
            ) : confirmPassword.length > 0 ? (
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <CheckCircle2
                  className={`h-3.5 w-3.5 ${
                    isMatchValid ? 'text-circle-sage' : 'text-circle-coral'
                  }`}
                />
                <span className={isMatchValid ? 'text-circle-sage font-medium' : 'text-circle-coral'}>
                  {isMatchValid ? t.auth.passwordMatch : t.auth.passwordMismatch}
                </span>
              </div>
            ) : null}
          </div>

          {/* Terms checkbox */}
          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="agreeTerms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded-md border-circle-hairline dark:border-circle-dark-hairline text-circle-sage focus:ring-circle-wash dark:bg-circle-dark-canvas"
            />
            <label htmlFor="agreeTerms" className="text-xs text-circle-slate dark:text-circle-dark-muted cursor-pointer select-none leading-relaxed">
              {t.auth.termsAgreement}
            </label>
          </div>

          {/* Cloudflare Turnstile bot verification */}
          <TurnstileWidget
            onVerify={(token) => setTurnstileToken(token)}
            onExpire={() => setTurnstileToken(undefined)}
            onError={() => setTurnstileToken(undefined)}
          />

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-circle-charcoal dark:bg-circle-primary py-3.5 text-sm font-semibold text-white dark:text-circle-charcoal shadow-sm hover:bg-circle-charcoal/90 dark:hover:bg-circle-sage active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-circle-primary dark:text-circle-charcoal" />
                  <span>{t.auth.creatingAccount}</span>
                </>
              ) : (
                <>
                  <span>{t.auth.register}</span>
                  <ArrowRight className="h-4 w-4 text-circle-primary dark:text-circle-charcoal" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Switch to Login */}
        <div className="mt-6 text-center border-t border-circle-hairline dark:border-circle-dark-hairline pt-5">
          <p className="text-xs text-circle-slate dark:text-circle-dark-muted">
            {t.auth.hasAccount}{' '}
            <Link
              href="/login"
              className="font-semibold text-circle-sage hover:underline hover:text-circle-charcoal dark:hover:text-white transition-colors ml-1"
            >
              {t.auth.signInHere}
            </Link>
          </p>
        </div>
      </div>
    </AuthGuard>
  );
}
