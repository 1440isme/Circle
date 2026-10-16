'use client';

import React from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Header } from '@/components/header/Header';
import { Sidebar } from '@/components/navigation/Sidebar';
import { FeedStream } from '@/components/stream/FeedStream';
import { PresenceRail } from '@/components/presence/PresenceRail';
import { CreateCircleModal } from '@/components/circle/CreateCircleModal';
import { JoinCircleModal } from '@/components/circle/JoinCircleModal';
import { CircleManagementModal } from '@/components/circle/CircleManagementModal';
import { CallStageModal } from '@/components/call/CallStageModal';
import { useCircleStore } from '@/stores/circle.store';

export default function HomePage() {
  const activeCircle = useCircleStore((s) => s.activeCircle);
  const activeCallStageSession = useCircleStore((s) => s.activeCallStageSession);
  const setActiveCallStageSession = useCircleStore((s) => s.setActiveCallStageSession);

  return (
    <AuthGuard mode="require-auth">
      <div className="min-h-screen flex flex-col bg-white dark:bg-circle-dark-surface text-circle-charcoal dark:text-circle-dark-text transition-colors">
        <Header />
        <div className="flex-1 flex w-full">
          {activeCircle ? (
            /* Active Circle Workspace: Flat seamless 3-column layout sharing unified background with zero border barriers */
            <div className="flex w-full">
              <Sidebar />
              <FeedStream />
              <PresenceRail />
            </div>
          ) : (
            /* Home Hub: Clean Focused Single-Column Layout */
            <div className="flex-1 flex justify-center px-4 py-8 max-w-5xl mx-auto w-full">
              <FeedStream />
            </div>
          )}
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
}
