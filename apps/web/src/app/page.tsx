'use client';

import React from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Header } from '@/components/header/Header';
import { Sidebar } from '@/components/navigation/Sidebar';
import { FeedStream } from '@/components/stream/FeedStream';
import { PresenceRail } from '@/components/presence/PresenceRail';

export default function HomePage() {
  return (
    <AuthGuard mode="require-auth">
      <div className="min-h-screen flex flex-col bg-circle-canvas dark:bg-circle-dark-canvas text-circle-charcoal dark:text-circle-dark-text transition-colors">
        <Header />
        <div className="flex-1 flex justify-center w-full">
          <div className="flex w-full max-w-[1360px] justify-between">
            <Sidebar />
            <FeedStream />
            <PresenceRail />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
