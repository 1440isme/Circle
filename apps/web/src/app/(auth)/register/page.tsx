'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, User, AlertCircle, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { AuthGuard } from '../../../components/auth/AuthGuard';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live password validation checks
  const isLengthValid = password.length >= 8;
  const isMatchValid = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!displayName.trim()) {
      setError('Vui lòng nhập tên hiển thị của bạn');
      return;
    }

    if (!email.trim()) {
      setError('Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }

    if (!isLengthValid) {
      setError('Mật khẩu phải có độ dài tối thiểu 8 ký tự');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (!agreeTerms) {
      setError('Bạn cần đồng ý với Quy chuẩn Cộng đồng của CIRCLE để tiếp tục');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        displayName: displayName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      router.push('/');
    } catch (err: any) {
      setError(err?.message || 'Đăng ký không thành công. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard mode="guest-only">
      <div className="rounded-3xl border border-white/80 bg-white/70 p-8 sm:p-10 shadow-xl shadow-circle-charcoal/5 backdrop-blur-xl transition-all">
        {/* Card Header */}
        <div className="mb-6 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-circle-hairline bg-circle-canvas px-3 py-1 text-xs font-semibold text-circle-sage mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-circle-primary animate-presence-breathe" />
            <span>Gia nhập cộng đồng</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-circle-charcoal sm:text-3xl">
            Tạo tài khoản CIRCLE
          </h1>
          <p className="mt-1 text-sm text-circle-slate">
            Mở ra không gian riêng tư, ấm cúng và an toàn cùng bạn bè thân thiết.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-circle-coral/30 bg-circle-coral/10 p-3.5 text-xs text-circle-charcoal animate-fadeIn">
            <AlertCircle className="h-4 w-4 shrink-0 text-circle-coral mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-circle-slate mb-1.5">
              Họ tên hoặc Biệt danh
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-circle-slate" />
              <input
                type="text"
                required
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="VD: Trương Công Bình"
                className="w-full rounded-2xl border border-circle-hairline bg-circle-canvas/80 py-3 pl-10 pr-4 text-sm text-circle-charcoal placeholder:text-circle-slate/60 focus:border-circle-sage focus:bg-white focus:outline-none focus:ring-4 focus:ring-circle-wash/60 transition-all"
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-circle-slate mb-1.5">
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-circle-slate" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tenban@domain.com"
                className="w-full rounded-2xl border border-circle-hairline bg-circle-canvas/80 py-3 pl-10 pr-4 text-sm text-circle-charcoal placeholder:text-circle-slate/60 focus:border-circle-sage focus:bg-white focus:outline-none focus:ring-4 focus:ring-circle-wash/60 transition-all"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-circle-slate mb-1.5">
              Mật khẩu (Tối thiểu 8 ký tự)
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-circle-slate" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu an toàn"
                className="w-full rounded-2xl border border-circle-hairline bg-circle-canvas/80 py-3 pl-10 pr-11 text-sm text-circle-charcoal placeholder:text-circle-slate/60 focus:border-circle-sage focus:bg-white focus:outline-none focus:ring-4 focus:ring-circle-wash/60 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-circle-slate hover:text-circle-charcoal transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {/* Visual Indicator */}
            {password.length > 0 && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <CheckCircle2
                  className={`h-3.5 w-3.5 ${
                    isLengthValid ? 'text-circle-sage' : 'text-circle-slate/40'
                  }`}
                />
                <span className={isLengthValid ? 'text-circle-sage font-medium' : 'text-circle-slate'}>
                  Tối thiểu 8 ký tự ({password.length}/8)
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-circle-slate mb-1.5">
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-circle-slate" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="w-full rounded-2xl border border-circle-hairline bg-circle-canvas/80 py-3 pl-10 pr-4 text-sm text-circle-charcoal placeholder:text-circle-slate/60 focus:border-circle-sage focus:bg-white focus:outline-none focus:ring-4 focus:ring-circle-wash/60 transition-all"
              />
            </div>
            {confirmPassword.length > 0 && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                <CheckCircle2
                  className={`h-3.5 w-3.5 ${
                    isMatchValid ? 'text-circle-sage' : 'text-circle-coral'
                  }`}
                />
                <span className={isMatchValid ? 'text-circle-sage font-medium' : 'text-circle-coral'}>
                  {isMatchValid ? 'Mật khẩu trùng khớp' : 'Mật khẩu chưa khớp'}
                </span>
              </div>
            )}
          </div>

          {/* Terms checkbox */}
          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="agreeTerms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded-md border-circle-hairline text-circle-sage focus:ring-circle-wash"
            />
            <label htmlFor="agreeTerms" className="text-xs text-circle-slate cursor-pointer select-none leading-relaxed">
              Tôi cam kết tuân thủ Quy chuẩn Cộng đồng và tôn trọng không gian an toàn tâm lý của các nhóm bạn CIRCLE.
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-circle-charcoal py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-circle-charcoal/90 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-circle-primary" />
                  <span>Đang khởi tạo tài khoản...</span>
                </>
              ) : (
                <>
                  <span>Hoàn tất đăng ký</span>
                  <ArrowRight className="h-4 w-4 text-circle-primary" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Switch to Login */}
        <div className="mt-6 text-center border-t border-circle-hairline pt-5">
          <p className="text-xs text-circle-slate">
            Đã có tài khoản CIRCLE?{' '}
            <Link
              href="/login"
              className="font-semibold text-circle-sage hover:underline hover:text-circle-charcoal transition-colors ml-1"
            >
              Đăng nhập tại đây
            </Link>
          </p>
        </div>
      </div>
    </AuthGuard>
  );
}
