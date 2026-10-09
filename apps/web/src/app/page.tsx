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
import { FriendsModal } from '@/components/friend/FriendsModal';
import { useCircleStore } from '@/stores/circle.store';

export default function HomePage() {
  const activeCircle = useCircleStore((s) => s.activeCircle);

  return (
    <AuthGuard mode="require-auth">
      <div className="min-h-screen flex flex-col bg-circle-canvas dark:bg-circle-dark-canvas text-circle-charcoal dark:text-circle-dark-text transition-colors">
        <Header />
        <div className="flex-1 flex justify-center w-full">
          {activeCircle ? (
            /* Active Circle Workspace: 3-column Layout (Channels, Feed & Chat, Members) */
            <div className="flex w-full max-w-[1360px] justify-between">
              <Sidebar />
              <FeedStream />
              <PresenceRail />
            </div>
          ) : (
            /* Home Hub: Clean Focused Single-Column Layout (Welcome & Circles Grid) */
            <div className="flex w-full max-w-4xl justify-center px-4 py-8">
              <FeedStream />
            </div>
          )}
        </div>
        <CreateCircleModal />
        <JoinCircleModal />
        <CircleManagementModal />
        <FriendsModal />
      </div>
    </AuthGuard>
  );
}
