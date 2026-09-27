'use client';

import React from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import { useLanguageStore } from '../../stores/language.store';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useLanguageStore((s) => s.t);

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-circle-canvas dark:bg-circle-dark-canvas text-circle-charcoal dark:text-circle-dark-text selection:bg-circle-wash selection:text-circle-sage transition-colors duration-200">
      {/* Ambient background glows (Apple HIG subtle depth) */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-circle-wash/60 dark:bg-circle-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-circle-peach/20 dark:bg-circle-peach/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-circle-primary/10 dark:bg-circle-primary/5 blur-3xl" />

      {/* Top Header / Brand */}
      <header className="relative z-10 flex h-20 w-full items-center justify-between px-6 sm:px-12">
        <Link href="/" className="flex items-center gap-3 group transition-transform active:scale-95">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-circle-primary text-circle-charcoal shadow-sm shadow-circle-primary/30 transition-transform group-hover:scale-105">
            <span className="text-xl font-bold">C</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-circle-charcoal dark:text-circle-dark-text">CIRCLE</span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-circle-slate dark:text-circle-dark-muted">
              {t.auth.brandTagline}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2.5">
          <div className="hidden md:flex items-center gap-2 rounded-full border border-circle-hairline dark:border-circle-dark-hairline bg-white/70 dark:bg-circle-dark-surface/70 px-3.5 py-1.5 text-xs font-medium text-circle-charcoal dark:text-circle-dark-text backdrop-blur-md">
            <Shield className="h-3.5 w-3.5 text-circle-sage" />
            <span>{t.common.dualTokenSecurity}</span>
          </div>
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex flex-1 items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-circle-hairline/60 dark:border-circle-dark-hairline bg-white/40 dark:bg-circle-dark-surface/40 px-6 py-4 text-xs text-circle-slate dark:text-circle-dark-muted backdrop-blur-sm sm:px-12">
        <p>{t.common.copyright}</p>
        <div className="flex items-center gap-4">
          <span className="hover:text-circle-charcoal dark:hover:text-circle-dark-text transition-colors cursor-pointer">
            {t.common.communityStandards}
          </span>
          <span>•</span>
          <span className="hover:text-circle-charcoal dark:hover:text-circle-dark-text transition-colors cursor-pointer">
            {t.common.privacyPolicy}
          </span>
        </div>
      </footer>
    </div>
  );
}
