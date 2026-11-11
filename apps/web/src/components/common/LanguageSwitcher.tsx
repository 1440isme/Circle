'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { LOCALES } from '@circle/shared';
import { useLanguageStore } from '../../stores/language.store';

export const LanguageSwitcher: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { locale, setLocale, t } = useLanguageStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const currentLocale = LOCALES.find((l) => l.code === locale) || LOCALES[0];

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-full border border-circle-hairline dark:border-circle-dark-hairline bg-white/92 dark:bg-circle-dark-surface/90 backdrop-blur-xl px-2.5 py-1 text-xs font-medium text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-canvas dark:hover:bg-circle-dark-elevated transition-colors shadow-sm focus:outline-none"
        title={t.common.changeLanguageTitle}
        aria-label={t.common.changeLanguageTitle}
      >
        <span className="text-sm leading-none">{currentLocale.flag}</span>
        {!compact && <span className="font-medium text-circle-slate dark:text-circle-dark-muted">{currentLocale.label}</span>}
        <ChevronDown className="h-3 w-3 text-circle-slate dark:text-circle-dark-muted" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-36 rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white/94 dark:bg-circle-dark-elevated/92 p-1.5 shadow-xl shadow-circle-charcoal/10 dark:shadow-black/50 backdrop-blur-xl z-50 animate-fadeIn">
          {LOCALES.map((l) => {
            const isSelected = l.code === locale;
            return (
              <button
                key={l.code}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setLocale(l.code);
                  setIsOpen(false);
                }}
                onClick={() => {
                  setLocale(l.code);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-circle-wash dark:bg-circle-dark-wash text-circle-sage dark:text-circle-primary font-semibold'
                    : 'text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-canvas dark:hover:bg-circle-dark-wash/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{l.flag}</span>
                  <span>{l.label}</span>
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
