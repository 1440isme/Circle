'use client';

import React from 'react';
import { Search, Bell, Sparkles, Shield, User } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-circle-hairline bg-white/80 px-6 backdrop-blur-md">
      {/* Brand & Active Circle indicator */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-circle-primary text-circle-charcoal shadow-sm">
            <span className="text-lg font-bold">C</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-circle-charcoal">CIRCLE</span>
        </div>
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

        <div className="flex items-center gap-2 pl-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white bg-circle-charcoal text-white text-xs font-semibold shadow-sm">
            <span>TB</span>
          </div>
          <div className="hidden lg:block text-left text-xs leading-tight">
            <p className="font-semibold text-circle-charcoal">Trương Công Bình</p>
            <p className="text-circle-slate">Owner Circle</p>
          </div>
        </div>
      </div>
    </header>
  );
};
