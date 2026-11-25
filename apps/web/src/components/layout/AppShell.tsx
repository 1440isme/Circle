'use client';

import React from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Header } from '@/components/header/Header';
import { CreateCircleModal } from '@/components/circle/CreateCircleModal';
import { JoinCircleModal } from '@/components/circle/JoinCircleModal';
import { CircleManagementModal } from '@/components/circle/CircleManagementModal';
import { CallStageModal } from '@/components/call/CallStageModal';
import { useCircleStore } from '@/stores/circle.store';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const activeCallStageSession = useCircleStore((s) => s.activeCallStageSession);
  const setActiveCallStageSession = useCircleStore((s) => s.setActiveCallStageSession);

  return (
    <AuthGuard mode="require-auth">
      <div className="h-screen w-full flex flex-col bg-white dark:bg-circle-dark-surface text-circle-charcoal dark:text-circle-dark-text overflow-hidden transition-colors relative">
        <Header />
        <div className="flex-1 flex w-full h-full min-h-0 overflow-hidden">
          {children}
        </div>
        <CreateCircleModal />
        <JoinCircleModal />
        <CircleManagementModal />
        {activeCallStageSession && (
          <CallStageModal
            callSession={activeCallStageSession}
            isOpen={!!activeCallStageSession}
            onClose={() => setActiveCallStageSession(null)}
          />
        )}
      </div>
    </AuthGuard>
  );
};
