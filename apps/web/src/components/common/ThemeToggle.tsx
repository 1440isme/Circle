'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Sun, Moon, Laptop, ChevronDown, Check } from 'lucide-react';
import { useThemeStore, Theme } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';

export const ThemeToggle: React.FC<{ compact?: boolean }> = ({ compact = true }) => {
  const { theme, resolvedTheme, setTheme, initTheme } = useThemeStore();
  const t = useLanguageStore((s) => s.t);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initTheme();
    setMounted(true);
  }, [initTheme]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!mounted) {
    return (
      <div className="h-8 w-8 rounded-full border border-circle-hairline bg-white/80 dark:bg-circle-dark-surface dark:border-circle-dark-hairline animate-pulse" />
    );
  }

  const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: t.common.themeLight, icon: <Sun className="h-3.5 w-3.5" /> },
    { value: 'dark', label: t.common.themeDark, icon: <Moon className="h-3.5 w-3.5" /> },
    { value: 'system', label: t.common.themeSystem, icon: <Laptop className="h-3.5 w-3.5" /> },
  ];

  const currentIcon =
    theme === 'system' ? (
      <Laptop className="h-3.5 w-3.5 text-circle-slate dark:text-circle-dark-muted" />
    ) : resolvedTheme === 'dark' ? (
      <Moon className="h-3.5 w-3.5 text-circle-sage" />
    ) : (
      <Sun className="h-3.5 w-3.5 text-amber-500" />
    );

  const currentLabel =
    theme === 'system'
      ? t.common.themeSystem
      : theme === 'dark'
      ? t.common.themeDark
      : t.common.themeLight;

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-full border border-circle-hairline bg-white/80 dark:bg-circle-dark-surface dark:border-circle-dark-hairline px-2.5 py-1 text-xs font-medium text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-canvas dark:hover:bg-circle-dark-elevated transition-colors shadow-sm focus:outline-none"
        title={t.common.changeTheme}
        aria-label={t.common.changeTheme}
      >
        {currentIcon}
        {!compact && (
          <span className="font-medium text-circle-slate dark:text-circle-dark-muted">
            {currentLabel}
          </span>
        )}
        <ChevronDown className="h-3 w-3 text-circle-slate dark:text-circle-dark-muted" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-36 rounded-2xl border border-circle-hairline bg-white/95 dark:bg-circle-dark-elevated dark:border-circle-dark-hairline p-1.5 shadow-xl shadow-circle-charcoal/10 backdrop-blur-md z-50 animate-fadeIn">
          {options.map((opt) => {
            const isSelected = opt.value === theme;
            return (
              <button
                key={opt.value}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setTheme(opt.value);
                  setIsOpen(false);
                }}
                onClick={() => {
                  setTheme(opt.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-circle-wash text-circle-sage dark:bg-circle-dark-wash dark:text-circle-primary'
                    : 'text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-canvas dark:hover:bg-circle-dark-surface'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-circle-sage dark:text-circle-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
