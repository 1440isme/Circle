'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useThemeStore } from '../../stores/theme.store';
import { useLanguageStore } from '../../stores/language.store';
import { ShieldCheck, RefreshCw } from 'lucide-react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'auto' | 'light' | 'dark';
          size?: 'normal' | 'compact' | 'flexible';
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  className?: string;
}

const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script';
const DEFAULT_TEST_SITE_KEY = '1x00000000000000000000AA'; // Cloudflare official Always Pass test key

export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  onVerify,
  onError,
  onExpire,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const t = useLanguageStore((s) => s.t);

  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const siteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || DEFAULT_TEST_SITE_KEY;

  // 1. Load Cloudflare Turnstile script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.turnstile) {
      setScriptLoaded(true);
      return;
    }

    if (document.getElementById(TURNSTILE_SCRIPT_ID)) {
      const interval = setInterval(() => {
        if (window.turnstile) {
          setScriptLoaded(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }

    const script = document.createElement('script');
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setScriptLoaded(true);
    };
    script.onerror = () => {
      setHasError(true);
      onError?.();
    };
    document.head.appendChild(script);
  }, [onError]);

  // 2. Render widget when container and script are ready
  useEffect(() => {
    if (!scriptLoaded || !containerRef.current || !window.turnstile) return;

    // Clean up previous widget instance if re-rendering (e.g. theme switch)
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        // ignore
      }
      widgetIdRef.current = null;
    }

    try {
      const id = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          setHasError(false);
          onVerify(token);
        },
        'error-callback': () => {
          setHasError(true);
          onError?.();
        },
        'expired-callback': () => {
          onExpire?.();
        },
        theme: resolvedTheme === 'dark' ? 'dark' : 'light',
        size: 'flexible',
      });
      widgetIdRef.current = id;
    } catch {
      setHasError(true);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
      }
    };
  }, [scriptLoaded, siteKey, resolvedTheme, onVerify, onError, onExpire]);

  return (
    <div className={`my-2 flex flex-col items-center justify-center ${className}`}>
      <div
        ref={containerRef}
        className="w-full min-h-[65px] flex items-center justify-center rounded-2xl overflow-hidden"
      />
      {hasError && (
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-circle-coral">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>{t.auth.turnstileFailed}</span>
        </div>
      )}
    </div>
  );
};
