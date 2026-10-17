'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Search, Bell, LogOut, ChevronDown, User as UserIcon, Sliders, AtSign } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCircleStore } from '../../stores/circle.store';
import { useLanguageStore } from '../../stores/language.store';
import { useThemeStore } from '../../stores/theme.store';
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
  const uiStyle = useThemeStore((s) => s.uiStyle);
  const isGlass = uiStyle === 'glass';
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
      {/* Unlimited Floating Header Layer: Floating Brand Pill (Top-Left) & Floating Avatar + Notifications (Top-Right) */}
      <header className="pointer-events-none fixed top-0 left-0 right-0 z-40 flex items-center justify-between p-3 sm:p-3.5 w-full bg-transparent border-0 shadow-none transition-colors">
        {/* Top-Left: Floating Brand Capsule Pill ("Viên thuốc bo sát") */}
        <div className="pointer-events-auto">
          <Link
            href="/"
            onClick={() => setActiveCircle(null)}
            className={`inline-flex h-9 sm:h-10 items-center gap-2 pl-1 sm:pl-1.5 pr-3.5 sm:pr-4 rounded-full border transition-all select-none group active:scale-95 ${
              isGlass
                ? 'backdrop-blur-md bg-white/80 dark:bg-circle-dark-surface/80 border-white/60 dark:border-white/10 shadow-sm hover:shadow-md hover:bg-white/90 dark:hover:bg-circle-dark-surface/90 hover:scale-[1.02]'
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
        </div>

        {/* Top-Right: Floating Notification Button (Left) + Floating User Avatar (Sát góc phải trên) */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Nút thông báo hình tròn treo lơ lửng bên trái của avt */}
          <button
            type="button"
            className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border transition-all text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text relative active:scale-95 ${
              isGlass
                ? 'backdrop-blur-md bg-white/80 dark:bg-circle-dark-surface/80 border-white/60 dark:border-white/10 shadow-sm hover:shadow-md hover:scale-105'
                : 'bg-white dark:bg-circle-dark-surface border-circle-hairline dark:border-circle-dark-hairline shadow-xs hover:border-circle-slate dark:hover:border-circle-dark-muted'
            }`}
            title={t.nav.notifications}
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-circle-coral" />
          </button>

          {/* User Avatar Circle (Sát góc phải trên) */}
          {isLoading ? (
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-circle-hairline dark:bg-circle-dark-hairline animate-pulse" />
          ) : isAuthenticated && user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border transition-all overflow-hidden focus:outline-none active:scale-95 ${
                  isGlass
                    ? 'backdrop-blur-md bg-white/80 dark:bg-circle-dark-surface/80 border-white/60 dark:border-white/10 shadow-sm hover:shadow-md hover:scale-105'
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
                      ? 'glass backdrop-blur-xl bg-white/85 dark:bg-circle-dark-surface/85 border border-white/40 dark:border-white/10 shadow-2xl'
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
                className="rounded-full bg-circle-charcoal dark:bg-circle-primary px-4 py-1.5 text-xs font-semibold text-white dark:text-circle-charcoal hover:bg-circle-charcoal/90 dark:hover:bg-circle-sage transition-colors shadow-xs"
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
