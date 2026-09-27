'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { AuthGuard } from '../../../components/auth/AuthGuard';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({
        email: email.trim(),
        password,
      });
      router.push(redirectUrl);
    } catch (err: any) {
      setError(err?.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-white/80 bg-white/70 p-8 sm:p-10 shadow-xl shadow-circle-charcoal/5 backdrop-blur-xl transition-all">
      {/* Card Header */}
      <div className="mb-8 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 rounded-full border border-circle-hairline bg-circle-canvas px-3 py-1 text-xs font-semibold text-circle-sage mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-circle-primary animate-presence-breathe" />
          <span>Xác thực người dùng</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-circle-charcoal sm:text-3xl">
          Chào mừng trở lại
        </h1>
        <p className="mt-1 text-sm text-circle-slate">
          Đăng nhập để vào không gian kết nối và trò chuyện nhóm thân mật.
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
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-circle-slate">
              Mật khẩu
            </label>
            <button
              type="button"
              className="text-xs font-medium text-circle-sage hover:underline"
              onClick={() => alert('Vui lòng liên hệ quản trị viên để khôi phục mật khẩu trong giai đoạn thử nghiệm.')}
            >
              Quên mật khẩu?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-circle-slate" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu của bạn"
              className="w-full rounded-2xl border border-circle-hairline bg-circle-canvas/80 py-3 pl-10 pr-11 text-sm text-circle-charcoal placeholder:text-circle-slate/60 focus:border-circle-sage focus:bg-white focus:outline-none focus:ring-4 focus:ring-circle-wash/60 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-circle-slate hover:text-circle-charcoal transition-colors"
              title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
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
            Duy trì trạng thái đăng nhập trên thiết bị này (7 ngày)
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
                <span>Đang xác thực...</span>
              </>
            ) : (
              <>
                <span>Đăng nhập</span>
                <ArrowRight className="h-4 w-4 text-circle-primary" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Switch to Register */}
      <div className="mt-8 text-center border-t border-circle-hairline pt-6">
        <p className="text-xs text-circle-slate">
            Chưa có tài khoản CIRCLE?{' '}
          <Link
            href="/register"
            className="font-semibold text-circle-sage hover:underline hover:text-circle-charcoal transition-colors ml-1"
          >
            Đăng ký tham gia ngay
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthGuard mode="guest-only">
      <Suspense
        fallback={
          <div className="flex min-h-[400px] w-full items-center justify-center rounded-3xl border border-white/80 bg-white/70 p-8 shadow-xl backdrop-blur-xl">
            <div className="flex items-center gap-2 text-sm text-circle-slate">
              <Loader2 className="h-5 w-5 animate-spin text-circle-primary" />
              <span>Đang tải form đăng nhập...</span>
            </div>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthGuard>
  );
}
