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
  Sparkles,
  Layout,
  Palette,
  ChevronRight,
  ArrowUpRight,
  HelpCircle,
  Key,
  FileText,
  User as UserIcon,
} from 'lucide-react';
import { SessionEntity } from '@circle/types';
import { useLanguageStore } from '../../stores/language.store';
import {
  useThemeStore,
  Theme,
  UIStyle,
} from '../../stores/theme.store';
import { useAuthStore } from '../../stores/auth.store';
import {
  useSessionsQuery,
  useRevokeSessionMutation,
  useRevokeOtherSessionsMutation,
  useLogoutMutation,
} from '../../hooks/use-auth-mutations';

export type SettingsTabId = 'appearance' | 'sessions' | 'language' | 'help';

interface SystemSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: SettingsTabId;
}

export const SystemSettingsModal: React.FC<SystemSettingsModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'appearance',
}) => {
  const t = useLanguageStore((s) => s.t);
  const { locale, setLocale } = useLanguageStore();
  const {
    theme,
    setTheme,
    uiStyle,
    setUiStyle,
  } = useThemeStore();

  const user = useAuthStore((s) => s.user);
  const logoutMutation = useLogoutMutation();

  const [activeTab, setActiveTab] = useState<SettingsTabId>(defaultTab);

  // Sessions state & queries
  const { data: sessions = [], isLoading, isRefetching, refetch } = useSessionsQuery();
  const revokeSessionMutation = useRevokeSessionMutation();
  const revokeOtherSessionsMutation = useRevokeOtherSessionsMutation();

  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [showConfirmRevokeAll, setShowConfirmRevokeAll] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      onClose();
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  const navItems: { id: SettingsTabId; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    {
      id: 'appearance',
      label: locale === 'vi' ? 'Giao diện' : 'Appearance',
      icon: Palette,
    },
    {
      id: 'sessions',
      label: locale === 'vi' ? 'Phiên đăng nhập' : 'Devices & Sessions',
      icon: Laptop,
      badge: sessions.length > 0 ? sessions.length : undefined,
    },
    {
      id: 'language',
      label: locale === 'vi' ? 'Ngôn ngữ' : 'Language',
      icon: Globe,
    },
    {
      id: 'help',
      label: locale === 'vi' ? 'Trợ giúp' : 'Help & Support',
      icon: HelpCircle,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      {/* 2-Column Desktop Settings Dialog */}
      <div className="relative w-full max-w-4xl h-[620px] max-h-[92vh] rounded-2xl md:rounded-[24px] bg-white dark:bg-[#18191d] border border-circle-hairline dark:border-[#2a2b31] shadow-2xl flex flex-col md:flex-row overflow-hidden text-circle-charcoal dark:text-white">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: Sidebar Navigation                           */}
        {/* ========================================================= */}
        <aside className="w-full md:w-64 shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-circle-hairline dark:border-[#27282e] bg-[#fbfcfd] dark:bg-[#131417] p-3 sm:p-4">
          <div className="px-2 py-1 mb-3">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-circle-charcoal dark:text-white">
              {t.common.systemSettings || 'Settings'}
            </h2>
          </div>

          {/* Navigation Pill List */}
          <nav className="space-y-1 flex-1 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all text-left ${
                    isActive
                      ? 'bg-circle-wash dark:bg-[#25272e] text-circle-sage dark:text-white border border-circle-hairline dark:border-[#3d4049] shadow-xs font-semibold'
                      : 'text-circle-slate dark:text-white/70 hover:bg-circle-canvas dark:hover:bg-white/5 hover:text-circle-charcoal dark:hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-circle-sage dark:text-white' : 'text-circle-slate dark:text-white/60'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-circle-primary text-white dark:text-circle-charcoal">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Action: Log Out */}
          <div className="mt-auto pt-3 border-t border-circle-hairline dark:border-[#27282e]">
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>{t.auth.logout}</span>
            </button>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Active Content Panel                        */}
        {/* ========================================================= */}
        <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#1a1b1f]">
          {/* Panel Header */}
          <header className="flex items-center justify-between px-6 py-4 border-b border-circle-hairline dark:border-[#27282e] shrink-0">
            <h3 className="text-base sm:text-lg font-bold text-circle-charcoal dark:text-white truncate">
              {navItems.find((n) => n.id === activeTab)?.label}
            </h3>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.common.close}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-circle-canvas dark:bg-[#25272e] text-circle-slate dark:text-white/70 hover:bg-circle-wash dark:hover:bg-[#32353e] hover:text-circle-charcoal dark:hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar">

            {/* TAB: APPEARANCE (Giao diện) */}
            {activeTab === 'appearance' && (
              <div className="space-y-5">
                {/* Section 1: Chế độ sáng / tối (Mode) */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-circle-slate dark:text-white/60 px-1">
                    {t.common.appearanceSection}
                  </span>
                  <div className="rounded-2xl border border-circle-hairline dark:border-[#2b2d35] bg-circle-canvas/30 dark:bg-[#212329] p-4 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="text-xs font-bold text-circle-charcoal dark:text-white">
                        {locale === 'vi' ? 'Chế độ hiển thị' : 'Display Mode'}
                      </p>
                      <p className="text-[11px] text-circle-slate dark:text-white/60">
                        {t.common.appearanceSectionDesc}
                      </p>
                    </div>

                    {/* Segmented control */}
                    <div className="flex items-center bg-circle-canvas dark:bg-[#16171a] p-1 rounded-xl border border-circle-hairline dark:border-[#33353e]">
                      <button
                        type="button"
                        onClick={() => setTheme('light')}
                        title={t.common.themeLight}
                        aria-label={t.common.themeLight}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          theme === 'light'
                            ? 'bg-white dark:bg-[#272930] text-circle-sage dark:text-circle-primary shadow-xs font-bold'
                            : 'text-circle-slate dark:text-white/60 hover:text-circle-charcoal dark:hover:text-white'
                        }`}
                      >
                        <Sun className="h-3.5 w-3.5 text-circle-slate dark:text-circle-dark-muted" />
                        <span>{t.common.themeLight}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme('dark')}
                        title={t.common.themeDark}
                        aria-label={t.common.themeDark}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          theme === 'dark'
                            ? 'bg-white dark:bg-[#272930] text-circle-sage dark:text-circle-primary shadow-xs font-bold'
                            : 'text-circle-slate dark:text-white/60 hover:text-circle-charcoal dark:hover:text-white'
                        }`}
                      >
                        <Moon className="h-3.5 w-3.5 text-circle-sage dark:text-circle-primary" />
                        <span>{t.common.themeDark}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme('system')}
                        title={t.common.themeSystem}
                        aria-label={t.common.themeSystem}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          theme === 'system'
                            ? 'bg-white dark:bg-[#272930] text-circle-sage dark:text-circle-primary shadow-xs font-bold'
                            : 'text-circle-slate dark:text-white/60 hover:text-circle-charcoal dark:hover:text-white'
                        }`}
                      >
                        <Monitor className="h-3.5 w-3.5 text-circle-slate dark:text-white/60" />
                        <span>{t.common.themeSystem}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section 2: Phong cách thiết kế (Flat Design vs Liquid Glass) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-circle-slate dark:text-white/60">
                      {locale === 'vi' ? 'Phong cách thiết kế' : 'Design Style'}
                    </span>
                    <span className="text-xs font-semibold text-circle-sage dark:text-circle-primary">
                      {uiStyle === 'flat' ? (locale === 'vi' ? 'Flat Design (Mặc định)' : 'Flat (Default)') : 'Liquid Glass'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Flat Design Choice */}
                    <button
                      type="button"
                      onClick={() => setUiStyle('flat')}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        uiStyle === 'flat'
                          ? 'border-circle-sage dark:border-circle-primary bg-circle-wash/50 dark:bg-circle-primary/10 shadow-xs'
                          : 'border-circle-hairline dark:border-[#2b2d35] bg-circle-canvas/30 dark:bg-[#212329] hover:border-circle-slate/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Layout className="h-4 w-4 text-circle-sage dark:text-circle-primary" />
                          <span className="text-xs font-bold text-circle-charcoal dark:text-white">Flat Design</span>
                        </div>
                        {uiStyle === 'flat' && (
                          <div className="h-5 w-5 rounded-full bg-circle-sage dark:bg-circle-primary flex items-center justify-center text-white dark:text-circle-charcoal">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-circle-slate dark:text-white/60 leading-relaxed">
                        {locale === 'vi'
                          ? 'Giao diện phẳng tối giản, phân cấp rõ ràng bằng đường kẻ viền mảnh (hairline), không blur, tối ưu tốc độ.'
                          : 'Minimalist flat interface with hairline dividers, no blur, optimized for maximum responsiveness.'}
                      </p>
                    </button>

                    {/* Liquid Glass Choice */}
                    <button
                      type="button"
                      onClick={() => setUiStyle('glass')}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        uiStyle === 'glass'
                          ? 'border-circle-sage dark:border-circle-primary bg-circle-wash/50 dark:bg-circle-primary/10 shadow-xs'
                          : 'border-circle-hairline dark:border-[#2b2d35] bg-circle-canvas/30 dark:bg-[#212329] hover:border-circle-slate/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-circle-sage dark:text-circle-primary" />
                          <span className="text-xs font-bold text-circle-charcoal dark:text-white">Liquid Glass</span>
                        </div>
                        {uiStyle === 'glass' && (
                          <div className="h-5 w-5 rounded-full bg-circle-sage dark:bg-circle-primary flex items-center justify-center text-white dark:text-circle-charcoal">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-circle-slate dark:text-white/60 leading-relaxed">
                        {locale === 'vi'
                          ? 'Hiệu ứng kính mờ (frosted glass), lớp nền xuyên thấu, ánh sáng viền phản xạ tinh tế, chiều sâu nhiều lớp.'
                          : 'Translucent frosted glass with subtle rim light reflections, blur backdrops, and multidimensional depth.'}
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SESSIONS (Phiên đăng nhập & Thiết bị) */}
            {activeTab === 'sessions' && (
              <div className="space-y-4">
                {/* Notices */}
                {successNotice && (
                  <div className="flex items-center gap-2 rounded-xl bg-circle-wash dark:bg-circle-primary/10 p-3 text-xs text-circle-sage dark:text-circle-primary border border-circle-sage/40 animate-fadeIn">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{successNotice}</span>
                  </div>
                )}
                {errorNotice && (
                  <div className="flex items-center gap-2 rounded-xl bg-circle-coral/10 p-3 text-xs text-circle-coral border border-circle-coral/30 animate-fadeIn">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{errorNotice}</span>
                  </div>
                )}

                <div className="flex items-center justify-between px-1">
                  <div>
                    <p className="text-xs font-bold text-circle-charcoal dark:text-white">
                      {t.auth.sessionsSubtitle || 'Các thiết bị đang đăng nhập tài khoản của bạn'}
                    </p>
                    <p className="text-[11px] text-circle-slate dark:text-white/60">
                      {t.common.sessionsSectionDesc}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    disabled={isRefetching}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-circle-slate dark:text-white/70 hover:text-circle-charcoal dark:hover:text-white hover:bg-circle-canvas dark:hover:bg-[#25272e] transition-colors"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
                    <span>{isRefetching ? t.common.loading : 'Làm mới'}</span>
                  </button>
                </div>

                {/* Sessions List */}
                <div className="space-y-2">
                  {isLoading ? (
                    <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-circle-hairline dark:border-[#2b2d35]">
                      <Loader2 className="h-5 w-5 animate-spin text-circle-sage dark:text-circle-primary" />
                      <p className="text-xs text-circle-slate dark:text-white/60">
                        {t.common.loading}
                      </p>
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="flex h-32 flex-col items-center justify-center text-center p-4 rounded-2xl border border-circle-hairline dark:border-[#2b2d35]">
                      <Shield className="h-7 w-7 text-circle-slate/40 mb-2" />
                      <p className="text-xs text-circle-slate dark:text-white/60">
                        {t.auth.noOtherSessions}
                      </p>
                    </div>
                  ) : (
                    sessions.map((session) => (
                      <div
                        key={session.id}
                        className={`flex items-center justify-between rounded-xl border p-3.5 transition-all ${
                          session.isCurrent
                            ? 'border-circle-sage dark:border-circle-primary bg-circle-wash/30 dark:bg-circle-primary/10 shadow-xs'
                            : 'border-circle-hairline dark:border-[#2b2d35] bg-circle-canvas/30 dark:bg-[#212329]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-[#18191d] border border-circle-hairline dark:border-[#33353d] shadow-2xs">
                            {getDeviceIcon(session.deviceType)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs font-bold text-circle-charcoal dark:text-white truncate">
                                {session.browser} • {session.os}
                              </p>
                              {session.isCurrent && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-circle-primary text-white dark:text-circle-charcoal px-2 py-0.5 text-[10px] font-bold">
                                  <span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-circle-charcoal animate-presence-breathe" />
                                  {t.auth.currentSession}
                                </span>
                              )}
                            </div>

                            <div className="mt-1 flex items-center gap-3 text-[11px] text-circle-slate dark:text-white/60 flex-wrap">
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

                        {/* Revoke single session button */}
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

                {/* Revoke All Other Action */}
                {otherSessions.length > 0 && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowConfirmRevokeAll(true)}
                      className="rounded-xl border border-circle-coral bg-circle-coral/10 hover:bg-circle-coral/20 px-3.5 py-2 text-xs font-semibold text-circle-coral transition-colors flex items-center gap-2"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>{t.auth.revokeAllOtherSessions} ({otherSessions.length})</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB: LANGUAGE (Ngôn ngữ) */}
            {activeTab === 'language' && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-circle-charcoal dark:text-white">
                    {t.common.languageSection}
                  </p>
                  <p className="text-[11px] text-circle-slate dark:text-white/60">
                    {t.common.languageSectionDesc}
                  </p>
                </div>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => setLocale('vi')}
                    className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${
                      locale === 'vi'
                        ? 'border-circle-sage dark:border-circle-primary bg-circle-wash/50 dark:bg-circle-primary/10 shadow-xs'
                        : 'border-circle-hairline dark:border-[#2b2d35] bg-circle-canvas/30 dark:bg-[#212329] hover:border-circle-slate/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🇻🇳</span>
                      <div className="text-left">
                        <p className="text-xs font-bold text-circle-charcoal dark:text-white">
                          Tiếng Việt (Mặc định)
                        </p>
                        <p className="text-[11px] text-circle-slate dark:text-white/60">
                          Giao diện chuẩn tiếng Việt tối ưu cho CIRCLE
                        </p>
                      </div>
                    </div>
                    {locale === 'vi' && (
                      <div className="h-5 w-5 rounded-full bg-circle-sage dark:bg-circle-primary flex items-center justify-center text-white dark:text-circle-charcoal">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setLocale('en')}
                    className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${
                      locale === 'en'
                        ? 'border-circle-sage dark:border-circle-primary bg-circle-wash/50 dark:bg-circle-primary/10 shadow-xs'
                        : 'border-circle-hairline dark:border-[#2b2d35] bg-circle-canvas/30 dark:bg-[#212329] hover:border-circle-slate/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🇬🇧</span>
                      <div className="text-left">
                        <p className="text-xs font-bold text-circle-charcoal dark:text-white">
                          English
                        </p>
                        <p className="text-[11px] text-circle-slate dark:text-white/60">
                          English international interface
                        </p>
                      </div>
                    </div>
                    {locale === 'en' && (
                      <div className="h-5 w-5 rounded-full bg-circle-sage dark:bg-circle-primary flex items-center justify-center text-white dark:text-circle-charcoal">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* TAB: HELP (Trợ giúp) */}
            {activeTab === 'help' && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-circle-charcoal dark:text-white">
                    {locale === 'vi' ? 'Trợ giúp & Hỗ trợ' : 'Help & Support'}
                  </p>
                  <p className="text-[11px] text-circle-slate dark:text-white/60">
                    {locale === 'vi' ? 'Thông tin ứng dụng, phím tắt và tiêu chuẩn an toàn' : 'Application info, keyboard shortcuts, and safety standards'}
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Shortcuts Card */}
                  <div className="rounded-2xl border border-circle-hairline dark:border-[#2b2d35] bg-circle-canvas/30 dark:bg-[#212329] p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-circle-charcoal dark:text-white">
                      <Key className="h-4 w-4 text-circle-sage dark:text-circle-primary" />
                      <span>{locale === 'vi' ? 'Phím tắt thông dụng' : 'Keyboard Shortcuts'}</span>
                    </div>
                    <div className="space-y-1.5 text-xs text-circle-slate dark:text-white/70">
                      <div className="flex items-center justify-between py-1 border-b border-circle-hairline dark:border-[#2b2d35]">
                        <span>{locale === 'vi' ? 'Gửi tin nhắn' : 'Send message'}</span>
                        <kbd className="px-2 py-0.5 rounded bg-circle-canvas dark:bg-[#18191d] border border-circle-hairline dark:border-[#33353d] text-[10px] font-mono">Enter</kbd>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-circle-hairline dark:border-[#2b2d35]">
                        <span>{locale === 'vi' ? 'Xuống dòng' : 'Line break'}</span>
                        <kbd className="px-2 py-0.5 rounded bg-circle-canvas dark:bg-[#18191d] border border-circle-hairline dark:border-[#33353d] text-[10px] font-mono">Shift + Enter</kbd>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span>{locale === 'vi' ? 'Đóng cửa sổ modal' : 'Close modal'}</span>
                        <kbd className="px-2 py-0.5 rounded bg-circle-canvas dark:bg-[#18191d] border border-circle-hairline dark:border-[#33353d] text-[10px] font-mono">Escape</kbd>
                      </div>
                    </div>
                  </div>

                  {/* Standards Card */}
                  <div className="rounded-2xl border border-circle-hairline dark:border-[#2b2d35] bg-circle-canvas/30 dark:bg-[#212329] p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-circle-sage dark:text-circle-primary" />
                      <div>
                        <p className="text-xs font-bold text-circle-charcoal dark:text-white">
                          {t.common.communityStandards}
                        </p>
                        <p className="text-[11px] text-circle-slate dark:text-white/60">
                          {t.common.privacyPolicy}
                        </p>
                      </div>
                    </div>
                    <Shield className="h-4 w-4 text-circle-sage dark:text-circle-primary" />
                  </div>

                  {/* Version Info Card */}
                  <div className="rounded-2xl border border-circle-hairline dark:border-[#2b2d35] bg-circle-canvas/30 dark:bg-[#212329] p-4 text-center">
                    <p className="text-xs font-bold text-circle-charcoal dark:text-white">
                      CIRCLE Web Platform v1.0.0
                    </p>
                    <p className="text-[11px] text-circle-slate dark:text-white/60 mt-0.5">
                      Đồ án Tốt nghiệp Kỹ sư CNTT • Trương Công Bình & Ninh Thị Mỹ Hạnh
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Modal: Confirm Revoke All Sessions */}
        {showConfirmRevokeAll && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div className="w-full max-w-sm rounded-2xl border border-circle-hairline dark:border-[#2b2d35] bg-white dark:bg-[#1f2025] p-5 shadow-2xl animate-scaleUp">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-circle-coral/15 text-circle-coral mb-3 border border-circle-coral/30">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-circle-charcoal dark:text-white">
                {t.auth.revokeAllOtherSessions}
              </h4>
              <p className="mt-1.5 text-xs text-circle-slate dark:text-white/60 leading-relaxed">
                {t.auth.revokeAllOtherSessionsConfirm}
              </p>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmRevokeAll(false)}
                  className="rounded-xl border border-circle-hairline dark:border-[#2b2d35] px-3.5 py-1.5 text-xs font-semibold text-circle-charcoal dark:text-white hover:bg-circle-canvas dark:hover:bg-[#2b2d35] transition-colors"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleRevokeAllOther}
                  disabled={revokeOtherSessionsMutation.isPending}
                  className="rounded-xl bg-circle-coral hover:bg-circle-coral/90 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors flex items-center gap-1.5"
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

        {/* Modal: Confirm Logout */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div className="w-full max-w-sm rounded-2xl border border-circle-hairline dark:border-[#2b2d35] bg-white dark:bg-[#1f2025] p-5 shadow-2xl animate-scaleUp">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 text-red-500 mb-3 border border-red-500/30">
                <LogOut className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-circle-charcoal dark:text-white">
                {t.auth.logout}
              </h4>
              <p className="mt-1.5 text-xs text-circle-slate dark:text-white/60 leading-relaxed">
                {t.auth.logoutConfirm || 'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản CIRCLE trên thiết bị này?'}
              </p>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="rounded-xl border border-circle-hairline dark:border-[#2b2d35] px-3.5 py-1.5 text-xs font-semibold text-circle-charcoal dark:text-white hover:bg-circle-canvas dark:hover:bg-[#2b2d35] transition-colors"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="rounded-xl bg-red-500 hover:bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors flex items-center gap-1.5"
                >
                  {logoutMutation.isPending && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  <span>{t.auth.logout}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
