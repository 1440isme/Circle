'use client';

import React, { useState } from 'react';
import { ShieldCheck, Lock, EyeOff, Sparkles, X } from 'lucide-react';
import { useLanguageStore } from '../../stores/language.store';

export const TrustBanner: React.FC = () => {
  const t = useLanguageStore((s) => s.t);
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="mt-4 flex items-center justify-between rounded-2xl border border-circle-sage/20 bg-circle-wash/40 dark:bg-circle-dark-wash/20 px-3.5 py-2.5 text-xs text-circle-charcoal dark:text-circle-dark-text transition-all">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-circle-sage text-white shadow-sm">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-circle-charcoal dark:text-circle-dark-text leading-tight">
              {t.auth.trustBadgeTitle}
            </p>
            <p className="text-[11px] text-circle-slate dark:text-circle-dark-muted">
              {t.auth.trustBadgeDesc}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="ml-2 shrink-0 text-[11px] font-semibold text-circle-sage hover:underline hover:text-circle-charcoal dark:hover:text-white transition-colors"
        >
          {t.common.privacyPolicy}
        </button>
      </div>

      {/* Privacy Commitment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-circle-charcoal/40 dark:bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl border border-circle-hairline dark:border-circle-dark-hairline bg-white/95 dark:bg-circle-dark-surface/95 p-6 shadow-2xl backdrop-blur-xl animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-circle-hairline dark:border-circle-dark-hairline">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-circle-primary/20 text-circle-sage dark:text-circle-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-circle-charcoal dark:text-circle-dark-text">
                  {t.auth.privacyPolicyTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-circle-slate hover:bg-circle-canvas dark:hover:bg-circle-dark-elevated transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 py-4 text-xs text-circle-charcoal dark:text-circle-dark-text">
              <div className="flex items-start gap-3 rounded-2xl bg-circle-canvas dark:bg-circle-dark-canvas p-3 border border-circle-hairline dark:border-circle-dark-hairline">
                <Lock className="h-4 w-4 text-circle-sage mt-0.5 shrink-0" />
                <p className="leading-relaxed">{t.auth.privacyPolicyBullet1}</p>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-circle-canvas dark:bg-circle-dark-canvas p-3 border border-circle-hairline dark:border-circle-dark-hairline">
                <EyeOff className="h-4 w-4 text-circle-sage mt-0.5 shrink-0" />
                <p className="leading-relaxed">{t.auth.privacyPolicyBullet2}</p>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-circle-canvas dark:bg-circle-dark-canvas p-3 border border-circle-hairline dark:border-circle-dark-hairline">
                <Sparkles className="h-4 w-4 text-circle-sage mt-0.5 shrink-0" />
                <p className="leading-relaxed">{t.auth.privacyPolicyBullet3}</p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full rounded-2xl bg-circle-charcoal dark:bg-circle-primary py-2.5 text-xs font-semibold text-white dark:text-circle-charcoal hover:bg-circle-charcoal/90 dark:hover:bg-circle-sage transition-all"
              >
                {t.auth.privacyPolicyClose}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
