'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

import { useLanguageStore } from '../../stores/language.store';

interface AuthGuardProps {
  children: React.ReactNode;
  mode?: 'require-auth' | 'guest-only';
  fallback?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  mode = 'require-auth',
  fallback,
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const t = useLanguageStore((s) => s.t);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (mode === 'require-auth' && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (mode === 'guest-only' && isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, mode, router, pathname]);

  if (isLoading) {
    return (
      fallback || (
        <div className="flex min-h-screen w-full items-center justify-center bg-circle-canvas dark:bg-circle-dark-canvas transition-colors">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-circle-primary text-circle-charcoal shadow-sm">
              <span className="text-xl font-bold">C</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-circle-slate dark:text-circle-dark-muted">
              <span className="h-2 w-2 rounded-full bg-circle-primary animate-presence-breathe" />
              <span>{t?.home?.connectingCircle || 'Connecting to CIRCLE...'}</span>
            </div>
          </div>
        </div>
      )
    );
  }

  if (mode === 'require-auth' && !isAuthenticated) {
    return null;
  }

  if (mode === 'guest-only' && isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
