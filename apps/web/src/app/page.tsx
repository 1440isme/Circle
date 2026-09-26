import React from 'react';
import { Header } from '@/components/header/Header';
import { Sidebar } from '@/components/navigation/Sidebar';
import { FeedStream } from '@/components/stream/FeedStream';
import { PresenceRail } from '@/components/presence/PresenceRail';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-circle-canvas">
      <Header />
      <div className="flex-1 flex justify-center w-full">
        <div className="flex w-full max-w-[1360px] justify-between">
          <Sidebar />
          <FeedStream />
          <PresenceRail />
        </div>
      </div>
    </div>
  );
}
