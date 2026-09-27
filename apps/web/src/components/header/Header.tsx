'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Search, Bell, Sparkles, Shield, LogOut, ChevronDown, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const Header: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
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

  const displayName = user?.profile?.displayName || user?.email?.split('@')[0] || 'Khách';
  const initials = getInitials(displayName);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-circle-hairline bg-white/80 px-6 backdrop-blur-md">
      {/* Brand & Active Circle indicator */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-circle-primary text-circle-charcoal shadow-sm transition-transform group-hover:scale-105">
            <span className="text-lg font-bold">C</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-circle-charcoal">CIRCLE</span>
        </Link>
        <div className="h-4 w-px bg-circle-hairline" />
        <div className="flex items-center gap-2 rounded-full border border-circle-hairline bg-circle-canvas px-3 py-1 text-sm font-medium text-circle-charcoal">
          <span className="flex h-2 w-2 rounded-full bg-circle-primary animate-presence-breathe" />
          <span>Kỷ Niệm Mùa Thu 🍂</span>
          <Shield className="h-3.5 w-3.5 text-circle-sage" />
        </div>
      </div>

      {/* Global Search Bar (Pill shape) */}
      <div className="relative mx-4 hidden max-w-md flex-1 md:block">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-circle-slate" />
        <input
          type="text"
          placeholder="Tìm kiếm tin nhắn, ảnh kỷ niệm, lịch hẹn..."
          className="w-full rounded-full border border-circle-hairline bg-circle-canvas py-2 pl-10 pr-4 text-sm text-circle-charcoal placeholder:text-circle-slate focus:border-circle-sage focus:bg-white focus:outline-none focus:ring-2 focus:ring-circle-primary/20 transition-all"
        />
      </div>

      {/* Actions & Profile */}
      <div className="flex items-center gap-3">
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full border border-circle-hairline bg-white text-circle-slate hover:bg-circle-canvas hover:text-circle-charcoal transition-colors relative"
          title="Thông báo nhóm"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-circle-coral" />
        </button>

        <button
          className="hidden sm:flex items-center gap-1.5 rounded-full border border-circle-hairline bg-circle-wash px-3.5 py-1.5 text-xs font-semibold text-circle-sage hover:bg-circle-primary/20 transition-colors"
          title="Thiệp Điều muốn nói"
        >
          <Sparkles className="h-3.5 w-3.5 text-circle-sage" />
          <span>Điều muốn nói</span>
        </button>

        {/* User state / Auth buttons */}
        {isLoading ? (
          <div className="flex items-center gap-2 pl-2">
            <div className="h-9 w-9 rounded-full bg-circle-hairline animate-pulse" />
          </div>
        ) : isAuthenticated && user ? (
          <div className="relative pl-2" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 rounded-full p-1 hover:bg-circle-canvas/80 transition-colors focus:outline-none"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white bg-circle-charcoal text-white text-xs font-semibold shadow-sm">
                <span>{initials}</span>
              </div>
              <div className="hidden lg:block text-left text-xs leading-tight pr-1">
                <p className="font-semibold text-circle-charcoal">{displayName}</p>
                <p className="text-circle-slate">{user.globalRole === 'ADMIN' ? 'Quản trị viên' : 'Thành viên'}</p>
              </div>
              <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-circle-slate" />
            </button>

            {/* Profile Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-circle-hairline bg-white/95 p-2 shadow-xl shadow-circle-charcoal/8 backdrop-blur-md animate-fadeIn z-50">
                <div className="px-3 py-2 border-b border-circle-hairline/70">
                  <p className="text-xs font-semibold text-circle-charcoal truncate">{displayName}</p>
                  <p className="text-[11px] text-circle-slate truncate">{user.email}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      alert(`Thông tin tài khoản: ${user.email} (ID: ${user.id})`);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-circle-charcoal hover:bg-circle-canvas transition-colors"
                  >
                    <UserIcon className="h-3.5 w-3.5 text-circle-slate" />
                    <span>Hồ sơ cá nhân</span>
                  </button>
                </div>
                <div className="border-t border-circle-hairline/70 pt-1">
                  <button
                    onClick={async () => {
                      setShowMenu(false);
                      await logout();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-circle-coral hover:bg-circle-coral/10 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 pl-2">
            <Link
              href="/login"
              className="rounded-full border border-circle-hairline bg-white px-3.5 py-1.5 text-xs font-semibold text-circle-charcoal hover:bg-circle-canvas transition-colors shadow-sm"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-circle-charcoal px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-circle-charcoal/90 transition-colors shadow-sm"
            >
              Đăng ký
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
