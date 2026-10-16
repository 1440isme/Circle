'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Search, Bell, LogOut, ChevronDown, User as UserIcon, Sliders, AtSign } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCircleStore } from '../../stores/circle.store';
import { useLanguageStore } from '../../stores/language.store';
import { EditProfileModal } from '../profile/EditProfileModal';
import { SystemSettingsModal } from '../settings/SystemSettingsModal';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const Header: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const setActiveCircle = useCircleStore((s) => s.setActiveCircle);
  const t = useLanguageStore((s) => s.t);
  const [showMenu, setShowMenu] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSystemSettingsModalOpen, setIsSystemSettingsModalOpen] = useState(false);
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
  const handle = (user?.profile as any)?.handle;
  const initials = getInitials(displayName);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface px-6 transition-colors">
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
        </div>

        {/* Global Search Bar (Apple Spotlight style rounded) */}
        <div className="relative mx-4 hidden max-w-md flex-1 md:block">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-circle-slate dark:text-circle-dark-muted" />
          <input
            type="text"
            placeholder={t.common.searchPlaceholder}
            className="w-full rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas dark:bg-circle-dark-canvas py-2 pl-10 pr-4 text-sm text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate dark:placeholder:text-circle-dark-muted focus:border-circle-sage focus:bg-white dark:focus:bg-circle-dark-elevated focus:outline-none transition-all"
          />
        </div>

        {/* Actions, Notifications & Profile */}
        <div className="flex items-center gap-2">
          {/* Notifications Icon Button (Circular Bounding Box) */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface text-circle-slate dark:text-circle-dark-muted hover:bg-circle-canvas dark:hover:bg-circle-dark-elevated hover:text-circle-charcoal dark:hover:text-circle-dark-text transition-colors relative"
            title={t.nav.notifications}
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-circle-coral" />
          </button>

          {/* User state / Auth buttons */}
          {isLoading ? (
            <div className="flex items-center gap-2 pl-2">
              <div className="h-9 w-9 rounded-full bg-circle-hairline dark:bg-circle-dark-hairline animate-pulse" />
            </div>
          ) : isAuthenticated && user ? (
            <div className="relative pl-1" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 rounded-xl p-1 hover:bg-circle-canvas/80 dark:hover:bg-circle-dark-elevated/80 transition-colors focus:outline-none"
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
                  <p className="text-circle-slate dark:text-circle-dark-muted">
                    {handle ? `@${handle}` : user.globalRole === 'ADMIN' ? t.auth.admin : t.auth.member}
                  </p>
                </div>
                <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-circle-slate dark:text-circle-dark-muted" />
              </button>

              {/* Profile Popover Menu (Apple/Meta Solid Style: rounded-xl, opaque surface) */}
              {showMenu && (
                <div className="absolute right-0 mt-2 w-60 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-1.5 shadow-xl animate-fadeIn z-50">
                  <div className="px-3 py-2.5 border-b border-circle-hairline dark:border-circle-dark-hairline">
                    <p className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text truncate">{displayName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {handle ? (
                        <span className="text-[11px] font-medium text-circle-sage dark:text-circle-primary truncate">@{handle}</span>
                      ) : (
                        <span className="text-[11px] text-circle-slate dark:text-circle-dark-muted truncate">{user.email}</span>
                      )}
                    </div>
                  </div>
                  <div className="py-1 space-y-0.5">
                    {/* Mục 1: Hồ sơ cá nhân */}
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setIsProfileModalOpen(true);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-canvas dark:hover:bg-circle-dark-elevated transition-colors"
                    >
                      <UserIcon className="h-3.5 w-3.5 text-circle-slate dark:text-circle-dark-muted" />
                      <span>{t.auth.profile}</span>
                    </button>

                    {/* Mục 2: Cài đặt hệ thống (Theme, Ngôn ngữ, Phiên đăng nhập) */}
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setIsSystemSettingsModalOpen(true);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-canvas dark:hover:bg-circle-dark-elevated transition-colors"
                    >
                      <Sliders className="h-3.5 w-3.5 text-circle-slate dark:text-circle-dark-muted" />
                      <span>{t.common.systemSettings}</span>
                    </button>
                  </div>

                  {/* Mục 3: Đăng xuất */}
                  <div className="border-t border-circle-hairline dark:border-circle-dark-hairline pt-1 mt-0.5">
                    <button
                      onClick={async () => {
                        setShowMenu(false);
                        await logout();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-circle-coral hover:bg-circle-coral/10 transition-colors"
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
                className="rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface px-3.5 py-1.5 text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-canvas dark:hover:bg-circle-dark-elevated transition-colors shadow-sm"
              >
                {t.auth.login}
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-circle-charcoal dark:bg-circle-primary px-3.5 py-1.5 text-xs font-semibold text-white dark:text-circle-charcoal hover:bg-circle-charcoal/90 dark:hover:bg-circle-sage transition-colors shadow-sm"
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

      {/* System Settings Modal (Theme, Language, Active Sessions) */}
      <SystemSettingsModal
        isOpen={isSystemSettingsModalOpen}
        onClose={() => setIsSystemSettingsModalOpen(false)}
      />
    </>
  );
};
