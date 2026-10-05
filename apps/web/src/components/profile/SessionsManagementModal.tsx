'use client';

import React, { useState } from 'react';
import {
  Laptop,
  Smartphone,
  Tablet,
  Shield,
  LogOut,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { SessionEntity } from '@circle/types';
import { useLanguageStore } from '../../stores/language.store';
import {
  useSessionsQuery,
  useRevokeSessionMutation,
  useRevokeOtherSessionsMutation,
} from '../../hooks/use-auth-mutations';

interface SessionsManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SessionsManagementModal: React.FC<SessionsManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const t = useLanguageStore((s) => s.t);
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
        return <Laptop className="h-5 w-5 text-circle-charcoal dark:text-circle-dark-text" />;
      case 'MOBILE':
        return <Smartphone className="h-5 w-5 text-circle-charcoal dark:text-circle-dark-text" />;
      case 'TABLET':
        return <Tablet className="h-5 w-5 text-circle-charcoal dark:text-circle-dark-text" />;
      default:
        return <Shield className="h-5 w-5 text-circle-charcoal dark:text-circle-dark-text" />;
    }
  };

  const formatSessionTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('vi-VN', {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-circle-charcoal/40 dark:bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl border border-circle-hairline dark:border-circle-dark-hairline bg-white/95 dark:bg-circle-dark-surface/95 p-6 shadow-2xl backdrop-blur-xl animate-scaleUp max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-circle-hairline dark:border-circle-dark-hairline shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-circle-wash dark:bg-circle-dark-wash text-circle-sage dark:text-circle-primary shadow-sm">
              <Laptop className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-circle-charcoal dark:text-circle-dark-text">
                {t.auth.sessionsTitle}
              </h3>
              <p className="text-xs text-circle-slate dark:text-circle-dark-muted">
                {t.auth.sessionsSubtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="flex h-8 w-8 items-center justify-center rounded-full text-circle-slate hover:bg-circle-canvas dark:hover:bg-circle-dark-elevated transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-circle-slate hover:bg-circle-canvas dark:hover:bg-circle-dark-elevated transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Notices */}
        {successNotice && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-circle-wash/70 dark:bg-circle-dark-wash/30 p-3 text-xs text-circle-sage dark:text-circle-primary border border-circle-sage/30 animate-fadeIn shrink-0">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}
        {errorNotice && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-circle-coral/10 p-3 text-xs text-circle-coral border border-circle-coral/30 animate-fadeIn shrink-0">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}

        {/* Sessions list */}
        <div className="mt-4 space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
          {isLoading ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-circle-sage" />
              <p className="text-xs text-circle-slate dark:text-circle-dark-muted">
                {t.common.loading}
              </p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-center p-4">
              <Shield className="h-8 w-8 text-circle-slate/40 mb-2" />
              <p className="text-xs text-circle-slate dark:text-circle-dark-muted">
                {t.auth.noOtherSessions}
              </p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`relative flex items-center justify-between rounded-2xl border p-4 transition-all ${
                  session.isCurrent
                    ? 'border-circle-sage/40 bg-circle-wash/30 dark:bg-circle-dark-wash/20'
                    : 'border-circle-hairline dark:border-circle-dark-hairline bg-circle-canvas/60 dark:bg-circle-dark-canvas/60 hover:bg-circle-canvas dark:hover:bg-circle-dark-elevated'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-circle-dark-elevated border border-circle-hairline dark:border-circle-dark-hairline shadow-sm">
                    {getDeviceIcon(session.deviceType)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-circle-charcoal dark:text-circle-dark-text truncate">
                        {session.browser} • {session.os}
                      </p>
                      {session.isCurrent && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-circle-sage/15 dark:bg-circle-primary/20 px-2 py-0.5 text-[10px] font-semibold text-circle-sage dark:text-circle-primary">
                          <span className="h-1.5 w-1.5 rounded-full bg-circle-primary animate-presence-breathe" />
                          {t.auth.currentSession} ({t.auth.activeNow})
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex items-center gap-3 text-[11px] text-circle-slate dark:text-circle-dark-muted flex-wrap">
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
                    className="ml-3 shrink-0 rounded-xl border border-circle-coral/30 bg-circle-coral/10 hover:bg-circle-coral/20 px-3 py-1.5 text-xs font-semibold text-circle-coral transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {revokingId === session.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <LogOut className="h-3.5 w-3.5" />
                    )}
                    <span>{t.auth.revokeSession}</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-4 pt-4 border-t border-circle-hairline dark:border-circle-dark-hairline flex items-center justify-between shrink-0">
          {otherSessions.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowConfirmRevokeAll(true)}
              className="rounded-2xl border border-circle-coral/40 bg-circle-coral/10 hover:bg-circle-coral/20 px-4 py-2.5 text-xs font-semibold text-circle-coral transition-colors flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>{t.auth.revokeAllOtherSessions} ({otherSessions.length})</span>
            </button>
          ) : (
            <p className="text-xs text-circle-slate dark:text-circle-dark-muted">
              {t.auth.noOtherSessions}
            </p>
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-circle-canvas dark:bg-circle-dark-elevated px-4 py-2.5 text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-hairline/60 transition-colors"
          >
            {t.common.close}
          </button>
        </div>

        {/* Confirm Revoke All Other Modal */}
        {showConfirmRevokeAll && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-sm rounded-3xl border border-circle-hairline dark:border-circle-dark-hairline bg-white dark:bg-circle-dark-surface p-6 shadow-2xl animate-scaleUp">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-circle-coral/15 text-circle-coral mb-4">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-circle-charcoal dark:text-circle-dark-text">
                {t.auth.revokeAllOtherSessions}
              </h4>
              <p className="mt-2 text-xs text-circle-slate dark:text-circle-dark-muted leading-relaxed">
                {t.auth.revokeAllOtherSessionsConfirm}
              </p>
              <div className="mt-5 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowConfirmRevokeAll(false)}
                  className="rounded-2xl border border-circle-hairline dark:border-circle-dark-hairline px-4 py-2 text-xs font-semibold text-circle-charcoal dark:text-circle-dark-text hover:bg-circle-canvas dark:hover:bg-circle-dark-elevated transition-colors"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleRevokeAllOther}
                  disabled={revokeOtherSessionsMutation.isPending}
                  className="rounded-2xl bg-circle-coral hover:bg-circle-coral/90 px-4 py-2 text-xs font-semibold text-white transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {revokeOtherSessionsMutation.isPending && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
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
