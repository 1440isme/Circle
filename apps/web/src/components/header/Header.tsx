'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bell, LogOut, User as UserIcon, Sliders, AtSign, Menu, Users, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCircleStore } from '../../stores/circle.store';
import { useLanguageStore } from '../../stores/language.store';
import { useThemeStore } from '../../stores/theme.store';
import { useMyCirclesQuery } from '../../hooks/use-circle-queries';
import { EditProfileModal } from '../profile/EditProfileModal';
import { SystemSettingsModal } from '../settings/SystemSettingsModal';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const Header: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const activeCircle = useCircleStore((s) => s.activeCircle);
  const setActiveCircle = useCircleStore((s) => s.setActiveCircle);
  const setManageModalOpen = useCircleStore((s) => s.setManageModalOpen);
  const isMobileDrawerOpen = useCircleStore((s) => s.isMobileDrawerOpen);
  const setMobileDrawerOpen = useCircleStore((s) => s.setMobileDrawerOpen);
  const { data: myCircles = [] } = useMyCirclesQuery();
  const t = useLanguageStore((s) => s.t);
  const uiStyle = useThemeStore((s) => s.uiStyle);
  const isGlass = uiStyle === 'glass';
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSystemSettingsModalOpen, setIsSystemSettingsModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowMenu(false);
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const pendingRequestCircles = myCircles.filter(
    (c: any) =>
      (c.role === 'OWNER' || c.role === 'ADMIN') &&
      Number(c.pendingJoinRequestsCount || 0) > 0,
  );
  const totalNotifications = pendingRequestCircles.reduce(
    (acc: number, c: any) => acc + Number(c.pendingJoinRequestsCount || 0),
    0,
  );

  const displayName = user?.profile?.displayName || user?.email?.split('@')[0] || t.auth.guest;
  const avatarUrl = user?.profile?.avatarUrl;
  const handle = (user?.profile as any)?.handle;
  const initials = getInitials(displayName);

  return (
    <>
      {/* Floating Header Layer */}
      <header className="pointer-events-none fixed top-0 left-0 right-0 z-40 flex items-center justify-between p-3 sm:p-3.5 w-full bg-transparent border-0 shadow-none transition-colors">
        {/* Top-Left: Floating Brand Capsule Pill + Mobile Sidebar Toggle */}
        <div className="pointer-events-auto flex items-center gap-2">
          <Link
            href="/"
            onClick={() => setActiveCircle(null)}
            className={`inline-flex h-9 sm:h-10 items-center gap-2 pl-1 sm:pl-1.5 pr-3.5 sm:pr-4 rounded-full border transition-all select-none group active:scale-95 ${
              isGlass
                ? 'backdrop-blur-xl bg-white/94 dark:bg-circle-dark-surface/92 border-circle-hairline/80 dark:border-white/12 shadow-sm hover:shadow-md hover:bg-white/98 dark:hover:bg-circle-dark-surface/98 hover:scale-[1.02]'
                : 'bg-white dark:bg-circle-dark-surface border-circle-hairline dark:border-circle-dark-hairline shadow-xs hover:border-circle-slate dark:hover:border-circle-dark-muted'
            }`}
            title={t.common.appName}
          >
            <div className="flex h-7 w-7 sm:h-7.5 sm:w-7.5 min-w-[28px] sm:min-w-[30px] aspect-square shrink-0 items-center justify-center rounded-full bg-circle-primary text-circle-charcoal shadow-xs transition-transform group-hover:scale-105">
              <span className="text-xs sm:text-sm font-black leading-none select-none">C</span>
            </div>
            <span className="text-sm sm:text-[15px] font-bold tracking-tight text-circle-charcoal dark:text-circle-dark-text">
              {t.common.appName}
            </span>
          </Link>

          {isAuthenticated && activeCircle && (
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(!isMobileDrawerOpen)}
              aria-label={t.common.openMenu}
              title={t.common.openMenu}
              className={`flex md:hidden h-9 w-9 items-center justify-center rounded-full border transition-all text-circle-charcoal dark:text-circle-dark-text active:scale-95 ${
                isGlass
                  ? 'backdrop-blur-xl bg-white/94 dark:bg-circle-dark-surface/92 border-circle-hairline/80 dark:border-white/12 shadow-sm hover:shadow-md'
                  : 'bg-white dark:bg-circle-dark-surface border-circle-hairline dark:border-circle-dark-hairline shadow-xs'
              }`}
            >
              <Menu className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Top-Right: Floating Notification Button + Floating User Avatar */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Notification Bell + Popover */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                setShowNotifications((prev) => !prev);
              }}
              aria-label={t.nav.notifications}
              title={t.nav.notifications}
              className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border transition-all text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text relative active:scale-95 ${
                isGlass
                  ? 'backdrop-blur-xl bg-white/94 dark:bg-circle-dark-surface/92 border-circle-hairline/80 dark:border-white/12 shadow-sm hover:shadow-md hover:scale-105'
                  : 'bg-white dark:bg-circle-dark-surface border-circle-hairline dark:border-circle-dark-hairline shadow-xs hover:border-circle-slate dark:hover:border-circle-dark-muted'
              }`}
            >
              <Bell className="h-4 w-4" />
              {totalNotifications > 0 && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-circle-coral ring-2 ring-white dark:ring-circle-dark-surface" />
              )}
            </button>

            {showNotifications && (
              <div
                className={`absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl p-2 animate-fadeIn z-50 ${
                  isGlass
                    ? 'glass backdrop-blur-xl bg-white/94 dark:bg-circle-dark-surface/92 border border-circle-hairline/80 dark:border-white/16 shadow-2xl'
                    : 'bg-white dark:bg-circle-dark-surface border border-circle-hairline dark:border-circle-dark-hairline shadow-xl'
                }`}
              >
                <div className="px-2.5 py-2 border-b border-circle-hairline dark:border-circle-dark-hairline">
                  <p className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                    {t.nav.notifications}
                  </p>
                  <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-0.5">
                    {t.nav.notificationsSubtitle}
                  </p>
                </div>

                {pendingRequestCircles.length > 0 ? (
                  <div className="py-1.5 space-y-1 max-h-64 overflow-y-auto">
                    {pendingRequestCircles.map((circle: any) => (
                      <button
                        key={circle.id}
                        type="button"
                        onClick={() => {
                          setShowNotifications(false);
                          setActiveCircle(circle);
                          setManageModalOpen(true, 'requests');
                        }}
                        className="flex w-full items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 text-left hover:bg-circle-wash/70 dark:hover:bg-circle-dark-elevated transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Users className="h-4 w-4 shrink-0 text-circle-sage dark:text-circle-primary" />
                          <span className="text-xs font-medium text-circle-charcoal dark:text-circle-dark-text truncate">
                            {t.nav.pendingRequestsNotice
                              .replace('{circle}', circle.name)
                              .replace('{count}', String(circle.pendingJoinRequestsCount))}
                          </span>
                        </div>
                        <span className="shrink-0 text-[11px] font-bold text-circle-sage dark:text-circle-primary">
                          {t.nav.reviewNow}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-5 text-center space-y-1.5">
                    <CheckCircle2 className="h-5 w-5 mx-auto text-circle-sage dark:text-circle-primary opacity-80" />
                    <p className="text-xs text-circle-slate dark:text-circle-dark-muted">
                      {t.nav.noNotifications}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Avatar Circle */}
          {isLoading ? (
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-circle-hairline dark:bg-circle-dark-hairline animate-pulse" />
          ) : isAuthenticated && user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => {
                  setShowNotifications(false);
                  setShowMenu(!showMenu);
                }}
                className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border transition-all overflow-hidden focus:outline-none active:scale-95 ${
                  isGlass
                    ? 'backdrop-blur-xl bg-white/94 dark:bg-circle-dark-surface/92 border-circle-hairline/80 dark:border-white/12 shadow-sm hover:shadow-md hover:scale-105'
                    : 'bg-white dark:bg-circle-dark-surface border-circle-hairline dark:border-circle-dark-hairline shadow-xs hover:border-circle-slate dark:hover:border-circle-dark-muted'
                }`}
                title={displayName}
              >
                <div className="flex h-full w-full items-center justify-center bg-circle-charcoal dark:bg-circle-primary text-white dark:text-circle-charcoal text-xs font-semibold overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
              </button>

              {/* Profile Popover Menu (Liquid Glass vs Flat) */}
              {showMenu && (
                <div
                  className={`absolute right-0 mt-2 w-60 rounded-2xl p-1.5 animate-fadeIn z-50 ${
                    isGlass
                      ? 'glass backdrop-blur-xl bg-white/94 dark:bg-circle-dark-surface/92 border border-circle-hairline/80 dark:border-white/16 shadow-2xl'
                      : 'bg-white dark:bg-circle-dark-surface border border-circle-hairline dark:border-circle-dark-hairline shadow-xl'
                  }`}
                >
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

                    {user?.globalRole === 'ADMIN' && (
                      <Link
                        href="/admin"
                        onClick={() => setShowMenu(false)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-canvas dark:hover:bg-circle-dark-elevated transition-colors"
                      >
                        <AtSign className="h-3.5 w-3.5 text-circle-slate dark:text-circle-dark-muted" />
                        <span>{t.auth.admin}</span>
                      </Link>
                    )}
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
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-full border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface px-4 py-1.5 text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-canvas dark:hover:bg-circle-dark-elevated transition-colors shadow-xs"
              >
                {t.auth.login}
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-circle-charcoal dark:bg-circle-primary px-4 py-1.5 text-xs font-semibold text-white dark:text-circle-charcoal hover:bg-circle-charcoal/90 dark:hover:bg-circle-sage dark:hover:text-white transition-colors shadow-xs"
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
