'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { LOCALES } from '@circle/shared';
import { useLanguageStore } from '../../stores/language.store';

export const LanguageSwitcher: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { locale, setLocale } = useLanguageStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLocale = LOCALES.find((l) => l.code === locale) || LOCALES[0];

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-full border border-circle-hairline bg-white/80 px-2.5 py-1 text-xs font-medium text-circle-charcoal hover:bg-circle-canvas transition-colors shadow-sm focus:outline-none"
        title="Đổi ngôn ngữ / Change Language"
      >
        <span className="text-sm leading-none">{currentLocale.flag}</span>
        {!compact && <span className="font-medium text-circle-slate">{currentLocale.label}</span>}
        <ChevronDown className="h-3 w-3 text-circle-slate" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-36 rounded-2xl border border-circle-hairline bg-white/95 p-1.5 shadow-xl shadow-circle-charcoal/10 backdrop-blur-md z-50 animate-fadeIn">
          {LOCALES.map((l) => {
            const isSelected = l.code === locale;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  setLocale(l.code);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-circle-wash text-circle-sage'
                    : 'text-circle-charcoal hover:bg-circle-canvas'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{l.flag}</span>
                  <span>{l.label}</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-circle-sage" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
