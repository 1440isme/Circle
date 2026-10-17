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
      <div className="h-screen w-full flex flex-col bg-white dark:bg-circle-dark-surface text-circle-charcoal dark:text-circle-dark-text overflow-hidden transition-colors relative">
        <Header />
        <div className="flex-1 flex w-full h-screen overflow-hidden">
          {activeCircle ? (
            /* Active Circle Workspace: 3 columns stick together in the center of the screen */
            <div className="flex w-full max-w-[1400px] 2xl:max-w-[1600px] h-screen justify-center mx-auto overflow-hidden">
              <Sidebar />
              <FeedStream />
              <PresenceRail />
            </div>
          ) : (
            /* Home Hub: Clean Focused Single-Column Layout */
            <div className="flex-1 flex justify-center px-4 pt-16 pb-8 max-w-5xl mx-auto w-full h-screen overflow-y-auto">
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
