'use client';

import React, { useEffect } from 'react';
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
  Users,
  Check,
  ChevronDown,
  Link2,
  Camera,
} from 'lucide-react';
import { useLanguageStore } from '../../stores/language.store';
import { useCircleStore } from '../../stores/circle.store';
import { useMyCirclesQuery } from '../../hooks/use-circle-queries';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, count, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-all text-left ${
      active
        ? 'bg-circle-wash dark:bg-circle-dark-wash text-circle-sage dark:text-circle-primary font-bold shadow-xs'
        : 'text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas hover:text-circle-sage dark:hover:text-circle-primary'
    }`}
  >
    <div className="flex items-center gap-2.5 text-left min-w-0">
      <span className={`shrink-0 ${active ? 'text-circle-sage dark:text-circle-primary' : 'text-circle-slate dark:text-circle-dark-muted'}`}>{icon}</span>
      <span className="text-left leading-snug">{label}</span>
    </div>
    {count !== undefined && (
      <span
        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold shrink-0 ${
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
  const activeCircle = useCircleStore((s) => s.activeCircle);
  const setActiveCircle = useCircleStore((s) => s.setActiveCircle);
  const setCreateModalOpen = useCircleStore((s) => s.setCreateModalOpen);
  const setManageModalOpen = useCircleStore((s) => s.setManageModalOpen);
  const activeCircleView = useCircleStore((s) => s.activeCircleView);
  const setActiveCircleView = useCircleStore((s) => s.setActiveCircleView);
  const setActiveChannelId = useCircleStore((s) => s.setActiveChannelId);

  const { data: circles = [], isLoading } = useMyCirclesQuery();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const handleCopyLink = () => {
    if (activeCircle) {
      const url = `${window.location.origin}/@${activeCircle.handle}`;
      navigator.clipboard.writeText(url);
      alert(t.home.linkCopiedNotice);
    }
  };

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col gap-4 bg-white dark:bg-circle-dark-surface p-3 pt-3 h-screen sticky top-0 overflow-y-auto transition-colors border-r border-circle-hairline/60 dark:border-circle-dark-hairline/60">
      {/* Circle Switcher Section (Flat, borderless container) */}
      <div className="p-1 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold tracking-wider text-circle-slate dark:text-circle-dark-muted uppercase px-1">
            {t.nav.yourCircles}
          </span>
          <div className="flex items-center gap-1">
            {activeCircle && (
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-circle-canvas dark:bg-circle-dark-canvas text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash hover:text-circle-sage dark:hover:text-circle-primary transition-colors"
                title={t.home.copyLinkBtn}
              >
                <Link2 className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-circle-canvas dark:bg-circle-dark-canvas text-circle-slate dark:text-circle-dark-muted hover:bg-circle-wash dark:hover:bg-circle-dark-wash hover:text-circle-sage dark:hover:text-circle-primary transition-colors"
              title={t.nav.createCircle}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-4 text-center text-xs text-circle-slate dark:text-circle-dark-muted animate-pulse">
            {t.circle.loadingCircles}
          </div>
        ) : circles.length > 0 ? (
          <div className="relative">
            {/* Active Circle Button */}
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex w-full items-center justify-between rounded-xl bg-circle-canvas dark:bg-circle-dark-canvas p-2.5 text-left hover:bg-circle-wash/80 dark:hover:bg-circle-dark-wash/80 transition-all shadow-2xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-circle-primary/10 text-circle-sage dark:text-circle-primary font-bold text-xs uppercase">
                  {activeCircle?.name ? activeCircle.name.slice(0, 2) : 'C'}
                </div>
                <div className="truncate">
                  <h4 className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text truncate">
                    {activeCircle?.name || t.circle.selectCircle}
                  </h4>
                  <p className="text-[10px] text-circle-slate dark:text-circle-dark-muted truncate font-mono">
                    @{activeCircle?.handle || 'circle'}
                  </p>
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-circle-slate dark:text-circle-dark-muted shrink-0" />
            </button>

            {/* Circle Selector Dropdown */}
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-30 rounded-xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-1.5 shadow-xl animate-in fade-in duration-150">
                  <div className="max-h-48 overflow-y-auto space-y-0.5">
                    {circles.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setActiveCircle(c);
                          setIsDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors ${
                          activeCircle?.id === c.id
                            ? 'bg-circle-wash dark:bg-circle-dark-wash text-circle-sage dark:text-circle-primary font-semibold'
                            : 'hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas text-circle-charcoal dark:text-circle-dark-text'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-circle-primary/10 text-[9px] font-bold">
                            {c.name.slice(0, 2)}
                          </span>
                          <span className="text-xs font-medium truncate">{c.name}</span>
                        </div>
                        {activeCircle?.id === c.id && (
                          <Check className="h-3.5 w-3.5 shrink-0 text-circle-sage dark:text-circle-primary" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="pt-1.5 mt-1 border-t border-circle-hairline dark:border-circle-dark-hairline">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setCreateModalOpen(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-circle-slate dark:text-circle-dark-muted hover:text-circle-sage dark:hover:text-circle-primary transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>+ {t.home.createCircleBtn}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Clean Empty Circle State */
            <div className="flex flex-col gap-2 rounded-xl border border-dashed border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas/60 p-3 text-center">
              <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-circle-primary/10 text-circle-sage dark:text-circle-primary">
                <HeartHandshake className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text">
                  {t.nav.noActiveCircle}
                </h4>
                <p className="text-[10px] text-circle-slate dark:text-circle-dark-muted mt-0.5 leading-snug">
                  {t.home.emptyCirclesTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="w-full rounded-lg bg-circle-charcoal dark:bg-circle-primary py-1.5 text-xs font-medium text-white dark:text-circle-charcoal shadow-sm hover:bg-circle-sage hover:text-white transition-all active:scale-98"
              >
                + {t.home.createCircleBtn}
              </button>
            </div>
          )}
        </div>

        {/* Intimate Circle Navigation: Single Chat & Moments */}
        <div className="flex flex-col gap-1">
          <NavItem
            icon={<MessageSquare className="h-4 w-4" />}
            label={t.chat.title}
            active={!activeCircleView || activeCircleView === 'chat' || activeCircleView === 'general'}
            onClick={() => {
              setActiveCircleView('chat');
              const defaultChannel = (activeCircle as any)?.channels?.[0];
              if (defaultChannel) {
                setActiveChannelId(defaultChannel.id);
              }
            }}
          />
          <NavItem
            icon={<Camera className="h-4 w-4" />}
            label={t.moments.momentWidgetTitle}
            active={activeCircleView === 'moments'}
            onClick={() => setActiveCircleView('moments')}
          />
        </div>

        {/* Divider line between navigation and group utilities */}
        <div className="border-t border-circle-hairline/80 dark:border-circle-dark-hairline/80 my-1 mx-1" />

        {/* Group Tools & Utilities (Borderless section with natural spacing) */}
        <div className="flex flex-col gap-1 pt-1">
          <span className="px-3 text-xs font-semibold tracking-wider text-circle-slate dark:text-circle-dark-muted uppercase mb-1">
            {t.nav.groupTools}
          </span>
          <NavItem icon={<ImageIcon className="h-4 w-4" />} label={t.nav.photoAlbum} />
          <NavItem icon={<Calendar className="h-4 w-4" />} label={t.nav.calendarEvents} />
          <NavItem icon={<FileSpreadsheet className="h-4 w-4" />} label={t.nav.planningSheet} />
          <NavItem icon={<Compass className="h-4 w-4" />} label={t.nav.luckyWheel} />
          <NavItem icon={<HelpCircle className="h-4 w-4" />} label={t.nav.reflectionMailbox} />
        </div>

        {/* Circle Settings (Natural bottom spacing) */}
        <div className="mt-auto pt-3">
          <NavItem
            icon={<Settings className="h-4 w-4" />}
            label={t.nav.circleSettings}
            onClick={() => {
              if (activeCircle) {
                setManageModalOpen(true, 'settings');
              }
            }}
          />
        </div>
      </aside>
  );
};
