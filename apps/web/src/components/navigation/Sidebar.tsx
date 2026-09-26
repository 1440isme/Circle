'use client';

import React from 'react';
import {
  MessageSquare,
  Image as ImageIcon,
  Calendar,
  Compass,
  FileSpreadsheet,
  HelpCircle,
  Settings,
  Plus,
  HeartHandshake,
} from 'lucide-react';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, count, active }) => (
  <button
    className={`flex w-full items-center justify-between rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
      active
        ? 'bg-circle-wash text-circle-sage shadow-sm'
        : 'text-circle-charcoal hover:bg-circle-canvas hover:text-circle-sage'
    }`}
  >
    <div className="flex items-center gap-3">
      <span className={active ? 'text-circle-sage' : 'text-circle-slate'}>{icon}</span>
      <span>{label}</span>
    </div>
    {count !== undefined && (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
          active ? 'bg-circle-sage text-white' : 'bg-circle-canvas text-circle-slate'
        }`}
      >
        {count}
      </span>
    )}
  </button>
);

export const Sidebar: React.FC = () => {
  return (
    <aside className="hidden md:flex w-72 flex-col gap-6 border-r border-circle-hairline bg-white/50 p-5 backdrop-blur-sm h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
      {/* Circle Switcher Card */}
      <div className="rounded-2xl border border-circle-hairline bg-white p-3.5 shadow-circle-card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold tracking-wider text-circle-slate uppercase">Vòng tròn của bạn</span>
          <button className="flex h-6 w-6 items-center justify-center rounded-full bg-circle-canvas text-circle-slate hover:bg-circle-wash hover:text-circle-sage transition-colors">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-circle-canvas p-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-circle-primary/20 text-circle-sage font-bold">
            🍂
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-circle-charcoal truncate">Kỷ Niệm Mùa Thu</h4>
            <p className="text-xs text-circle-slate">8 thành viên · 4 online</p>
          </div>
        </div>
      </div>

      {/* Main Channels & Communications */}
      <div className="flex flex-col gap-1">
        <span className="px-4 text-xs font-semibold tracking-wider text-circle-slate uppercase mb-1">
          Kênh Trò Chuyện
        </span>
        <NavItem icon={<MessageSquare className="h-4 w-4" />} label="Thảo luận chung" count={3} active />
        <NavItem icon={<HeartHandshake className="h-4 w-4" />} label="Góc tâm sự & Chuyện vui" />
      </div>

      {/* Group Tools & Utilities (Module 7) */}
      <div className="flex flex-col gap-1">
        <span className="px-4 text-xs font-semibold tracking-wider text-circle-slate uppercase mb-1">
          Tiện ích Nhóm
        </span>
        <NavItem icon={<ImageIcon className="h-4 w-4" />} label="Album kỷ niệm" count={24} />
        <NavItem icon={<Calendar className="h-4 w-4" />} label="Lịch hẹn & Sự kiện" />
        <NavItem icon={<FileSpreadsheet className="h-4 w-4" />} label="Bảng kế hoạch (Sheet)" />
        <NavItem icon={<Compass className="h-4 w-4" />} label="Vòng xoay may mắn" />
        <NavItem icon={<HelpCircle className="h-4 w-4" />} label="Hộp thư Điều muốn nói" />
      </div>

      {/* Circle Settings */}
      <div className="mt-auto pt-4 border-t border-circle-hairline">
        <NavItem icon={<Settings className="h-4 w-4" />} label="Cài đặt Vòng tròn" />
      </div>
    </aside>
  );
};
