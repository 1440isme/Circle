'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  KeyRound,
  ShieldCheck,
  Send,
  Paperclip,
  Image as ImageIcon,
  Smile,
  Compass,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguageStore } from '../../stores/language.store';

export const FeedStream: React.FC = () => {
  const { user } = useAuth();
  const t = useLanguageStore((s) => s.t);
  const [message, setMessage] = useState('');

  const displayName = user?.profile?.displayName || user?.email?.split('@')[0] || t.auth.guest;

  const handleActionNotice = (msg: string) => {
    alert(msg);
  };

  return (
    <main className="flex-1 max-w-3xl flex flex-col gap-6 p-6 min-h-[calc(100vh-4rem)]">
      {/* Welcome Hero Banner (Apple HIG Intimate Glow) */}
      <div className="relative overflow-hidden rounded-3xl border border-circle-hairline dark:border-circle-dark-hairline bg-gradient-to-br from-circle-wash/80 via-white/90 to-circle-canvas dark:from-circle-dark-wash dark:via-circle-dark-surface dark:to-circle-dark-canvas p-6 sm:p-8 shadow-circle-card transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-circle-primary text-circle-charcoal shadow-sm text-2xl font-bold">
              C
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-circle-primary/20 dark:bg-circle-primary/10 px-2.5 py-0.5 text-xs font-semibold text-circle-sage dark:text-circle-primary">
                <Sparkles className="h-3 w-3" />
                <span>{t.home.createFirstCirclePrompt}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-circle-charcoal dark:text-circle-dark-text">
                {t.home.welcomeTitle.replace('{name}', displayName)}
              </h2>
              <p className="text-sm text-circle-slate dark:text-circle-dark-muted max-w-xl leading-relaxed">
                {t.home.welcomeSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Start CTAs */}
        <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-circle-hairline/80 dark:border-circle-dark-hairline">
          <button
            type="button"
            onClick={() => handleActionNotice(t.home.createCirclePrompt)}
            className="flex items-center gap-2 rounded-full bg-circle-charcoal dark:bg-circle-primary px-4 py-2 text-xs sm:text-sm font-semibold text-white dark:text-circle-charcoal shadow-sm hover:bg-circle-sage dark:hover:bg-circle-sage dark:hover:text-white transition-all active:scale-98"
          >
            <Plus className="h-4 w-4" />
            <span>{t.home.createCircleBtn}</span>
          </button>
          <button
            type="button"
            onClick={() => handleActionNotice(t.home.inviteCodePrompt)}
            className="flex items-center gap-2 rounded-full border border-circle-hairline dark:border-circle-dark-hairline bg-white/80 dark:bg-circle-dark-surface/80 px-4 py-2 text-xs sm:text-sm font-semibold text-circle-charcoal dark:text-circle-dark-text shadow-sm hover:bg-circle-canvas dark:hover:bg-circle-dark-elevated transition-colors"
          >
            <KeyRound className="h-4 w-4 text-circle-slate dark:text-circle-dark-muted" />
            <span>{t.home.joinWithCodeBtn}</span>
          </button>
        </div>
      </div>

      {/* Clean Authentic Empty State Feed */}
      <div className="rounded-3xl border border-dashed border-circle-hairline dark:border-circle-dark-hairline bg-white/60 dark:bg-circle-dark-surface/60 p-10 text-center shadow-circle-card flex flex-col items-center justify-center gap-4 transition-colors">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-circle-canvas dark:bg-circle-dark-canvas text-circle-sage dark:text-circle-primary border border-circle-hairline dark:border-circle-dark-hairline shadow-sm">
          <Compass className="h-8 w-8 stroke-[1.5]" />
        </div>
        <div className="max-w-md space-y-1.5">
          <h3 className="text-base sm:text-lg font-bold text-circle-charcoal dark:text-circle-dark-text">
            {t.home.feedEmptyTitle}
          </h3>
          <p className="text-xs sm:text-sm text-circle-slate dark:text-circle-dark-muted leading-relaxed">
            {t.home.feedEmptyDesc}
          </p>
        </div>

        <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-circle-hairline dark:border-circle-dark-hairline bg-circle-wash/60 dark:bg-circle-dark-wash/60 px-3.5 py-1 text-xs text-circle-sage dark:text-circle-primary font-medium">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>{t.home.dualTokenSecured}</span>
        </div>
      </div>

      {/* Sticky Bottom Message Composer */}
      <div className="sticky bottom-6 mt-auto">
        <div className="flex items-center gap-3 rounded-full border border-circle-hairline dark:border-circle-dark-hairline bg-white/90 dark:bg-circle-dark-surface/90 p-2 shadow-circle-hover backdrop-blur-md transition-colors">
          <button
            type="button"
            onClick={() => handleActionNotice(t.home.createCirclePrompt)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-circle-slate dark:text-circle-dark-muted hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas hover:text-circle-sage transition-colors"
            title="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleActionNotice(t.home.createCirclePrompt)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-circle-slate dark:text-circle-dark-muted hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas hover:text-circle-sage transition-colors"
            title="Attach image"
          >
            <ImageIcon className="h-4 w-4" />
          </button>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t.home.composerPlaceholder}
            className="flex-1 bg-transparent text-xs sm:text-sm text-circle-charcoal dark:text-circle-dark-text placeholder:text-circle-slate dark:placeholder:text-circle-dark-muted focus:outline-none"
          />
          <button
            type="button"
            onClick={() => handleActionNotice(t.home.createCirclePrompt)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-circle-slate dark:text-circle-dark-muted hover:bg-circle-canvas dark:hover:bg-circle-dark-canvas transition-colors"
          >
            <Smile className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (message.trim()) {
                handleActionNotice(t.home.createCirclePrompt);
                setMessage('');
              }
            }}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
              message.trim()
                ? 'bg-circle-primary text-circle-charcoal shadow-sm hover:bg-circle-sage hover:text-white'
                : 'bg-circle-canvas dark:bg-circle-dark-canvas text-circle-slate dark:text-circle-dark-muted opacity-50 cursor-not-allowed'
            }`}
            disabled={!message.trim()}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </main>
  );
};
