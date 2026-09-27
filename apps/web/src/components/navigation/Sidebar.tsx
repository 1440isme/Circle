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

  const handleActionNotice = (msg: string) => {
    alert(msg);
  };

  return (
    <aside className="hidden md:flex w-72 flex-col gap-6 border-r border-circle-hairline dark:border-circle-dark-hairline bg-white/50 dark:bg-circle-dark-surface/50 p-5 backdrop-blur-sm h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto transition-colors">
      {/* Circle Switcher Card */}
      <div className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-3.5 shadow-circle-card transition-colors">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold tracking-wider text-circle-slate dark:text-circle-dark-muted uppercase">
            {t.nav.yourCircles}
          </span>
          <button
            onClick={() => handleActionNotice(t.home.createCirclePrompt)}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-circle-canvas dark:bg-circle-dark-canvas text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash hover:text-circle-sage dark:hover:text-circle-primary transition-colors"
            title={t.nav.createCircle}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Clean Empty Circle State */}
        <div className="flex flex-col gap-2.5 rounded-xl border border-dashed border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas/60 p-3 text-center">
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-circle-primary/10 text-circle-sage dark:text-circle-primary">
            <HeartHandshake className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text">
              {t.nav.noActiveCircle}
            </h4>
            <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted mt-0.5 leading-snug">
              {t.home.emptyCirclesTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleActionNotice(t.home.createCirclePrompt)}
            className="w-full rounded-lg bg-circle-charcoal dark:bg-circle-primary py-1.5 text-xs font-medium text-white dark:text-circle-charcoal shadow-sm hover:bg-circle-sage hover:text-white transition-all active:scale-98"
          >
            + {t.home.createCircleBtn}
          </button>
        </div>
      </div>

      {/* Main Channels & Communications */}
      <div className="flex flex-col gap-1">
        <span className="px-4 text-xs font-semibold tracking-wider text-circle-slate dark:text-circle-dark-muted uppercase mb-1">
          {t.nav.chatChannels}
        </span>
        <NavItem icon={<MessageSquare className="h-4 w-4" />} label={t.nav.generalDiscussion} active />
        <NavItem icon={<HeartHandshake className="h-4 w-4" />} label={t.nav.confessionCorner} />
      </div>

      {/* Group Tools & Utilities (Module 7) */}
      <div className="flex flex-col gap-1">
        <span className="px-4 text-xs font-semibold tracking-wider text-circle-slate dark:text-circle-dark-muted uppercase mb-1">
          {t.nav.groupTools}
        </span>
        <NavItem icon={<ImageIcon className="h-4 w-4" />} label={t.nav.photoAlbum} />
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
