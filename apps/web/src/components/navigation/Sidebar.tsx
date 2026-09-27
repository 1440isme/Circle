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
import { useLanguageStore } from '../../stores/language.store';

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
        ? 'bg-circle-wash dark:bg-circle-dark-wash text-circle-sage dark:text-circle-primary shadow-sm'
        : 'text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-canvas dark:hover:bg-circle-dark-elevated hover:text-circle-sage dark:hover:text-circle-primary'
    }`}
  >
    <div className="flex items-center gap-3">
      <span className={active ? 'text-circle-sage dark:text-circle-primary' : 'text-circle-slate dark:text-circle-dark-muted'}>{icon}</span>
      <span>{label}</span>
    </div>
    {count !== undefined && (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
          active ? 'bg-circle-sage text-white' : 'bg-circle-canvas dark:bg-circle-dark-elevated text-circle-slate dark:text-circle-dark-muted'
        }`}
      >
        {count}
      </span>
    )}
  </button>
);

export const Sidebar: React.FC = () => {
  const t = useLanguageStore((s) => s.t);

  return (
    <aside className="hidden md:flex w-72 flex-col gap-6 border-r border-circle-hairline dark:border-circle-dark-hairline bg-white/50 dark:bg-circle-dark-surface/50 p-5 backdrop-blur-sm h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto transition-colors">
      {/* Circle Switcher Card */}
      <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-3.5 shadow-circle-card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold tracking-wider text-circle-slate dark:text-circle-dark-muted uppercase">
            {t.nav.yourCircles}
          </span>
          <button className="flex h-6 w-6 items-center justify-center rounded-full bg-circle-canvas dark:bg-circle-dark-canvas text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash hover:text-circle-sage transition-colors">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-circle-canvas dark:bg-circle-dark-canvas p-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-circle-primary/20 text-circle-sage font-bold">
            🍂
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-circle-charcoal dark:text-circle-dark-text truncate">
              {t.nav.activeCircle}
            </h4>
            <p className="text-xs text-circle-slate dark:text-circle-dark-muted">
              {t.nav.membersCount.replace('{total}', '8').replace('{online}', '4')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Channels & Communications */}
      <div className="flex flex-col gap-1">
        <span className="px-4 text-xs font-semibold tracking-wider text-circle-slate dark:text-circle-dark-muted uppercase mb-1">
          {t.nav.chatChannels}
        </span>
        <NavItem icon={<MessageSquare className="h-4 w-4" />} label={t.nav.generalDiscussion} count={3} active />
        <NavItem icon={<HeartHandshake className="h-4 w-4" />} label={t.nav.confessionCorner} />
      </div>

      {/* Group Tools & Utilities (Module 7) */}
      <div className="flex flex-col gap-1">
        <span className="px-4 text-xs font-semibold tracking-wider text-circle-slate dark:text-circle-dark-muted uppercase mb-1">
          {t.nav.groupTools}
        </span>
        <NavItem icon={<ImageIcon className="h-4 w-4" />} label={t.nav.photoAlbum} count={24} />
        <NavItem icon={<Calendar className="h-4 w-4" />} label={t.nav.calendarEvents} />
        <NavItem icon={<FileSpreadsheet className="h-4 w-4" />} label={t.nav.planningSheet} />
        <NavItem icon={<Compass className="h-4 w-4" />} label={t.nav.luckyWheel} />
        <NavItem icon={<HelpCircle className="h-4 w-4" />} label={t.nav.reflectionMailbox} />
      </div>

      {/* Circle Settings */}
      <div className="mt-auto pt-4 border-t border-circle-hairline dark:border-circle-dark-hairline">
        <NavItem icon={<Settings className="h-4 w-4" />} label={t.nav.circleSettings} />
      </div>
    </aside>
  );
};
