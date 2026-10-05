'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Search, Bell, Sparkles, Shield, LogOut, ChevronDown, User as UserIcon, Laptop } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguageStore } from '../../stores/language.store';
import { useCircleStore } from '../../stores/circle.store';
import { EditProfileModal } from '../profile/EditProfileModal';
import { SessionsManagementModal } from '../profile/SessionsManagementModal';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const Header: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const t = useLanguageStore((s) => s.t);
  const activeCircle = useCircleStore((s) => s.activeCircle);
  const setActiveCircle = useCircleStore((s) => s.setActiveCircle);
  const [showMenu, setShowMenu] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = user?.profile?.displayName || user?.email?.split('@')[0] || t.auth.guest;
  const avatarUrl = user?.profile?.avatarUrl;
  const initials = getInitials(displayName);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-circle-hairline dark:border-circle-dark-hairline bg-white/80 dark:bg-circle-dark-surface/80 px-6 backdrop-blur-md transition-colors">
        {/* Brand & Active Circle indicator */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            onClick={() => setActiveCircle(null)}
            className="flex items-center gap-2.5 group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-circle-primary text-circle-charcoal shadow-sm transition-transform group-hover:scale-105">
              <span className="text-lg font-bold">C</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-circle-charcoal dark:text-circle-dark-text">{t.common.appName}</span>
          </Link>
          {activeCircle && (
            <>
              <div className="h-4 w-px bg-circle-hairline dark:bg-circle-dark-hairline" />
              <button
                type="button"
                onClick={() => setActiveCircle(null)}
                className="flex items-center gap-2 rounded-full border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas px-3 py-1 text-sm font-medium text-circle-charcoal dark:text-circle-dark-text hover:border-circle-sage/50 transition-colors"
              >
                <span className="flex h-2 w-2 rounded-full bg-circle-primary animate-presence-breathe" />
                <span>{activeCircle.name}</span>
                <Shield className="h-3.5 w-3.5 text-circle-sage" />
              </button>
            </>
          )}
        </div>

        {/* Global Search Bar (Pill shape) */}
        <div className="relative mx-4 hidden max-w-md flex-1 md:block">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-circle-slate dark:text-circle-dark-muted" />
          <input
            type="text"
            placeholder={t.common.searchPlaceholder}
            className="w-full rounded-full border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas py-2 pl-10 pr-4 text-sm text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate dark:placeholder:text-circle-dark-muted focus:border-circle-sage focus:bg-white dark:focus:bg-circle-dark-elevated focus:outline-none focus:ring-2 focus:ring-circle-primary/20 transition-all"
          />
        </div>

        {/* Actions, Theme Toggle, Language Switcher & Profile */}
        <div className="flex items-center gap-2.5">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface text-circle-slate dark:text-circle-dark-muted hover:bg-circle-canvas dark:hover:bg-circle-dark-elevated hover:text-circle-charcoal dark:hover:text-circle-dark-text transition-colors relative"
            title={t.nav.notifications}
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-circle-coral" />
          </button>

          <button
            className="hidden sm:flex items-center gap-1.5 rounded-full border border-circle-hairline dark:border-circle-dark-hairline bg-circle-wash dark:bg-circle-dark-wash px-3.5 py-1.5 text-xs font-semibold text-circle-sage dark:text-circle-primary hover:bg-circle-primary/20 transition-colors"
            title={t.nav.reflectionCard}
          >
            <Sparkles className="h-3.5 w-3.5 text-circle-sage dark:text-circle-primary" />
            <span>{t.nav.reflectionCard}</span>
          </button>

          {/* User state / Auth buttons */}
          {isLoading ? (
            <div className="flex items-center gap-2 pl-2">
              <div className="h-9 w-9 rounded-full bg-circle-hairline dark:bg-circle-dark-hairline animate-pulse" />
            </div>
          ) : isAuthenticated && user ? (
            <div className="relative pl-2" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 rounded-full p-1 hover:bg-circle-canvas/80 dark:hover:bg-circle-dark-elevated/80 transition-colors focus:outline-none"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white dark:border-circle-dark-hairline bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-charcoal text-xs font-semibold shadow-sm overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <div className="hidden lg:block text-left text-xs leading-tight pr-1">
                  <p className="font-semibold text-circle-charcoal dark:text-circle-dark-text">{displayName}</p>
                  <p className="text-circle-slate dark:text-circle-dark-muted">{user.globalRole === 'ADMIN' ? t.auth.admin : t.auth.member}</p>
                </div>
                <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-circle-slate dark:text-circle-dark-muted" />
              </button>

              {/* Profile Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white/95 dark:bg-circle-dark-elevated/95 p-2 shadow-xl shadow-circle-charcoal/8 backdrop-blur-md animate-fadeIn z-50">
                  <div className="px-3 py-2 border-b border-circle-hairline/70 dark:border-circle-dark-hairline">
                    <p className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text truncate">{displayName}</p>
                    <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted truncate">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setIsProfileModalOpen(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-canvas dark:hover:bg-circle-dark-surface transition-colors"
                    >
                      <UserIcon className="h-3.5 w-3.5 text-circle-slate dark:text-circle-dark-muted" />
                      <span>{t.auth.profile}</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setIsSessionsModalOpen(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-canvas dark:hover:bg-circle-dark-surface transition-colors"
                    >
                      <Laptop className="h-3.5 w-3.5 text-circle-slate dark:text-circle-dark-muted" />
                      <span>{t.auth.sessionsTitle}</span>
                    </button>
                  </div>
                  <div className="border-t border-circle-hairline/70 dark:border-circle-dark-hairline pt-1">
                    <button
                      onClick={async () => {
                        setShowMenu(false);
                        await logout();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-circle-coral hover:bg-circle-coral/10 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>{t.auth.logout}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2">
              <Link
                href="/login"
                className="rounded-full border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface px-3.5 py-1.5 text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-canvas dark:hover:bg-circle-dark-elevated transition-colors shadow-sm"
              >
                {t.auth.login}
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-circle-charcoal dark:bg-circle-primary px-3.5 py-1.5 text-xs font-semibold text-white dark:text-circle-charcoal hover:bg-circle-charcoal/90 dark:hover:bg-circle-sage transition-colors shadow-sm"
              >
                {t.auth.register}
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Sessions Management Modal */}
      <SessionsManagementModal
        isOpen={isSessionsModalOpen}
        onClose={() => setIsSessionsModalOpen(false)}
      />
    </>
  );
};
