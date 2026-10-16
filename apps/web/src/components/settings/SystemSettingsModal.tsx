'use client';

import React, { useState } from 'react';
import {
  X,
  Sliders,
  Sun,
  Moon,
  Monitor,
  Globe,
  Laptop,
  Smartphone,
  Tablet,
  Shield,
  LogOut,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  Check,
} from 'lucide-react';
import { SessionEntity } from '@circle/types';
import { useLanguageStore } from '../../stores/language.store';
import { useThemeStore, Theme } from '../../stores/theme.store';
import {
  useSessionsQuery,
  useRevokeSessionMutation,
  useRevokeOtherSessionsMutation,
} from '../../hooks/use-auth-mutations';

interface SystemSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'general' | 'sessions';
}

export const SystemSettingsModal: React.FC<SystemSettingsModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'general',
}) => {
  const t = useLanguageStore((s) => s.t);
  const { locale, setLocale } = useLanguageStore();
  const { theme, setTheme } = useThemeStore();

  const [activeTab, setActiveTab] = useState<'general' | 'sessions'>(defaultTab);

  // Sessions state & queries
  const { data: sessions = [], isLoading, isRefetching, refetch } = useSessionsQuery();
  const revokeSessionMutation = useRevokeSessionMutation();
  const revokeOtherSessionsMutation = useRevokeOtherSessionsMutation();

  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [showConfirmRevokeAll, setShowConfirmRevokeAll] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const otherSessions = sessions.filter((s) => !s.isCurrent);

  const getDeviceIcon = (deviceType: SessionEntity['deviceType']) => {
    switch (deviceType) {
      case 'DESKTOP':
        return <Laptop className="h-4 w-4 text-circle-charcoal dark:text-circle-dark-text" />;
      case 'MOBILE':
        return <Smartphone className="h-4 w-4 text-circle-charcoal dark:text-circle-dark-text" />;
      case 'TABLET':
        return <Tablet className="h-4 w-4 text-circle-charcoal dark:text-circle-dark-text" />;
      default:
        return <Shield className="h-4 w-4 text-circle-charcoal dark:text-circle-dark-text" />;
    }
  };

  const formatSessionTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const handleRevokeSingle = async (sessionId: string) => {
    setRevokingId(sessionId);
    setErrorNotice(null);
    try {
      await revokeSessionMutation.mutateAsync(sessionId);
      setSuccessNotice(t.auth.revokeSessionSuccess);
      setTimeout(() => setSuccessNotice(null), 3000);
    } catch (err: any) {
      setErrorNotice(err?.message || t.auth.sessionNotFound);
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAllOther = async () => {
    setErrorNotice(null);
    try {
      await revokeOtherSessionsMutation.mutateAsync();
      setShowConfirmRevokeAll(false);
      setSuccessNotice(t.auth.revokeAllOtherSuccess);
      setTimeout(() => setSuccessNotice(null), 3000);
    } catch (err: any) {
      setErrorNotice(err?.message || t.common.unknownError);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      {/* Modal Dialog: Modern Apple/Meta Sheet (rounded-2xl, solid opaque surface, 1px crisp border) */}
      <div className="relative w-full max-w-xl rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-6 shadow-2xl max-h-[90vh] flex flex-col text-circle-charcoal dark:text-circle-dark-text">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-circle-hairline dark:border-circle-dark-hairline shrink-0 gap-4">
          <h3 className="text-base font-bold text-circle-charcoal dark:text-circle-dark-text truncate">
            {t.common.systemSettings}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-circle-canvas dark:bg-circle-dark-canvas text-circle-slate hover:bg-circle-wash hover:text-circle-charcoal dark:hover:text-circle-dark-text transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Switcher: Parent bounded by bottom line without rounded bubble, active tab is rounded-xl */}
        <div className="mt-4 flex items-center gap-1 border-b border-circle-hairline dark:border-circle-dark-hairline pb-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-2 px-3.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'general'
                ? 'bg-circle-wash dark:bg-circle-dark-wash text-circle-sage dark:text-circle-primary font-bold shadow-xs'
                : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text hover:bg-circle-canvas/60'
            }`}
          >
            <Globe className="h-4 w-4" />
            <span>{t.common.generalTab}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sessions')}
            className={`py-2 px-3.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'sessions'
                ? 'bg-circle-wash dark:bg-circle-dark-wash text-circle-sage dark:text-circle-primary font-bold shadow-xs'
                : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text hover:bg-circle-canvas/60'
            }`}
          >
            <Laptop className="h-4 w-4" />
            <span>{t.common.sessionsTab}</span>
            {sessions.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-circle-primary text-white dark:text-circle-charcoal">
                {sessions.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: CÀI ĐẶT CHUNG (THEME & NGÔN NGỮ - Flat layout, parent partitioned by line, active item rounded) */}
        {activeTab === 'general' && (
          <div className="mt-4 space-y-5 overflow-y-auto flex-1 pr-1 custom-scrollbar">
            {/* Section 1: Chế độ giao diện */}
            <div className="space-y-2">
              <div className="px-0.5">
                <span className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                  {t.common.appearanceSection}
                </span>
              </div>

              {/* Theme Controls: Parent line-divided, icon-first, active item rounded-lg */}
              <div className="flex items-center divide-x divide-circle-hairline dark:divide-circle-dark-hairline border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  title={t.common.themeLight}
                  aria-label={t.common.themeLight}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 px-2 text-xs font-semibold transition-all ${
                    theme === 'light'
                      ? 'rounded-lg bg-white dark:bg-circle-dark-surface text-circle-sage dark:text-circle-primary font-bold shadow-xs border border-circle-hairline/80 dark:border-circle-dark-hairline'
                      : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text hover:bg-circle-wash/40'
                  }`}
                >
                  <Sun className="h-4 w-4 text-amber-500" />
                  <span className="text-[11px]">{t.common.themeLight}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  title={t.common.themeDark}
                  aria-label={t.common.themeDark}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 px-2 text-xs font-semibold transition-all ${
                    theme === 'dark'
                      ? 'rounded-lg bg-white dark:bg-circle-dark-surface text-circle-sage dark:text-circle-primary font-bold shadow-xs border border-circle-hairline/80 dark:border-circle-dark-hairline'
                      : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text hover:bg-circle-wash/40'
                  }`}
                >
                  <Moon className="h-4 w-4 text-circle-sage dark:text-circle-primary" />
                  <span className="text-[11px]">{t.common.themeDark}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  title={t.common.themeSystem}
                  aria-label={t.common.themeSystem}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 px-2 text-xs font-semibold transition-all ${
                    theme === 'system'
                      ? 'rounded-lg bg-white dark:bg-circle-dark-surface text-circle-sage dark:text-circle-primary font-bold shadow-xs border border-circle-hairline/80 dark:border-circle-dark-hairline'
                      : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text hover:bg-circle-wash/40'
                  }`}
                >
                  <Monitor className="h-4 w-4 text-circle-slate dark:text-circle-dark-muted" />
                  <span className="text-[11px]">{t.common.themeSystem}</span>
                </button>
              </div>
            </div>

            {/* Section 2: Ngôn ngữ hiển thị */}
            <div className="space-y-2">
              <div className="px-0.5">
                <span className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                  {t.common.languageSection}
                </span>
              </div>

              {/* Language Selector: Parent line-divided, active item rounded-lg */}
              <div className="flex items-center divide-x divide-circle-hairline dark:divide-circle-dark-hairline border border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/40 dark:bg-circle-dark-canvas/40 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setLocale('vi')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold transition-all ${
                    locale === 'vi'
                      ? 'rounded-lg bg-white dark:bg-circle-dark-surface text-circle-sage dark:text-circle-primary font-bold shadow-xs border border-circle-hairline/80 dark:border-circle-dark-hairline'
                      : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text hover:bg-circle-wash/40'
                  }`}
                >
                  <span className="text-base">🇻🇳</span>
                  <span>Tiếng Việt</span>
                  {locale === 'vi' && <Check className="h-3.5 w-3.5 text-circle-sage dark:text-circle-primary ml-1" />}
                </button>

                <button
                  type="button"
                  onClick={() => setLocale('en')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold transition-all ${
                    locale === 'en'
                      ? 'rounded-lg bg-white dark:bg-circle-dark-surface text-circle-sage dark:text-circle-primary font-bold shadow-xs border border-circle-hairline/80 dark:border-circle-dark-hairline'
                      : 'text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text hover:bg-circle-wash/40'
                  }`}
                >
                  <span className="text-base">🇬🇧</span>
                  <span>English</span>
                  {locale === 'en' && <Check className="h-3.5 w-3.5 text-circle-sage dark:text-circle-primary ml-1" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: THIẾT BỊ & PHIÊN ĐĂNG NHẬP (Phân chia bằng line, item select bo tròn) */}
        {activeTab === 'sessions' && (
          <div className="mt-4 flex-1 flex flex-col min-h-0">
            {/* Notices */}
            {successNotice && (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-circle-wash dark:bg-circle-dark-wash p-2.5 text-xs text-circle-sage dark:text-circle-primary border border-circle-sage/40 animate-fadeIn shrink-0">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successNotice}</span>
              </div>
            )}
            {errorNotice && (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-circle-coral/10 p-2.5 text-xs text-circle-coral border border-circle-coral/30 animate-fadeIn shrink-0">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorNotice}</span>
              </div>
            )}

            <div className="flex items-center justify-between pb-2 shrink-0">
              <span className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text">
                {t.auth.sessionsSubtitle}
              </span>
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isRefetching}
                className="flex items-center gap-1 text-[11px] font-semibold text-circle-slate dark:text-circle-dark-muted hover:text-circle-charcoal dark:hover:text-circle-dark-text transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`h-3 w-3 ${isRefetching ? 'animate-spin' : ''}`} />
                <span>{isRefetching ? t.common.loading : 'Làm mới'}</span>
              </button>
            </div>

            {/* Sessions Flat List: Khung viền 1px, card phiên bo tròn nhẹ */}
            <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
              {isLoading ? (
                <div className="flex h-40 flex-col items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-circle-sage" />
                  <p className="text-xs text-circle-slate dark:text-circle-dark-muted">
                    {t.common.loading}
                  </p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center text-center p-4">
                  <Shield className="h-7 w-7 text-circle-slate/40 mb-2" />
                  <p className="text-xs text-circle-slate dark:text-circle-dark-muted">
                    {t.auth.noOtherSessions}
                  </p>
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`relative flex items-center justify-between rounded-xl border p-3 transition-all ${
                      session.isCurrent
                        ? 'border-circle-sage bg-circle-wash/30 dark:bg-circle-dark-wash/20 shadow-xs'
                        : 'border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas/60 hover:bg-circle-wash/40 dark:hover:bg-circle-dark-elevated'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-circle-dark-elevated border border-circle-hairline dark:border-circle-dark-hairline shadow-2xs">
                        {getDeviceIcon(session.deviceType)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text truncate">
                            {session.browser} • {session.os}
                          </p>
                          {session.isCurrent && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-circle-primary text-white dark:text-circle-charcoal px-2 py-0.5 text-[10px] font-bold">
                              <span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-circle-charcoal animate-presence-breathe" />
                              {t.auth.currentSession}
                            </span>
                          )}
                        </div>

                        <div className="mt-0.5 flex items-center gap-2.5 text-[11px] text-circle-slate dark:text-circle-dark-muted flex-wrap">
                          {session.ipAddress && (
                            <span className="flex items-center gap-1 font-mono">
                              <MapPin className="h-3 w-3" />
                              {session.ipAddress}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatSessionTime(session.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Revoke single session button: rounded-lg */}
                    {!session.isCurrent && (
                      <button
                        type="button"
                        onClick={() => handleRevokeSingle(session.id)}
                        disabled={revokingId === session.id}
                        className="ml-2 shrink-0 rounded-lg border border-circle-coral/40 bg-circle-coral/10 hover:bg-circle-coral/20 px-2.5 py-1 text-xs font-semibold text-circle-coral transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        {revokingId === session.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <LogOut className="h-3 w-3" />
                        )}
                        <span>{t.auth.revokeSession}</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Revoke All Other Action: rounded-lg */}
            {otherSessions.length > 0 && (
              <div className="pt-3 mt-2 border-t border-circle-hairline dark:border-circle-dark-hairline shrink-0">
                <button
                  type="button"
                  onClick={() => setShowConfirmRevokeAll(true)}
                  className="rounded-lg border border-circle-coral bg-circle-coral/10 hover:bg-circle-coral/20 px-3 py-1.5 text-xs font-semibold text-circle-coral transition-colors flex items-center gap-1.5"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>{t.auth.revokeAllOtherSessions} ({otherSessions.length})</span>
                </button>
              </div>
            )}
          </div>
        )}


        {/* Confirm Revoke All Other Modal: rounded-2xl with rounded-lg buttons */}
        {showConfirmRevokeAll && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
            <div className="w-full max-w-sm rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-5 shadow-2xl animate-scaleUp">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-circle-coral/15 text-circle-coral mb-3 border border-circle-coral/30">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-circle-charcoal dark:text-circle-dark-text">
                {t.auth.revokeAllOtherSessions}
              </h4>
              <p className="mt-1.5 text-xs text-circle-slate dark:text-circle-dark-muted leading-relaxed">
                {t.auth.revokeAllOtherSessionsConfirm}
              </p>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmRevokeAll(false)}
                  className="rounded-lg border border-circle-hairline dark:border-circle-dark-hairline px-3.5 py-1.5 text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-canvas dark:hover:bg-circle-dark-elevated transition-colors"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleRevokeAllOther}
                  disabled={revokeOtherSessionsMutation.isPending}
                  className="rounded-lg bg-circle-coral hover:bg-circle-coral/90 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors flex items-center gap-1.5"
                >
                  {revokeOtherSessionsMutation.isPending && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  <span>{t.auth.revokeAllOtherSessions}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
